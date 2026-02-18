import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import {
  assertDelegatablePermissions,
  assertPermission,
  canManageDelegatedTarget,
  resolveGrantRootForDelegation,
  WorkspacePermissionError,
} from '@/lib/workspace-permissions';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  message: z.string().optional(),
  permissions: z.array(z.string()).min(1).default([WORKSPACE_PERMISSION.DOCUMENTS_VIEW]),
});

// POST send workspace invitation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { email, message, permissions } = inviteSchema.parse(body);
    const actorAccess = await assertPermission(user.id, id, WORKSPACE_PERMISSION.MEMBERS_INVITE);
    const normalizedPermissions = assertDelegatablePermissions(actorAccess, permissions);
    const grantRootId = resolveGrantRootForDelegation(actorAccess, user.id);

    // Get workspace to check permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if email belongs to an existing user
    const invitedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Check if user is already a member or owner
    if (invitedUser) {
      if (workspace.ownerId === invitedUser.id) {
        return NextResponse.json(
          { error: 'This user is already the workspace owner' },
          { status: 400 }
        );
      }

      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: id,
          userId: invitedUser.id,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of the workspace' },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending invitation
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: id,
        ...(invitedUser ? { invitedUserId: invitedUser.id } : { invitedEmail: email }),
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this user' },
        { status: 400 }
      );
    }

    // Create the invitation
    const invite = await prisma.$transaction(async (tx) => {
      const newInvite = await tx.workspaceInvite.create({
        data: {
          workspaceId: id,
          invitedEmail: email,
          invitedUserId: invitedUser?.id,
          invitedById: user.id,
          grantRootId,
          message,
          permissions: normalizedPermissions,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          type: 'INVITE_SENT',
          actorId: user.id,
          workspaceId: id,
          entityType: 'workspace_invite',
          entityId: newInvite.id,
          metadata: {
            invitedEmail: email,
            invitedUserId: invitedUser?.id,
            invitedUserName: invitedUser?.name,
            grantedById: user.id,
            grantRootId,
            message,
            permissions: normalizedPermissions,
          },
        },
      });

      // Send notification if user exists
      if (invitedUser) {
        await tx.notification.create({
          data: {
            userId: invitedUser.id,
            type: 'WORKSPACE_INVITE_RECEIVED',
            title: 'Workspace Invitation',
            message: `${user.name || user.email} invited you to join "${workspace.name}"${message ? `: ${message}` : ''}`,
            link: `/dashboard/invites/${newInvite.id}`,
          },
        });
      }

      return newInvite;
    });

    return NextResponse.json({
      success: true,
      invite,
      message: invitedUser
        ? `Invitation sent to ${invitedUser.name || email}`
        : `Invitation sent to ${email}. They will be able to accept it once they create an account.`,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error creating workspace invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET list pending invitations for a workspace
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const actorAccess = await assertPermission(user.id, id, WORKSPACE_PERMISSION.MEMBERS_VIEW);

    // Get workspace to check permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get all active invitations
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId: id,
        status: {
          in: ['PENDING', 'EXPIRED', 'CANCELLED'],
        },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        invitedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    const expiredInviteIds = invites
      .filter((invite) => invite.status === 'PENDING' && invite.expiresAt && now > invite.expiresAt)
      .map((invite) => invite.id);

    if (expiredInviteIds.length > 0) {
      await prisma.workspaceInvite.updateMany({
        where: { id: { in: expiredInviteIds } },
        data: { status: 'EXPIRED' },
      });
    }

    const grantRootUserIds = Array.from(
      new Set(
        invites.map((invite) => invite.grantRootId).filter((value): value is string => !!value)
      )
    );

    const grantRootUsers = grantRootUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: grantRootUserIds } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        })
      : [];

    const grantRootUserMap = new Map(grantRootUsers.map((item) => [item.id, item]));

    const responseInvites = invites.map((invite) => ({
      ...invite,
      grantRoot: invite.grantRootId ? (grantRootUserMap.get(invite.grantRootId) ?? null) : null,
      canManage: canManageDelegatedTarget(user.id, actorAccess, {
        userId: invite.invitedUserId,
        grantedById: invite.invitedById,
        grantRootId: invite.grantRootId,
      }),
    }));

    return NextResponse.json({ invites: responseInvites });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching workspace invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
