# GitHub Webhook Integration

## Overview

The GitHub webhook integration enables automatic document synchronization when changes are pushed to the GitHub repository. When files are modified, added, or deleted in GitHub, the webhook handler automatically updates the corresponding documents in the platform.

## Features

✅ **Automatic Sync**: Documents update automatically when pushed to GitHub  
✅ **Signature Verification**: HMAC SHA256 signature verification for security  
✅ **Workspace-Level Configuration**: One webhook per workspace  
✅ **File Filtering**: Only syncs markdown files within configured basePath  
✅ **Error Resilience**: Continues processing even if some files fail  
✅ **Deletion Handling**: Marks documents as ERROR when files are deleted  
✅ **Activity Tracking**: Logs all webhook events for audit trail

## Setup Instructions

### 1. Configure Workspace Integration

Before setting up webhooks, ensure your workspace has GitHub integration configured:

1. Navigate to **Workspace Settings → GitHub Integration**
2. Configure:
   - **Repository**: e.g., `owner/repo-name`
   - **Branch**: e.g., `main`
   - **Base Path**: e.g., `docs`
   - **Webhook Secret**: Generate a random string (e.g., using `openssl rand -hex 32`)

3. Copy the **Webhook URL** displayed after saving

### 2. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings → Webhooks → Add webhook**
3. Configure the webhook:
   - **Payload URL**: `https://your-domain.com/api/github/webhook`
   - **Content type**: `application/json`
   - **Secret**: Same value you entered in workspace settings
   - **Events**: Select "Just the push event"
   - **Active**: ✓ Checked

4. Click **Add webhook**

### 3. Test the Webhook

1. Make a change to a markdown file in your repository
2. Push the changes to the configured branch
3. Check the webhook delivery in GitHub (**Settings → Webhooks → Recent Deliveries**)
4. Verify the document was updated in your workspace

## How It Works

### Webhook Flow

```
GitHub Push Event
       ↓
Webhook POST to /api/github/webhook
       ↓
1. Verify signature using workspace webhook secret
2. Parse push event payload
3. Find workspace by repository + branch
4. Get GitHub access token from workspace members
5. Process modified/added/removed files asynchronously
       ↓
For each modified/added file:
   - Check if markdown file in basePath
   - Find document by githubPath
   - Pull latest content from GitHub
   - Update document content + SHA
       ↓
For each removed file:
   - Find document by githubPath
   - Mark syncStatus as ERROR
   - Set lastError to "File deleted in GitHub"
       ↓
Return 200 OK (processing continues in background)
```

### File Processing

**Modified/Added Files**:

- Only processes markdown files (`.md`, `.markdown`)
- Only files within configured `basePath`
- Finds document by `githubPath` field
- Calls `GitHubSyncService.pullFromGitHub()`
- Updates `document.content` and `document.githubSha`
- Converts markdown to HTML for editor

**Removed Files**:

- Finds document by `githubPath`
- Updates `syncInfo.syncStatus` to `ERROR`
- Sets `syncInfo.lastError` to "File deleted in GitHub"
- Does NOT delete the document (preserves data)

## API Endpoint

### POST `/api/github/webhook`

Handles GitHub webhook push events.

**Headers** (sent by GitHub):

```
x-github-event: push
x-hub-signature-256: sha256=<signature>
```

**Request Body** (push event payload):

```json
{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "owner/repo",
    "owner": { "login": "owner" },
    "name": "repo"
  },
  "commits": [
    {
      "id": "abc123...",
      "message": "Update API docs",
      "added": ["docs/api/users.md"],
      "modified": ["docs/api/auth.md"],
      "removed": ["docs/api/legacy.md"]
    }
  ]
}
```

**Response** (200 OK):

