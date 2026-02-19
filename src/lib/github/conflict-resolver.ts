/**
 * Conflict Detection and Resolution
 * Handles merge conflicts between platform and GitHub
 */

import { prisma } from '@/lib/prisma';
import { diffLines, Change } from 'diff';

export interface ConflictInfo {
  id: string;
  documentId: string;
  localContent: string;
  remoteContent: string;
  localSha: string;
  remoteSha: string;
  status: string;
  createdAt: Date;
}

/**
 * Detect if content has conflicting changes
 */
export async function detectConflict(
  localContent: string,
  remoteContent: string,
  localSha: string,
  remoteSha: string
): Promise<boolean> {
  // If SHAs match, no conflict
  if (localSha === remoteSha) {
    return false;
  }

  // If content matches, no conflict (same changes made)
  if (localContent === remoteContent) {
    return false;
  }

  // Different content and different SHAs = potential conflict
  // Check if changes are on different lines (can auto-merge)
  const canAutoMerge = checkAutoMergeable(localContent, remoteContent);

  return !canAutoMerge;
}

/**
 * Check if changes can be auto-merged (non-overlapping line changes)
 */
function checkAutoMergeable(local: string, remote: string): boolean {
  const diff = diffLines(local, remote);

  // Look for conflicting changes (both added/removed at same position)
  let hasConflict = false;

  for (let i = 0; i < diff.length; i++) {
    const change = diff[i];
    if (change.added || change.removed) {
      // Check if next change is opposite type (conflict indicator)
      const next = diff[i + 1];
      if (next && ((change.added && next.removed) || (change.removed && next.added))) {
        hasConflict = true;
        break;
      }
    }
  }

  return !hasConflict;
}

/**
 * Create a conflict record
 */
export async function createConflictRecord(
  documentId: string,
  localContent: string,
  remoteContent: string,
  localSha: string,
  remoteSha: string
): Promise<string> {
  // Get sync info
  const syncInfo = await prisma.docSyncInfo.findUnique({
    where: { documentId },
  });

  if (!syncInfo) {
    throw new Error('Sync info not found for document');
  }

  // Check if conflict already exists
  const existing = await prisma.conflictResolution.findFirst({
    where: {
      documentId,
      status: 'pending',
    },
  });

  if (existing) {
    // Update existing conflict
    const updated = await prisma.conflictResolution.update({
      where: { id: existing.id },
      data: {
        localContent,
        remoteContent,
        localSha,
        remoteSha,
        updatedAt: new Date(),
      },
    });
    return updated.id;
  }

  // Create new conflict record
  const conflict = await prisma.conflictResolution.create({
    data: {
      documentId,
      syncInfoId: syncInfo.id,
      localContent,
      remoteContent,
      localSha,
      remoteSha,
      status: 'pending',
    },
  });

  // Log conflict event
  await prisma.syncEvent.create({
    data: {
      syncInfoId: syncInfo.id,
      documentId,
      eventType: 'conflict_detected',
      direction: 'bidirectional',
      status: 'conflict',
      message: 'Merge conflict detected between platform and GitHub',
      metadata: {
        conflictId: conflict.id,
        localSha,
        remoteSha,
      },
    },
  });

  return conflict.id;
}

/**
 * Resolve conflict with chosen strategy
 */
export async function resolveConflict(
  conflictId: string,
  strategy: 'local' | 'remote' | 'manual',
  resolvedContent?: string,
  userId?: string
): Promise<void> {
  const conflict = await prisma.conflictResolution.findUnique({
    where: { id: conflictId },
    include: {
      document: true,
      syncInfo: true,
    },
  });

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  if (conflict.status !== 'pending') {
    throw new Error('Conflict already resolved');
  }

  let finalContent: string;

  switch (strategy) {
    case 'local':
      finalContent = conflict.localContent;
      break;
    case 'remote':
      finalContent = conflict.remoteContent;
      break;
    case 'manual':
      if (!resolvedContent) {
        throw new Error('Manual resolution requires resolved content');
      }
      finalContent = resolvedContent;
      break;
  }

  // Update document with resolved content
  await prisma.document.update({
    where: { id: conflict.documentId },
    data: {
      content: finalContent,
    },
  });

  // Mark conflict as resolved
  await prisma.conflictResolution.update({
    where: { id: conflictId },
    data: {
      status: 'resolved',
      resolution: finalContent,
      resolvedBy: userId,
      resolvedAt: new Date(),
    },
  });

  // Update sync info status
  await prisma.docSyncInfo.update({
    where: { id: conflict.syncInfoId },
    data: {
      syncStatus: 'SYNCED',
      needSyncToGitHub: strategy !== 'remote', // Need to push if we kept local/manual
      needSyncFromGitHub: false,
    },
  });

  // Log resolution event
  await prisma.syncEvent.create({
    data: {
      syncInfoId: conflict.syncInfoId,
      documentId: conflict.documentId,
      eventType: 'conflict_resolved',
      direction: 'bidirectional',
      status: 'success',
      message: `Conflict resolved using ${strategy} strategy`,
      metadata: {
        conflictId,
        strategy,
        resolvedBy: userId,
      },
    },
  });
}

/**
 * Get pending conflicts for a document
 */
export async function getDocumentConflicts(documentId: string): Promise<ConflictInfo[]> {
  const conflicts = await prisma.conflictResolution.findMany({
    where: {
      documentId,
      status: 'pending',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return conflicts;
}

/**
 * Get all pending conflicts in a workspace
 */
export async function getWorkspaceConflicts(workspaceId: string): Promise<ConflictInfo[]> {
  const conflicts = await prisma.conflictResolution.findMany({
    where: {
      document: {
        workspaceId,
      },
      status: 'pending',
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Remove the document property from the response
  return conflicts.map((c) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { document, ...rest } = c;
    return rest as ConflictInfo;
  });
}

/**
 * Generate three-way diff for conflict visualization
 */
export function generateConflictDiff(localContent: string, remoteContent: string): Change[] {
  return diffLines(localContent, remoteContent);
}

/**
 * Auto-resolve conflict if possible (non-overlapping changes)
 */
export async function attemptAutoResolve(conflictId: string): Promise<boolean> {
  const conflict = await prisma.conflictResolution.findUnique({
    where: { id: conflictId },
  });

  if (!conflict) {
    return false;
  }

  const canAutoMerge = checkAutoMergeable(conflict.localContent, conflict.remoteContent);

  if (canAutoMerge) {
    // Attempt smart merge (take both non-conflicting changes)
    const merged = smartMerge(conflict.localContent, conflict.remoteContent);

    await resolveConflict(conflictId, 'manual', merged);
    return true;
  }

  return false;
}

/**
 * Smart merge of non-conflicting changes
 */
function smartMerge(local: string, remote: string): string {
  const diff = diffLines(local, remote);

  const result: string[] = [];

  for (const change of diff) {
    if (!change.removed) {
      result.push(change.value);
    }
  }

  return result.join('');
}

/**
 * Cancel conflict resolution (mark as cancelled)
 */
export async function cancelConflict(conflictId: string): Promise<void> {
  await prisma.conflictResolution.update({
    where: { id: conflictId },
    data: {
      status: 'cancelled',
    },
  });
}
