# GitHub Integration - Comprehensive Documentation

## Overview

This implementation provides a **LeetHub-style** GitHub integration with zero-friction automation, complete PR tracking, and bidirectional synchronization.

## Key Features

### ✅ Full OAuth Integration

- **Scopes**: `repo`, `read:org`, `read:user`, `user:email`, `workflow`, `write:discussion`
- **Enhanced Profile Storage**: GitHub user ID, username, avatar, profile URL, email
- **Token Management**: Encrypted storage with expiration tracking
- **Automatic Re-authentication**: Prompts when scopes are missing

### ✅ Automated Path Mapping

- **Zero User Prompts**: Paths are auto-generated from document titles
- **Smart Slug Generation**: Clean, URL-safe file paths
- **Type-Based Organization**: Auto-folder creation based on document type
  - Specs → `specifications/`
  - Meetings → `meeting-notes/`
  - Decisions → `decisions/`
  - Tutorials → `tutorials/`
- **Hierarchy Preservation**: Optional parent-child path structure
- **Collision Handling**: Automatic numeric suffixes for duplicates

### ✅ Pull Request Tracking

- **Automatic Linking**: PRs linked to documents via file paths
- **Full Lifecycle Tracking**: Open, updated, closed, merged events
- **Document Impact View**: See all PRs affecting each document
- **Auto-created PR Mode**: Option to push via PR instead of direct commits
- **Webhook Integration**: Real-time PR status updates

### ✅ Background Sync Worker

- **Queue-Based Processing**: Priority queue with retry logic
- **Exponential Backoff**: Smart retries for failed syncs
- **Concurrent Limits**: Prevents API rate limiting
- **Status Tracking**: Real-time sync progress
- **Auto-sync on Save**: Debounced automatic syncing

### ✅ Conflict Resolution

- **Automatic Detection**: SHA-based conflict detection
- **Three-Way Diff**: Visual side-by-side comparison
- **Resolution Strategies**:
  - **Manual**: User chooses merged content
  - **Local Wins**: Keep platform version
  - **Remote Wins**: Keep GitHub version
  - **Auto-merge**: Smart merge of non-overlapping changes
- **Conflict History**: Audit log of all resolutions

### ✅ Webhook Handlers

- **Push Events**: Auto-pull on GitHub changes
- **PR Events**: Track opened, updated, closed, merged
- **Issue Events**: Sync GitHub issues
- **Signature Verification**: Secure webhook authentication

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Documents  │  │ PR Tracker │  │ Conflicts  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
┌──────────────▼───────────────▼───────────────▼──────────────┐
│                     API Layer                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Sync API │  │   PR API   │  │ Webhook API│            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
┌──────────────▼───────────────▼───────────────▼──────────────┐
│                  Business Logic Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Path Mapper│  │ PR Tracker │  │   Conflict │            │
│  │            │  │            │  │  Resolver  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐                             │
│  │Sync Worker │  │GitHub Client│                            │
│  └────────────┘  └────────────┘                             │
└──────────────┬───────────────┬──────────────┬───────────────┘
               │               │              │
┌──────────────▼───────────────▼──────────────▼───────────────┐
│                     Data Layer                              │
│  ┌────────────────────────────────────────────┐             │
│  │              PostgreSQL + Prisma            │             │
│  │  • SyncQueue  • ConflictResolution         │             │
│  │  • GitHubPR   • GitHubWebhook              │             │
│  │  • SyncEvent  • DocSyncInfo                │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                   GitHub API (Octokit)                      │
│  • Repository Operations • PR Management                    │
│  • File Operations       • Webhook Management               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Enhancements

### User Model

```prisma
model User {
  // Enhanced GitHub fields
  githubUserId         Int?
  githubUsername       String?
  githubAvatarUrl      String?
  githubProfileUrl     String?
  githubEmail          String?
  githubTokenScopes    String[]
  githubTokenExpiresAt DateTime?
}
```

### Document Model

```prisma
model Document {
  // GitHub integration
  githubPath          String?
  githubSha           String?
  githubAutoGenerated Boolean @default(false)

  syncQueue           SyncQueue[]
  conflicts           ConflictResolution[]
  syncEvents          SyncEvent[]
}
```

### New Models

#### SyncQueue

Manages background sync operations with priority and retry logic.

```prisma
model SyncQueue {
  id          String
  documentId  String
  operation   String // "push", "pull", "create"
  priority    Int
  status      String // "pending", "processing", "completed", "failed"
  attemptCount Int
  maxAttempts Int
  scheduledAt DateTime
}
```

#### ConflictResolution

Tracks merge conflicts and resolutions.

```prisma
model ConflictResolution {
  id            String
  documentId    String
  localContent  String
  remoteContent String
  status        String // "pending", "resolved", "cancelled"
  resolution    String?
  resolvedBy    String?
}
```

#### GitHubWebhook

Manages webhook subscriptions.

```prisma
model GitHubWebhook {
  id              String
  repoId          String
  githubWebhookId String @unique
  secret          String
  events          String[]
  active          Boolean
}
```

## API Endpoints

### Sync Operations

#### `POST /api/sync/push`

Push document to GitHub (queues background sync).

```typescript
{
  "documentId": "...",
  "commitMessage": "docs: update feature spec"
}
```

#### `POST /api/sync/pull`

