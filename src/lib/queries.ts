/**
 * Optimized Database Queries
 * Common query patterns with best practices
 */

import { prisma } from './prisma';
import { workspaceCache, documentCache, getCached } from './cache';

/**
 * Get workspace with members - optimized query
 */
export async function getWorkspaceWithMembers(workspaceId: string, userId: string) {
  return getCached(
    `workspace:${workspaceId}:members`,
    async () => {
      return prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
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
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });
    },
    workspaceCache,
    10 * 60 * 1000 // 10 minutes
  );
}

/**
 * Get user workspaces - optimized query
 */
export async function getUserWorkspaces(userId: string) {
  return getCached(
    `user:${userId}:workspaces`,
    async () => {
      return prisma.workspace.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            select: {
              permissions: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    },
    workspaceCache
  );
}

/**
 * Get document with related data - optimized query
 */
export async function getDocumentWithDetails(
  documentId: string,
  workspaceId: string,
  userId: string
) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          members: {
            where: {
              userId,
            },
            select: {
              permissions: true,
            },
          },
        },
      },
      versions: {
        take: 10,
        orderBy: {
          version: 'desc',
        },
        select: {
          id: true,
          version: true,
          content: true,
          diff: true,
          message: true,
          sha: true,
          label: true,
          createdAt: true,
          authorId: true,
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
}

/**
 * Search documents - optimized query with pagination
 */
export async function searchDocuments({
  searchTerm,
  workspaceIds,
  limit = 20,
  offset = 0,
}: {
  searchTerm: string;
  workspaceIds: string[];
  limit?: number;
  offset?: number;
}) {
  const where = {
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { content: { contains: searchTerm, mode: 'insensitive' as const } },
      { path: { contains: searchTerm, mode: 'insensitive' as const } },
    ],
    workspaceId: { in: workspaceIds },
  };

  // Execute queries in parallel
  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        path: true,
        emoji: true,
        status: true,
        workspaceId: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    total,
    hasMore: offset + documents.length < total,
  };
}

/**
 * Get recent activity - optimized query
 */
export async function getRecentActivity(workspaceId: string, limit = 20) {
  return prisma.activity.findMany({
    where: {
      workspaceId,
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}
