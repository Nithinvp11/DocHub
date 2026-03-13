import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityTracker } from '@/lib/activity';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// DELETE cancel workspace invitation
export async function DELETE(
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
            members: {
              where: { userId: user.id },
              select: { permissions: true },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const actorAccess = await assertPermission(
      user.id,
      invite.workspaceId,
      WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE
    );

    const canManageInvite =
      actorAccess.isOwner || invite.invitedById === user.id || invite.grantRootId === user.id;

    if (!canManageInvite) {
      return NextResponse.json(
        { error: 'You are not allowed to cancel this invitation' },
        { status: 403 }
      );
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending invitations can be cancelled' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInvite = await tx.workspaceInvite.update({
        where: { id: inviteId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      await ActivityTracker.createWithClient(tx, {
        type: 'INVITE_CANCELLED',
        actorId: user.id,
        workspaceId: invite.workspaceId,
        entityType: 'workspace_invite',
        entityId: inviteId,
        metadata: {
          invitedEmail: invite.invitedEmail,
          invitedUserId: invite.invitedUserId,
        },
      });

      if (invite.invitedUserId) {
        await tx.notification.create({
          data: {
            userId: invite.invitedUserId,
            type: 'WORKSPACE_INVITE_CANCELLED',
            title: 'Invitation Cancelled',
            message: `Your invitation to join "${invite.workspace.name}" was cancelled.`,
            link: `/dashboard/invites/${inviteId}`,
          },
        });
      } else if (invite.invitedEmail) {
        const invitedUser = await tx.user.findUnique({
          where: { email: invite.invitedEmail },
          select: { id: true },
        });

        if (invitedUser) {
          await tx.notification.create({
            data: {
              userId: invitedUser.id,
              type: 'WORKSPACE_INVITE_CANCELLED',
              title: 'Invitation Cancelled',
              message: `Your invitation to join "${invite.workspace.name}" was cancelled.`,
              link: `/dashboard/invites/${inviteId}`,
            },
          });
        }
      }

      return updatedInvite;
    });

    return NextResponse.json({ success: true, invite: result });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error cancelling invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
