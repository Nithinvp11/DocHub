# Bulk Workspace Sync to GitHub

## Overview

The Bulk Sync feature allows users to sync all documents in a workspace to GitHub with a single click. This feature is essential for workspaces with many documents, eliminating the need to sync each document individually.

## Features

✅ **One-Click Sync**: Sync all workspace documents at once  
✅ **Error Resilience**: Continues syncing even if some documents fail  
✅ **Conflict Detection**: Identifies documents modified in GitHub  
✅ **Comprehensive Summary**: Shows which documents synced, conflicted, or failed  
✅ **Image Processing**: Automatically extracts and uploads base64 images  
✅ **Activity Tracking**: Logs bulk sync operations for audit trail

## How to Use

### 1. Configure GitHub Integration

Before using bulk sync, ensure your workspace has GitHub integration configured:

1. Navigate to **Workspace Settings → GitHub Integration**
2. Connect your GitHub account
3. Configure:
   - **Repository**: e.g., `owner/repo-name`
   - **Branch**: e.g., `main`
   - **Base Path**: e.g., `docs`

### 2. Trigger Bulk Sync

1. Go to **Workspace Settings → GitHub Integration**
2. Scroll to **"Sync All to GitHub"** section
3. Click **"Sync All to GitHub"** button
4. Confirm the sync operation

### 3. View Sync Results

After the sync completes, you'll see a summary showing:

- **Synced**: Documents successfully pushed to GitHub
- **Conflicts**: Documents with GitHub modifications (not overwritten)
- **Failed**: Documents that encountered errors
- **Total**: Total documents processed
- **Duration**: Time taken to complete

## API Endpoint

### POST `/api/github/sync-workspace`

Syncs all documents in a workspace to GitHub.

**Request Body**:

```json
{
  "workspaceId": "workspace-123"
}
```

**Response** (Success):

```json
{
  "status": "success",
  "message": "Synced 95 of 100 documents",
  "summary": {
    "total": 100,
    "synced": 95,
    "conflicts": 3,
    "failed": 2,
    "syncedDocs": [{ "id": "doc1", "title": "API Guide", "sha": "abc123" }],
    "conflictDocs": [
      {
        "id": "doc2",
        "title": "Architecture",
        "details": {
          "expectedSha": "old123",
          "currentSha": "new456",
          "githubUrl": "https://github.com/..."
        }
      }
    ],
    "failedDocs": [{ "id": "doc99", "title": "Roadmap", "error": "Network timeout" }],
    "duration": 45000
  }
}
```

**Response Statuses**:

- `"success"`: All documents synced successfully
- `"partial"`: Some documents synced, others had conflicts/failures
- `"error"`: All documents failed to sync (returns 500 status code)

## Sync Process

The bulk sync operation follows this process:

1. **Validate**: Check authentication and workspace access
2. **Verify**: Ensure GitHub integration is configured
3. **Fetch**: Load all documents in the workspace
4. **Initialize**: Set up GitHub sync service with access token
5. **Process Each Document**:
   - Extract and upload images to GitHub assets directory
   - Convert HTML to markdown with relative image paths
   - Check for conflicts using SHA comparison
   - Upload markdown file to GitHub
   - Update document with new SHA
   - Log result (synced/conflict/error)
6. **Summarize**: Collect results and calculate duration
7. **Track**: Record activity in database
8. **Respond**: Return comprehensive summary to client

## Conflict Handling

Documents with conflicts are **not overwritten** automatically. When a conflict is detected:

