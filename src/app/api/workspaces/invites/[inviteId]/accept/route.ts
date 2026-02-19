import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION, normalizePermissions } from '@/lib/workspace-permission-definitions';
import { getWorkspaceAccess, resolveGrantRootForDelegation } from '@/lib/workspace-permissions';

// POST accept workspace invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteId } = await params;

    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Validate: Only invited user can accept
    if (invite.invitedUserId !== user.id && invite.invitedEmail !== user.email) {
      return NextResponse.json({ error: 'This invitation was not sent to you' }, { status: 403 });
    }

    // Validate: Invitation must be pending
    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: `This invitation has already been ${invite.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check expiration
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await prisma.workspaceInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: invite.workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this workspace' },
        { status: 400 }
      );
    }

    // Check if user is the owner
    if (invite.workspace.ownerId === user.id) {
      return NextResponse.json({ error: 'You are the owner of this workspace' }, { status: 400 });
    }

    // Accept invitation and add member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const inviterAccess = await getWorkspaceAccess(invite.invitedById, invite.workspaceId);
      const grantRootId =
        invite.grantRootId ?? resolveGrantRootForDelegation(inviterAccess, invite.invitedById);
      const grantDepth = inviterAccess.isOwner ? 1 : (inviterAccess.grantDepth ?? 0) + 1;

      // Update invitation status
      const updatedInvite = await tx.workspaceInvite.update({
        where: { id: inviteId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          invitedUserId: user.id, // Link to user if invited by email
        },
      });

      // Add user as workspace member with invite permissions
      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          permissions:
            invite.permissions.length > 0
              ? normalizePermissions(invite.permissions)
              : [WORKSPACE_PERMISSION.DOCUMENTS_VIEW, WORKSPACE_PERMISSION.WORKSPACE_VIEW],
          grantedById: invite.invitedById,
          grantRootId,
          grantDepth,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          type: 'INVITE_ACCEPTED',
          actorId: user.id,
          workspaceId: invite.workspaceId,
          entityType: 'workspace_invite',
          entityId: inviteId,
          metadata: {
            userName: user.name,
            userEmail: user.email,
            invitedById: invite.invitedById,
            grantRootId,
            grantDepth,
          },
        },
      });

      // Log member added activity
      await tx.activity.create({
        data: {
          type: 'MEMBER_ADDED',
          actorId: user.id,
          workspaceId: invite.workspaceId,
          entityType: 'workspace_member',
          entityId: member.id,
          metadata: {
            userName: user.name,
            userEmail: user.email,
            permissions: member.permissions,
            grantedById: invite.invitedById,
            grantRootId,
            grantDepth,
          },
        },
      });

      // Send notification to inviter
      await tx.notification.create({
        data: {
          userId: invite.invitedById,
          type: 'WORKSPACE_INVITE_ACCEPTED',
          title: 'Invitation Accepted',
          message: `${user.name || user.email} accepted your invitation to join "${invite.workspace.name}"`,
          link: `/dashboard/${invite.workspaceId}`,
        },
      });

      return { updatedInvite, member };
    });

    return NextResponse.json({
      success: true,
      message: `You have joined "${invite.workspace.name}"`,
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
      },
      member: result.member,
    });
  } catch (error) {
    console.error('Error accepting workspace invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
