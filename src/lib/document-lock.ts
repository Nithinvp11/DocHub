import { prisma } from './prisma';

export const LOCK_TIMEOUT_MINUTES = 15;
export const LOCK_EXTENSION_MINUTES = 10;

export interface LockInfo {
  documentId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  acquiredAt: Date;
  expiresAt: Date;
}

/**
 * Check if a document is locked
 */
export async function isDocumentLocked(documentId: string): Promise<boolean> {
  const lock = await prisma.documentLock.findUnique({
    where: { documentId },
  });

  if (!lock) return false;

  // Check if expired
  const now = new Date();
  if (now > lock.expiresAt) {
    // Clean up expired lock
    await prisma.documentLock.delete({
      where: { id: lock.id },
    }).catch(() => {}); // Ignore errors
    return false;
  }

  return true;
}

/**
 * Get lock information for a document
 */
export async function getDocumentLock(documentId: string): Promise<LockInfo | null> {
  const lock = await prisma.documentLock.findUnique({
    where: { documentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!lock) return null;

  // Check if expired
  const now = new Date();
  if (now > lock.expiresAt) {
    await prisma.documentLock.delete({
      where: { id: lock.id },
    }).catch(() => {});
    return null;
  }

  return {
    documentId: lock.documentId,
    userId: lock.userId,
    userName: lock.user.name,
    userEmail: lock.user.email,
    acquiredAt: lock.acquiredAt,
    expiresAt: lock.expiresAt,
  };
}

/**
 * Acquire a lock for editing
 */
export async function acquireLock(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string; lock?: { id: string; documentId: string; userId: string; acquiredAt: Date; expiresAt: Date } }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TIMEOUT_MINUTES * 60 * 1000);

  try {
    // Check for existing lock
    const existingLock = await prisma.documentLock.findUnique({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If lock exists and not expired
    if (existingLock && now <= existingLock.expiresAt) {
      // If it's the same user, extend the lock
      if (existingLock.userId === userId) {
        const updatedLock = await prisma.documentLock.update({
          where: { id: existingLock.id },
          data: {
            lastPingAt: now,
            expiresAt,
          },
        });

        return { success: true, lock: updatedLock };
      }

      // Lock is held by another user
      return {
        success: false,
        error: `Document is being edited by ${existingLock.user.name || existingLock.user.email}`,
      };
    }

    // Lock expired or doesn't exist
    const lock = await prisma.documentLock.upsert({
      where: { documentId },
      create: {
        documentId,
        userId,
        expiresAt,
        lastPingAt: now,
      },
      update: {
        userId,
        acquiredAt: now,
        expiresAt,
        lastPingAt: now,
      },
    });

    return { success: true, lock };
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return { success: false, error: 'Failed to acquire lock' };
  }
}

/**
 * Release a lock
 */
export async function releaseLock(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });

    if (!lock) {
      return { success: true }; // No lock to release
    }

    // Only the lock owner can release it
    if (lock.userId !== userId) {
      return { success: false, error: 'Cannot release lock held by another user' };
    }

    await prisma.documentLock.delete({
      where: { id: lock.id },
    });

    return { success: true };
  } catch (error) {
    console.error('Error releasing lock:', error);
    return { success: false, error: 'Failed to release lock' };
  }
}

/**
 * Extend/refresh a lock (heartbeat)
 */
export async function extendLock(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });

    if (!lock) {
      return { success: false, error: 'No lock found' };
    }

    if (lock.userId !== userId) {
      return { success: false, error: 'Lock is held by another user' };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_EXTENSION_MINUTES * 60 * 1000);

    await prisma.documentLock.update({
      where: { id: lock.id },
      data: {
        lastPingAt: now,
        expiresAt,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error extending lock:', error);
    return { success: false, error: 'Failed to extend lock' };
  }
}

/**
 * Force release a lock (admin only)
 */
export async function forceReleaseLock(documentId: string): Promise<boolean> {
  try {
    await prisma.documentLock.delete({
      where: { documentId },
    });
    return true;
  } catch (error) {
    console.error('Error force releasing lock:', error);
    return false;
  }
}

/**
 * Clean up all expired locks
 */
export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const now = new Date();
    const result = await prisma.documentLock.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    if (result.count > 0) {
      console.log(`[Lock Cleanup] Removed ${result.count} expired locks`);
    }

    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired locks:', error);
    return 0;
  }
}

/**
 * Get all active locks in a workspace
 */
export async function getWorkspaceLocks(workspaceId: string): Promise<LockInfo[]> {
  const now = new Date();

  const locks = await prisma.documentLock.findMany({
    where: {
      document: {
        workspaceId,
      },
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
    },
  });

  return locks.map((lock) => ({
    documentId: lock.documentId,
    userId: lock.userId,
    userName: lock.user.name,
    userEmail: lock.user.email,
    acquiredAt: lock.acquiredAt,
    expiresAt: lock.expiresAt,
  }));
}

/**
 * Get all locks held by a user
 */
export async function getUserLocks(userId: string): Promise<string[]> {
  const now = new Date();

  const locks = await prisma.documentLock.findMany({
    where: {
      userId,
      expiresAt: {
        gt: now,
      },
    },
    select: {
      documentId: true,
    },
  });

  return locks.map((lock) => lock.documentId);
}

/**
 * Release all locks held by a user (e.g., on logout)
 */
export async function releaseAllUserLocks(userId: string): Promise<number> {
  try {
    const result = await prisma.documentLock.deleteMany({
      where: {
        userId,
      },
    });

    console.log(`[Lock] Released ${result.count} locks for user ${userId}`);
    return result.count;
  } catch (error) {
    console.error('Error releasing user locks:', error);
    return 0;
  }
}
