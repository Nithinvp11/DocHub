import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/encryption';

async function provisionWorkspaceAuthFromLinkedAccount(workspaceId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'github',
      access_token: { not: null },
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      token_type: true,
      scope: true,
    },
  });

  if (!account?.access_token) {
    return null;
  }

  return prisma.gitHubAuth.upsert({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    create: {
      userId,
      workspaceId,
      accessToken: encryptToken(account.access_token),
      refreshToken: account.refresh_token ? encryptToken(account.refresh_token) : null,
      scope: account.scope,
      tokenType: account.token_type || 'Bearer',
      expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
    },
    update: {
      accessToken: encryptToken(account.access_token),
      refreshToken: account.refresh_token ? encryptToken(account.refresh_token) : null,
      scope: account.scope,
      tokenType: account.token_type || 'Bearer',
      expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Resolves a GitHub auth record for a workspace operation.
 *
 * Priority order:
 *  1. The requesting user's own GitHubAuth for this workspace
 *  2. The workspace owner's GitHubAuth
 *  3. Any connected member's GitHubAuth (most recently updated)
 *
 * This allows any member with GITHUB_* permissions to perform sync operations
 * as long as at least one person in the workspace has connected their GitHub account.
 */
export async function resolveWorkspaceGitHubAuth(workspaceId: string, preferUserId?: string) {
  if (preferUserId) {
    const userAuth = await prisma.gitHubAuth.findUnique({
      where: { userId_workspaceId: { userId: preferUserId, workspaceId } },
    });
    if (userAuth) return userAuth;

    // Auto-provision workspace auth from the member's linked GitHub account if possible.
    const provisionedAuth = await provisionWorkspaceAuthFromLinkedAccount(
      workspaceId,
      preferUserId
    );
    if (provisionedAuth) return provisionedAuth;
  }

  // Fall back to workspace owner's token
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  if (workspace) {
    const ownerAuth = await prisma.gitHubAuth.findUnique({
      where: { userId_workspaceId: { userId: workspace.ownerId, workspaceId } },
    });
    if (ownerAuth) return ownerAuth;

    const provisionedOwnerAuth = await provisionWorkspaceAuthFromLinkedAccount(
      workspaceId,
      workspace.ownerId
    );
    if (provisionedOwnerAuth) return provisionedOwnerAuth;
  }

  // Fall back to any connected member
  return prisma.gitHubAuth.findFirst({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
  });
}
