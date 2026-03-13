# Safe GitHub Sync Implementation

## Overview

Implemented safe GitHub push sync with **conflict detection** to prevent accidental overwrites when documents are modified in both the platform and GitHub simultaneously.

## Problem Statement

**Before:** Documents could be synced to GitHub without checking if the file had been modified by someone else, potentially causing data loss.

**After:** The system now detects conflicts by comparing file SHAs before pushing, ensuring safe synchronization.

## Architecture

### Conflict Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Sync to GitHub"                              │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Fetch Workspace GitHub Integration                        │
│    - repository: "owner/repo"                                │
│    - branch: "main"                                          │
│    - basePath: "docs"                                        │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Compute Full GitHub File Path                            │
│    fullPath = `${basePath}/${document.githubPath}`          │
│    Example: "docs/api/authentication.md"                    │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Fetch File from GitHub API                               │
│    GET /repos/{owner}/{repo}/contents/{path}?ref={branch}   │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
               ┌──────┴──────┐
               │ File Exists? │
               └──────┬───────┘
                      │
         ┌────────────┴────────────┐
         │ YES                     │ NO
         ▼                         ▼
┌────────────────────┐   ┌──────────────────┐
│ 5a. Compare SHAs   │   │ 5b. Create New   │
│                    │   │     File         │
│ Current GitHub SHA │   └────────┬─────────┘
│        vs          │            │
│ Last Known SHA     │            │
│ (lastExternalHash) │            │
└────────┬───────────┘            │
         │                        │
    ┌────┴────┐                   │
    │ Match?  │                   │
    └────┬────┘                   │
         │                        │
    ┌────┴────┐                   │
    YES       NO                  │
    │         │                   │
    ▼         ▼                   ▼
┌────────┐ ┌──────────┐   ┌──────────────┐
│ 6a.    │ │ 6b.      │   │ 6c.          │
│ SAFE   │ │ CONFLICT │   │ CREATE       │
│ PUSH   │ │ DETECTED │   │ NEW FILE     │
└────┬───┘ └────┬─────┘   └──────┬───────┘
     │          │                 │
     ▼          ▼                 ▼
┌────────────────────────────────────────┐
│ 7. Update Database                     │
│    - document.githubSha = new SHA      │
│    - syncInfo.lastExternalHash = SHA   │
│    - syncInfo.syncStatus = "SYNCED"    │
│    - syncInfo.lastSyncedAt = now()     │
└────────────────────────────────────────┘
```

### Key Components

#### 1. **Document Model** (Already Exists)

```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  githubPath  String?  // Path relative to workspace basePath
  githubSha   String?  // ⭐ Last synced file content SHA from GitHub
  // ... other fields
}
```

**New Usage:**

- `githubSha` now stores the file content SHA from GitHub
- Used for conflict detection on next sync

#### 2. **DocSyncInfo Model** (Enhanced)

```prisma
model DocSyncInfo {
  id                  String       @id @default(cuid())
  documentId          String       @unique
  githubRepository    String       // "owner/repo"
  githubBranch        String       @default("main")
  githubPath          String       // Full path in repo
  lastExternalHash    String?      // ⭐ GitHub file content SHA (for conflict detection)
  lastDerivedHash     String?      // Platform commit SHA
  syncStatus          SyncStatus   @default(SYNCED)
  lastError           String?      @db.Text
  errorCount          Int          @default(0)
  lastSyncedAt        DateTime?
  // ... other fields
}

enum SyncStatus {
  SYNCED       // ✅ Successfully synced
  PENDING      // ⏳ Queued for sync
  SYNCING      // 🔄 Currently syncing
  CONFLICT     // ⚠️ Conflict detected (NEW)
  ERROR        // ❌ Sync failed
  PAUSED       // ⏸️ Sync disabled
}
```

**Key Fields:**

- `lastExternalHash`: Stores GitHub file content SHA after successful sync
- `syncStatus`: Tracks current sync state (including CONFLICT)
- `lastError`: Stores detailed error messages

## Implementation Details

### 1. GitHubSyncService (`src/lib/github-sync-service.ts`)

#### Updated Method Signature

```typescript
async syncToGitHub(
  documentId: string,
  config: SyncConfig
): Promise<{
  status: 'success' | 'conflict';
  sha?: string;
  message?: string;
  conflictDetails?: any;
}>
```

**Return Types:**

- **Success:** `{ status: 'success', sha: string, message: string }`
- **Conflict:** `{ status: 'conflict', message: string, conflictDetails: {...} }`

#### Conflict Detection Logic

```typescript
// 1. Fetch current file from GitHub
const { data } = await this.octokit.rest.repos.getContent({
  owner,
  repo,
  path: filePath,
  ref: branch,
});
const existingFile = data as { sha: string };

