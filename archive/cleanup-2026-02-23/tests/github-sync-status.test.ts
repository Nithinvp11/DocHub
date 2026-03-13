import { strict as assert } from 'assert';
import { computeWorkspaceGitHubSyncState } from '../src/lib/github-sync-status';

console.log('\n🧪 computeWorkspaceGitHubSyncState tests');

// 1) No integration -> not-connected
const ws1 = { githubIntegration: null, githubRepos: [] };
assert.equal(computeWorkspaceGitHubSyncState(ws1), 'not-connected');
console.log('✅ not-connected when no integration');

// 2) Integration exists but no repo has lastSyncedAt -> connected
const ws2 = {
  githubIntegration: { repository: 'org/repo' },
  githubRepos: [{ lastSyncedAt: null }, {}],
};
assert.equal(computeWorkspaceGitHubSyncState(ws2), 'connected');
console.log('✅ connected when integration exists but no lastSyncedAt');

// 3) Integration + a repo with lastSyncedAt -> synced
const ws3 = {
  githubIntegration: { repository: 'org/repo' },
  githubRepos: [{ lastSyncedAt: new Date().toISOString() }],
};
assert.equal(computeWorkspaceGitHubSyncState(ws3), 'synced');
console.log('✅ synced when at least one repo has lastSyncedAt');

console.log('\nAll tests passed for computeWorkspaceGitHubSyncState\n');