```json
{
  "message": "Webhook received and processing",
  "repository": "owner/repo",
  "branch": "main",
  "commits": 1
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid signature
- `200 OK`: Even on errors (to avoid webhook retries)

## Security

### Signature Verification

The webhook handler verifies GitHub's signature using HMAC SHA256:

1. GitHub sends signature in `x-hub-signature-256` header
2. Format: `sha256=<hex_digest>`
3. Computed using webhook secret: `HMAC_SHA256(secret, payload)`
4. Timing-safe comparison prevents timing attacks

**Important**: Always configure a webhook secret! Without it, anyone could send fake webhook requests.

### Access Control

- Workspace integration must exist for repository + branch
- Requires GitHub access token from workspace member
- Only processes files within configured `basePath`
- Signature verification is **required** if secret is configured

## Monitoring

### Logging

The webhook handler logs comprehensive information:

```
[Webhook] Received GitHub webhook
[Webhook] Event type: push
[Webhook] Repository: owner/repo
[Webhook] Branch: main
[Webhook] Found workspace: workspace-123
[Webhook] Verifying signature
[Webhook] ✓ Signature verified
[Webhook] Using access token from user: user@example.com
[Webhook] Processing push event asynchronously
[Webhook] Added: 1, Modified: 2, Removed: 1
[Webhook] Processing file: docs/api/users.md
[Webhook] Pulling latest content for document: User API
[Webhook] ✓ Updated document: User API
[Webhook] Processing deleted file: docs/api/legacy.md
[Webhook] ✓ Marked as missing: Legacy API
[Webhook] Processing complete: 2 updated, 1 deleted, 0 errors
```

### Activity Tracking

Webhook events are logged in the database:

```typescript
{
  type: 'GITHUB_WEBHOOK',
  workspaceId: 'workspace-123',
  entityType: 'Workspace',
  entityId: 'workspace-123',
  metadata: {
    repository: 'owner/repo',
    branch: 'main',
    commits: 1,
    filesUpdated: 2,
    filesDeleted: 1,
    errors: 0
  }
}
```

### GitHub Webhook Deliveries

Check webhook delivery status in GitHub:

1. Go to **Repository Settings → Webhooks**
2. Click on your webhook
3. View **Recent Deliveries** tab
4. Click on a delivery to see:
   - Request headers and payload
   - Response status and body
   - Timestamp and delivery ID

## Troubleshooting

### Webhook Not Triggering

**Symptoms**: Documents not updating after push

**Possible Causes**:

1. Webhook not configured in GitHub
2. Wrong payload URL
3. Wrong branch configured
4. Files outside basePath

**Solution**:

- Check webhook configuration in GitHub
- Verify webhook URL matches your domain
- Check "Recent Deliveries" for errors
- Ensure files are in configured basePath

### Authentication Errors

**Symptoms**: Webhook returns 401 Unauthorized

**Possible Causes**:

1. Invalid webhook secret
2. Signature mismatch
3. No webhook secret configured in workspace

**Solution**:

- Verify webhook secret matches in both places
- Check workspace GitHub integration settings
- Re-save webhook secret in workspace settings

### Documents Not Updating

**Symptoms**: Webhook succeeds but documents unchanged

**Possible Causes**:

1. Document not found (githubPath mismatch)
2. No GitHub access token available
3. File not a markdown file
4. File outside basePath

**Solution**:

- Check document `githubPath` matches file path in repo
- Ensure at least one workspace member has GitHub connected
- Verify file extension is `.md` or `.markdown`
- Confirm file is within configured basePath

### Signature Verification Failures

**Symptoms**: Webhook returns "Invalid signature"

**Possible Causes**:

1. Webhook secret mismatch
2. Payload modified in transit
3. Wrong secret in GitHub

**Solution**:

- Regenerate webhook secret
- Update in both workspace settings and GitHub webhook
- Test with new delivery

## Performance

### Processing Time

- **Small files** (< 100KB): ~1-2 seconds
- **Large files** (> 1MB): ~5-10 seconds
- **Multiple commits**: Sequential processing

### Rate Limiting

GitHub webhook deliveries are rate-limited:

- Maximum 1000 deliveries per hour per webhook
- Failed deliveries trigger retries (exponential backoff)
- Connection timeout: 10 seconds

**Best Practices**:

- Keep webhook handler response time < 10 seconds
- Process files asynchronously
- Return 200 OK immediately

## Best Practices

1. **Always Use Webhook Secret**: Never deploy without signature verification
2. **Monitor Webhook Deliveries**: Check GitHub regularly for failed deliveries
3. **Test Locally First**: Use ngrok or similar for local testing
4. **Handle Errors Gracefully**: Return 200 even on partial failures
5. **Log Everything**: Comprehensive logging helps troubleshooting
6. **Validate File Paths**: Only process files within basePath
7. **Background Processing**: Don't block webhook response

## Limitations

1. **Push Events Only**: Currently only handles push events (not PRs, issues, etc.)
2. **Single Branch**: One branch per workspace integration
3. **Markdown Only**: Only syncs `.md` and `.markdown` files
4. **Sequential Processing**: Files processed one at a time
5. **No Automatic Document Creation**: Documents must exist in platform first

## Future Enhancements

Potential improvements:

- **Create Missing Documents**: Auto-create documents for new files
- **Multi-Branch Support**: Support multiple branches per workspace
- **Pull Request Integration**: Sync on PR merge events
- **Parallel Processing**: Process multiple files concurrently
- **Webhook Status Dashboard**: UI for monitoring webhook deliveries
- **Retry Logic**: Automatic retry for failed file updates
- **Conflict Resolution**: Handle concurrent edits gracefully

## Related Documentation

- [GitHub Integration](./GITHUB_INTEGRATION.md) - Overall integration setup
- [Bulk Sync](./BULK_SYNC.md) - Manual bulk sync feature
- [Image Sync](./GITHUB_IMAGE_SYNC.md) - How images are handled

## Example Workflow

1. **Setup**: Configure workspace with GitHub repo and webhook secret
2. **Configure GitHub**: Add webhook with same secret
3. **Create Document**: Create document in platform with `githubPath` set
4. **Initial Sync**: Manually sync document to GitHub
5. **Edit in GitHub**: Make changes to file in GitHub editor or via PR
6. **Push/Merge**: Push commits or merge PR
7. **Webhook Triggers**: GitHub sends webhook to platform
8. **Auto-Update**: Document automatically updates with latest content
9. **View Changes**: Users see updated content in platform
10. **Activity Log**: Webhook event logged in activity feed

## Summary

The GitHub webhook integration provides seamless automatic synchronization when documents are modified in GitHub. With proper configuration and monitoring, it enables true bidirectional sync between the platform and GitHub repositories.

**Key Takeaways**:

- Automatic sync on push events
- Workspace-level configuration
- Signature verification for security
- Handles file additions, modifications, and deletions
- Comprehensive logging and activity tracking
- Returns 200 OK immediately for fast response
