import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { hasPermission } from '@/lib/workspace-permissions';

// GET single invitation details
export async function GET(req: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
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
            description: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if user is the invited user or has access to the workspace
    const hasWorkspaceViewAccess = await hasPermission(
      user.id,
      invite.workspaceId,
      WORKSPACE_PERMISSION.MEMBERS_VIEW
    );

    const hasAccess =
      invite.invitedUserId === user.id ||
      invite.invitedEmail === user.email ||
      hasWorkspaceViewAccess;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check expiration
    if (invite.expiresAt && new Date() > invite.expiresAt && invite.status === 'PENDING') {
      await prisma.workspaceInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' },
      });
      invite.status = 'EXPIRED';
    }

    return NextResponse.json(invite);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
