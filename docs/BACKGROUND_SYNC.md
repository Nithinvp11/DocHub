# Background GitHub Auto-Sync System

## Overview

The background GitHub auto-sync system uses **BullMQ + Redis** to process document synchronization jobs asynchronously. When documents are updated with `autoSync` enabled, they are automatically queued for synchronization to GitHub without blocking the main application.

## Architecture

```
Document Update
       ↓
Check if autoSync enabled
       ↓
Add job to Redis queue (BullMQ)
       ↓
Return immediately to user
       ↓
Background Worker processes job
       ↓
Sync to GitHub
       ↓
Update sync status
```

## Features

✅ **Asynchronous Processing**: Non-blocking background jobs  
✅ **Automatic Retries**: Exponential backoff on failures  
✅ **Rate Limit Handling**: Respects GitHub API rate limits  
✅ **Concurrency Control**: Process multiple jobs in parallel  
✅ **Priority Queuing**: Manual saves prioritized over auto-saves  
✅ **Job Deduplication**: Prevents duplicate jobs for same document  
✅ **Graceful Shutdown**: Completes active jobs before stopping  
✅ **Monitoring**: Real-time queue status API

## Prerequisites

### 1. Install Redis

**Windows** (using Chocolatey):

```powershell
choco install redis-64
redis-server
```

**macOS** (using Homebrew):

```bash
brew install redis
brew services start redis
```

**Linux** (Ubuntu/Debian):

```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Configure Environment

Add to `.env`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Installation

Dependencies are already installed:

```bash
npm install bullmq ioredis
```

## Usage

### 1. Start the Worker

**Development** (with auto-reload):

```powershell
npm run worker:sync:dev
```

**Production**:

```powershell
npm run worker:sync
```

You should see:

```
============================================================
GitHub Sync Worker
============================================================

Starting background worker for GitHub synchronization...

Environment:
  - Redis Host: localhost
  - Redis Port: 6379
  - Concurrency: 5 jobs
  - Rate Limit: 10 jobs/second

Worker is ready and waiting for jobs...
Press Ctrl+C to gracefully shutdown
============================================================

[Worker] GitHub sync worker is ready
```

### 2. Enable Auto-Sync for Documents

Documents will be automatically queued when:

- Document content is updated
- `autoSync` is enabled in `DocSyncInfo`
- Workspace has GitHub integration configured

### 3. Monitor Queue Status

**API Endpoint**: `GET /api/github/queue-status`

```typescript
const response = await fetch('/api/github/queue-status');
const status = await response.json();

