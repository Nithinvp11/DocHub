import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

/**
 * Check if a user is an admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Get all users with statistics
 */
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      githubLinked: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          workspaces: true,
          documents: true,
          versions: true,
          comments: true,
          documentLocks: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  const now = new Date();
  const [workspacesCount, documentsCount, versionsCount, commentsCount, locksCount] =
    await Promise.all([
      prisma.workspaceMember.count({ where: { userId } }),
      prisma.document.count({ where: { authorId: userId } }),
      prisma.version.count({ where: { authorId: userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
      prisma.documentLock.count({ where: { userId, expiresAt: { gt: now } } }),
    ]);

  return {
    workspaces: workspacesCount,
    documents: documentsCount,
    versions: versionsCount,
    comments: commentsCount,
    activeLocks: locksCount,
  };
}

// Admin functions removed - admin has read-only access
// User management (delete, promote, demote) is not available to admin role
// Admin can only view users and monitor activity

/**
 * Get all workspaces with statistics
 */
export async function getAllWorkspaces() {
  const workspaces = await prisma.workspace.findMany({
    include: {
      _count: {
        select: {
          members: true,
          documents: true,
          activities: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return workspaces;
}

/**
 * Get all active document locks
 */
export async function getAllActiveLocks() {
  const now = new Date();
  const locks = await prisma.documentLock.findMany({
    where: {
      expiresAt: {
        gt: now,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      document: {
        select: {
          id: true,
          title: true,
          path: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      acquiredAt: 'desc',
    },
  });

  return locks;
}

// Force release lock removed - admin has read-only access
// Only lock owners can release their own locks

/**
 * Get system statistics
 */
export async function getSystemStats() {
  const now = new Date();
  const [
    totalUsers,
    adminUsers,
    totalWorkspaces,
    totalDocuments,
    totalVersions,
    activeLocks,
    totalComments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.workspace.count(),
    prisma.document.count(),
    prisma.version.count(),
    prisma.documentLock.count({ where: { expiresAt: { gt: now } } }),
    prisma.comment.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      admins: adminUsers,
      regular: totalUsers - adminUsers,
    },
    workspaces: totalWorkspaces,
    documents: totalDocuments,
    versions: totalVersions,
    activeLocks,
    comments: totalComments,
  };
}
