# GitHub Integration - Complete Developer Guide

> **Comprehensive guide to running the DocHub application locally and understanding the GitHub synchronization system end-to-end.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Environment Setup](#4-environment-setup-env)
5. [Database Setup](#5-database-setup)
6. [Running the Application Locally](#6-running-the-application-locally)
7. [Redis + BullMQ Explanation](#7-redis--bullmq-explanation)
8. [GitHub Integration Full Workflow](#8-github-integration-full-workflow)
9. [Health Check Endpoints](#9-health-check-endpoints)
10. [End-to-End Testing Guide](#10-end-to-end-testing-guide)
11. [Troubleshooting](#11-troubleshooting)
12. [Production Deployment](#12-production-deployment-guide)
13. [Quick Command Cheat Sheet](#13-quick-command-cheat-sheet)

---

## 1. Project Overview

### What is DocHub?

DocHub is a **full-stack documentation platform** that bridges the gap between collaborative document editing and version-controlled GitHub repositories. It enables teams to:

- **Write and organize documentation** in a workspace environment
- **Automatically sync documents to GitHub** as Markdown files
- **Pull changes from GitHub** back into the platform
- **Detect and resolve conflicts** when simultaneous edits occur
- **Version control** with full Git integration
- **Collaborate** with role-based access control

### Problems It Solves

1. **Documentation Drift**: Keeps documentation in sync with code repositories
2. **Collaboration Friction**: Non-technical team members can edit without using Git directly
3. **Version Control**: Maintains Git history while providing a user-friendly interface
4. **Conflict Management**: Intelligent conflict detection and multiple resolution strategies
5. **Automation**: Background workers handle sync operations asynchronously

### Main Features

| Feature                 | Description                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Workspaces**          | Team containers with member roles (OWNER, EDITOR, VIEWER)                                          |
| **Documents**           | Markdown documents with phases (Planning, Development, etc.) and types (Spec, Meeting Notes, etc.) |
| **GitHub Sync**         | Bi-directional sync between platform and GitHub repositories                                       |
| **Auto-Sync**           | Automatic syncing with configurable delay (default: 5 seconds)                                     |
| **Conflict Resolution** | 4 strategies: Manual, Last Write Wins, Platform Wins, GitHub Wins                                  |
| **Version History**     | Complete version tracking with diffs                                                               |
| **Webhooks**            | Real-time updates when GitHub repository changes                                                   |
| **Background Jobs**     | BullMQ-powered job queue with retry logic                                                          |
| **Token Encryption**    | AES-256-CBC encryption for GitHub OAuth tokens                                                     |

---

## 2. Tech Stack

### Frontend

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Accessible component library
- **React Markdown** - Markdown rendering

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Relational database
- **NextAuth.js** - Authentication (email/password + GitHub OAuth)

### Infrastructure

- **Redis** - In-memory data store (via Docker)
- **BullMQ** - Background job queue library
- **ioredis** - Redis client for Node.js
- **Docker** - Containerization (Redis deployment)

### GitHub Integration

- **Octokit (GitHub API)** - Official GitHub REST API client
- **GitHub OAuth Apps** - User authentication
- **GitHub Webhooks** - Push/PR event notifications
- **crypto** - Webhook signature verification

### Background Processing

- **Worker Script** - `scripts/github-sync-worker.ts`
- **Job Queue** - BullMQ with exponential backoff retry
- **Concurrency** - 5 jobs processed simultaneously
- **Rate Limiting** - 10 jobs/second, 60 requests/hour per repo

### Security

- **Token Encryption** - AES-256-CBC with PBKDF2 key derivation
- **Webhook Signatures** - HMAC-SHA256 validation
- **Environment Secrets** - Secure key storage

---

## 3. Prerequisites

Before running this application locally, ensure you have:

### Required Software

| Software           | Version        | Installation                                                 |
| ------------------ | -------------- | ------------------------------------------------------------ |
| **Node.js**        | 18.x or higher | [nodejs.org](https://nodejs.org)                             |
| **npm**            | 9.x or higher  | Included with Node.js                                        |
| **PostgreSQL**     | 14.x or higher | [postgresql.org](https://www.postgresql.org/download/)       |
| **Docker Desktop** | Latest         | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Git**            | 2.x or higher  | [git-scm.com](https://git-scm.com)                           |

### Verify Installations

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check PostgreSQL
psql --version
# Expected: psql (PostgreSQL) 14.x or higher

# Check Docker
docker --version
# Expected: Docker version 20.x or higher

# Check Git
git --version
# Expected: git version 2.x or higher
```

### GitHub OAuth App Setup

You need to create a GitHub OAuth App to enable user authentication:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: `DocHub (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID** (you'll need this for `.env`)
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret** (you'll need this for `.env`)

> ⚠️ **Important**: Keep your client secret secure. Never commit it to version control.

### Database Access

You need a running PostgreSQL instance:

**Option 1: Local PostgreSQL**

- Install PostgreSQL locally
- Default connection: `postgresql://postgres:password@localhost:5432/repo_aware_knowledge_hub`

**Option 2: Cloud Database**

- Use services like [Supabase](https://supabase.com), [Railway](https://railway.app), or [Neon](https://neon.tech)
- Copy the connection string they provide

---

## 4. Environment Setup (.env)

Create a `.env` file in the root directory with the following variables:

### Complete .env Template

```env
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="postgresql://postgres:password@localhost:5432/repo_aware_knowledge_hub"

# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<GENERATE_WITH_OPENSSL>"

# ============================================
# GitHub OAuth App Credentials
# ============================================
GITHUB_ID="<YOUR_GITHUB_OAUTH_CLIENT_ID>"
GITHUB_SECRET="<YOUR_GITHUB_OAUTH_CLIENT_SECRET>"

# GitHub Webhook Secret (for signature validation)
GITHUB_WEBHOOK_SECRET="<GENERATE_WITH_OPENSSL>"

# ============================================
# Redis Configuration
# ============================================
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
# REDIS_PASSWORD=""  # Uncomment if Redis requires password

# ============================================
# Security & Encryption
# ============================================
# CRITICAL: 64-character hex string for AES-256-CBC encryption
ENCRYPTION_KEY="<GENERATE_64_CHAR_HEX_STRING>"

# Cron job authentication secret (for scheduled tasks)
CRON_SECRET="<GENERATE_WITH_OPENSSL>"

# ============================================
# Application Configuration (Optional)
# ============================================
NODE_ENV="development"
PORT="3000"
```

### How to Generate Secrets

#### Generate NEXTAUTH_SECRET (Base64, 32 bytes)

```bash
openssl rand -base64 32
```

Example output: `UEiTd87zty5+9ND98k6LFeKghYRpkrRhW70ekkSPLfM=`

#### Generate ENCRYPTION_KEY (Hex, 64 characters)

```bash
openssl rand -hex 32
```

Example output: `846f92fbacb3c8b5cc837b9c868930e284874df2ae3bc29c31ac87cd248491c1`

#### Generate GITHUB_WEBHOOK_SECRET (Hex, 32 bytes)

```bash
openssl rand -hex 32
```

Example output: `1b5b1989f75d69e11c1afdee9bdd970a1aecfe9835758d86ba708fbbb2109e23`

#### Generate CRON_SECRET (Hex, 20 bytes)

```bash
openssl rand -hex 20
```

Example output: `4e392e8f6afc9bcb19fc2d626161e393375709c9`

### Environment Variable Descriptions

| Variable                | Purpose                        | Required       | Example                               |
| ----------------------- | ------------------------------ | -------------- | ------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string   | ✅ Yes         | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL`          | Base URL for OAuth callbacks   | ✅ Yes         | `http://localhost:3000`               |
| `NEXTAUTH_SECRET`       | Session encryption key         | ✅ Yes         | Base64 string (32 bytes)              |
| `GITHUB_ID`             | GitHub OAuth Client ID         | ✅ Yes         | From GitHub OAuth App settings        |
| `GITHUB_SECRET`         | GitHub OAuth Client Secret     | ✅ Yes         | From GitHub OAuth App settings        |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature validation   | ⚠️ Recommended | Hex string (32 bytes)                 |
| `REDIS_URL`             | Redis connection URL           | ✅ Yes         | `redis://localhost:6379`              |
| `ENCRYPTION_KEY`        | Token encryption key (AES-256) | ✅ Yes         | 64-character hex string               |
| `CRON_SECRET`           | Cron job authentication        | ⚠️ Recommended | Hex string (20 bytes)                 |

> ⚠️ **Security Warning**:
>
> - Never commit `.env` to version control
> - Use different secrets for development and production
> - Rotate secrets periodically in production
> - If `ENCRYPTION_KEY` is lost, all encrypted tokens become unrecoverable

---

## 5. Database Setup

### Step 1: Install Dependencies

```bash
# Install all Node.js packages
npm install
```

This installs:

- Next.js, React, TypeScript
- Prisma (ORM and CLI)
- Redis client (ioredis)
- BullMQ (job queue)
- Octokit (GitHub API)
- All other dependencies

### Step 2: Generate Prisma Client

```bash
# Generate TypeScript types from Prisma schema
npx prisma generate
```

This creates the Prisma Client based on `prisma/schema.prisma`, which includes all models:

- User, Workspace, Document
- DocSyncInfo, ConflictResolution
- GitHubAuth, WorkspaceGitHubIntegration
- And 20+ other models

### Step 3: Create Database

If using local PostgreSQL:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE repo_aware_knowledge_hub;

# Exit PostgreSQL
\q
```

### Step 4: Run Migrations

**Option A: Push schema directly (for development)**

```bash
npx prisma db push
```

This applies the schema without creating migration files. Fast, good for development.

**Option B: Create and run migrations (for production)**

```bash
# Create migration
npx prisma migrate dev --name initial_setup

# Or run existing migrations
npx prisma migrate deploy
```

This creates migration files in `prisma/migrations/` for version control.

### Step 5: Verify Database Schema

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
```

This opens `http://localhost:5555` where you can:

- Browse all tables
- View data
- Create test records
- Verify migrations applied correctly

### Step 6: Seed Database (Optional)

If there's a seed script:

```bash
npm run db:seed
```

Or create an admin user manually:

```bash
npm run create-admin
```

---

## 6. Running the Application Locally

To run the complete application, you need **4 services** running simultaneously:

1. **PostgreSQL** - Database
2. **Redis** - Job queue backend
3. **Worker** - Background job processor
4. **Next.js Dev Server** - Web application

### Service Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │◄────│   Next.js App   │
│   (Database)    │     │  (Port 3000)    │
└─────────────────┘     └────────┬────────┘
                                 │
                                 │ Queue Jobs
                                 ▼
                        ┌─────────────────┐
                        │      Redis      │
                        │   (Port 6379)   │
                        └────────┬────────┘
                                 │
                                 │ Consume Jobs
                                 ▼
                        ┌─────────────────┐
                        │  GitHub Worker  │
                        │  (Background)   │
                        └────────┬────────┘
                                 │
                                 │ API Calls
                                 ▼
                        ┌─────────────────┐
                        │   GitHub API    │
                        └─────────────────┘
```

### Step-by-Step Startup

#### 1. Start PostgreSQL

**If installed locally:**

```bash
# Ensure PostgreSQL service is running
# Windows:
net start postgresql-x64-14

# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql
```

**If using cloud database:**

- No action needed, it's already running

#### 2. Start Redis with Docker

```bash
# Navigate to project directory
cd c:\Users\n1234\Downloads\repo-aware-knowledge-hub

# Start Redis container (detached mode)
docker-compose up -d redis
```

**What this does:**

- Pulls `redis:7-alpine` image (if not cached)
- Creates container named `repo-aware-redis`
- Exposes port `6379` on localhost
- Creates persistent volume `redis-data`
- Enables AOF (Append-Only File) persistence
- Runs health checks every 5 seconds

**Verify Redis is running:**

```bash
# Check container status
docker ps | Select-String "redis"

# Test Redis connection
docker exec repo-aware-redis redis-cli ping
# Expected output: PONG
```

**Alternative: Redis with Redis Commander (Web UI)**

```bash
# Start both Redis and Redis Commander
docker-compose up -d

# Access Redis Commander at http://localhost:8081
```

#### 3. Start GitHub Sync Worker

Open a **new terminal window** and run:

```bash
# Start the background worker
npm run worker:github-sync
```

**What this does:**

- Connects to Redis
- Listens to the `github-sync` queue
- Processes sync jobs with concurrency of 5
- Handles retries with exponential backoff
- Logs all job processing activity

**Expected output:**

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
```

**Keep this terminal open** - it needs to run continuously for background sync operations.

#### 4. Start Next.js Development Server

Open **another new terminal window** and run:

```bash
# Start the dev server
npm run dev
```

**What this does:**

- Compiles TypeScript
- Starts Next.js server on port 3000
- Enables hot module reloading
- Serves API routes and pages

**Expected output:**

```
▲ Next.js 16.0.3
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

**Open browser:** Navigate to http://localhost:3000

### Why Each Service is Required

| Service        | Purpose                                         | What Happens if Missing                    |
| -------------- | ----------------------------------------------- | ------------------------------------------ |
| **PostgreSQL** | Stores all data (users, documents, sync info)   | App won't start, database connection fails |
| **Redis**      | Stores job queue data, enables async processing | Sync operations fail, health checks fail   |
| **Worker**     | Processes GitHub API operations in background   | Jobs remain in queue, sync never completes |
| **Dev Server** | Serves web UI and API routes                    | Can't access application                   |

### Full Startup Script (PowerShell)

Save this as `start-dev.ps1`:

```powershell
# Start all services for local development

Write-Host "Starting DocHub..." -ForegroundColor Cyan

# 1. Start Redis
Write-Host "`n[1/3] Starting Redis..." -ForegroundColor Yellow
docker-compose up -d redis
Start-Sleep -Seconds 3

# 2. Start Worker (in new window)
Write-Host "[2/3] Starting GitHub Sync Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run worker:github-sync"
Start-Sleep -Seconds 2

# 3. Start Dev Server (in new window)
Write-Host "[3/3] Starting Next.js Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n✓ All services started!" -ForegroundColor Green
Write-Host "  - Redis: http://localhost:6379" -ForegroundColor White
Write-Host "  - Worker: Running in background" -ForegroundColor White
Write-Host "  - App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nWait 10-15 seconds for compilation, then open http://localhost:3000`n" -ForegroundColor Yellow
```

Run with:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

---

## 7. Redis + BullMQ Explanation

### Why Redis is Needed

**Redis** is an in-memory data store used as the **backend for the job queue**. It provides:

1. **Fast job storage** - Sub-millisecond read/write operations
2. **Persistence** - AOF (Append-Only File) ensures jobs survive crashes
3. **Atomic operations** - Reliable job locking and state transitions
4. **Pub/Sub** - Real-time queue event notifications

**Without Redis:**

- GitHub sync requests would block the HTTP request/response cycle
- Long-running GitHub API calls would cause timeouts
- No retry mechanism for failed operations
- Users would have to wait for sync to complete before getting a response

### Why BullMQ Queue is Used

**BullMQ** is a Node.js library that implements a robust job queue on top of Redis. It provides:

#### Job Management

- **Queuing** - Add jobs to the queue instantly
- **Prioritization** - High-priority manual syncs, low-priority auto-syncs
- **Deduplication** - Prevent duplicate sync jobs for the same document
- **Delayed jobs** - Schedule jobs to run after a delay (used for auto-sync batching)

#### Reliability

- **Retry logic** - Automatic retries with exponential backoff
- **Job persistence** - Jobs survive application restarts
- **Failed job tracking** - Store failed jobs with error details for debugging
- **Job cleanup** - Automatic removal of old completed/failed jobs

#### Performance

- **Concurrency control** - Process 5 jobs simultaneously
- **Rate limiting** - Limit to 10 jobs/second to avoid GitHub API rate limits
- **Progress tracking** - Update job progress (10%, 50%, 100%)

#### Monitoring

- **Queue statistics** - Track waiting, active, completed, failed counts
- **Job events** - Listen to `completed`, `failed`, `progress` events
- **Job inspection** - Retrieve job status, result, or error at any time

### Why Worker is Required

The **worker** is a separate Node.js process that:

1. **Consumes jobs** from the BullMQ queue
2. **Executes GitHub API operations** (push, pull, create commits)
3. **Updates database** after successful/failed operations
4. **Logs activity** for auditing and debugging

#### Worker Process Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. User triggers sync (manual or auto)                │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  2. API route adds job to BullMQ queue                 │
│     Job ID: sync-doc123-1707912345678                  │
│     Status: waiting                                     │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  3. API route returns immediately (HTTP 200)           │
│     Response: { jobId: "...", status: "queued" }       │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  4. Worker picks up job from queue                     │
│     Status: waiting → active                           │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  5. Worker executes sync job                           │
│     - Fetch document from DB                           │
│     - Decrypt GitHub token                             │
│     - Call GitHub API (create/update file)             │
│     - Update DocSyncInfo (githubSha, syncStatus)       │
│     - Log activity                                     │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  6. Job completes                                      │
│     Status: active → completed                         │
│     Result: { commitSha: "abc123...", message: "..." } │
└─────────────────────────────────────────────────────────┘
```

#### What Happens if Redis/Worker is Not Running

| Scenario                      | What Happens                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| **Redis not running**         | ❌ App fails to start, health checks return 503                         |
| **Worker not running**        | ⚠️ Jobs queue up but never process, sync UI shows "pending" forever     |
| **Redis crashes during job**  | ⚠️ Job is retried when Redis comes back (job persisted to disk via AOF) |
| **Worker crashes during job** | ⚠️ Job is marked as failed and retried (BullMQ handles worker crashes)  |

**Best Practice:** Run worker as a system service (PM2, systemd) in production so it auto-restarts on failure.

---

## 8. GitHub Integration Full Workflow

### 8.1 Connecting GitHub Account (OAuth)

#### User Flow

1. **User clicks "Connect GitHub Account"** in workspace settings
2. **OAuth redirect**: User is sent to `https://github.com/login/oauth/authorize`
3. **GitHub authorization page**: User reviews requested permissions:
   - `repo` - Full repository access (read/write)
   - `user:email` - Read user email addresses
4. **User approves**: GitHub redirects back to `/api/auth/callback/github`
5. **Callback processing**:
   - Exchange authorization code for access token
   - Fetch GitHub user profile (username, avatar, email)
   - Encrypt access token with AES-256-CBC
   - Store in `GitHubAuth` table

#### Database Storage

**GitHubAuth Table Schema:**

```prisma
model GitHubAuth {
  id           String    @id @default(cuid())
  userId       String
  githubUserId Int       // GitHub numeric user ID
  username     String    // GitHub username (e.g., "octocat")
  accessToken  String    // ENCRYPTED with ENCRYPTION_KEY
  tokenScopes  String[]  // ["repo", "user:email"]
  expiresAt    DateTime? // Token expiration (refreshed every 8 hours)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

#### Token Encryption

**Algorithm:** AES-256-CBC with PBKDF2 key derivation

**Encryption Process:**

```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

export function encryptToken(token: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY!, 'salt', 100000, 32, 'sha256');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const algorithm = 'aes-256-cbc';
  const key = crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY!, 'salt', 100000, 32, 'sha256');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Security Notes:**

- Tokens are **never stored in plaintext**
- IV (Initialization Vector) is unique per encryption
- If `ENCRYPTION_KEY` changes, all tokens become unrecoverable
- Tokens are rotated/refreshed periodically

---

### 8.2 Connecting Workspace to Repository

#### Configuration UI

**Location:** Workspace Settings → GitHub Integration

**User completes form:**

- **Repository**: Select from user's accessible repositories (fetched via GitHub API)
- **Branch**: Default `main`, can be changed to `develop`, `docs`, etc.
- **Base Path**: Default `docs`, documents are saved under `docs/<phase>/<type>/`
- **Webhook Secret**: Auto-generated or manual entry (for webhook signature validation)

#### API Endpoint

**POST /api/github/workspace-integration**

Request body:

```json
{
  "workspaceId": "clx123...",
  "repository": "myorg/myrepo",
  "branch": "main",
  "basePath": "docs",
  "webhookSecret": "1b5b1989f75d69e11c1afdee..."
}
```

**Database Record Created:**

```prisma
model WorkspaceGitHubIntegration {
  id            String   @id @default(cuid())
  workspaceId   String   @unique // One integration per workspace
  repository    String   // "owner/repo" format
  branch        String   @default("main")
  basePath      String   @default("docs")
  webhookSecret String?  // For webhook signature validation
  connectedAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id])
}
```

**Important:**

- **One integration per workspace** - Multiple workspaces can connect to same repo
- **Repository format** - Must be `owner/repo` (e.g., `octocat/Hello-World`)
- **Base path** - All documents are synced under this directory in the repo

---

### 8.3 Syncing a Document to GitHub

#### Manual Sync Trigger

**User clicks "Sync to GitHub"** button on a document.

#### GitHub Path Generation

**Automatic path generation** (if `githubPath` is not set):

```typescript
// Format: docs/<phase>/<type>/<slug>.md
const githubPath = generateGitHubPath({
  basePath: integration.basePath, // "docs"
  phase: document.phase, // "PLANNING"
  type: document.type, // "SPEC"
  title: document.title, // "API Design Document"
});

// Result: "docs/planning/spec/api-design-document.md"
```

**Slug generation:**

- Lowercase title
- Replace spaces with hyphens
- Remove special characters
- Example: "API Design Document" → "api-design-document"

#### Sync Process

**1. Queue Sync Job**

API route adds job to BullMQ queue:

```typescript
// POST /api/github/sync-document
const job = await addGitHubSyncJob({
  documentId: document.id,
  workspaceId: workspace.id,
  userId: user.id,
  operation: 'sync', // 'sync' = push to GitHub
  priority: 10, // Manual sync = high priority
});

// Return immediately
return Response.json({
  jobId: job.id,
  status: 'queued',
});
```

**2. Worker Processes Job**

Worker executes these steps:

```typescript
// Worker: scripts/github-sync-worker.ts

// a) Fetch document + workspace + integration
const document = await prisma.document.findUnique({
  where: { id: documentId },
  include: {
    syncInfo: true,
    workspace: {
      include: { githubIntegration: true },
    },
  },
});

// b) Get user's GitHub token
const githubAuth = await prisma.gitHubAuth.findFirst({
  where: { userId },
});
const accessToken = decryptToken(githubAuth.accessToken);

// c) Initialize GitHub API client
const octokit = new Octokit({ auth: accessToken });
const [owner, repo] = integration.repository.split('/');

// d) Check if file exists in GitHub
let existingFile = null;
try {
  existingFile = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: document.githubPath,
    ref: integration.branch,
  });
} catch (error) {
  // File doesn't exist yet
}

// e) Create or update file
const commitMessage = existingFile ? `Update ${document.title}` : `Create ${document.title}`;

const result = await octokit.rest.repos.createOrUpdateFileContents({
  owner,
  repo,
  path: document.githubPath,
  message: commitMessage,
  content: Buffer.from(document.content).toString('base64'),
  branch: integration.branch,
  sha: existingFile?.data.sha, // Required for updates
});

// f) Update database
await prisma.document.update({
  where: { id: documentId },
  data: {
    githubSha: result.data.content.sha,
  },
});

await prisma.docSyncInfo.update({
  where: { documentId },
  data: {
    syncStatus: 'SYNCED',
    lastSyncedAt: new Date(),
    lastCommitSha: result.data.commit.sha,
    lastCommitUrl: result.data.commit.html_url,
    lastExternalHash: result.data.content.sha,
  },
});

// g) Log activity
await prisma.activity.create({
  data: {
    type: 'GITHUB_SYNC_COMPLETED',
    actorId: userId,
    workspaceId,
    entityType: 'Document',
    entityId: documentId,
    metadata: {
      commitSha: result.data.commit.sha,
      commitUrl: result.data.commit.html_url,
    },
  },
});
```

**3. GitHub Commit Created**

File appears in repository:

- **Path**: `docs/planning/spec/api-design-document.md`
- **Content**: Document markdown content
- **Commit message**: "Create API Design Document" or "Update API Design Document"
- **Author**: GitHub user (from access token)
- **SHA**: Unique content hash (stored in `githubSha` field)

#### GitHubSHA Storage

**What is SHA?**

- SHA (Secure Hash Algorithm) is a unique hash of the file content
- Every file in Git has a SHA (blob SHA in Git terms)
- Used to detect if file has changed

**Why store it?**

- **Conflict detection**: Compare local SHA with GitHub SHA
- **Conditional updates**: GitHub API requires SHA to update existing files
- **Change tracking**: Know if file was modified externally

**When stored:**

- After every successful push to GitHub
- After every successful pull from GitHub
- After conflict resolution

---

### 8.4 Syncing All Workspace Documents

#### Bulk Sync Trigger

**User clicks "Push All to GitHub"** in workspace sync settings.

**API Endpoint:** POST `/api/github/sync-workspace`

#### Process

**1. Fetch all documents in workspace:**

```typescript
const documents = await prisma.document.findMany({
  where: {
    workspaceId,
    // Only sync documents with githubPath set
    githubPath: { not: null },
  },
  include: {
    syncInfo: true,
  },
});
```

**2. Filter documents that need sync:**

```typescript
const documentsToSync = documents.filter((doc) => {
  // Include if:
  // - No sync info (never synced)
  // - syncStatus is PENDING or ERROR
  // - needSyncToGitHub flag is true
  return (
    !doc.syncInfo ||
    doc.syncInfo.syncStatus === 'PENDING' ||
    doc.syncInfo.syncStatus === 'ERROR' ||
    doc.syncInfo.needSyncToGitHub
  );
});
```

**3. Queue individual sync jobs:**

```typescript
const jobs = await Promise.all(
  documentsToSync.map((doc) =>
    addGitHubSyncJob({
      documentId: doc.id,
      workspaceId,
      userId,
      operation: 'sync',
      priority: 5, // Bulk sync = medium priority
    })
  )
);

// Return job IDs
return Response.json({
  totalDocuments: documents.length,
  queuedForSync: jobs.length,
  jobIds: jobs.map((j) => j.id),
});
```

**4. Worker processes jobs concurrently:**

- Up to **5 jobs simultaneously** (concurrency limit)
- Rate limited to **10 jobs/second**
- Each job is independent (failure of one doesn't affect others)

#### Monitoring Progress

**Real-time queue statistics:**

```typescript
// GET /api/github/queue-status
const stats = {
  waiting: await githubSyncQueue.getWaitingCount(),
  active: await githubSyncQueue.getActiveCount(),
  completed: await githubSyncQueue.getCompletedCount(),
  failed: await githubSyncQueue.getFailedCount(),
};

// Example response:
{
  "waiting": 12,
  "active": 5,
  "completed": 23,
  "failed": 2,
  "total": 42
}
```

**UI polling:**

- Poll `/api/github/queue-status` every 2 seconds
- Update progress bar: `(completed + failed) / total * 100`
- Show "Syncing X documents..." message

---

### 8.5 Auto Sync System

#### Configuration

**Enable Auto Sync** per document:

```typescript
// DocSyncInfo table
{
  autoSync: true,              // Enable automatic syncing
  syncDirection: 'BIDIRECTIONAL',  // or 'TO_GITHUB', 'FROM_GITHUB'
}
```

**Location:** Document Settings → GitHub → Enable Auto Sync

#### How It Works

**1. Document save triggers auto-sync:**

```typescript
// API route: PATCH /api/documents/[id]
async function updateDocument(documentId, updates) {
  // Update document
  const document = await prisma.document.update({
    where: { id: documentId },
    data: updates,
    include: { syncInfo: true },
  });

  // Check if auto-sync enabled
  if (document.syncInfo?.autoSync) {
    // Mark as needing sync
    await prisma.docSyncInfo.update({
      where: { documentId },
      data: { needSyncToGitHub: true },
    });

    // Schedule sync job with delay (debouncing)
    await addGitHubSyncJob(
      {
        documentId,
        workspaceId: document.workspaceId,
        userId,
        operation: 'sync',
        priority: 1, // Auto-sync = low priority
      },
      {
        delay: 5000, // 5 second delay
        jobId: `autosync-${documentId}`, // Deduplicate by ID
      }
    );
  }

  return document;
}
```

**2. Delay Batching (Debouncing)**

If user makes multiple edits quickly:

```
Edit 1 → Queue job with 5s delay (jobId: autosync-doc123)
Edit 2 (2s later) → Replace existing job (same jobId)
Edit 3 (3s later) → Replace existing job again
... no more edits for 5 seconds ...
Job executes → Syncs latest version
```

**Benefits:**

- Prevents spamming GitHub API with every keystroke
- Batches rapid changes into single commit
- Reduces queue congestion

**3. Job Deduplication**

```typescript
// Check if active job exists
export async function hasActiveSyncJob(documentId: string): Promise<boolean> {
  const jobs = await githubSyncQueue.getJobs(['waiting', 'active', 'delayed']);
  return jobs.some((job) => job.data.documentId === documentId);
}

// Usage in API route
if (await hasActiveSyncJob(documentId)) {
  return Response.json({
    message: 'Sync already in progress',
    status: 'skipped',
  });
}
```

**Prevents:**

- Duplicate jobs for same document
- Race conditions (multiple workers syncing same doc)
- Wasted API calls

#### Priority System

| Trigger          | Priority   | Delay  | Behavior                    |
| ---------------- | ---------- | ------ | --------------------------- |
| **Manual Sync**  | 10 (high)  | 0ms    | Processed immediately       |
| **Bulk Sync**    | 5 (medium) | 0ms    | Processed before auto-sync  |
| **Auto Sync**    | 1 (low)    | 5000ms | Processed after manual/bulk |
| **Webhook Pull** | 7 (high)   | 0ms    | Processed quickly           |

**Queue processing order:**

1. High priority jobs (manual, webhook)
2. Medium priority jobs (bulk sync)
3. Low priority jobs (auto-sync)
4. Within same priority: FIFO (first in, first out)

---

### 8.6 Pull from GitHub

#### Manual Pull Trigger

**User clicks "Pull from GitHub"** button on a document.

#### Pull Process

**1. Queue pull job:**

```typescript
// POST /api/github/pull-document
const job = await addGitHubSyncJob({
  documentId,
  workspaceId,
  userId,
  operation: 'pull', // 'pull' = fetch from GitHub
  priority: 7,
});
```

**2. Worker fetches file from GitHub:**

```typescript
// Worker processes pull job

// a) Get file from GitHub
const file = await octokit.rest.repos.getContent({
  owner,
  repo,
  path: document.githubPath,
  ref: integration.branch,
});

// b) Decode content (Base64 → UTF-8)
const content = Buffer.from(file.data.content, 'base64').toString('utf8');

// c) Check for conflicts
const hasConflict = document.githubSha && document.githubSha !== file.data.sha;

if (hasConflict) {
  // Create conflict record
  await createConflictResolution(/* ... */);
  return;
}

// d) Update local document
await prisma.document.update({
  where: { id: documentId },
  data: {
    content: content,
    githubSha: file.data.sha,
    updatedAt: new Date(),
  },
});

// e) Update sync info
await prisma.docSyncInfo.update({
  where: { documentId },
  data: {
    syncStatus: 'SYNCED',
    lastSyncedAt: new Date(),
    lastExternalHash: file.data.sha,
    needSyncFromGitHub: false,
  },
});
```

**3. UI updates:**

- Document content refreshes
- Last synced timestamp updates
- Sync badge shows "Synced" (green)

#### Automatic Pull (Webhook-Triggered)

When a file is edited in GitHub and webhook is configured:

**1. GitHub sends webhook:**

```json
POST /api/github/webhook
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "added": [],
      "removed": [],
      "modified": ["docs/planning/spec/api-design-document.md"]
    }
  ]
}
```

**2. Webhook handler processes:**

```typescript
// Find document by githubPath
const document = await prisma.document.findFirst({
  where: {
    githubPath: 'docs/planning/spec/api-design-document.md',
    workspace: {
      githubIntegration: {
        repository: 'owner/repo',
      },
    },
  },
});

// Queue pull job
await addGitHubSyncJob({
  documentId: document.id,
  workspaceId: document.workspaceId,
  userId: document.authorId, // Original author
  operation: 'pull',
  priority: 7,
});
```

**3. Worker pulls updated content** (same as manual pull)

**Benefits:**

- Platform stays in sync with GitHub automatically
- No manual "refresh" needed
- Changes propagate within seconds

---

### 8.7 Conflict Detection

#### When Conflicts Occur

**Scenario:** Document is edited in **both** platform and GitHub before syncing.

**Timeline:**

```
1. Document synced to GitHub (githubSha: abc123)
2. User A edits document in platform (not synced yet)
3. User B edits same file in GitHub (new commit, githubSha: def456)
4. User A clicks "Sync to GitHub"
5. CONFLICT DETECTED (local githubSha ≠ remote githubSha)
```

#### Detection Logic

**Worker checks for conflicts before pushing:**

```typescript
// Worker: Before syncing to GitHub

// Fetch current file SHA from GitHub
const remoteFile = await octokit.rest.repos.getContent({
  owner,
  repo,
  path: document.githubPath,
  ref: integration.branch,
});

const remoteSha = remoteFile.data.sha;
const localSha = document.githubSha;

if (localSha && localSha !== remoteSha) {
  // CONFLICT DETECTED
  console.log('[Worker] Conflict detected:', {
    localSha,
    remoteSha,
    document: document.id,
  });

  // Create conflict record
  await createConflictRecord(/* ... */);
}
```

#### Conflict Record Creation

**ConflictResolution Table:**

```prisma
model ConflictResolution {
  id              String   @id @default(cuid())
  docSyncInfoId   String
  workspaceId     String
  conflictType    String   // "EDIT_EDIT", "EDIT_DELETE", "DELETE_EDIT"
  detectedAt      DateTime @default(now())
  resolvedAt      DateTime?
  status          String   @default("PENDING") // PENDING, RESOLVED, IGNORED

  // Content snapshots
  platformVersion String   @db.Text  // Local document content
  githubVersion   String   @db.Text  // Remote file content
  mergedVersion   String?  @db.Text  // User's merged content

  // Metadata
  platformSha     String   // Local SHA before conflict
  githubSha       String   // Remote SHA that conflicts

  // Resolution
  resolution      String?  // "PLATFORM_WINS", "GITHUB_WINS", "MANUAL"
  resolvedBy      String?  // User ID who resolved

  docSyncInfo DocSyncInfo @relation(fields: [docSyncInfoId], references: [id])
  resolver    User?       @relation(fields: [resolvedBy], references: [id])
}
```

**Creating conflict:**

```typescript
const conflictResolution = await prisma.conflictResolution.create({
  data: {
    docSyncInfoId: syncInfo.id,
    workspaceId: document.workspaceId,
    conflictType: 'EDIT_EDIT',
    platformVersion: document.content, // Local content
    githubVersion: remoteFile.data.content, // Remote content (decoded)
    platformSha: document.githubSha,
    githubSha: remoteFile.data.sha,
    status: 'PENDING',
  },
});

// Update sync status
await prisma.docSyncInfo.update({
  where: { documentId: document.id },
  data: {
    syncStatus: 'CONFLICT',
    lastError: 'Conflict detected: document was modified in both platform and GitHub',
  },
});
```

#### UI Indication

**Conflict badge appears on document:**

```
┌─────────────────────────────────────┐
│ API Design Document                 │
│ ⚠️ CONFLICT - Requires resolution   │
└─────────────────────────────────────┘
```

**Clicking badge opens conflict resolution modal:**

- Shows side-by-side diff
- Platform version (left) vs GitHub version (right)
- Resolution options (3 strategies)

---

### 8.8 Conflict Resolution

#### Resolution Strategies

**1. Use Platform Version** (`PLATFORM_WINS`)

- Keep local changes, overwrite GitHub
- GitHub file is updated with platform content
- Local `githubSha` is updated to new commit SHA

**2. Use GitHub Version** (`GITHUB_WINS`)

- Discard local changes, use GitHub content
- Local document is updated with GitHub content
- Local `githubSha` is updated to remote SHA

**3. Manual Merge** (`MANUAL`)
See full 3-pane diff/merge UI

- Left: Platform version
- Middle: Merged version (editable)
- Right: GitHub version
- User manually merges content
- Result is saved to both platform and GitHub

#### Resolution Process

**API Endpoint:** PATCH `/api/github/conflicts/[id]`

Request body:

```json
{
  "resolution": "MANUAL",
  "mergedContent": "# API Design\n\nMerged content here..."
}
```

**Backend processing:**

```typescript
async function resolveConflict(conflictId, resolution, mergedContent, userId) {
  const conflict = await prisma.conflictResolution.findUnique({
    where: { id: conflictId },
    include: {
      docSyncInfo: {
        include: {
          document: true,
        },
      },
    },
  });

  const document = conflict.docSyncInfo.document;
  let finalContent;

  // Determine final content based on strategy
  switch (resolution) {
    case 'PLATFORM_WINS':
      finalContent = conflict.platformVersion;
      break;

    case 'GITHUB_WINS':
      finalContent = conflict.githubVersion;
      break;

    case 'MANUAL':
      finalContent = mergedContent;
      break;
  }

  // 1. Update local document
  await prisma.document.update({
    where: { id: document.id },
    data: {
      content: finalContent,
    },
  });

  // 2. Push resolved content to GitHub
  const result = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: document.githubPath,
    message: `Resolve conflict: ${document.title}`,
    content: Buffer.from(finalContent).toString('base64'),
    branch: integration.branch,
    sha: conflict.githubSha, // Use GitHub SHA for update
  });

  // 3. Update resolution record
  await prisma.conflictResolution.update({
    where: { id: conflictId },
    data: {
      status: 'RESOLVED',
      resolution,
      mergedVersion: finalContent,
      resolvedBy: userId,
      resolvedAt: new Date(),
    },
  });

  // 4. Update sync info
  await prisma.docSyncInfo.update({
    where: { documentId: document.id },
    data: {
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      lastCommitSha: result.data.commit.sha,
      githubSha: result.data.content.sha,
      lastError: null,
    },
  });

  // 5. Log activity
  await prisma.activity.create({
    data: {
      type: 'CONFLICT_RESOLVED',
      actorId: userId,
      workspaceId: document.workspaceId,
      entityType: 'Document',
      entityId: document.id,
      metadata: {
        conflictId,
        resolution,
        commitSha: result.data.commit.sha,
      },
    },
  });
}
```

**Result:**

- Conflict badge removed
- Document shows "Synced" status (green)
- GitHub repository has new commit with merged content
- Conflict record marked as RESOLVED in database

---

### 8.9 Webhook Integration (GitHub → Platform)

#### Setting Up Webhook

**1. Go to GitHub Repository Settings:**
Navigate to: `https://github.com/<owner>/<repo>/settings/hooks`

**2. Click "Add webhook"**

**3. Configure webhook:**

| Field                | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| **Payload URL**      | `https://your-domain.com/api/github/webhook`             |
| **Content type**     | `application/json`                                       |
| **Secret**           | Copy from workspace integration settings (webhookSecret) |
| **SSL verification** | Enable SSL verification (production only)                |
| **Events**           | Select individual events: `Push`, `Pull request`         |
| **Active**           | ✓ Checked                                                |

**4. Click "Add webhook"**

**5. Verify:**
GitHub sends a `ping` event immediately. Check "Recent Deliveries" tab to see if it succeeded.

#### Webhook Signature Validation

**Why signature validation?**

- Ensures webhook requests are actually from GitHub
- Prevents malicious actors from triggering sync operations
- Validates payload hasn't been tampered with

**How it works:**

GitHub sends signature in header:

```
X-Hub-Signature-256: sha256=abc123def456...
```

**Validation code:**

```typescript
// /api/github/webhook/route.ts
import crypto from 'crypto';

export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();

  // Get workspace integration (contains webhookSecret)
  const integration = await prisma.workspaceGitHubIntegration.findFirst({
    where: { repository: payload.repository.full_name },
  });

  if (!integration || !integration.webhookSecret) {
    return Response.json({ error: 'No webhook secret configured' }, { status: 401 });
  }

  // Compute expected signature
  const hmac = crypto.createHmac('sha256', integration.webhookSecret);
  const digest = 'sha256=' + hmac.update(body).digest('hex');

  // Compare signatures (timing-safe)
  const signatureValid = crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(digest));

  if (!signatureValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook...
}
```

#### Supported Events

**1. Push Event**

Triggered when commits are pushed to the branch.

**Payload excerpt:**

```json
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "abc123...",
      "message": "Update API documentation",
      "added": ["docs/new-file.md"],
      "removed": ["docs/old-file.md"],
      "modified": ["docs/planning/spec/api-design.md"]
    }
  ],
  "repository": {
    "full_name": "owner/repo"
  }
}
```

**Processing:**

```typescript
async function handlePushEvent(payload) {
  const { commits, ref, repository } = payload;

  // Only process main branch
  if (ref !== `refs/heads/${integration.branch}`) {
    return Response.json({ message: 'Ignored: different branch' });
  }

  // Extract modified/added file paths
  const changedFiles = commits.flatMap((commit) => [...commit.modified, ...commit.added]);

  // Find documents matching these paths
  const documents = await prisma.document.findMany({
    where: {
      githubPath: { in: changedFiles },
      workspace: {
        githubIntegration: {
          repository: repository.full_name,
        },
      },
    },
  });

  // Queue pull jobs for each document
  const jobs = await Promise.all(
    documents.map((doc) =>
      addGitHubSyncJob({
        documentId: doc.id,
        workspaceId: doc.workspaceId,
        userId: doc.authorId,
        operation: 'pull',
        priority: 7,
      })
    )
  );

  return Response.json({
    message: 'Webhook processed',
    documentsQueued: documents.length,
    jobIds: jobs.map((j) => j.id),
  });
}
```

**2. Pull Request Event**

Triggered when PR is opened/updated/merged.

**Use case:** Show PR status in document UI (future enhancement)

**Payload excerpt:**

```json
{
  "action": "opened",
  "pull_request": {
    "number": 42,
    "title": "Update API docs",
    "state": "open",
    "html_url": "https://github.com/owner/repo/pull/42"
  }
}
```

#### What Happens After Webhook

**Timeline:**

```
1. User pushes commit to GitHub
   ↓
2. GitHub sends webhook to platform (within 1 second)
   ↓
3. Webhook handler validates signature
   ↓
4. Handler finds affected documents
   ↓
5. Handler queues pull jobs (high priority)
   ↓
6. Worker picks up jobs within seconds
   ↓
7. Worker pulls updated content from GitHub
   ↓
8. Database updated with new content + githubSha
   ↓
9. UI refreshes (WebSocket/polling) showing updated content
```

**Total latency:** 2-5 seconds from commit to UI update

---

### 8.10 Image Handling

> **Note:** Image handling depends on implementation. The following describes a typical approach.

#### Image Extraction

When you paste or upload an image in a document:

**1. Image is embedded as Base64 data URI:**

```markdown
![Screenshot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...)
```

**2. Before syncing to GitHub, images are extracted:**

```typescript
// Extract Base64 images from markdown
const imageRegex = /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([^)]+)\)/g;
let match;
const images = [];

while ((match = imageRegex.exec(content)) !== null) {
  const [fullMatch, altText, mimeType, base64Data] = match;

  images.push({
    fullMatch,
    altText,
    mimeType,
    base64Data,
    filename: `${slugify(altText)}.${mimeType}`,
  });
}
```

**3. Upload images to GitHub:**

```typescript
// Upload to docs/assets/<document-slug>/<image-filename>
for (const image of images) {
  const imagePath = `${integration.basePath}/assets/${documentSlug}/${image.filename}`;

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: imagePath,
    message: `Upload image: ${image.filename}`,
    content: image.base64Data, // Already Base64
    branch: integration.branch,
  });

  // Replace Base64 URI with relative path
  content = content.replace(
    image.fullMatch,
    `![${image.altText}](./assets/${documentSlug}/${image.filename})`
  );
}
```

**4. Sync document with updated image references:**

Final markdown:

```markdown
![Screenshot](./assets/api-design-document/screenshot.png)
```

**Benefits:**

- Images are properly versioned in Git
- Markdown files remain readable
- Base64 bloat removed from document content
- Images can be viewed directly in GitHub UI

---

## 9. Health Check Endpoints

Health endpoints allow you to monitor the system status programmatically.

### GET /api/health/redis

**Purpose:** Check Redis connection and BullMQ queue statistics.

**Request:**

```bash
curl http://localhost:3000/api/health/redis
```

**Response (200 OK - Healthy):**

```json
{
  "redisConnected": true,
  "queueStatus": {
    "waiting": 0,
    "active": 2,
    "completed": 145,
    "failed": 3,
    "delayed": 0,
    "paused": 0
  },
  "timestamp": "2026-02-14T12:45:30.123Z"
}
```

**Response (503 Service Unavailable - Unhealthy):**

```json
{
  "redisConnected": false,
  "error": "Connection refused on localhost:6379",
  "timestamp": "2026-02-14T12:45:30.123Z"
}
```

**Interpretation:**

| Field            | Meaning                                     |
| ---------------- | ------------------------------------------- |
| `redisConnected` | Can connect to Redis                        |
| `waiting`        | Jobs queued, not yet picked up by worker    |
| `active`         | Jobs currently being processed              |
| `completed`      | Successfully completed jobs (last 24 hours) |
| `failed`         | Failed jobs (last 7 days)                   |
| `delayed`        | Jobs scheduled for future execution         |
| `paused`         | Queue is paused (0=not paused, 1=paused)    |

**Monitoring thresholds:**

- ❌ `redisConnected: false` → Redis is down, restart container
- ⚠️ `failed > 10` → Investigate recent failures
- ⚠️ `waiting > 100` → Worker may be slow or not running
- ⚠️ `active = 0` and `waiting > 0` → Worker not picking up jobs

---

### GET /api/health/github-sync

**Purpose:** Comprehensive system health check (Redis, Queue, Encryption, Database, Worker).

**Request:**

```bash
curl http://localhost:3000/api/health/github-sync
```

**Response (200 OK - Healthy):**

```json
{
  "status": "healthy",
  "checks": {
    "redis": {
      "status": "ok",
      "message": "Redis is reachable"
    },
    "queue": {
      "status": "ok",
      "message": "Queue is operational",
      "stats": {
        "waiting": 0,
        "active": 2,
        "completed": 145,
        "failed": 3,
        "delayed": 0
      }
    },
    "encryption": {
      "status": "ok",
      "message": "Token encryption/decryption working"
    },
    "database": {
      "status": "ok",
      "message": "Database is accessible"
    },
    "worker": {
      "status": "ok",
      "message": "Worker has processed 145 jobs"
    }
  },
  "timestamp": "2026-02-14T12:45:30.123Z"
}
```

**Response (207 Multi-Status - Degraded):**

```json
{
  "status": "degraded",
  "checks": {
    "redis": { "status": "ok", "message": "..." },
    "queue": { "status": "ok", "message": "..." },
    "encryption": { "status": "ok", "message": "..." },
    "database": { "status": "ok", "message": "..." },
    "worker": {
      "status": "warning",
      "message": "Worker may not be running (no active or completed jobs found). Start with: npm run worker:sync"
    }
  },
  "timestamp": "2026-02-14T12:45:30.123Z"
}
```

**Response (503 Service Unavailable - Unhealthy):**

```json
{
  "status": "unhealthy",
  "checks": {
    "redis": {
      "status": "error",
      "message": "Redis connection failed: ECONNREFUSED"
    },
    "queue": { "status": "error", "message": "..." },
    "encryption": { "status": "ok", "message": "..." },
    "database": { "status": "ok", "message": "..." },
    "worker": { "status": "warning", "message": "..." }
  },
  "timestamp": "2026-02-14T12:45:30.123Z"
}
```

**Overall status logic:**

- `healthy` - All checks pass
- `degraded` - Some checks have warnings (system works but not optimally)
- `unhealthy` - Critical checks fail (system not functional)

**Use in monitoring:**

```bash
# Poll every 5 minutes
while true; do
  status=$(curl -s http://localhost:3000/api/health/github-sync | jq -r '.status')
  if [ "$status" != "healthy" ]; then
    echo "ALERT: System status is $status"
    # Send notification
  fi
  sleep 300
done
```

---

## 10. End-to-End Testing Guide

### Complete Testing Checklist

Use this checklist to verify all GitHub integration features work correctly.

#### Prerequisites

- [ ] Dev server running (`npm run dev`)
- [ ] Redis running (`docker-compose up -d redis`)
- [ ] Worker running (`npm run worker:github-sync`)
- [ ] GitHub OAuth app configured
- [ ] User account created in platform

---

#### Test 1: GitHub Account Connection

**Steps:**

1. Sign in to workspace
2. Go to User Settings → GitHub
3. Click "Connect GitHub Account"
4. Authorize GitHub OAuth app (approve permissions)
5. Verify redirect back to platform

**Expected Result:**

- ✅ GitHub username and avatar displayed in settings
- ✅ Database has `GitHubAuth` record with encrypted token
- ✅ User profile shows GitHub linked badge

**Verify in database:**

```sql
SELECT id, username, githubUsername, githubLinked
FROM "User"
WHERE email = 'your-email@example.com';
```

---

#### Test 2: Workspace Repository Connection

**Steps:**

1. Go to Workspace Settings → GitHub Integration
2. Click "Connect Repository"
3. Select a repository from dropdown
4. Configure branch (default: `main`)
5. Configure base path (default: `docs`)
6. Click "Connect"

**Expected Result:**

- ✅ Success message appears
- ✅ Repository name displayed in settings
- ✅ Database has `WorkspaceGitHubIntegration` record

**Verify in database:**

```sql
SELECT * FROM "WorkspaceGitHubIntegration"
WHERE "workspaceId" = 'your-workspace-id';
```

---

#### Test 3: Push Document to GitHub

**Steps:**

1. Create a new document:
   - Title: "GitHub Sync Test"
   - Content: "# Test Document\n\nThis is a sync test."
   - Phase: Planning
   - Type: Spec
2. Click "Sync to GitHub" button
3. Wait 2-5 seconds
4. Check document shows "Synced" badge (green)

**Expected Result:**

- ✅ Job queued immediately (status: queued)
- ✅ Worker processes job (check worker logs)
- ✅ Document status changes to "Synced"
- ✅ File appears in GitHub repo at `docs/planning/spec/github-sync-test.md`
- ✅ Document has `githubSha` populated

**Verify in GitHub:**

1. Go to `https://github.com/<owner>/<repo>/blob/main/docs/planning/spec/github-sync-test.md`
2. Confirm file exists and content matches

**Verify in database:**

```sql
SELECT id, title, githubPath, githubSha
FROM "Document"
WHERE title = 'GitHub Sync Test';

SELECT syncStatus, lastSyncedAt, lastCommitSha
FROM "DocSyncInfo"
WHERE "documentId" = 'document-id-from-above';
```

---

#### Test 4: Edit on GitHub and Pull

**Steps:**

1. Go to GitHub repository
2. Edit the file you just pushed:
   - Add a line: "\n\nEdited in GitHub!"
   - Commit changes directly to `main` branch
3. Go back to platform
4. Open the same document
5. Click "Pull from GitHub" button
6. Wait 2-5 seconds

**Expected Result:**

- ✅ Document content updates with new line
- ✅ `githubSha` updated to new commit SHA
- ✅ Last synced timestamp updated

**Verify:**

- Document now shows: "Edited in GitHub!" at the end

---

#### Test 5: Create Conflict

**Steps:**

1. Open document in platform
2. Add line: "\n\nEdited in platform!"
3. **Don't click "Sync to GitHub" yet**
4. Go to GitHub repository
5. Edit same file in GitHub: Add "\n\nEdited in GitHub again!"
6. Commit changes
7. Go back to platform
8. Now click "Sync to GitHub"

**Expected Result:**

- ✅ Conflict detected (githubSha mismatch)
- ✅ Document shows yellow "CONFLICT" badge
- ✅ Conflict resolution modal appears
- ✅ Database has `ConflictResolution` record with status PENDING

**Verify in database:**

```sql
SELECT id, conflictType, status, platformVersion, githubVersion
FROM "ConflictResolution"
WHERE status = 'PENDING';

SELECT syncStatus, lastError
FROM "DocSyncInfo"
WHERE "documentId" = 'document-id';
```

---

#### Test 6: Resolve Conflict (Use Platform Version)

**Steps:**

1. In conflict modal, select "Use Platform Version"
2. Click "Resolve Conflict"
3. Wait for confirmation

**Expected Result:**

- ✅ Conflict badge removed
- ✅ Document shows "Synced" badge
- ✅ GitHub file updated with platform content ("Edited in platform!")
- ✅ Conflict record status changes to RESOLVED
- ✅ New commit created in GitHub

**Verify in GitHub:**

- File content matches platform version
- Commit message: "Resolve conflict: GitHub Sync Test"

---

#### Test 7: Resolve Conflict (Manual Merge)

**Setup:** Create another conflict (repeat Test 5)

**Steps:**

1. In conflict modal, select "Manual Merge"
2. Edit merged content in text area:

   ```markdown
   # Test Document

   This is a sync test.

   Edited in platform!
   Edited in GitHub again!
   Both changes merged manually.
   ```

3. Click "Resolve Conflict"

**Expected Result:**

- ✅ GitHub file contains manually merged content
- ✅ Platform document contains manually merged content
- ✅ Conflict resolved

---

#### Test 8: Auto-Sync

**Steps:**

1. Go to document settings
2. Enable "Auto Sync"
3. Edit document content (add a few words)
4. Click "Save"
5. **Wait 5 seconds** (don't manually click "Sync to GitHub")
6. Check worker logs
7. Check GitHub repository

**Expected Result:**

- ✅ After 5 seconds, job automatically queued
- ✅ Worker processes job
- ✅ GitHub file updated automatically
- ✅ No manual sync button click needed

**Test rapid edits:**

1. Edit and save 3 times within 5 seconds
2. Wait 5 seconds after last edit
3. Verify only 1 commit created in GitHub (changes batched)

---

#### Test 9: Bulk Sync

**Setup:** Create 5 documents in the workspace

**Steps:**

1. Go to Workspace Settings → GitHub Integration
2. Click "Push All to GitHub"
3. Watch progress indicator

**Expected Result:**

- ✅ Progress bar shows syncing documents
- ✅ All 5 documents appear in GitHub under correct paths
- ✅ Queue stats show 5 jobs completed
- ✅ All documents show "Synced" badge

**Verify:**

```bash
# Check queue stats
curl http://localhost:3000/api/github/queue-status
```

---

#### Test 10: Webhook (Optional, requires public URL)

**Setup:**

1. Deploy to a public URL (or use ngrok for localhost)
2. Configure webhook in GitHub (see section 8.9)

**Steps:**

1. Go to GitHub repository
2. Edit any synced file
3. Commit changes
4. Wait 5-10 seconds
5. Check platform document

**Expected Result:**

- ✅ Webhook received (check `/api/github/webhook` logs)
- ✅ Pull job automatically queued
- ✅ Document content updated in platform
- ✅ No manual "Pull" button click needed

**Verify in GitHub:**

- Go to Settings → Webhooks → Recent Deliveries
- Should show 200 OK response

---

#### Test 11: Health Endpoints

**Steps:**

```bash
# Test Redis health
curl http://localhost:3000/api/health/redis | jq

# Test full system health
curl http://localhost:3000/api/health/github-sync | jq
```

**Expected Result:**

- ✅ Both endpoints return 200 OK
- ✅ `status: "healthy"` (or "degraded" if worker not running)
- ✅ Queue stats show completed jobs

---

### Automated E2E Test Script

Run the comprehensive test suite:

```bash
# Run end-to-end test
npx tsx scripts/test-github-sync-e2e.ts
```

**Expected output:**

```
======================================================================
GITHUB SYNC END-TO-END VERIFICATION
======================================================================

=== Step 1: Redis Infrastructure ===
✓ Redis Connection: Redis is responding (PONG)
✓ REDIS_URL Config: REDIS_URL is configured
✓ BullMQ Queue: Queue is operational

=== Step 2: Database Connectivity ===
✓ Database Connection: PostgreSQL database is accessible
✓ Workspaces: Found 2 workspace(s)
⚠ GitHub Integrations: No GitHub integrations found

... [more tests] ...

======================================================================
END-TO-END TEST RESULTS SUMMARY
======================================================================

Total Tests: 14
✓ PASS: 9
✗ FAIL: 0
⚠ WARNING: 3
○ SKIP: 2

✅ SYSTEM READY - Infrastructure operational!
```

---

## 11. Troubleshooting

### Redis Not Running

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Cause:** Redis container is not running.

**Solution:**

```bash
# Check if container exists
docker ps -a | Select-String "redis"

# Start existing container
docker start repo-aware-redis

# Or recreate
docker-compose up -d redis

# Verify
docker exec repo-aware-redis redis-cli ping
# Should return: PONG
```

---

### Worker Not Running

**Symptom:**

- Jobs stuck in "queued" or "pending" status forever
- Queue `waiting` count keeps increasing
- Health endpoint shows "worker may not be running"

**Cause:** Worker process not started or crashed.

**Solution:**

```bash
# Check if worker is running (look for PowerShell window)
Get-Process | Select-String "powershell"

# Restart worker
npm run worker:github-sync
```

**Production (PM2):**

```bash
pm2 list
pm2 restart github-worker
pm2 logs github-worker
```

---

### Docker Errors

**Problem 1: Docker not installed**

```
docker : The term 'docker' is not recognized
```

**Solution:** Install Docker Desktop from https://www.docker.com/products/docker-desktop

---

**Problem 2: YAML syntax error**

```
yaml: line 43: mapping values are not allowed in this context
```

**Cause:** Malformed `docker-compose.yml`

**Solution:** Verify YAML syntax:

```bash
# Validate YAML
docker-compose config

# Fix by ensuring proper indentation and quotes
# All values should have double quotes, proper indentation
```

---

**Problem 3: Port already in use**

```
Error: Bind for 0.0.0.0:6379 failed: port is already allocated
```

**Solution:**

```bash
# Find process using port 6379
netstat -ano | findstr :6379

# Kill process (replace PID)
Stop-Process -Id <PID> -Force

# Or change port in docker-compose.yml
ports:
  - "6380:6379"  # Use 6380 externally

# Update REDIS_URL in .env
REDIS_URL="redis://localhost:6380"
```

---

### OAuth Callback Mismatch

**Symptom:**

```
error=redirect_uri_mismatch
&error_description=The redirect_uri MUST match the registered callback URL for this application.
```

**Cause:** GitHub OAuth callback URL doesn't match configured URL.

**Solution:**

1. Go to [GitHub OAuth App Settings](https://github.com/settings/developers)
2. Edit your OAuth app
3. Ensure "Authorization callback URL" is **exactly**:
   ```
   http://localhost:3000/api/auth/callback/github
   ```
   (No trailing slash, exact protocol, exact port)
4. Save changes
5. Restart dev server

---

### ENCRYPTION_KEY Mismatch

**Symptom:**

```
Error: Unsupported state or unable to authenticate data
    at Decipheriv.final
    at decryptToken (/src/lib/encryption.ts:45:28)
```

**Cause:** `ENCRYPTION_KEY` changed after tokens were encrypted.

**Solution:**

**If in development:**

```bash
# 1. Delete all GitHubAuth records
# psql or Prisma Studio
DELETE FROM "GitHubAuth";

# 2. Generate new ENCRYPTION_KEY
openssl rand -hex 32

# 3. Update .env

# 4. Reconnect GitHub accounts
```

**If in production:**

- **DO NOT change ENCRYPTION_KEY** unless you have a migration plan
- Rotating keys requires re-encrypting all tokens
- Consider using a key management service (AWS KMS, etc.)

---

### Webhook Signature Failure

**Symptom:**

```
POST /api/github/webhook
401 Unauthorized
{ "error": "Invalid signature" }
```

**Cause:** Webhook secret in GitHub doesn't match `WorkspaceGitHubIntegration.webhookSecret`

**Solution:**

1. Get webhook secret from database:
   ```sql
   SELECT "webhookSecret" FROM "WorkspaceGitHubIntegration"
   WHERE "workspaceId" = 'your-workspace-id';
   ```
2. Go to GitHub → Repository → Settings → Webhooks
3. Edit webhook
4. Update "Secret" field with exact value from database
5. Click "Update webhook"
6. Test by clicking "Redeliver" on a recent delivery

---

### Conflict Stuck in PENDING

**Symptom:**

- Conflict detected but resolution doesn't work
- Conflict status remains PENDING after attempting resolution
- Error: "Cannot update file, SHA mismatch"

**Cause:** GitHub file was updated again after conflict was detected.

**Solution:**

1. Pull latest from GitHub first:
   ```typescript
   // In conflict resolution modal
   // Option: "Refresh from GitHub"
   ```
2. Re-attempt resolution with updated GitHub version
3. Or manually resolve:
   - Copy content from platform
   - Edit file in GitHub directly
   - Mark conflict as RESOLVED in database

---

### Job Fails with Rate Limit

**Symptom:**

```
Worker: Job failed - API rate limit exceeded
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707912345
```

**Cause:** GitHub API rate limit hit (5000 requests/hour per user)

**Solution:**

**Immediate:**

- Wait until rate limit resets (check `X-RateLimit-Reset` timestamp)
- Job will automatically retry after backoff

**Long-term:**

- Reduce sync frequency (increase auto-sync delay from 5s to 30s)
- Implement caching (don't fetch file if SHA matches)
- Use conditional requests (If-None-Match header)
- Consider GitHub Enterprise (higher rate limits)

**Check rate limit:**

```bash
curl -H "Authorization: token ghp_YOUR_TOKEN" \
  https://api.github.com/rate_limit
```

---

### Database Connection Pool Exhausted

**Symptom:**

```
Error: Prepared statement already exists
```

**Cause:** Too many concurrent Prisma clients

**Solution:**

```typescript
// Use global Prisma instance (singleton pattern)
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

---

## 12. Production Deployment Guide

### Hosting Next.js Application

**Recommended Platforms:**

| Platform                      | Pros                                          | Cons                                      |
| ----------------------------- | --------------------------------------------- | ----------------------------------------- |
| **Vercel**                    | Zero-config, auto-scaling, generous free tier | Serverless (need separate worker hosting) |
| **Railway**                   | Simple, includes database, worker-friendly    | Paid plans required for production        |
| **AWS ECS**                   | Full control, private networking              | Complex setup                             |
| **DigitalOcean App Platform** | Affordable, managed                           | Limited customization                     |

**Example: Vercel Deployment**

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   vercel --prod
   ```

4. **Set environment variables:**

   ```bash
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add ENCRYPTION_KEY production
   # ... add all required env vars
   ```

5. **Update GitHub OAuth callback:**
   - Change to `https://your-app.vercel.app/api/auth/callback/github`

---

### Running Worker with PM2

**PM2** is a production process manager that keeps worker running and restarts on failure.

**1. Install PM2:**

```bash
npm install -g pm2
```

**2. Create ecosystem config:**

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'github-worker',
      script: 'npm',
      args: 'run worker:github-sync',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

**3. Start worker:**

```bash
# Start worker
pm2 start ecosystem.config.js

# View logs
pm2 logs github-worker

# Monitor
pm2 monit

# Restart
pm2 restart github-worker
```

**4. Enable auto-start on boot:**

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

**5. Monitoring:**

```bash
# View status
pm2 status

# View metrics
pm2 describe github-worker
```

---

### Managed Redis (Production)

**Don't use Docker in production.** Use managed Redis service.

**Recommended Providers:**

| Provider            | Pricing              | Features                  |
| ------------------- | -------------------- | ------------------------- |
| **Upstash**         | $0.20/100K commands  | Serverless, HTTP REST API |
| **Redis Labs**      | Free 30MB, then paid | Managed clusters, backups |
| **AWS ElastiCache** | ~$15/month           | VPC private networking    |
| **Railway**         | Included with app    | Simple, auto-configured   |

**Example: Upstash Setup**

1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL
4. Update `.env`:
   ```env
   REDIS_URL="rediss://default:password@host:port"
   ```
5. Deploy (no code changes needed)

**Benefits:**

- Automatic backups
- High availability (replication)
- Monitoring dashboard
- No server maintenance

---

### Security Best Practices

#### 1. Environment Variables

**DO:**

- ✅ Use different secrets for dev/staging/production
- ✅ Store secrets in environment variable service (Vercel Env, AWS Secrets Manager)
- ✅ Never commit `.env` to version control
- ✅ Add `.env` to `.gitignore`

**DON'T:**

- ❌ Use same secrets across environments
- ❌ Hardcode secrets in code
- ❌ Share secrets via Slack/email
- ❌ Store secrets in frontend code

---

#### 2. Rotating Webhook Secret

**How to rotate without downtime:**

1. **Add new secret to database** (don't delete old one yet):

   ```sql
   UPDATE "WorkspaceGitHubIntegration"
   SET "webhookSecret" = 'new-secret-here'
   WHERE id = 'integration-id';
   ```

2. **Update webhook in GitHub** with new secret

3. **Test webhook** (send test delivery)

4. **Monitor for errors** for 24 hours

5. **Old secret can now be fully removed**

**Automate rotation** (monthly):

```typescript
// Cron job: scripts/rotate-webhook-secrets.ts
async function rotateWebhookSecrets() {
  const integrations = await prisma.workspaceGitHubIntegration.findMany();

  for (const integration of integrations) {
    const newSecret = crypto.randomBytes(32).toString('hex');

    // Update database
    await prisma.workspaceGitHubIntegration.update({
      where: { id: integration.id },
      data: { webhookSecret: newSecret },
    });

    // Update GitHub webhook via API
    await updateGitHubWebhookSecret(integration.repository, newSecret);

    console.log(`Rotated secret for ${integration.repository}`);
  }
}
```

---

#### 3. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function middleware(request: Request) {
  if (request.url.includes('/api/github')) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
  }

  return NextResponse.next();
}
```

---

#### 4. Monitoring Health Endpoints

**Setup uptime monitoring:**

**Option 1: Simple uptime monitor**

```bash
# Add to cron (every 5 minutes)
*/5 * * * * curl -f https://your-app.com/api/health/github-sync || echo "Health check failed"
```

**Option 2: UptimeRobot**

- Free tier: 50 monitors
- Add monitor: `https://your-app.com/api/health/github-sync`
- Alert via email/Slack when down

**Option 3: Custom monitoring**

```typescript
// scripts/monitor-health.ts
import nodemailer from 'nodemailer';

setInterval(
  async () => {
    const response = await fetch('https://your-app.com/api/health/github-sync');
    const data = await response.json();

    if (data.status !== 'healthy') {
      // Send alert
      await sendAlertEmail({
        subject: '🚨 System Unhealthy',
        body: JSON.stringify(data, null, 2),
      });
    }
  },
  5 * 60 * 1000
); // Every 5 minutes
```

---

### Backup Strategy

**1. Database Backups**

**PostgreSQL automated backups:**

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump -U postgres -h localhost -d repo_aware_knowledge_hub > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://my-backups/database/

# Keep only last 30 days
find . -name "backup_*.sql" -mtime +30 -delete
```

**2. Redis Backups**

**AOF (Append-Only File) enabled:**

- Every write persisted to disk
- Automatic on restart

**RDB snapshots:**

```bash
# Manual snapshot
redis-cli BGSAVE

# Scheduled snapshots (redis.conf)
save 900 1   # Save if 1 key changed in 900 seconds
save 300 10  # Save if 10 keys changed in 300 seconds
```

**3. GitHub as Backup**

All synced documents are backed up in GitHub repository!

- Full version history
- Accessible even if platform is down
- Can restore from GitHub using import feature

---

## 13. Quick Command Cheat Sheet

### Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Database setup
npx prisma db push                    # Dev: Apply schema
npx prisma migrate dev               # Prod: Create migration
npx prisma studio                    # Visual database browser

# Start Redis
docker-compose up -d redis           # Start detached
docker exec repo-aware-redis redis-cli ping  # Test connection

# Start services
npm run dev                          # Next.js dev server (port 3000)
npm run worker:github-sync           # Background worker

# View logs
docker logs repo-aware-redis         # Redis logs
docker logs -f repo-aware-redis      # Follow Redis logs
```

---

### Testing

```bash
# Run E2E test suite
npx tsx scripts/test-github-sync-e2e.ts

# Health checks
curl http://localhost:3000/api/health/redis | jq
curl http://localhost:3000/api/health/github-sync | jq

# Queue status
curl http://localhost:3000/api/github/queue-status | jq
```

---

### Docker

```bash
# Start/stop Redis
docker-compose up -d redis           # Start
docker-compose stop redis            # Stop
docker-compose down                  # Stop & remove

# Container management
docker ps                            # List running containers
docker ps -a                         # List all containers
docker start repo-aware-redis        # Start existing container
docker restart repo-aware-redis      # Restart container

# Redis commands
docker exec repo-aware-redis redis-cli ping
docker exec repo-aware-redis redis-cli INFO
docker exec -it repo-aware-redis redis-cli  # Interactive shell
```

---

### Database

```bash
# Prisma commands
npx prisma db push                   # Sync schema (dev)
npx prisma migrate dev               # Create migration
npx prisma migrate deploy            # Apply migrations (prod)
npx prisma studio                    # Open GUI
npx prisma format                    # Format schema.prisma

# PostgreSQL direct access
psql -U postgres -d repo_aware_knowledge_hub
\dt                                  # List tables
\d "Document"                        # Describe table
SELECT COUNT(*) FROM "Document";     # Query
\q                                   # Quit
```

---

### Production (PM2)

```bash
# Start worker
pm2 start ecosystem.config.js
pm2 start npm --name "github-worker" -- run worker:github-sync

# Management
pm2 list                             # List all processes
pm2 logs github-worker               # View logs
pm2 logs github-worker --lines 100   # Last 100 lines
pm2 monit                            # Real-time monitoring
pm2 restart github-worker            # Restart
pm2 stop github-worker               # Stop
pm2 delete github-worker             # Remove

# Startup script
pm2 startup                          # Generate startup script
pm2 save                             # Save process list
pm2 resurrect                        # Restore saved processes
```

---

### Git & GitHub

```bash
# Generate secrets
openssl rand-base64 32               # NEXTAUTH_SECRET
openssl rand -hex 32                 # ENCRYPTION_KEY, GITHUB_WEBHOOK_SECRET
openssl rand -hex 20                 # CRON_SECRET

# Check GitHub API rate limit
curl -H "Authorization: token ghp_YOUR_TOKEN" \
  https://api.github.com/rate_limit
```

---

### Troubleshooting

```bash
# Check if services are running
docker ps | Select-String "redis"
Get-Process | Select-String "node"
netstat -ano | findstr :3000        # Check port 3000
netstat -ano | findstr :6379        # Check port 6379

# Kill process by port (Windows)
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# View logs
docker logs repo-aware-redis
pm2 logs github-worker --lines 50
```

---

### Quick Start Script

Save as `quick-start.sh` (Linux/macOS) or `quick-start.ps1` (Windows):

```powershell
# Quick start all services

Write-Host "🚀 Starting DocHub..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
node --version | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Node.js not found"; exit 1 }
docker --version | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Docker not found"; exit 1 }

# Start Redis
Write-Host "Starting Redis..." -ForegroundColor Yellow
docker-compose up -d redis
Start-Sleep -Seconds 2

# Start worker
Write-Host "Starting GitHub Sync Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run worker:github-sync"

# Start dev server
Write-Host "Starting Next.js Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n✅ All services started!`n" -ForegroundColor Green
Write-Host "📊 Health Check: http://localhost:3000/api/health/github-sync" -ForegroundColor Cyan
Write-Host "🌐 Application: http://localhost:3000`n" -ForegroundColor Cyan
```

---

## Conclusion

This guide covered the complete GitHub integration system for the DocHub platform. You should now be able to:

- ✅ Set up the development environment
- ✅ Run all services (PostgreSQL, Redis, Worker, Next.js)
- ✅ Connect GitHub accounts and repositories
- ✅ Sync documents bidirectionally
- ✅ Handle conflicts intelligently
- ✅ Configure webhooks for real-time updates
- ✅ Monitor system health
- ✅ Troubleshoot common issues
- ✅ Deploy to production

### Key Takeaways

1. **Redis + Worker are essential** - Without them, sync operations won't complete
2. **Encryption key is critical** - Losing it means all tokens are unrecoverable
3. **SHA tracking prevents conflicts** - Every sync updates githubSha for comparison
4. **Auto-sync uses debouncing** - 5-second delay batches rapid edits
5. **BullMQ handles retries** - Failed jobs automatically retry with exponential backoff
6. **Webhooks enable real-time sync** - Platform updates when GitHub changes
7. **Health endpoints are your friend** - Use them for monitoring and debugging

### Next Steps

- Review [VERIFICATION_REPORT.md](../VERIFICATION_REPORT.md) for detailed test results
- Read [GITHUB_INTEGRATION_SUMMARY.md](GITHUB_INTEGRATION_SUMMARY.md) for architecture overview
- Check [END_TO_END_TEST_PLAN.md](END_TO_END_TEST_PLAN.md) for test scenarios
- Run the automated test suite: `npx tsx scripts/test-github-sync-e2e.ts`

### Getting Help

If you encounter issues not covered in this guide:

1. Check health endpoints first
2. Review worker logs for errors
3. Verify Redis is running and accessible
4. Confirm environment variables are set correctly
5. Check GitHub API rate limits
6. Review [Troubleshooting](#11-troubleshooting) section

---

**Happy syncing! 🚀**
