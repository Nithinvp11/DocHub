import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// POST reject workspace invitation
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
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Validate: Only invited user can reject
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

    // Reject invitation in a transaction
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.workspaceInvite.update({
        where: { id: inviteId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          invitedUserId: user.id, // Link to user if invited by email
        },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          type: 'INVITE_REJECTED',
          actorId: user.id,
          workspaceId: invite.workspaceId,
          entityType: 'workspace_invite',
          entityId: inviteId,
          metadata: {
            userName: user.name,
            userEmail: user.email,
            invitedById: invite.invitedById,
          },
        },
      });

      // Send notification to inviter
      await tx.notification.create({
        data: {
          userId: invite.invitedById,
          type: 'WORKSPACE_INVITE_REJECTED',
          title: 'Invitation Declined',
          message: `${user.name || user.email} declined your invitation to join "${invite.workspace.name}"`,
          link: `/dashboard/${invite.workspaceId}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `You have declined the invitation to join "${invite.workspace.name}"`,
    });
  } catch (error) {
    console.error('Error rejecting workspace invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