console.log(status);
// {
//   status: 'ok',
//   paused: false,
//   counts: {
//     waiting: 5,
//     active: 2,
//     completed: 150,
//     failed: 3,
//     delayed: 0,
//     paused: 0
//   },
//   jobs: {
//     active: [...],
//     waiting: [...],
//     delayed: [...],
//     failed: [...]
//   }
// }
```

## Job Types

### Sync Job (Push to GitHub)

Triggered automatically when document is updated:

```typescript
{
  documentId: 'doc-123',
  workspaceId: 'workspace-456',
  userId: 'user-789',
  operation: 'sync',
  priority: 10 // Higher for manual saves, 0 for auto-saves
}
```

### Pull Job (Pull from GitHub)

Can be triggered manually or by webhooks:

```typescript
{
  documentId: 'doc-123',
  workspaceId: 'workspace-456',
  userId: 'user-789',
  operation: 'pull',
  priority: 5
}
```

## Configuration

### Queue Options

**File**: `src/lib/github-sync-queue.ts`

```typescript
export const defaultJobOptions = {
  attempts: 5, // Retry up to 5 times
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 seconds, doubles each retry
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    count: 5000,
  },
};
```

### Worker Options

**File**: `src/lib/github-sync-worker.ts`

```typescript
export const githubSyncWorker = new Worker(GITHUB_SYNC_QUEUE_NAME, processSyncJob, {
  connection: redisConnection.duplicate(),
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Maximum 10 jobs
    duration: 1000, // Per second
  },
});
```

## How It Works

### 1. Job Creation

When a document is updated:

```typescript
// src/app/api/documents/[id]/route.ts
if (content && content !== document.content) {
  const syncInfo = await prisma.docSyncInfo.findUnique({
    where: { documentId: id },
    include: {
      workspace: {
        include: {
          githubIntegration: true,
        },
      },
    },
  });

  if (syncInfo && syncInfo.autoSync && syncInfo.workspace.githubIntegration) {
    const hasActiveJob = await hasActiveSyncJob(id);

    if (!hasActiveJob) {
      await addGitHubSyncJob(
        {
          documentId: id,
          workspaceId: document.workspaceId,
          userId: user.id,
          operation: 'sync',
          priority: isAutoSave ? 0 : 10,
        },
        {
          delay: isAutoSave ? 5000 : 0, // Delay auto-saves by 5 seconds
        }
      );
    }
  }
}
```

### 2. Job Processing

Worker processes jobs:

```typescript
async function processSyncJob(job: Job<GitHubSyncJobData>) {
  // 1. Fetch document and workspace integration
  // 2. Check rate limit
  // 3. Get GitHub access token
  // 4. Initialize sync service
  // 5. Perform sync operation
  // 6. Update sync status
  // 7. Return result
}
```

### 3. Retry Logic

Failed jobs are automatically retried with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 4 seconds
- Attempt 4: After 8 seconds
- Attempt 5: After 16 seconds

### 4. Rate Limit Handling

Worker tracks rate limits per repository:

```typescript
function isRateLimited(repository: string): boolean {
  const limit = rateLimitTracker.get(repository);
  if (!limit) return false;

  const now = Date.now();
  if (now > limit.resetAt) {
    rateLimitTracker.delete(repository);
    return false;
  }

  return limit.count >= 60; // Conservative limit
}
```

If rate limited, the job throws `RATE_LIMITED` error, triggering retry after backoff.

## Monitoring

### Worker Logs

The worker logs comprehensive information:

```
[Worker] Processing job sync-doc-123-1707849600000: sync document doc-123
[Worker] Job sync-doc-123-1707849600000 progress: 10%
[Worker] Job sync-doc-123-1707849600000 progress: 30%
[Worker] Syncing document doc-123 to GitHub
[Worker] Job sync-doc-123-1707849600000 progress: 60%
[Worker] Job sync-doc-123-1707849600000 progress: 90%
[Worker] Job sync-doc-123-1707849600000 progress: 100%
[Worker] Job sync-doc-123-1707849600000 completed successfully: success
```

### Queue Status API

**GET /api/github/queue-status**

Returns:

```json
{
  "status": "ok",
  "paused": false,
  "counts": {
    "waiting": 3,
    "active": 2,
    "completed": 45,
    "failed": 1,
    "delayed": 0,
    "paused": 0
  },
  "jobs": {
    "active": [
      {
        "id": "sync-doc-123",
        "name": "github-sync-sync",
        "data": {
          "documentId": "doc-123",
          "operation": "sync"
        },
        "progress": 60,
        "attemptsMade": 0
      }
    ],
    "waiting": [...],
    "delayed": [...],
    "failed": [...]
  }
}
```

### Queue Management API

**POST /api/github/queue-status**

Actions:

- `pause`: Pause the queue
- `resume`: Resume the queue
- `clean`: Clean up old jobs
- `retry`: Retry a specific job
- `remove`: Remove a specific job

```typescript
// Pause queue
await fetch('/api/github/queue-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'pause' }),
});

// Retry failed job
await fetch('/api/github/queue-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'retry',
    jobId: 'sync-doc-123-1707849600000',
  }),
});
```

## Error Handling

### Automatic Retries

Jobs are automatically retried on failure:

```typescript
{
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s, 16s, 32s
  },
}
```

### Error Types

1. **Document Not Found**: No retry, job fails immediately
2. **No GitHub Integration**: No retry, job fails
3. **Rate Limited**: Retry with backoff
4. **Network Error**: Retry with backoff
5. **Invalid Token**: Retry (token might refresh)

### Sync Status Updates

Failed jobs update document sync status:

```typescript
await prisma.docSyncInfo.update({
  where: { id: syncInfo.id },
  data: {
    syncStatus: 'ERROR',
    lastError: error.message,
    errorCount: syncInfo.errorCount + 1,
  },
});
```

## Performance

### Throughput

- **Concurrency**: 5 jobs in parallel
- **Rate Limit**: 10 jobs/second
- **Maximum**: 300 jobs/minute (with rate limiting)

### Resource Usage

- **CPU**: Low (mostly I/O bound)
- **Memory**: ~50-100MB per worker
- **Redis**: ~10MB for 1000 active jobs

### Scaling

To scale horizontally, run multiple worker instances:

```powershell
# Terminal 1
npm run worker:sync