Pull document from GitHub (queues background sync).

```typescript
{
  "documentId": "..."
}
```

#### `GET /api/sync/status`

Get sync queue status.

```typescript
Response: {
  "pending": 5,
  "processing": 2,
  "failed": 0
}
```

### PR Operations

#### `GET /api/prs?workspaceId=...`

List pull requests for workspace.

#### `GET /api/prs/:prId/documents`

Get documents affected by PR.

#### `POST /api/prs/:prId/link`

Manually link PR to document.

### Conflict Resolution

#### `GET /api/conflicts?workspaceId=...`

List pending conflicts.

#### `POST /api/conflicts/:id/resolve`

Resolve conflict.

```typescript
{
  "strategy": "local" | "remote" | "manual",
  "resolvedContent"?: "..."
}
```

### Webhooks

#### `POST /api/webhooks/github`

GitHub webhook endpoint (public, signature-verified).

## Usage Examples

### 1. Automatic Push on Document Save

```typescript
// src/app/api/documents/[id]/route.ts
import { queueSync } from '@/lib/github/sync-worker';

// After saving document
await queueSync(documentId, workspaceId, 'push', 0, {
  commitMessage: `docs: update ${document.title}`,
});
```

### 2. Manual Pull from GitHub

```typescript
import { queueSync } from '@/lib/github/sync-worker';

await queueSync(documentId, workspaceId, 'pull', 10);
```

### 3. Get Document PRs

```typescript
import { getDocumentPRs } from '@/lib/github/pr-tracker';

const prs = await getDocumentPRs(documentId);
console.log(`${prs.length} PRs affecting this document`);
```

### 4. Resolve Conflict

```typescript
import { resolveConflict } from '@/lib/github/conflict-resolver';

await resolveConflict(conflictId, 'manual', mergedContent, userId);
```

### 5. Setup Webhook

```typescript
import { getGitHubClient, createWebhook } from '@/lib/github/client';

const octokit = await getGitHubClient(userId);
const webhookUrl = 'https://yourdomain.com/api/webhooks/github';
const secret = process.env.GITHUB_WEBHOOK_SECRET!;

await createWebhook(octokit, 'owner', 'repo', webhookUrl, secret, [
  'push',
  'pull_request',
  'issues',
]);
```

## Environment Variables

Add to `.env.local`:

```env
# GitHub OAuth
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret

# GitHub Webhook
GITHUB_WEBHOOK_SECRET=your_secure_webhook_secret

# ⚠️ REQUIRED: Encryption key for GitHub access tokens
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_string
```

**Note:** All GitHub access tokens are now encrypted at rest using AES-256-CBC encryption. The `ENCRYPTION_KEY` is required for production deployments.

## Background Worker Setup

### Option 1: Next.js API Route (Simple)

Create `/api/cron/sync-worker/route.ts`:

```typescript
import { processAllPending } from '@/lib/github/sync-worker';

export async function GET() {
  const processed = await processAllPending(10);
  return Response.json({ processed });
}
```

Use Vercel Cron or external scheduler to call this every minute.

### Option 2: Dedicated Worker (Production)

```typescript
// worker.ts
import { processNextSync } from '@/lib/github/sync-worker';

async function main() {
  while (true) {
    const hasMore = await processNextSync();
    if (!hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main();
```

Run with: `node worker.ts` or `pm2 start worker.ts`

## GitHub App Setup

1. **Create GitHub OAuth App**: https://github.com/settings/applications/new
   - Homepage URL: `https://yourdomain.com`
   - Callback URL: `https://yourdomain.com/api/auth/callback/github`
   - Scopes: `repo read:org read:user user:email workflow write:discussion`

2. **Configure Webhook**:
   - Payload URL: `https://yourdomain.com/api/webhooks/github`
   - Content type: `application/json`
   - Secret: Generate a secure random string
   - Events: Push, Pull requests, Issues

3. **Add Environment Variables** (see above)

## Testing

### Test Automated Path Generation

```typescript
import { getDocumentGitHubPath } from '@/lib/github/path-mapper';

const path = await getDocumentGitHubPath('doc-id');
console.log(path); // "docs/specifications/feature-name.md"
```

### Test Sync Worker

```typescript
import { processNextSync } from '@/lib/github/sync-worker';

const success = await processNextSync();
console.log('Sync processed:', success);
```

### Test Conflict Detection

```typescript
import { detectConflict } from '@/lib/github/conflict-resolver';

const hasConflict = await detectConflict(localContent, remoteContent, localSha, remoteSha);
```

## Troubleshooting

### Issue: Scopes Missing

**Solution**: User must re-authenticate with GitHub to grant new scopes.

### Issue: Sync Queue Stuck

**Solution**: Check worker is running, review failed queue items.

### Issue: Webhook Not Firing

**Solution**: Verify webhook secret, check GitHub webhook delivery logs.

### Issue: Path Collisions

**Solution**: System auto-appends numbers, or manually set custom paths.

## Future Enhancements

- [ ] Branch-based workflows (feature branches)
- [ ] Multi-repository support per workspace
- [ ] Commit history visualization
- [ ] PR review integration
- [ ] Code review comments sync
- [ ] GitHub Discussions sync
- [ ] GitHub Projects integration
- [ ] Automated PR descriptions from document changes

## License

Same as main project license.
