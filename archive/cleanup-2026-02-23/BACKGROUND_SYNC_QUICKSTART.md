# Background GitHub Auto-Sync - Quick Start

## Setup (5 minutes)

### 1. Install & Start Redis

**Windows**:

```powershell
choco install redis-64
redis-server
```

**macOS**:

```bash
brew install redis
brew services start redis
```

### 2. Configure Environment

Add to `.env`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start the Worker

**Terminal 1** (App):

```powershell
npm run dev
```

**Terminal 2** (Worker):

```powershell
npm run worker:sync
```

## Usage

### Enable Auto-Sync for a Document

1. Create or open a document
2. Ensure workspace has GitHub integration configured
3. Enable autoSync in DocSyncInfo (via settings or API)
4. Edit the document
5. Save → Job automatically queued!

### Monitor Queue

```bash
# Check queue status
curl http://localhost:3000/api/github/queue-status
```

## Verification

### Check Worker Logs

Look for:

```
[Worker] GitHub sync worker is ready
[Worker] Processing job sync-doc-123: sync document doc-123
[Worker] Job sync-doc-123 completed successfully: success
```

### Check Document Status

```sql
SELECT
  d.title,
  s.syncStatus,
  s.lastSyncedAt,
  s.lastError
FROM "Document" d
JOIN "DocSyncInfo" s ON d.id = s.documentId
WHERE d.id = 'your-doc-id';
```

## Testing

### 1. Manual Job Creation

```typescript
import { addGitHubSyncJob } from '@/lib/github-sync-queue';

await addGitHubSyncJob({
  documentId: 'doc-123',
  workspaceId: 'workspace-456',
  userId: 'user-789',
  operation: 'sync',
  priority: 10,
});
```

### 2. Check Job Status

```typescript
import { getJobStatus } from '@/lib/github-sync-queue';

const status = await getJobStatus('sync-doc-123-1707849600000');
console.log(status);
```

### 3. Monitor via API

```bash
# Get queue status
curl http://localhost:3000/api/github/queue-status

# Pause queue
curl -X POST http://localhost:3000/api/github/queue-status \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'

# Resume queue
curl -X POST http://localhost:3000/api/github/queue-status \
  -H "Content-Type: application/json" \
  -d '{"action": "resume"}'

# Retry failed job
curl -X POST http://localhost:3000/api/github/queue-status \
  -H "Content-Type: application/json" \
  -d '{"action": "retry", "jobId": "job-id-here"}'
```

## Troubleshooting

### Worker not processing jobs?

```powershell
# Check Redis
redis-cli ping
# Should return: PONG

# Check worker logs
# Should show: [Worker] GitHub sync worker is ready

# Restart worker
# Ctrl+C, then npm run worker:sync
```

### Jobs failing?

1. Check worker logs for error message
2. Verify GitHub integration settings
3. Check GitHub access token is valid
4. View failed jobs via API: GET /api/github/queue-status

### Rate limited?

Wait 1 hour or reduce sync frequency. Rate limits tracked per repository.

## Production Deployment

### Using PM2

```bash
pm2 start npm --name "github-sync-worker" -- run worker:sync
pm2 save
pm2 startup
```

### Environment Variables

```bash
# Production .env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
DATABASE_URL=postgresql://...
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
```

## Common Scenarios

### Auto-save batching

Auto-saves are delayed by 5 seconds to batch multiple rapid edits into a single sync job.

### Manual save priority

Manual saves have priority 10, auto-saves have priority 0. Manual saves process first.

### Duplicate prevention

Only one job per document can be active at a time. New jobs are queued only if no active job exists.

### Retry behavior

Failed jobs retry with exponential backoff:

- 2s → 4s → 8s → 16s → 32s (max 5 attempts)

## Architecture

```
User edits document
       ↓
Document API saves to database
       ↓
Check if autoSync enabled
       ↓
Add job to Redis queue (BullMQ)
       ↓
Return 200 OK to user (fast!)
       ↓
Background worker picks up job
       ↓
Worker syncs to GitHub
       ↓
Worker updates sync status
       ↓
User sees synced status in UI
```

## Key Benefits

✅ **Fast Response**: Document saves return immediately  
✅ **Reliable**: Automatic retries on failure  
✅ **Scalable**: Add more workers as needed  
✅ **Monitored**: Real-time queue status  
✅ **Smart**: Rate limit aware, batches auto-saves

## Files Created

- `src/lib/github-sync-queue.ts` - Queue configuration
- `src/lib/github-sync-worker.ts` - Worker implementation
- `src/app/api/github/queue-status/route.ts` - Monitoring API
- `scripts/github-sync-worker.ts` - Standalone worker script
- `docs/BACKGROUND_SYNC.md` - Full documentation

## Next Steps

1. ✅ Install Redis and start it
2. ✅ Start the worker
3. ✅ Enable autoSync for a document
4. ✅ Edit and save the document
5. ✅ Watch worker logs
6. ✅ Check queue status API
7. ✅ Deploy to production with PM2

Done! Your background GitHub auto-sync system is ready. 🚀