- The document is added to `conflictDocs` array
- Conflict details include:
  - Expected SHA (last known state)
  - Current SHA (GitHub's state)
  - GitHub URL for manual review
- User must resolve conflicts manually by:
  1. Pulling the latest version from GitHub
  2. Reviewing changes
  3. Syncing again after resolution

## Error Handling

The bulk sync is designed to be resilient:

- **Continue on Error**: If one document fails, others continue syncing
- **Error Collection**: All errors are collected and reported
- **Categorized Results**: Clear separation of synced/conflicts/failed
- **Detailed Errors**: Each failed document includes error message

Common errors:

- Network timeout
- GitHub API rate limit exceeded
- File too large
- Invalid markdown conversion
- Permission denied

## Performance

### Sync Speed

- **Sequential Processing**: Documents synced one at a time
- **Typical Speed**: 1-2 seconds per document
- **Estimated Times**:
  - 10 documents: ~15-20 seconds
  - 50 documents: ~60-90 seconds
  - 100 documents: ~2-3 minutes

### Optimization Tips

To improve sync performance:

1. **Optimize Images**: Compress images before syncing
2. **Reduce File Size**: Split large documents into smaller ones
3. **Sync Strategically**: Sync only when changes are significant
4. **Monitor Network**: Ensure stable connection for large batches

## Logging

The bulk sync operation logs comprehensive information:

```
[Workspace Sync] Starting bulk sync for workspace: workspace-123
[Workspace Sync] Found 50 documents to sync
[Workspace Sync] Syncing document 1/50: API Guide
[Workspace Sync] ✓ Successfully synced: API Guide
[Workspace Sync] Syncing document 2/50: Architecture
[Workspace Sync] Conflict detected for document: Architecture
[Workspace Sync] Syncing document 3/50: Setup
[Workspace Sync] ✓ Successfully synced: Setup
...
[Workspace Sync] Completed in 45000ms
[Workspace Sync] Results: 47 synced, 1 conflicts, 2 failed
```

Check server logs to troubleshoot issues or monitor progress.

## Activity Tracking

Bulk sync operations are tracked in the database:

```typescript
{
  type: 'GITHUB_REPO_SYNCED',
  actorId: 'user-123',
  workspaceId: 'workspace-123',
  entityType: 'Workspace',
  entityId: 'workspace-123',
  metadata: {
    action: 'bulk_sync',
    repository: 'owner/repo',
    branch: 'main',
    total: 100,
    synced: 95,
    conflicts: 3,
    failed: 2,
    duration: 45000
  }
}
```

This provides an audit trail of all bulk sync operations.

## Best Practices

1. **Test First**: Try syncing a single document before bulk syncing
2. **Review Config**: Verify repository, branch, and base path are correct
3. **Check Conflicts**: Always review conflict documents before re-syncing
4. **Monitor Progress**: Watch the sync summary for any issues
5. **Backup Data**: Ensure you have backups before large sync operations
6. **Limit Size**: Consider syncing in batches for extremely large workspaces (200+ docs)

## Troubleshooting

### All Documents Failed

**Possible Causes**:

- GitHub integration not configured
- Invalid access token (expired or revoked)
- Repository doesn't exist
- No write permissions to repository

**Solution**: Re-configure GitHub integration and verify permissions

### High Conflict Rate

**Possible Causes**:

- Multiple users editing in GitHub
- Branch mismatch
- Recent GitHub repository changes

**Solution**: Pull latest changes before syncing, coordinate with team

### Slow Sync Speed

**Possible Causes**:

- Large documents with many images
- Slow network connection
- GitHub API rate limiting

**Solution**: Optimize images, check network, wait if rate limited

### Partial Success

This is **normal** behavior. The bulk sync is designed to continue even when some documents fail. Review the failed and conflict documents, resolve issues, and sync again.

## Integration with Other Features

The bulk sync leverages all existing GitHub features:

- **Auto Path Generation**: Documents use auto-generated GitHub paths
- **Image Sync**: Images extracted and uploaded to assets directory
- **Conflict Detection**: SHA-based checking for each document
- **Pull Feature**: Can be used to resolve conflicts before re-syncing

## Future Enhancements

Potential improvements for bulk sync:

- **Bulk Pull**: Import all documents from GitHub at once
- **Selective Sync**: Choose specific documents to sync
- **Progress Bar**: Real-time progress indicator during sync
- **Cancel Operation**: Ability to stop sync mid-process
- **Scheduling**: Automatic periodic syncs
- **Webhooks**: Trigger sync on GitHub events

## Related Documentation

- [GitHub Image Sync](./GITHUB_IMAGE_SYNC.md) - How images are processed
- [GitHub Integration](./GITHUB_INTEGRATION.md) - Setting up GitHub
- [Conflict Resolution](./CONFLICT_RESOLUTION.md) - Handling conflicts

## Summary

The bulk sync feature makes it easy to keep entire workspaces synchronized with GitHub. With comprehensive error handling, conflict detection, and detailed reporting, it's a robust solution for managing large document collections.

**Key Takeaways**:

- One-click sync for entire workspace
- Continues on errors, reports all results
- Integrates with image processing
- Provides detailed summary of operations
- Tracks activity for audit purposes
