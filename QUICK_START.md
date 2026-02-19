# 🚀 Quick Start Guide - GitHub Integration

Get the GitHub integration up and running in 5 minutes!

## Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] PostgreSQL database running
- [x] Git installed
- [x] GitHub account

---

## Step 1: Environment Setup (2 minutes)

### 1.1 Copy Environment Template

```bash
cp .env.example .env.local
```

### 1.2 Generate Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate webhook secret
openssl rand -hex 20

# Generate cron secret
openssl rand -hex 20
```

### 1.3 Update .env.local

```env
DATABASE_URL="postgresql://user:password@localhost:5432/repo_aware_knowledge_hub"
NEXTAUTH_SECRET="<output from first command>"
NEXTAUTH_URL="http://localhost:3000"

# Get these from Step 2
GITHUB_ID="your-client-id-here"
GITHUB_SECRET="your-client-secret-here"

GITHUB_WEBHOOK_SECRET="<output from second command>"
CRON_SECRET="<output from third command>"
```

---

## Step 2: GitHub OAuth App (1 minute)

### 2.1 Create OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `Your App Name`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"

### 2.2 Get Credentials

1. Copy **Client ID** → Paste into `.env.local` as `GITHUB_ID`
2. Click "Generate a new client secret"
3. Copy **Client Secret** → Paste into `.env.local` as `GITHUB_SECRET`

---

## Step 3: Database Setup (1 minute)

```bash
# Install dependencies (if not done)
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed with sample data
npm run db:seed
```

---

## Step 4: Start Development Server (30 seconds)

```bash
npm run dev
```

You should see:

```
> Ready on http://localhost:3000
> WebSocket server ready on ws://localhost:3000/api/socket
```

---

## Step 5: Verify Installation (30 seconds)

### 5.1 Open Browser

Navigate to: http://localhost:3000

### 5.2 Test Health Check

```bash
# PowerShell
Invoke-WebRequest http://localhost:3000/api/health

# Or visit in browser:
http://localhost:3000/api/health
```

Should return:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T...",
  "database": "connected",
  "uptime": 123
}
```

---

## Step 6: Test GitHub Integration (2 minutes)

### 6.1 Sign Up / Sign In

1. Go to http://localhost:3000/auth/signup
2. Create account OR sign in with GitHub OAuth
3. Verify GitHub profile data is captured

### 6.2 Create Workspace

1. Click "Create Workspace"
2. Enter name and description
3. Click "Create"

### 6.3 Connect GitHub Repository

1. Go to workspace settings
2. Click "GitHub Integration"
3. Authorize GitHub OAuth (if not already)
4. Select repository to connect
5. Click "Connect Repository"

### 6.4 Create and Sync Document

1. Click "New Document"
2. Enter title: "Test API Specification"
3. Select type: "Specification"
4. Add content
5. Click "Save"

**Expected Behavior**:

- ✅ Document created
- ✅ GitHub path auto-generated: `docs/specifications/test-api-specification.md`
- ✅ Sync queued (check sync status badge)
- ✅ File appears on GitHub (after background worker runs)

### 6.5 Test Background Sync Worker

```bash
# Manually trigger sync worker (for testing)
curl -X POST http://localhost:3000/api/cron/sync-worker \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check sync status badge - should change to "Synced" ✅

---

## Step 7: Setup Webhooks (Optional - Production)

### 7.1 Expose Local Server (Development)

```bash
# Using ngrok
npx ngrok http 3000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
```

### 7.2 Configure GitHub Webhook

1. Go to your repository
2. Settings → Webhooks → Add webhook
3. **Payload URL**: `https://abc123.ngrok.io/api/webhooks/github`
4. **Content type**: `application/json`
5. **Secret**: Value from `GITHUB_WEBHOOK_SECRET` in `.env.local`
6. **Events**: Select:
   - ☑ Push events
   - ☑ Pull requests
   - ☑ Issues
