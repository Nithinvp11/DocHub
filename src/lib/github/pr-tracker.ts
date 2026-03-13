/**
 * Pull Request Tracking
 * Automatic linking of PRs to documents
 */

import { prisma } from '@/lib/prisma';
import { getGitHubClient, listPullRequests, getPullRequestFiles, GitHubPR } from './client';

/**
 * Fetch and sync all PRs for a repository
 */
export async function syncRepositoryPRs(repoId: string, userId: string): Promise<number> {
  const repo = await prisma.gitHubRepo.findUnique({
    where: { id: repoId },
  });

  if (!repo) {
    throw new Error('Repository not found');
  }

  const octokit = await getGitHubClient(userId);
  const prs = await listPullRequests(octokit, repo.repoOwner, repo.repoName, 'all');

  let synced = 0;

  for (const pr of prs) {
    await syncPullRequest(repoId, pr, userId);
    synced++;
  }

  // Update last synced timestamp
  await prisma.gitHubRepo.update({
    where: { id: repoId },
    data: { lastSyncedAt: new Date() },
  });

  return synced;
}

/**
 * Sync a single pull request
 */
export async function syncPullRequest(
  repoId: string,
  prData: GitHubPR,
  userId: string
): Promise<string> {
  const repo = await prisma.gitHubRepo.findUnique({
    where: { id: repoId },
  });

  if (!repo) {
    throw new Error('Repository not found');
  }

  // Get affected files
  const octokit = await getGitHubClient(userId);
  const files = await getPullRequestFiles(octokit, repo.repoOwner, repo.repoName, prData.number);

  // Find documents linked to these files
  const linkedDocuments = await prisma.document.findMany({
    where: {
      workspaceId: repo.workspaceId,
      githubPath: {
        in: files,
      },
    },
    select: { id: true },
  });

  const linkedDocumentIds = linkedDocuments.map((d) => d.id);

  // Upsert PR record
  const pr = await prisma.gitHubPullRequest.upsert({
    where: {
      repoId_number: {
        repoId,
        number: prData.number,
      },
    },
    create: {
      repoId,
      number: prData.number,
      title: prData.title,
      body: prData.body || '',
      state: prData.state,
      author: prData.user.login,
      authorAvatar: prData.user.avatar_url,
      htmlUrl: prData.html_url,
      linkedDocumentIds,
      affectedFiles: files,
      autoCreated: false,
      createdAt: new Date(prData.created_at),
      updatedAt: new Date(prData.updated_at),
      closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
      mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
      syncedAt: new Date(),
    },
    update: {
      title: prData.title,
      body: prData.body || '',
      state: prData.state,
      linkedDocumentIds,
      affectedFiles: files,
      updatedAt: new Date(prData.updated_at),
      closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
      mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
      syncedAt: new Date(),
    },
  });

  return pr.id;
}

/**
 * Get PRs affecting a specific document
 */
export async function getDocumentPRs(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      workspace: {
        include: {
          githubRepos: {
            include: {
              pullRequests: {
                where: {
                  linkedDocumentIds: {
                    has: documentId,
                  },
                },
                orderBy: {
                  updatedAt: 'desc',
                },
              },
            },
          },
        },
      },
    },
  });

  if (!document) {
    return [];
  }

  const allPRs = document.workspace.githubRepos.flatMap((repo) => repo.pullRequests);

  return allPRs;
}

/**
 * Get PR impact summary for a workspace
 */
export async function getWorkspacePRSummary(workspaceId: string) {
  const repos = await prisma.gitHubRepo.findMany({
    where: { workspaceId },
    include: {
      pullRequests: {
        where: {
          state: 'open',
        },
      },
    },
  });

  const openPRs = repos.flatMap((r) => r.pullRequests);

  const affectedDocumentIds = new Set<string>();
  openPRs.forEach((pr) => {
    pr.linkedDocumentIds.forEach((id) => affectedDocumentIds.add(id));
  });

  return {
    totalOpenPRs: openPRs.length,
    affectedDocuments: affectedDocumentIds.size,
    repositories: repos.length,
  };
}

/**
 * Track PR lifecycle event
 */
export async function trackPREvent(
  prId: string,
  event: 'opened' | 'updated' | 'closed' | 'merged',
  metadata?: Record<string, unknown>
): Promise<void> {
  const pr = await prisma.gitHubPullRequest.findUnique({
    where: { id: prId },
    include: {
      repo: true,
    },
  });

  if (!pr) {
    return;
  }

  // For each linked document, create a sync event
  for (const documentId of pr.linkedDocumentIds) {
    const syncInfo = await prisma.docSyncInfo.findUnique({
      where: { documentId },
    });

    if (syncInfo) {
      await prisma.syncEvent.create({
        data: {
          syncInfoId: syncInfo.id,
          documentId,
          prId,
          prNumber: pr.number,
          eventType: `pull_request_${event}`,
          direction: 'from_github',
          status: 'success',
          message: `PR #${pr.number} ${event}: ${pr.title}`,
          metadata: {
            prNumber: pr.number,
            prTitle: pr.title,
            prUrl: pr.htmlUrl,
            event,
            ...metadata,
          },
        },
      });
    }
  }
}

/**
 * Link PR to additional documents manually
 */
export async function linkPRToDocument(prId: string, documentId: string): Promise<void> {
  const pr = await prisma.gitHubPullRequest.findUnique({
    where: { id: prId },
  });

  if (!pr) {
    throw new Error('PR not found');
  }

  if (pr.linkedDocumentIds.includes(documentId)) {
    return; // Already linked
  }

  await prisma.gitHubPullRequest.update({
    where: { id: prId },
    data: {
      linkedDocumentIds: {
        push: documentId,
      },
    },
  });
}

/**
 * Unlink PR from document
 */
export async function unlinkPRFromDocument(prId: string, documentId: string): Promise<void> {
  const pr = await prisma.gitHubPullRequest.findUnique({
    where: { id: prId },
  });

  if (!pr) {
    throw new Error('PR not found');
  }

  const newLinkedIds = pr.linkedDocumentIds.filter((id) => id !== documentId);

  await prisma.gitHubPullRequest.update({
    where: { id: prId },
    data: {
      linkedDocumentIds: newLinkedIds,
    },
  });
}

/**
 * Get PR statistics for a repository
 */
export async function getRepositoryPRStats(repoId: string) {
  const [open, merged, closed] = await Promise.all([
    prisma.gitHubPullRequest.count({
      where: { repoId, state: 'open' },
    }),
    prisma.gitHubPullRequest.count({
      where: { repoId, state: 'closed', mergedAt: { not: null } },
    }),
    prisma.gitHubPullRequest.count({
      where: { repoId, state: 'closed', mergedAt: null },
    }),
  ]);

  return { open, merged, closed, total: open + merged + closed };
}

/**
 * Check if document has pending PRs
 */
export async function hasDocumentPendingPRs(documentId: string): Promise<boolean> {
  const prs = await getDocumentPRs(documentId);
  return prs.some((pr) => pr.state === 'open');
}

/**
 * Get recent PR activity for a workspace
 */
export async function getRecentPRActivity(workspaceId: string, limit = 10) {
  const repos = await prisma.gitHubRepo.findMany({
    where: { workspaceId },
    include: {
      pullRequests: {
        orderBy: { updatedAt: 'desc' },
        take: limit,
      },
    },
  });

  const allPRs = repos.flatMap((r) =>
    r.pullRequests.map((pr) => ({
      ...pr,
      repoName: `${r.repoOwner}/${r.repoName}`,
    }))
  );

  // Sort by updated date and take limit
  return allPRs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
}
