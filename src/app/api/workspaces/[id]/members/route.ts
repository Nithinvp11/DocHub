import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { WORKSPACE_PERMISSION, normalizePermissions } from '@/lib/workspace-permission-definitions';
import {
  assertDelegatablePermissions,
  assertPermission,
  canManageDelegatedTarget,
  resolveGrantRootForDelegation,
  WorkspacePermissionError,
} from '@/lib/workspace-permissions';

const addMemberSchema = z
  .object({
    email: z.string().email().optional(),
    userId: z.string().cuid().optional(),
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
    message: z.string().optional(),
  })
  .refine((data) => data.email || data.userId, {
    message: 'Either email or userId must be provided',
  });

// GET all members of a workspace
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const actorAccess = await assertPermission(user.id, id, WORKSPACE_PERMISSION.MEMBERS_VIEW);

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: id,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    const delegationUserIds = Array.from(
      new Set(
        members
          .flatMap((member) => [member.grantedById, member.grantRootId])
          .filter((value): value is string => !!value)
      )
    );

    const delegationUsers = delegationUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: delegationUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const delegationUserMap = new Map(delegationUsers.map((item) => [item.id, item]));

    const responseMembers = members.map((member) => {
      const grantedBy = member.grantedById ? delegationUserMap.get(member.grantedById) : null;
      const grantRoot = member.grantRootId ? delegationUserMap.get(member.grantRootId) : null;

      return {
        ...member,
        grantedById: member.grantedById,
        grantRootId: member.grantRootId,
        grantDepth: member.grantDepth,
        grantedBy: grantedBy
          ? { id: grantedBy.id, name: grantedBy.name, email: grantedBy.email }
          : null,
        grantRoot: grantRoot
          ? { id: grantRoot.id, name: grantRoot.name, email: grantRoot.email }
          : null,
        canManage: canManageDelegatedTarget(user.id, actorAccess, {
          userId: member.userId,
          grantedById: member.grantedById,
          grantRootId: member.grantRootId,
        }),
      };
    });

    return NextResponse.json(responseMembers);
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST add a member to workspace
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { email, userId, permissions, message } = addMemberSchema.parse(body);
    const actorAccess = await assertPermission(user.id, id, WORKSPACE_PERMISSION.MEMBERS_INVITE);
    const normalizedPermissions = assertDelegatablePermissions(actorAccess, permissions);
    const grantRootId = resolveGrantRootForDelegation(actorAccess, user.id);

    // Get workspace to check ownership and member permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Find target user (optional for email invites)
    const targetUser = await prisma.user.findUnique({
      where: email ? { email } : { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser && userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser) {
      // Check if already a member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: id,
          userId: targetUser.id,
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }

      // Prevent inviting workspace owner
      if (targetUser.id === workspace.ownerId) {
        return NextResponse.json(
          { error: 'Workspace owner is already part of this workspace' },
          { status: 400 }
        );
      }
    }

    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: id,
        ...(targetUser ? { invitedUserId: targetUser.id } : { invitedEmail: email }),
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this user' },
        { status: 400 }
      );
    }

    const invite = await prisma.$transaction(async (tx) => {
      const newInvite = await tx.workspaceInvite.create({
        data: {
          workspaceId: id,
          invitedEmail: email || targetUser?.email || null,
          invitedUserId: targetUser?.id,
          invitedById: user.id,
          grantRootId,
          message,
          permissions: normalizedPermissions,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.activity.create({
        data: {
          type: 'INVITE_SENT',
          actorId: user.id,
          workspaceId: id,
          entityType: 'workspace_invite',
          entityId: newInvite.id,
          metadata: {
            invitedEmail: newInvite.invitedEmail,
            invitedUserId: newInvite.invitedUserId,
            grantedById: user.id,
            grantRootId,
            message,
            permissions: normalizedPermissions,
          },
        },
      });

      if (targetUser) {
        await tx.notification.create({
          data: {
            userId: targetUser.id,
            type: 'WORKSPACE_INVITE_RECEIVED',
            title: 'Workspace Invitation',
            message: `You were invited to join "${workspace.name}"`,
            link: `/dashboard/invites/${newInvite.id}`,
          },
        });
      }

      return newInvite;
    });

    return NextResponse.json(
      {
        success: true,
        invite,
        message: 'Invitation sent successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error adding workspace member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