# Terminal 2
npm run worker:sync

# Terminal 3
npm run worker:sync
```

All workers share the same Redis queue and automatically distribute work.

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms**: Jobs stuck in "waiting" state

**Possible Causes**:

1. Worker not running
2. Redis connection issues
3. Worker crashed

**Solution**:

```powershell
# Check if worker is running
# Check Redis connection
redis-cli ping
# PONG

# Restart worker
npm run worker:sync
```

### Jobs Failing Repeatedly

**Symptoms**: Jobs in "failed" state after 5 attempts

**Possible Causes**:

1. Invalid GitHub token
2. Repository not accessible
3. Network issues

**Solution**:

1. Check worker logs for error messages
2. Verify GitHub integration settings
3. Check document sync status
4. Manually retry job via API

### Rate Limiting

**Symptoms**: Jobs failing with "RATE_LIMITED" error

**Possible Causes**:

1. Too many sync operations
2. Multiple workers syncing to same repo

**Solution**:

- Wait for rate limit to reset (tracked per hour)
- Reduce sync frequency
- Use manual sync instead of auto-sync

### Redis Connection Lost

**Symptoms**: Worker logs show Redis errors

**Solution**:

```powershell
# Check Redis status
redis-cli ping

# Restart Redis
redis-server

# Restart worker
npm run worker:sync
```

## Production Deployment

### Process Manager

Use PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start npm --name "github-sync-worker" -- run worker:sync

# Monitor
pm2 monit

# View logs
pm2 logs github-sync-worker

# Restart
pm2 restart github-sync-worker
```

### Docker

Example `docker-compose.yml`:

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

  github-sync-worker:
    build: .
    command: npm run worker:sync
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - DATABASE_URL=postgresql://...
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
```

### Health Checks

Monitor worker health:

```typescript
// GET /api/health/worker
import { githubSyncQueue } from '@/lib/github-sync-queue';

const counts = await githubSyncQueue.getJobCounts();
const isHealthy = counts.active > 0 || counts.waiting === 0;

if (!isHealthy && counts.waiting > 100) {
  // Alert: Worker might be down or overloaded
}
```

## Best Practices

1. **Run One Worker Per Server**: Avoid resource contention
2. **Monitor Queue Depth**: Alert if waiting jobs > 100
3. **Set Up Alerts**: Monitor failed job count
4. **Regular Cleanup**: Run cleanup job daily
5. **Log Rotation**: Configure PM2 log rotation
6. **Backup Redis**: Schedule Redis backups
7. **Test Failover**: Ensure worker restarts automatically
8. **Monitor Memory**: Watch for memory leaks

## Limitations

1. **Single Redis Instance**: No Redis cluster support yet
2. **Sequential Retry**: Jobs retry one at a time
3. **No Priority Inversion**: Can't bump job priority after creation
4. **Fixed Concurrency**: Requires restart to change

## Future Enhancements

- [ ] Redis Cluster support
- [ ] Dynamic concurrency adjustment
- [ ] Web UI for queue monitoring
- [ ] Job priority adjustment API
- [ ] Metrics export (Prometheus)
- [ ] Dead letter queue
- [ ] Job chaining (sync → validate → notify)
- [ ] Scheduled sync jobs (cron-like)

## Summary

The background GitHub auto-sync system provides robust, scalable, and fault-tolerant document synchronization. With automatic retries, rate limit handling, and comprehensive monitoring, it ensures documents are reliably synced to GitHub without impacting application performance.

**Key Benefits**:

- Non-blocking async processing
- Automatic retry with exponential backoff
- Rate limit aware
- Easy to monitor and debug
- Horizontally scalable
- Production-ready with PM2/Docker

Ready for production use! 🚀
