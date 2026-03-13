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
          ownedWorkspaces: true,
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

  // Use UTC methods so date keys match the UTC timestamps stored in the DB.
  // setHours(0,0,0,0) uses LOCAL time and toISOString() converts to UTC,
  // which shifts the key by the local UTC offset and breaks the lookup.
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [
    totalUsers,
    adminUsers,
    totalWorkspaces,
    totalDocuments,
    totalVersions,
    activeLocks,
    totalComments,
    usersRaw,
    loginEventsRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.workspace.count(),
    prisma.document.count(),
    prisma.version.count(),
    prisma.documentLock.count({ where: { expiresAt: { gt: now } } }),
    prisma.comment.count(),
    // New non-admin registrations in the last 30 days
    prisma.user.findMany({
      where: { role: 'USER', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    // All login events by non-admin users in the last 30 days
    prisma.loginEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, user: { role: 'USER' } },
      select: { userId: true, createdAt: true },
    }),
  ]);

  // Build 30-day ISO date labels (UTC)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });

  // New registrations per day
  const growthMap: Record<string, number> = {};
  for (const u of usersRaw) {
    const day = u.createdAt.toISOString().slice(0, 10);
    growthMap[day] = (growthMap[day] ?? 0) + 1;
  }

  // Distinct signed-in users per day
  const activeMap: Record<string, Set<string>> = {};
  for (const loginEvent of loginEventsRaw) {
    const day = loginEvent.createdAt.toISOString().slice(0, 10);
    if (!activeMap[day]) activeMap[day] = new Set();
    activeMap[day].add(loginEvent.userId);
  }

  const regularUsers = totalUsers - adminUsers;
  const todayKey = today.toISOString().slice(0, 10);

  return {
    users: {
      total: regularUsers,
      admins: adminUsers,
      regular: regularUsers,
      todayActive: activeMap[todayKey]?.size ?? 0,
      growth: days.map((d) => ({ date: d, count: growthMap[d] ?? 0 })),
      dailyActive: days.map((d) => ({ date: d, count: activeMap[d]?.size ?? 0 })),
    },
    workspaces: totalWorkspaces,
    documents: totalDocuments,
    versions: totalVersions,
    activeLocks,
    comments: totalComments,
  };
}
