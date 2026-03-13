# End-to-End GitHub Sync Test Plan

# This document provides a complete testing workflow

## Prerequisites

1. **Redis is running**

   ```powershell
   redis-cli ping  # Should return "PONG"
   # OR
   docker-compose up -d redis
   ```

2. **Worker is running**

   ```powershell
   npm run worker:github-sync
   # Keep this terminal open
   ```

3. **Dev server is running**

   ```powershell
   npm run dev
   # Keep this terminal open
   ```

4. **Environment variables are set**
   - Check `.env` file has all required variables
   - Run `node -e "console.log(process.env.ENCRYPTION_KEY)"` to verify

---

## Test 1: Connect Workspace to GitHub

### Steps:

1. Open browser: `http://localhost:3000`
2. Sign in to your workspace
3. Navigate to **Settings → GitHub Integration**
4. Click **"Connect GitHub Account"**
5. Authorize the OAuth app
6. Configure repository:
   - Repository: `owner/repo`
   - Branch: `main`
   - Base Path: `docs`
7. Click **"Save Integration"**

### Expected Result:

- ✅ GitHub token is encrypted and stored
- ✅ Workspace shows "Connected" status
- ✅ Repository details are displayed

### Verify:

```powershell
# Check database
npx prisma studio
# Navigate to WorkspaceGitHubIntegration table
# Verify record exists for your workspace
```

---

## Test 2: Create Document and Push to GitHub

### Steps:

1. Go to workspace dashboard
2. Click **"New Document"**
3. Title: `Test Document`
4. Path: `test-doc`
5. Add some content with formatting
6. Click **Save**
7. Click **"Sync from GitHub"** button (top toolbar)
8. Click **"Push All to GitHub"**

### Expected Result:

- ✅ Job added to BullMQ queue
- ✅ Worker processes the job
- ✅ Document appears in GitHub repository at `docs/test-doc.md`
- ✅ Document shows lastCommitSha and lastCommitUrl
- ✅ Document shows "SYNCED" badge (green)

### Verify:

```powershell
# Check queue status
Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis"

# Check GitHub
# Open: https://github.com/owner/repo/blob/main/docs/test-doc.md
```

### Worker Logs Should Show:

```
[Worker] Processing job: sync-doc-1234567890
[Worker] Operation: sync for document: test-doc
[Worker] Pushing to GitHub: docs/test-doc.md
[Worker] ✓ Committed to GitHub: <commit-sha>
[Worker] ✓ Job completed successfully
```

---

## Test 3: Enable AutoSync

### Steps:

1. Open the document
2. Click document settings (gear icon)
3. Toggle **"Auto-sync to GitHub"** ON
4. Edit the document content
5. Click **Save** (or wait for auto-save)
6. Wait 5 seconds

### Expected Result:

- ✅ Job automatically added to queue after 5-second delay
- ✅ Worker processes the job
- ✅ GitHub shows updated content
- ✅ Document shows updated lastCommitSha

### Verify:

```powershell
# Check queue immediately after save
Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis"
# Should show "waiting: 1" or "active: 1"

# Wait 10 seconds and check again
Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis"
# Should show "completed: N" (where N increased)
```

---

## Test 4: Webhook Sync (GitHub → Platform)

### Steps:

1. Configure webhook in GitHub:
   - Go to: `https://github.com/owner/repo/settings/hooks`
   - Click **"Add webhook"**
   - Payload URL: `https://yourdomain.com/api/github/webhook`
   - Content type: `application/json`
   - Secret: (copy from workspace settings → GitHub → Webhook Secret)
   - Events: **Push events**
   - Click **"Add webhook"**

2. Edit file directly in GitHub:
   - Navigate to `docs/test-doc.md` in GitHub
   - Click **Edit** (pencil icon)
   - Add new line: `"Edited directly in GitHub"`
   - Commit changes

3. Check platform immediately after commit

### Expected Result:

