# Quick Start Guide - GitHub Sync Production Setup

## Step 1: Install Redis

**Option A: Docker (Recommended)**

```powershell
# Install Docker Desktop from: https://www.docker.com/products/docker-desktop/
# After installation, run:
docker-compose up -d redis
redis-cli ping  # Should return: PONG
```

**Option B: Windows PowerShell Script**

```powershell
# Run as Administrator
./install-redis-windows.ps1
```

**Option C: Manual Install (Chocolatey)**

```powershell
# Install Chocolatey first: https://chocolatey.org/install
choco install redis-64 -y
redis-server
```

---

## Step 2: Verify Environment

```powershell
# Check all environment variables
cat .env | Select-String "="

# Verify critical secrets are set (not placeholders):
# - NEXTAUTH_SECRET
# - ENCRYPTION_KEY
# - GITHUB_WEBHOOK_SECRET
# - CRON_SECRET
```

---

## Step 3: Install Dependencies

```powershell
npm install
```

---

## Step 4: Setup Database

```powershell
# Generate Prisma client
npm run db:generate

# Apply schema to database
npm run db:push

# (Optional) Seed with test data
npm run db:seed
```

---

## Step 5: Start Services

**Terminal 1 - Redis:**

```powershell
# If using Docker:
docker-compose up redis

# If using local Redis:
redis-server
```

**Terminal 2 - Worker:**

```powershell
npm run worker:github-sync
# Should see: "GitHub Sync Worker Started"
# Keep this running
```

**Terminal 3 - Dev Server:**

```powershell
npm run dev
# Server starts at: http://localhost:3000
```

---

## Step 6: Verify Everything Works

```powershell
# Run verification script
./verify-production.ps1

# Should show all checks passing:
# ✓ Redis connectivity
# ✓ Queue operational
# ✓ Encryption working
# ✓ Database accessible
# ✓ Worker ready
```

---

## Step 7: Health Check

Open browser and check:

- http://localhost:3000/api/health/redis
- http://localhost:3000/api/health/github-sync

Should return:

```json
{
  "status": "healthy",
  "redisConnected": true,
  "queueStatus": {
    "waiting": 0,
    "active": 0,
    "completed": 0,
    "failed": 0
  }
}
```

---

## Step 8: End-to-End Test

Follow the test plan in: **[End-to-End Test Plan](./END_TO_END_TEST_PLAN.md)**

Quick test:

1. Sign in to workspace
2. Go to Settings → GitHub
3. Connect GitHub account
4. Create a document
5. Click "Sync from GitHub" → "Push All"
6. Check GitHub repository - file should appear
7. Edit file in GitHub
8. Setup webhook in GitHub repository
9. File should auto-update in platform

---

## Monitoring

### Check Queue Status

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis"
```

### Check Worker Logs

Check Terminal 2 where worker is running - should show:

```
[Worker] Processing job: sync-doc-1234567890
[Worker] ✓ Job completed successfully
```

### Check Redis Contents

```powershell
redis-cli
> KEYS github-sync:*
> LRANGE github-sync:waiting 0 -1
```

---

## Production Deployment

### Required Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<secure-secret>
ENCRYPTION_KEY=<64-char-hex>
GITHUB_CLIENT_ID=<oauth-app-id>
GITHUB_CLIENT_SECRET=<oauth-app-secret>
GITHUB_WEBHOOK_SECRET=<webhook-secret>
REDIS_URL=redis://...
CRON_SECRET=<cron-secret>
```

### Deploy Worker as Service

**Option 1: PM2 (Recommended)**

```bash
npm install -g pm2
pm2 start npm --name "github-sync-worker" -- run worker:github-sync
pm2 save
pm2 startup
```

**Option 2: Systemd (Linux)**

```bash
# Create: /etc/systemd/system/github-sync-worker.service
sudo systemctl enable github-sync-worker
sudo systemctl start github-sync-worker
```

**Option 3: Windows Service**

```powershell
# Use NSSM (Non-Sucking Service Manager)
nssm install GitHubSyncWorker "npm" "run worker:github-sync"
nssm start GitHubSyncWorker
```

---

## Troubleshooting

### Redis Connection Failed

```powershell
# Check if Redis is running
redis-cli ping

# If not running:
redis-server
# OR
docker-compose up -d redis
```

### Worker Not Processing Jobs

```powershell
# Restart worker
# Stop: Ctrl+C
# Start: npm run worker:github-sync

# Check queue:
Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis"
```

### Webhook Not Working

1. Verify webhook secret matches between:
   - Workspace GitHub settings
   - GitHub repository webhook settings
2. Check webhook delivery in GitHub:
   - Settings → Webhooks → Recent Deliveries
   - Should show 200 OK

### Encryption Errors

```powershell
# Verify ENCRYPTION_KEY is set
node -e "console.log('Key length:', process.env.ENCRYPTION_KEY?.length)"
# Should output: Key length: 64

# If not 64 characters:
openssl rand -hex 32
# Copy output to .env ENCRYPTION_KEY=
```

---

## Next Steps

✅ Follow [End-to-End Test Plan](./END_TO_END_TEST_PLAN.md)
✅ Setup monitoring alerts for worker health
✅ Configure automatic worker restarts
✅ Setup Redis persistence (if using Docker)
✅ Configure GitHub webhook for production URL
✅ Review [GitHub Integration Summary](./GITHUB_INTEGRATION_SUMMARY.md)

---

## Support

For issues or questions:

1. Check worker logs for errors
2. Check health endpoints: `/api/health/redis` and `/api/health/github-sync`
3. Review troubleshooting section above
4. Check Redis queue contents: `redis-cli KEYS github-sync:*`
