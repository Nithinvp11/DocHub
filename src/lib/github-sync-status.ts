export type GitHubSyncState = 'not-connected' | 'connected' | 'synced';

/**
 * Determine a workspace's GitHub sync state from server-provided fields.
 * - not-connected: no WorkspaceGitHubIntegration record
 * - connected: integration exists but no repo has a lastSyncedAt timestamp yet
 * - synced: at least one repo shows lastSyncedAt
 */
export function computeWorkspaceGitHubSyncState(workspace: {
  githubIntegration?: { repository?: string } | null;
  githubRepos?: { lastSyncedAt?: Date | string | null }[] | null;
}): GitHubSyncState {
  if (!workspace?.githubIntegration) return 'not-connected';

  const repos = workspace.githubRepos ?? [];
  const anySynced = repos.some((r) => Boolean(r && r.lastSyncedAt));
  if (anySynced) return 'synced';

  return 'connected';
}
