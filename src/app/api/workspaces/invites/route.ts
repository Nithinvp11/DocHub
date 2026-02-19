import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// GET list user's pending invitations
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending invitations for the user
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        OR: [{ invitedUserId: user.id }, { invitedEmail: user.email }],
        status: 'PENDING',
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out expired invites and update their status
    const now = new Date();
    const validInvites = [];
    const expiredInvites = [];

    for (const invite of invites) {
      if (invite.expiresAt && now > invite.expiresAt) {
        expiredInvites.push(invite.id);
      } else {
        validInvites.push(invite);
      }
    }

    // Update expired invites
    if (expiredInvites.length > 0) {
      await prisma.workspaceInvite.updateMany({
        where: {
          id: { in: expiredInvites },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    }

    return NextResponse.json({ invites: validInvites });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