7. Click "Add webhook"

### 7.3 Test Webhook

1. Edit a synced file on GitHub
2. Commit the change
3. Check platform - document should auto-update! 🎉

---

## Step 8: Setup Background Worker

### Option A: Manual Trigger (Development)

```bash
# Run every minute
while true; do
  curl -X POST http://localhost:3000/api/cron/sync-worker \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  sleep 60
done
```

### Option B: System Cron (Production)

```bash
# Add to crontab
crontab -e

# Add this line (runs every minute)
* * * * * curl -X POST http://localhost:3000/api/cron/sync-worker -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option C: Vercel Cron (Vercel Deployment)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-worker",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

---

## 🎯 Quick Test Scenarios

### Scenario 1: Create Document → Sync to GitHub

1. Create document in platform
2. Wait for sync worker (~60 seconds)
3. Check GitHub - file should appear ✅

### Scenario 2: Edit on GitHub → Sync to Platform

1. Edit file on GitHub
2. Commit changes
3. Webhook triggers (instant) OR wait for cron (60s)
4. Platform document auto-updates ✅

### Scenario 3: Conflict Resolution

1. Edit document on platform (don't save yet)
2. Edit same file on GitHub and commit
3. Save platform document
4. Conflict detected! ⚠️
5. Conflict resolver dialog appears
6. Choose resolution strategy
7. Conflict resolved ✅

### Scenario 4: PR Tracking

1. Create PR on GitHub affecting synced file
2. Webhook triggers PR tracking
3. PR impact indicator shows on document ✅
4. Merge PR
5. Platform document auto-updates ✅

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env.local
# Make sure database exists
psql -c "CREATE DATABASE repo_aware_knowledge_hub;"
```

### Issue: "GitHub OAuth fails"

- Verify `GITHUB_ID` and `GITHUB_SECRET` are correct
- Check callback URL matches exactly: `http://localhost:3000/api/auth/callback/github`
- Ensure OAuth app is not suspended

### Issue: "Sync worker not processing"

```bash
# Check if cron endpoint is accessible
curl http://localhost:3000/api/cron/sync-worker \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check queue status
npx tsx tests/github-integration.test.ts
```

### Issue: "Webhook not triggering"

- Verify webhook URL is publicly accessible (use ngrok for local dev)
- Check webhook secret matches `GITHUB_WEBHOOK_SECRET`
- View webhook delivery logs in GitHub repo settings
- Check signature verification in server logs

---

## 📊 Verification Checklist

After completing all steps, verify:

- [x] Server running on http://localhost:3000
- [x] Can sign in with GitHub OAuth
- [x] GitHub profile data captured (name, avatar, etc.)
- [x] Can create workspace
- [x] Can create document
- [x] Document syncs to GitHub (check sync badge)
- [x] GitHub path auto-generated correctly
- [x] Can edit document on GitHub → syncs to platform
- [x] Conflicts detected and resolver dialog works
- [x] PRs tracked and linked to documents
- [x] Webhooks triggering (if configured)
- [x] Background worker processing queue

---

## 🎉 Success!

If all checks pass, your GitHub integration is fully operational!

### Next Steps:

1. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed features
2. Check [GITHUB_INTEGRATION.md](./docs/GITHUB_INTEGRATION.md) for advanced usage
3. Review [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for deployment

### Key Endpoints:

- **App**: http://localhost:3000
- **Health**: http://localhost:3000/api/health
- **Sync Worker**: http://localhost:3000/api/cron/sync-worker
- **Webhooks**: http://localhost:3000/api/webhooks/github

### Support:

- Check server logs for errors
- Run test suite: `npx tsx tests/github-integration.test.ts`
- Review documentation in `/docs` folder

---

**Total Setup Time**: ~5 minutes  
**Complexity**: Low (well documented)  
**Status**: Production Ready ✅

Happy syncing! 🚀
