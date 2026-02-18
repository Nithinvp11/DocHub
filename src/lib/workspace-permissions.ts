import { prisma } from '@/lib/prisma';
import {
  ALL_WORKSPACE_PERMISSIONS,
  type WorkspacePermission,
  normalizePermissions,
} from '@/lib/workspace-permission-definitions';

export class WorkspacePermissionError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'WorkspacePermissionError';
    this.status = status;
  }
}

export type WorkspaceAccess = {
  isOwner: boolean;
  permissions: WorkspacePermission[];
  memberId?: string;
  grantedById?: string | null;
  grantRootId?: string | null;
  grantDepth?: number;
};

export type DelegationManagedTarget = {
  userId?: string | null;
  grantedById?: string | null;
  grantRootId?: string | null;
};

export const getWorkspaceAccess = async (
  userId: string,
  workspaceId: string
): Promise<WorkspaceAccess> => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      ownerId: true,
      members: {
        where: { userId },
        select: {
          id: true,
          permissions: true,
          grantedById: true,
          grantRootId: true,
          grantDepth: true,
        },
        take: 1,
      },
    },
  });

  if (!workspace) {
    throw new WorkspacePermissionError('Workspace not found', 404);
  }

  if (workspace.ownerId === userId) {
    return {
      isOwner: true,
      permissions: ALL_WORKSPACE_PERMISSIONS,
      memberId: undefined,
      grantedById: null,
      grantRootId: userId,
      grantDepth: 0,
    };
  }

  const membership = workspace.members[0];
  if (!membership) {
    throw new WorkspacePermissionError('Access denied', 403);
  }

  return {
    isOwner: false,
    permissions: normalizePermissions(membership.permissions),
    memberId: membership.id,
    grantedById: membership.grantedById,
    grantRootId: membership.grantRootId,
    grantDepth: membership.grantDepth,
  };
};

export const resolveGrantRootForDelegation = (
  actorAccess: WorkspaceAccess,
  actorUserId: string
) => {
  if (actorAccess.isOwner) {
    return actorUserId;
  }

  return actorAccess.grantRootId ?? actorUserId;
};

export const canManageDelegatedTarget = (
  actorUserId: string,
  actorAccess: WorkspaceAccess,
  target: DelegationManagedTarget
) => {
  if (actorAccess.isOwner) {
    return true;
  }

  if (target.userId && target.userId === actorUserId) {
    return false;
  }

  if (target.grantedById === actorUserId) {
    return true;
  }

  if (target.grantRootId && target.grantRootId === actorUserId) {
    return true;
  }

  return false;
};

export const assertCanManageDelegatedTarget = (
  actorUserId: string,
  actorAccess: WorkspaceAccess,
  target: DelegationManagedTarget,
  reason = 'You are not allowed to manage this member'
) => {
  if (!canManageDelegatedTarget(actorUserId, actorAccess, target)) {
    throw new WorkspacePermissionError(reason, 403);
  }
};

export const hasPermission = async (
  userId: string,
  workspaceId: string,
  permission: WorkspacePermission
): Promise<boolean> => {
  try {
    const access = await getWorkspaceAccess(userId, workspaceId);
    return access.isOwner || access.permissions.includes(permission);
  } catch {
    return false;
  }
};

export const assertPermission = async (
  userId: string,
  workspaceId: string,
  permission: WorkspacePermission
): Promise<WorkspaceAccess> => {
  const access = await getWorkspaceAccess(userId, workspaceId);
  if (!access.isOwner && !access.permissions.includes(permission)) {
    throw new WorkspacePermissionError(`Missing required permission: ${permission}`, 403);
  }

  return access;
};

export const assertDelegatablePermissions = (
  actorAccess: WorkspaceAccess,
  requestedPermissions: string[],
  existingPermissions: string[] = []
): WorkspacePermission[] => {
  const normalizedRequested = normalizePermissions(requestedPermissions);
  const normalizedExisting = normalizePermissions(existingPermissions);

  if (actorAccess.isOwner) {
    return normalizedRequested;
  }

  const actorPermissionSet = new Set(actorAccess.permissions);
  const existingPermissionSet = new Set(normalizedExisting);
  const forbidden = normalizedRequested.filter(
    (permission) => !actorPermissionSet.has(permission) && !existingPermissionSet.has(permission)
  );

  if (forbidden.length > 0) {
    throw new WorkspacePermissionError(
      `You cannot assign permissions you do not have: ${forbidden.join(', ')}`,
      403
    );
  }

  return normalizedRequested;
};
