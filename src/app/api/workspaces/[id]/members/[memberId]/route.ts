import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import {
  assertCanManageDelegatedTarget,
  assertDelegatablePermissions,
  assertPermission,
  WorkspacePermissionError,
} from '@/lib/workspace-permissions';

const updateMemberSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

// PATCH update member permissions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, memberId } = await params;
    const body = await req.json();
    const { permissions } = updateMemberSchema.parse(body);
    const actorAccess = await assertPermission(
      user.id,
      id,
      WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS
    );

    // Get workspace to check ownership and permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        ownerId: true,
        name: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.ownerId === user.id;

    // Get the member being updated
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: {
        workspace: {
          select: { ownerId: true },
        },
      },
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    assertCanManageDelegatedTarget(user.id, actorAccess, {
      userId: targetMember.userId,
      grantedById: targetMember.grantedById,
      grantRootId: targetMember.grantRootId,
    });

    if (targetMember.userId === user.id && !isOwner) {
      return NextResponse.json(
        { error: 'You cannot modify your own permissions unless you are the owner' },
        { status: 403 }
      );
    }

    // Prevent modifying workspace owner's permissions
    if (targetMember.userId === workspace.ownerId) {
      return NextResponse.json(
        { error: 'Cannot modify workspace owner permissions. Owner always has all permissions.' },
        { status: 403 }
      );
    }

    const normalizedPermissions = assertDelegatablePermissions(
      actorAccess,
      permissions,
      targetMember.permissions
    );

    // Update member permissions
    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { permissions: normalizedPermissions },
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

    await prisma.activity.create({
      data: {
        type: 'MEMBER_ADDED',
        actorId: user.id,
        workspaceId: id,
        entityType: 'workspace_member',
        entityId: memberId,
        metadata: {
          action: 'permissions_updated',
          memberUserId: targetMember.userId,
          memberGrantedById: targetMember.grantedById,
          memberGrantRootId: targetMember.grantRootId,
          memberGrantDepth: targetMember.grantDepth,
          beforePermissions: targetMember.permissions,
          afterPermissions: normalizedPermissions,
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error updating workspace member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE remove member from workspace
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, memberId } = await params;
    const previewOnly = req.nextUrl.searchParams.get('preview') === 'true';
    const actorAccess = await assertPermission(user.id, id, WORKSPACE_PERMISSION.MEMBERS_REMOVE);

    // Get workspace to check ownership and permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        ownerId: true,
        name: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.ownerId === user.id;

    // Get the member being removed
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    assertCanManageDelegatedTarget(user.id, actorAccess, {
      userId: targetMember.userId,
      grantedById: targetMember.grantedById,
      grantRootId: targetMember.grantRootId,
    });

    // Prevent removing workspace owner (owner is not a member)
    if (targetMember.userId === workspace.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner. Transfer ownership first if needed.' },
        { status: 403 }
      );
    }

    const memberIdsToRemove = new Set<string>([targetMember.id]);
    const userIdsToRemove = new Set<string>([targetMember.userId]);
    let frontierUserIds = [targetMember.userId];

    while (frontierUserIds.length > 0) {
      const delegatedMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: id,
          grantedById: { in: frontierUserIds },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      const nextFrontierUserIds: string[] = [];
      for (const delegatedMember of delegatedMembers) {
        if (!memberIdsToRemove.has(delegatedMember.id)) {
          memberIdsToRemove.add(delegatedMember.id);
          userIdsToRemove.add(delegatedMember.userId);
          nextFrontierUserIds.push(delegatedMember.userId);
        }
      }

      frontierUserIds = nextFrontierUserIds;
    }

    const pendingDelegatedInvitesCount = await prisma.workspaceInvite.count({
      where: {
        workspaceId: id,
        invitedById: { in: Array.from(userIdsToRemove) },
        status: 'PENDING',
      },
    });

    const delegatedMembersCount = memberIdsToRemove.size - 1;

    const memberIdsToRemoveList = Array.from(memberIdsToRemove);
    const userIdsToRemoveList = Array.from(userIdsToRemove);

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        canCascade: isOwner,
        targetMemberId: targetMember.id,
        targetUserId: targetMember.userId,
        summary: {
          totalMembersToRemove: memberIdsToRemoveList.length,
          delegatedMembersToRemove: delegatedMembersCount,
          pendingInvitesToCancel: pendingDelegatedInvitesCount,
        },
      });
    }

    if (!isOwner && (delegatedMembersCount > 0 || pendingDelegatedInvitesCount > 0)) {
      return NextResponse.json(
        {
          error:
            'Cannot remove this member while they still manage delegated members or pending invites. Reassign or remove delegated entities first.',
          details: {
            delegatedMembers: delegatedMembersCount,
            delegatedPendingInvites: pendingDelegatedInvitesCount,
          },
        },
        { status: 409 }
      );
    }

    const usersToRemove = await prisma.user.findMany({
      where: { id: { in: Array.from(userIdsToRemove) } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const usersToRemoveMap = new Map(usersToRemove.map((item) => [item.id, item]));
    const targetUser = usersToRemoveMap.get(targetMember.userId);

    // Remove member in a transaction (with activity log and notification)
    await prisma.$transaction(async (tx) => {
      const cancelledInvites = await tx.workspaceInvite.updateMany({
        where: {
          workspaceId: id,
          invitedById: { in: userIdsToRemoveList },
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      await tx.workspaceMember.deleteMany({
        where: { id: { in: memberIdsToRemoveList } },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          type: 'MEMBER_REMOVED',
          actorId: user.id,
          workspaceId: id,
          entityType: 'workspace_member',
          entityId: memberId,
          metadata: {
            removedUserId: targetMember.userId,
            removedUserName: targetUser?.name,
            removedUserEmail: targetUser?.email,
            removedUserGrantedById: targetMember.grantedById,
            removedUserGrantRootId: targetMember.grantRootId,
            removedUserGrantDepth: targetMember.grantDepth,
            cascadeRemoval: isOwner && delegatedMembersCount > 0,
            removedMemberCount: memberIdsToRemoveList.length,
            removedDelegatedMemberCount: delegatedMembersCount,
            removedMemberIds: memberIdsToRemoveList,
            removedUserIds: userIdsToRemoveList,
            cancelledPendingInviteCount: cancelledInvites.count,
          },
        },
      });

      for (const removedUserId of userIdsToRemoveList) {
        const removedUser = usersToRemoveMap.get(removedUserId);
        if (!removedUser) {
          continue;
        }

        await tx.notification.create({
          data: {
            userId: removedUser.id,
            type: 'MEMBER_REMOVED',
            title: 'Removed from Workspace',
            message: `You have been removed from the workspace "${workspace.name}"`,
            link: `/dashboard`,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error removing workspace member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