- ✅ Webhook received (check webhook delivery in GitHub)
- ✅ Signature verified
- ✅ Document content updated on platform
- ✅ Document shows new lastCommitSha
- ✅ No conflict created (since platform content hasn't changed)

### Verify:

```powershell
# Check webhook delivery in GitHub
# Go to: https://github.com/owner/repo/settings/hooks
# Click on webhook → Recent Deliveries
# Should show 200 OK response

# Check document in platform
# Content should match GitHub version
```

---

## Test 5: Conflict Resolution

### Steps:

1. Edit document in platform:
   - Open `Test Document`
   - Add line: `"Edited on platform"`
   - Click **Save**
   - **DO NOT sync to GitHub yet**

2. Edit same document in GitHub:
   - Open `docs/test-doc.md` in GitHub
   - Add line at same location: `"Edited in GitHub"`
   - Commit changes

3. Trigger webhook (automatic from step 2)

4. Check document on platform:
   - Document should show **"CONFLICT"** badge (red)
   - **"Resolve Conflict"** button appears

5. Click **"Resolve Conflict"** button

6. Choose resolution strategy:
   - **Platform (Keep Local)**: Keep platform version
   - **GitHub (Use Remote)**: Use GitHub version
   - **Manual Merge**: Merge both versions

7. Click **"Resolve"**

### Expected Result:

- ✅ Conflict detected (SHA mismatch)
- ✅ ConflictResolution record created
- ✅ Conflict resolution UI accessible
- ✅ Both versions displayed side-by-side
- ✅ After resolution, conflict resolved
- ✅ Document synced to GitHub with merged content
- ✅ Document shows "SYNCED" badge again

### Verify:

```powershell
# Check conflicts API
Invoke-RestMethod -Uri "http://localhost:3000/api/github/conflicts?workspaceId=<workspace-id>"
# Should show conflict before resolution
# Should be empty after resolution
```

---

## Test 6: Queue Monitoring

### Steps:

1. Create 10 documents rapidly
2. Enable autoSync on all of them
3. Edit all 10 documents
4. Save all within 1 minute

### Expected Result:

- ✅ 10 jobs added to queue
- ✅ Worker processes them with concurrency (5 concurrent max)
- ✅ All jobs complete without errors
- ✅ Rate limiting respected (10 jobs/second max)
- ✅ GitHub shows all 10 files updated

### Verify:

```powershell
# Monitor queue in real-time
while ($true) {
    cls
    $status = Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis"
    Write-Host "Waiting: $($status.queueStatus.waiting)"
    Write-Host "Active: $($status.queueStatus.active)"
    Write-Host "Completed: $($status.queueStatus.completed)"
    Write-Host "Failed: $($status.queueStatus.failed)"
    Start-Sleep -Seconds 1
}
```

---

## Test 7: Worker Recovery

### Steps:

1. Add a job to queue:
   - Edit and save a document with autoSync enabled

2. Kill the worker process:
   - Press `Ctrl+C` in worker terminal

3. Wait 10 seconds

4. Restart worker:

   ```powershell
   npm run worker:github-sync
   ```

5. Worker should pick up pending jobs

### Expected Result:

- ✅ Job waits in queue while worker is down
- ✅ Worker gracefully shuts down (handles SIGINT)
- ✅ Worker resumes processing on restart
- ✅ No jobs lost
- ✅ Job completes successfully after restart

---

## Test 8: Import from GitHub

### Steps:

1. Add several markdown files to GitHub repository in `docs/` folder
2. Click **"Sync from GitHub"** button
3. Click **"Import from GitHub"**
4. Wait for import to complete

### Expected Result:

- ✅ All markdown files imported as documents
- ✅ Documents show correct githubPath
- ✅ Documents show githubAutoGenerated = true
- ✅ Documents show lastCommitSha
- ✅ All documents show "SYNCED" status

---

## Test 9: Health Check Endpoints

### Steps:

```powershell
# Redis health
Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis" | ConvertTo-Json -Depth 5

# GitHub Sync health
Invoke-RestMethod -Uri "http://localhost:3000/api/health/github-sync" | ConvertTo-Json -Depth 5

# General health
Invoke-RestMethod -Uri "http://localhost:3000/api/health" | ConvertTo-Json -Depth 5
```

### Expected Result:

- ✅ All endpoints return 200 OK
- ✅ redis: `redisConnected: true`
- ✅ github-sync: `status: "healthy"` or `"degraded"`
- ✅ All checks pass or show warnings only

---

## Troubleshooting

### Redis Not Running

```powershell
# Option 1: Docker
docker-compose up -d redis
redis-cli ping

# Option 2: Direct Redis (Windows)
redis-server
# In another terminal:
redis-cli ping
```

### Worker Not Processing Jobs

```powershell
# Check worker logs
npm run worker:github-sync
# Should show:
# "GitHub Sync Worker Started"
# "Worker is ready and waiting for jobs..."

# If stuck, check Redis connection:
redis-cli
> KEYS github-sync:*
> GET github-sync:id
```

### Webhook Not Triggering

1. Check webhook secret matches in:
   - `.env` → `GITHUB_WEBHOOK_SECRET`
   - Workspace settings → GitHub → Webhook Secret
   - GitHub repository webhook settings → Secret

2. Check webhook delivery:
   - Go to GitHub webhook settings
   - Click "Recent Deliveries"
   - Check response code (should be 200)
   - Check response body

3. Check signature verification:
   - Webhook route logs: `[Webhook] ✓ Signature verified`
   - If fails: `[Webhook] Invalid signature`

### Conflicts Not Detected

```powershell
# Verify DocSyncInfo has correct SHA
npx prisma studio
# Check DocSyncInfo table
# lastCommitSha should match GitHub commit

# Verify webhook is updating SHA
# Check SyncEvent table for recent events
```

---

## Success Criteria

✅ All tests pass
✅ No errors in worker logs
✅ No failed jobs in queue
✅ GitHub repository matches platform documents
✅ Conflicts are detected and resolved correctly
✅ Health checks return "healthy" status
✅ Webhook deliveries show 200 OK

---

## Production Deployment Checklist

Before deploying to production:

1. ☐ Redis is running (persistent storage configured)
2. ☐ Worker is running as a service/daemon
3. ☐ All environment variables set in production
4. ☐ ENCRYPTION_KEY is unique and secure (NOT from .env.example)
5. ☐ GITHUB_WEBHOOK_SECRET is unique and matches GitHub webhook
6. ☐ GitHub OAuth app has correct callback URL
7. ☐ Database migrations applied
8. ☐ Health check endpoints accessible
9. ☐ Monitoring/alerting configured for worker
10. ☐ Backup strategy for Redis queue data