// 2. Compare SHAs (if we have a last known SHA)
if (existingFile && syncInfo?.lastExternalHash && existingFile.sha !== syncInfo.lastExternalHash) {
  // CONFLICT DETECTED!
  console.warn(`[GitHub Sync] CONFLICT DETECTED`);
  console.warn(`  Expected SHA: ${syncInfo.lastExternalHash}`);
  console.warn(`  Current GitHub SHA: ${existingFile.sha}`);

  // Mark as CONFLICT in database
  await prisma.docSyncInfo.update({
    where: { id: syncInfo.id },
    data: {
      syncStatus: 'CONFLICT',
      lastError: `File modified in GitHub. Expected: ${syncInfo.lastExternalHash}, Current: ${existingFile.sha}`,
      needSyncFromGitHub: true,
    },
  });

  // Return conflict response
  return {
    status: 'conflict',
    message: 'Conflict detected: File has been modified in GitHub',
    conflictDetails: {
      expectedSha: syncInfo.lastExternalHash,
      currentSha: existingFile.sha,
      githubUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`,
    },
  };
}
```

#### Safe Push Logic

```typescript
// 3. If no conflict, proceed with push
const result = await this.octokit.rest.repos.createOrUpdateFileContents({
  owner,
  repo,
  path: filePath,
  message: commitMessage,
  content: base64Content,
  branch,
  sha: existingFile?.sha, // Include existing SHA to ensure atomicity
  author: commitAuthor,
});

// 4. Update database with new SHAs
const newFileSha = result.data.content?.sha || '';

await prisma.document.update({
  where: { id: documentId },
  data: {
    githubSha: newFileSha, // ⭐ Store for next conflict check
    githubPath: filePath,
  },
});

await prisma.docSyncInfo.update({
  where: { id: syncInfo.id },
  data: {
    lastExternalHash: newFileSha, // ⭐ Store for next conflict check
    lastDerivedHash: result.data.commit.sha,
    syncStatus: 'SYNCED',
    lastError: null,
    errorCount: 0,
    lastSyncedAt: new Date(),
  },
});

return {
  status: 'success',
  sha: newFileSha,
  message: 'Document synced successfully',
};
```

### 2. Sync Document API (`src/app/api/github/sync-document/route.ts`)

#### Request Format

```typescript
POST /api/github/sync-document
{
  "documentId": "clx123abc",
  "autoSync": false
}
```

**Note:** Repository, branch, and basePath are now fetched from workspace GitHub integration.

#### Response Formats

**✅ Success Response (200)**

```json
{
  "status": "success",
  "message": "Document synced to GitHub successfully",
  "sha": "a1b2c3d4e5f6..."
}
```

**⚠️ Conflict Response (409)**

```json
{
  "status": "conflict",
  "error": "Conflict detected: File has been modified in GitHub",
  "message": "Please pull the latest changes from GitHub before syncing.",
  "conflictDetails": {
    "expectedSha": "old123abc...",
    "currentSha": "new456def...",
    "githubUrl": "https://github.com/owner/repo/blob/main/docs/file.md"
  }
}
```

**❌ Error Response (400/404/500)**

```json
{
  "status": "error",
  "error": "Workspace GitHub not connected",
  "message": "Please configure GitHub integration in workspace settings first.",
  "redirectTo": "/dashboard/workspace-id/settings/github"
}
```

#### API Handler Logic

```typescript
// 1. Fetch workspace GitHub integration
const document = await prisma.document.findFirst({
  where: { id: documentId },
  include: {
    workspace: {
      include: { githubIntegration: true },
    },
  },
});

// 2. Validate workspace integration exists
if (!document.workspace.githubIntegration) {
  return NextResponse.json(
    {
      status: 'error',
      error: 'Workspace GitHub not connected',
      message: 'Please configure GitHub integration first.',
      redirectTo: `/dashboard/${workspaceId}/settings/github`,
    },
    { status: 400 }
  );
}

// 3. Call sync service with workspace config
const { repository, branch, basePath } = document.workspace.githubIntegration;
const syncResult = await syncService.syncToGitHub(documentId, {
  repository,
  branch,
  basePath,
  autoSync,
  conflictResolution: 'LAST_WRITE_WINS',
});

// 4. Handle conflict response
if (syncResult.status === 'conflict') {
  return NextResponse.json(
    {
      status: 'conflict',
      error: syncResult.message,
      conflictDetails: syncResult.conflictDetails,
      message: 'Please pull the latest changes from GitHub before syncing.',
    },
    { status: 409 }
  );
}

// 5. Return success
return NextResponse.json({
  status: 'success',
  message: syncResult.message,
  sha: syncResult.sha,
});
```

## Conflict Resolution Workflow

### Scenario: Concurrent Modifications

**Timeline:**

1. **T0:** User A syncs document to GitHub
   - Document content: "Version 1"
   - GitHub file SHA: `sha_v1`
   - `document.githubSha` = `sha_v1`
   - `syncInfo.lastExternalHash` = `sha_v1`

2. **T1:** User B modifies file directly in GitHub
   - Document content: "Version 2"
   - GitHub file SHA: `sha_v2`
   - Platform still has: `lastExternalHash` = `sha_v1`

3. **T2:** User A modifies document in platform and clicks "Sync to GitHub"
   - Document content: "Version 3"
   - System fetches GitHub file → SHA is `sha_v2`
   - Compare: `sha_v2` ≠ `sha_v1` (lastExternalHash)
   - **CONFLICT DETECTED! 🚨**

4. **T3:** System marks document as CONFLICT
   - `syncInfo.syncStatus` = `CONFLICT`
   - `syncInfo.lastError` = "File modified in GitHub..."
   - `syncInfo.needSyncFromGitHub` = `true`
   - Returns 409 response to user

5. **T4:** User must resolve conflict manually
   - Option 1: Pull changes from GitHub (sync FROM GitHub)
   - Option 2: Force push (overwrite GitHub with platform version)
   - Option 3: Manual merge in GitHub UI

### Conflict Resolution UI Flow

```
User clicks "Sync to GitHub"
         │
         ▼
    API returns 409 CONFLICT
         │
         ▼
┌─────────────────────────────────┐
│  ⚠️ Conflict Detected            │
│                                 │
│  This document has been         │
│  modified in GitHub since       │
│  your last sync.                │
│                                 │
│  Your last sync: sha_v1         │
│  Current GitHub: sha_v2         │
│                                 │
│  [View on GitHub]               │
│  [Pull Latest Changes]          │
│  [Force Push (Overwrite)]       │
└─────────────────────────────────┘
```

## Testing

### Manual Test: Conflict Detection

**Setup:**

1. Create a document in the platform
2. Sync it to GitHub (first sync)
3. Modify the file directly in GitHub (via GitHub UI or git push)
4. Return to platform and modify the same document
5. Click "Sync to GitHub"

**Expected Result:**

- API returns 409 status code
- Response includes:
  - `status: "conflict"`
  - `conflictDetails` with both SHAs
  - GitHub URL to view conflict
- Document status marked as `CONFLICT` in database
- Sync does NOT overwrite GitHub file

### API Test Cases

#### Test 1: First Sync (No Conflict)

```bash
curl -X POST http://localhost:3000/api/github/sync-document \
  -H "Content-Type: application/json" \
  -d '{"documentId": "doc123"}'

# Expected: 200 OK
# {
#   "status": "success",
#   "message": "Document synced to GitHub successfully",
#   "sha": "a1b2c3..."
# }
```

#### Test 2: Sync After External Modification (Conflict)

```bash
# 1. First sync - succeeds
curl -X POST .../sync-document -d '{"documentId": "doc123"}'

# 2. Manually edit file in GitHub (via web UI)

# 3. Try to sync again - should detect conflict
curl -X POST .../sync-document -d '{"documentId": "doc123"}'

# Expected: 409 CONFLICT
# {
#   "status": "conflict",
#   "error": "Conflict detected: File has been modified in GitHub",
#   "conflictDetails": {
#     "expectedSha": "old_sha",
#     "currentSha": "new_sha",
#     "githubUrl": "https://github.com/..."
#   }
# }
```

#### Test 3: Workspace Not Connected

```bash
curl -X POST .../sync-document -d '{"documentId": "doc_no_integration"}'

# Expected: 400 BAD REQUEST
# {
#   "status": "error",
#   "error": "Workspace GitHub not connected",
#   "message": "Please configure GitHub integration in workspace settings first.",
#   "redirectTo": "/dashboard/workspace-id/settings/github"
# }
```

## Database Schema Changes

### No Schema Changes Required! ✅

The existing schema already supports all necessary fields:

**Document:**

- `githubSha`: Already exists, now properly utilized
- `githubPath`: Already exists

**DocSyncInfo:**

- `lastExternalHash`: Already exists, now used for conflict detection
- `syncStatus`: Already exists with CONFLICT enum value
- `lastError`: Already exists for error messages

## Benefits

### 1. **Data Safety** 🛡️

- Prevents accidental overwrites
- Detects concurrent modifications
- Preserves both platform and GitHub changes

### 2. **User Awareness** 👁️

- Clear conflict notifications
- Detailed error messages with SHAs
- Direct links to view conflicts in GitHub

### 3. **Developer Experience** 🧑‍💻

- Structured API responses
- Predictable error handling
- Easy to integrate with UI

### 4. **Scalability** 📈

- Works with workspace-level GitHub integration
- Supports multiple users editing same document
- Handles high-frequency sync operations

## Integration with Frontend

### Example: Handle Sync Response

```typescript
async function syncDocumentToGitHub(documentId: string) {
  const response = await fetch('/api/github/sync-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });

  const data = await response.json();

  if (data.status === 'success') {
    toast.success('Document synced to GitHub successfully!');
    toast.info(`New SHA: ${data.sha}`);
  } else if (data.status === 'conflict') {
    // Show conflict resolution dialog
    showConflictDialog({
      message: data.error,
      expectedSha: data.conflictDetails.expectedSha,
      currentSha: data.conflictDetails.currentSha,
      githubUrl: data.conflictDetails.githubUrl,
      actions: [
        { label: 'View on GitHub', url: data.conflictDetails.githubUrl },
        { label: 'Pull Latest', action: () => pullFromGitHub(documentId) },
        { label: 'Force Push', action: () => forcePushToGitHub(documentId) },
      ],
    });
  } else if (data.status === 'error') {
    if (data.redirectTo) {
      // Redirect to settings
      router.push(data.redirectTo);
    }
    toast.error(data.message || 'Failed to sync document');
  }
}
```

## Future Enhancements

### 1. **Three-Way Merge** 🔀

- Automatically merge non-conflicting changes
- Only show UI for actual content conflicts
- Use diff-match-patch algorithm

### 2. **Conflict Resolution UI** 🎨

- Built-in diff viewer
- Side-by-side comparison
- Interactive merge tool

### 3. **Auto-Sync with Conflict Queue** 📊

- Queue conflicted documents for manual review
- Notification center for pending conflicts
- Batch conflict resolution

### 4. **Webhook Integration** 🪝

- Real-time conflict detection via GitHub webhooks
- Immediate notification when GitHub file changes
- Preemptive conflict warnings

## Conclusion

The safe GitHub sync implementation provides robust conflict detection and prevents data loss from concurrent modifications. With structured API responses, clear error handling, and comprehensive conflict information, users can confidently sync documents between the platform and GitHub.

---

**Implementation Status:** ✅ Complete  
**Date:** February 2026  
**Impact:** High - Critical for data integrity in collaborative environments
