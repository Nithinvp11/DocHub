# Manual Testing Guide - DocHub – Collaborative Documentation Platform

**Version:** 1.0  
**Last Updated:** February 14, 2026  
**Target Audience:** QA Engineers, Developers, System Testers

---

## Table of Contents

1. [Project Setup Test](#section-1-project-setup-test)
2. [User Authentication Testing](#section-2-user-authentication-testing)
3. [Workspace Management Test Cases](#section-3-workspace-management-test-cases)
4. [Document Management Test Cases](#section-4-document-management-test-cases)
5. [GitHub Integration - Main Priority](#section-5-github-integration---main-priority)
6. [Security Testing Checklist](#section-6-security-testing-checklist)
7. [Database Table Reference](#section-7-database-table-reference)
8. [Final Production Checklist](#section-8-final-production-checklist)

---

## Section 1: Project Setup Test

### Overview

This section validates that all system components (database, Redis, worker, application) are correctly installed and running.

---

### 1.1 Install Dependencies

**Command:**

```bash
npm install
```

**Expected Output:**

```
added XXX packages, and audited XXX packages in XXs
```

**Common Failures:**

- **Error:** `ERESOLVE unable to resolve dependency tree`
  - **Fix:** Delete `node_modules` and `package-lock.json`, then run `npm install` again
- **Error:** `gyp ERR! build error`
  - **Fix:** Install build tools: `npm install --global windows-build-tools` (Windows) or Xcode Command Line Tools (Mac)

---

### 1.2 Database Migration

**Command:**

```bash
npx prisma db push
```

**Expected Output:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

🚀  Your database is now in sync with your Prisma schema. Done in XXXms

✔ Generated Prisma Client (6.19.0) to .\node_modules\@prisma\client
```

**Alternative (For production):**

```bash
npx prisma migrate deploy
```

**What This Does:**

- Creates all database tables defined in `prisma/schema.prisma`
- Establishes relationships between tables
- Creates indexes for optimized queries
- Generates Prisma Client for database access

**Common Failures:**

- **Error:** `Environment variable not found: DATABASE_URL`
  - **Fix:** Create `.env` file in root directory with `DATABASE_URL="postgresql://username:password@localhost:5432/dbname"`
- **Error:** `Can't reach database server`
  - **Fix:** Ensure PostgreSQL is running: `pg_ctl status` or check Docker container
- **Error:** `Authentication failed for user`
  - **Fix:** Verify database credentials in `.env` file

**Verify Database Created:**

```bash
npx prisma studio
```

Navigate to: `http://localhost:5555`  
You should see all tables listed in the left sidebar.

---

### 1.3 Start Redis

**Using Docker Compose:**

```bash
docker-compose up -d redis
```

**Expected Output:**

```
[+] Running 1/1
 ✔ Container repo-aware-knowledge-hub-redis-1  Started
```

**Verify Redis Running:**

```bash
docker ps
```

Look for container with name containing `redis`.

**Alternative (Without Docker):**
If Redis is installed locally:

```bash
redis-server
```

**Test Redis Connection:**

```bash
redis-cli ping
```

**Expected:** `PONG`

**Common Failures:**

- **Error:** `docker: command not found`
  - **Fix:** Install Docker Desktop from docker.com
- **Error:** `Cannot connect to the Docker daemon`
  - **Fix:** Start Docker Desktop application
- **Error:** `port is already allocated`
  - **Fix:** Change Redis port in `docker-compose.yml` or stop conflicting service

---

### 1.4 Start GitHub Sync Worker

**Command:**

```bash
npm run worker:github-sync
```

**Expected Output:**

```
[Worker Started] GitHub Sync Worker is processing jobs...
[BullMQ] Worker started and listening for jobs
Redis connected successfully
```

**What This Does:**

- Connects to Redis
- Listens to `github-sync` BullMQ queue
- Processes background sync jobs (push/pull documents to/from GitHub)
- Handles webhook-triggered sync operations
- Manages auto-sync operations

**Keep This Running:** Open this in a separate terminal window and keep it running throughout testing.

**Common Failures:**

- **Error:** `connect ECONNREFUSED 127.0.0.1:6379`
  - **Fix:** Redis is not running. Start Redis first (see 1.3)
- **Error:** `ENCRYPTION_KEY is not defined`
  - **Fix:** Add `ENCRYPTION_KEY` to `.env` file (32-character random string)
- **Error:** Worker keeps restarting
  - **Fix:** Check Redis health, ensure database is accessible

**Worker Logs Location:**
Worker outputs logs to console. Look for:

- `Job processing started for job: <jobId>`
- `Job completed successfully: <jobId>`
- `Job failed: <jobId>` (indicates errors)

---

### 1.5 Start Application

**Development Mode:**

```bash
npm run dev
```

**Expected Output:**

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Compiled in XXXms
 ✓ Ready in XXXms
```

**Production Mode (Testing production build):**

```bash
npm run build
npm start
```

**What This Does:**

- Starts Next.js development server on port 3000
- Enables hot module replacement (HMR)
- Serves API routes under `/api/*`
- Serves frontend React application

**Access Application:**
Open browser and navigate to: `http://localhost:3000`

**Expected:** Landing page with "DocHub" title and login/signup buttons.

**Common Failures:**

- **Error:** `Port 3000 is already in use`
  - **Fix:** Kill process on port 3000 or change port: `PORT=3001 npm run dev`
- **Error:** `Module not found`
  - **Fix:** Run `npm install` again, ensure Prisma Client generated: `npx prisma generate`
- **Error:** `NEXTAUTH_SECRET is not defined`
  - **Fix:** Add `NEXTAUTH_SECRET` to `.env` (random 32-character string)

---

### 1.6 Verify Health Endpoints

#### 1.6.1 Redis Health Check

**Endpoint:** `GET /api/health/redis`

**Test:**
Open browser or use curl:

```bash
curl http://localhost:3000/api/health/redis
```

**Expected Response (Success):**

```json
{
  "redisConnected": true,
  "queueStatus": {
    "waiting": 0,
    "active": 0,
    "completed": 12,
    "failed": 1,
    "delayed": 0,
    "paused": 0
  },
  "timestamp": "2026-02-14T10:30:45.123Z"
}
```

**What Each Field Means:**

- `waiting`: Jobs in queue waiting to be processed
- `active`: Jobs currently being processed by worker
- `completed`: Total jobs successfully completed
- `failed`: Total jobs that failed
- `delayed`: Jobs scheduled for future processing
- `paused`: 1 if queue is paused, 0 if active

**Common Failures:**

- **Response:** `{ "redisConnected": false, "error": "..." }`
  - **Cause:** Redis is not running or not accessible
  - **Fix:** Start Redis (see 1.3)

---

#### 1.6.2 GitHub Sync Health Check

**Endpoint:** `GET /api/health/github-sync`

**Test:**

```bash
curl http://localhost:3000/api/health/github-sync
```

**Expected Response (Healthy):**

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
        "active": 0,
        "completed": 12,
        "failed": 1
      }
    },
    "encryption": {
      "status": "ok",
      "message": "Encryption working"
    },
    "database": {
      "status": "ok",
      "message": "Database connected"
    },
    "worker": {
      "status": "warning",
      "message": "Worker status unknown (check if worker process is running)"
    }
  },
  "timestamp": "2026-02-14T10:30:45.123Z"
}
```

**Status Meanings:**

- `healthy`: All checks passed
- `degraded`: Some checks failed but system functional
- `unhealthy`: Critical failures, system not operational

**Worker Check:**

- `ok`: Worker processed jobs recently (within 5 minutes)
- `warning`: No recent job activity (worker may not be running)
- `error`: Worker failed or cannot connect to queue

**Common Failures:**

- **Worker status: "warning"**
  - **Cause:** Worker is not running
  - **Fix:** Start worker (see 1.4): `npm run worker:github-sync`
- **Encryption status: "error"**
  - **Cause:** `ENCRYPTION_KEY` missing or invalid
  - **Fix:** Add valid 32-character `ENCRYPTION_KEY` to `.env`

---

### 1.7 Verify Prisma Database Connectivity

**Test Prisma Connection:**

```bash
npx prisma db execute --stdin <<< "SELECT 1;"
```

**Expected Output:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "dbname" at "localhost:5432"

Query executed successfully.
```

**Alternative Test - Open Prisma Studio:**

```bash
npx prisma studio
```

Navigate to `http://localhost:5555` and verify you can see tables.

---

### 1.8 Verify Build Works

**Command:**

```bash
npm run build
```

**Expected Output:**

```
> repo-aware-knowledge-hub@0.1.0 build
> npm run db:generate && next build

...
✓ Compiled successfully in 7.5s
Route (app)                              Size     First Load JS
...
✓ Generating static pages (X/X)
✓ Collecting build traces
✓ Finalizing page optimization

Build completed successfully!
```

**What This Tests:**

- TypeScript compilation
- Next.js static optimization
- All imports resolve correctly
- No syntax errors

**Common Failures:**

- **Error:** `Type error: ...`
  - **Cause:** TypeScript compilation error
  - **Fix:** Review error message, fix type issues in indicated file
- **Error:** `Module not found`
  - **Cause:** Missing dependency or incorrect import path
  - **Fix:** Install missing package or correct import

---

### 1.9 Verify Lint Works

**Command:**

```bash
npm run lint
```

**Expected Output (No Critical Errors):**

```
✔ No ESLint warnings or errors
```

**Acceptable Output (Cosmetic Warnings):**

```
⚠ 1 warning

./src/components/some-file.tsx
  45:10  warning  'variable' is defined but never used  @typescript-eslint/no-unused-vars

1 problem (0 errors, 1 warning)
```

**What This Tests:**

- Code style compliance
- ESLint rules enforcement
- Potential code quality issues

**Common Failures:**

- **Error:** Multiple TypeScript errors
  - **Fix:** Review and fix each error individually
- **Warning:** Unused variables
  - **Fix:** Remove unused variables or prefix with `_` if intentional

---

### 1.10 Environment Variables Checklist

Before proceeding, ensure your `.env` file contains:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-secret-here"

# GitHub OAuth (for user authentication)
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# GitHub App (for repository access)
GITHUB_APP_ID="your-github-app-id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Encryption (for GitHub tokens)
ENCRYPTION_KEY="your-32-character-encryption-key"

# Redis
REDIS_URL="redis://localhost:6379"

# Optional: Webhook secret (global, can be per-workspace)
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
```

**How to Generate Secrets:**

```bash
# Generate NEXTAUTH_SECRET or ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Section 2: User Authentication Testing

### Overview

Test user signup, login, session management, and role verification.

---

### 2.1 Test User Signup (Email/Password)

**Steps:**

1. Navigate to: `http://localhost:3000`
2. Click **"Sign Up"** button
3. Fill in signup form:
   - **Name:** Test User
   - **Email:** testuser@example.com
   - **Password:** TestPassword123!
4. Click **"Create Account"** button

**Expected Behavior:**

- Form submits successfully
- User is created in database
- User is automatically logged in
- Redirected to: `http://localhost:3000/dashboard`

**Verify in Database (Prisma Studio):**

```bash
npx prisma studio
```

Navigate to `User` table:

- New record with `email = "testuser@example.com"`
- `password` field is hashed (bcrypt)
- `role = "USER"`
- `createdAt` timestamp is recent

**Common Failures:**

- **Error:** "Email already exists"
  - **Cause:** Email already registered
  - **Fix:** Use different email or delete existing user
- **Error:** Session not created
  - **Cause:** `NEXTAUTH_SECRET` missing
  - **Fix:** Add `NEXTAUTH_SECRET` to `.env`

---

### 2.2 Test User Login (Email/Password)

**Steps:**

1. Logout if already logged in (click profile → Logout)
2. Navigate to: `http://localhost:3000`
3. Click **"Sign In"** button
4. Fill in login form:
   - **Email:** testuser@example.com
   - **Password:** TestPassword123!
5. Click **"Sign In"** button

**Expected Behavior:**

- Login successful
- Redirected to: `http://localhost:3000/dashboard`
- User name/avatar displayed in top-right corner

**Test Invalid Credentials:**

1. Try logging in with wrong password
2. **Expected:** Error message "Invalid credentials"

---

### 2.3 Test GitHub OAuth Login

**Prerequisites:**

- GitHub OAuth app configured
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`

**Steps:**

1. Navigate to: `http://localhost:3000`
2. Click **"Sign in with GitHub"** button
3. Redirected to GitHub authorization page
4. Click **"Authorize"** button on GitHub

**Expected Behavior:**

- Redirected back to application
- User logged in automatically
- Redirected to: `http://localhost:3000/dashboard`

**Verify in Database:**
Navigate to `User` table:

- New user created with GitHub email
- `githubLinked = true`
- `githubUserId` populated
- `githubUsername` populated

**Verify in `Account` table:**

- New record created
- `provider = "github"`
- `providerAccountId` matches GitHub user ID
- `access_token` stored (GitHub OAuth token)

---

### 2.4 Test Session Persistence (Multi-Tab)

**Steps:**

1. Login in Tab A
2. Open new tab (Tab B) and navigate to: `http://localhost:3000/dashboard`

**Expected Behavior:**

- Tab B shows you're already logged in
- User info displays correctly
- No need to login again

**Test Cross-Tab Logout:**

1. In Tab A, logout
2. Switch to Tab B, refresh page

**Expected Behavior:**

- Tab B now shows login page
- Session cleared across all tabs

---

### 2.5 Test Logout

**Steps:**

1. While logged in, click profile dropdown in top-right
2. Click **"Logout"** button

**Expected Behavior:**

- Logged out successfully
- Redirected to: `http://localhost:3000` (homepage)
- Session cleared

**Verify Session Cleared:**
Try accessing protected route:

```
http://localhost:3000/dashboard
```

**Expected:** Redirected to login page

---

### 2.6 Test Protected Page Access

**Steps:**

1. Logout completely
2. Try to access protected routes directly:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/dashboard/workspace123`

**Expected Behavior:**

- Redirected to: `http://localhost:3000/api/auth/signin`
- Login required to access these pages

---

### 2.7 Verify User Roles

**Test Regular User Role:**

1. Login as regular user
2. Navigate to `http://localhost:3000/dashboard`
3. **Expected:** Normal workspace view, no admin panels

**Test Admin Role (If Implemented):**

1. Manually set user as admin in database:

```bash
npx prisma studio
```

In `User` table, set `role = "ADMIN"` for test user

2. Refresh dashboard
3. **Expected:** Admin-specific features visible (if implemented)

---

## Section 3: Workspace Management Test Cases

### Overview

Test workspace creation, member management, permissions, and deletion.

---

### 3.1 Create Workspace

**Steps:**

1. Login and navigate to: `http://localhost:3000/dashboard`
2. Click **"Create Workspace"** button (usually a "+" icon)
3. Fill in workspace form:
   - **Name:** Test Workspace
   - **Description:** This is a test workspace for QA
4. Click **"Create"** button

**Expected Behavior:**

- Workspace created successfully
- Success toast notification appears
- Redirected to workspace page: `http://localhost:3000/dashboard/{workspaceId}`
- Workspace visible in workspace list

**Verify in Database:**
Navigate to `Workspace` table:

- New record created
- `name = "Test Workspace"`
- `ownerId` matches your user ID
- `createdAt` timestamp is recent

**Key Workspace Fields:**

- **id:** Unique workspace identifier (CUID)
- **name:** Workspace display name
- **description:** Optional description
- **ownerId:** User who created the workspace (workspace owner)
- **createdAt:** Creation timestamp
- **updatedAt:** Last modification timestamp

---

### 3.2 Rename Workspace

**Steps:**

1. Navigate to workspace: `http://localhost:3000/dashboard/{workspaceId}`
2. Click **"Settings"** tab or gear icon
3. Find workspace name field
4. Change name to: "Updated Test Workspace"
5. Click **"Save"** button

**Expected Behavior:**

- Workspace renamed successfully
- Success toast notification
- New name displays immediately
- Workspace list updated

**Verify in Database:**
Check `Workspace` table:

- `name` updated to "Updated Test Workspace"
- `updatedAt` timestamp updated

---

### 3.3 Delete Workspace

**Steps:**

1. Navigate to workspace settings
2. Scroll to **"Danger Zone"** section
3. Click **"Delete Workspace"** button
4. Confirmation dialog appears
5. Type workspace name to confirm
6. Click **"Delete Permanently"** button

**Expected Behavior:**

- Workspace deleted successfully
- Redirected to: `http://localhost:3000/dashboard`
- Workspace no longer visible in list

**Verify in Database:**
Check `Workspace` table:

- Record deleted (if using hard delete)
- OR `deletedAt` field set (if using soft delete)

**Verify Cascade Deletion:**
All related records should be deleted:

- `WorkspaceMember` records deleted
- `Document` records deleted
- `WorkspaceGitHubIntegration` deleted
- `Activity` records deleted

**Important:** This is destructive. Only test with test data.

---

### 3.4 Add Team Members

**Steps:**

1. Navigate to workspace: `http://localhost:3000/dashboard/{workspaceId}`
2. Click **"Members"** tab or **"Manage Members"** button
3. Click **"Add Member"** button
4. Enter email: `member@example.com`
5. Select permissions (if permission UI exists)
6. Click **"Invite"** button

**Expected Behavior:**

- Member added successfully
- New member appears in member list
- Member can now access workspace

**Verify in Database:**
Check `WorkspaceMember` table:

- New record created
- `workspaceId` matches workspace
- `userId` matches invited user
- `permissions` array populated

**Test Member Access:**

1. Login as invited member
2. Navigate to dashboard
3. **Expected:** Workspace visible in workspace list
4. Click workspace
5. **Expected:** Can access workspace content

---

### 3.5 Remove Team Members

**Steps:**

1. Navigate to workspace members list
2. Find member to remove
3. Click **"Remove"** or **"X"** button next to member
4. Confirm deletion in dialog

**Expected Behavior:**

- Member removed successfully
- Member no longer in member list
- Member loses access to workspace

**Verify Member Access Revoked:**

1. Login as removed member
2. Navigate to dashboard
3. **Expected:** Workspace no longer visible
4. Try to access workspace directly via URL
5. **Expected:** 403 Forbidden or redirected

**Verify in Database:**
Check `WorkspaceMember` table:

- Record deleted for removed member

---

### 3.6 Verify Workspace Roles

**Owner Role Test:**

1. Login as workspace owner
2. Navigate to workspace
3. **Expected Capabilities:**
   - Can create/edit/delete documents
   - Can rename workspace
   - Can delete workspace
   - Can add/remove members
   - Can configure GitHub integration
   - Can access workspace settings

**Member Role Test:**

1. Login as workspace member (non-owner)
2. Navigate to workspace
3. **Expected Capabilities:**
   - Can create/edit/delete documents
   - CANNOT delete workspace
   - CANNOT remove other members
   - CANNOT configure GitHub integration
   - LIMITED access to settings

**Test Permission Enforcement:**

1. Login as member
2. Try to access workspace settings: `http://localhost:3000/dashboard/{workspaceId}/settings`
3. **Expected:** Access denied or settings disabled

---

### 3.7 Test Workspace Permissions Validation

**Test Non-Member Access:**

1. Create workspace as User A
2. Login as User B (not a member)
3. Try to access workspace directly:
   `http://localhost:3000/dashboard/{workspaceId}`

**Expected Behavior:**

- Access denied
- Redirected to dashboard
- Error message: "You don't have access to this workspace"

**Verify API Protection:**
Try accessing workspace API without membership:

```bash
curl -X GET http://localhost:3000/api/workspaces/{workspaceId} \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected:** 403 Forbidden

---

### 3.8 Workspace Fields Reference

**Workspace Table Fields:**

| Field         | Type          | Purpose               | Required |
| ------------- | ------------- | --------------------- | -------- |
| `id`          | String (CUID) | Unique identifier     | Yes      |
| `name`        | String        | Workspace name        | Yes      |
| `description` | String        | Workspace description | No       |
| `ownerId`     | String        | User ID of owner      | Yes      |
| `createdAt`   | DateTime      | Creation timestamp    | Auto     |
| `updatedAt`   | DateTime      | Last update timestamp | Auto     |

**WorkspaceMember Table Fields:**

| Field         | Type          | Purpose                      | Required |
| ------------- | ------------- | ---------------------------- | -------- |
| `id`          | String (CUID) | Unique identifier            | Yes      |
| `workspaceId` | String        | Workspace ID                 | Yes      |
| `userId`      | String        | User ID                      | Yes      |
| `permissions` | String[]      | Capability-based permissions | Yes      |
| `createdAt`   | DateTime      | When user joined             | Auto     |

**Permissions Array Values:**

- `document:create` - Can create documents
- `document:edit` - Can edit documents
- `document:delete` - Can delete documents
- `workspace:settings` - Can modify workspace settings
- `members:manage` - Can add/remove members

---

## Section 4: Document Management Test Cases

### Overview

Test document creation, editing, saving, image uploads, and permissions.

---

### 4.1 Create New Document

**Steps:**

1. Navigate to workspace: `http://localhost:3000/dashboard/{workspaceId}`
2. Click **"New Document"** or **"Create Document"** button
3. Fill in document creation form:
   - **Title:** Test Document
   - **Path:** /test-document (optional - may auto-generate)
   - **Type:** Specification (or General)
4. Click **"Create"** button

**Expected Behavior:**

- Document created successfully
- Redirected to document editor: `http://localhost:3000/dashboard/{workspaceId}/docs/{documentId}`
- Document visible in workspace document list
- Empty editor ready for content

**Verify in Database:**
Check `Document` table:

- New record created
- `title = "Test Document"`
- `workspaceId` matches workspace
- `authorId` matches your user ID
- `content` is empty string or default text
- `status = "DRAFT"`

---

### 4.2 Rename Document

**Steps:**

1. Open document in editor
2. Click on document title at top
3. Edit title to: "Updated Test Document"
4. Press Enter or click outside title field

**Expected Behavior:**

- Title updated immediately
- Auto-save indicator appears
- Success notification

**Verify in Database:**
Check `Document` table:

- `title` updated to "Updated Test Document"
- `updatedAt` timestamp updated

---

### 4.3 Delete Document

**Steps:**

1. Navigate to workspace document list
2. Find document to delete
3. Click **"..."** menu or **"Delete"** button
4. Confirm deletion in dialog

**Expected Behavior:**

- Document deleted successfully
- Removed from document list
- Redirected to workspace view

**Verify in Database:**
Check `Document` table:

- Record deleted (hard delete)
- OR `deletedAt` field set (soft delete)

**Verify Cascade Deletion:**

- `Version` records deleted
- `DocSyncInfo` deleted
- `Comment` records deleted
- `SyncQueue` jobs deleted

---

### 4.4 Test Save and Auto-Save

**Manual Save Test:**

1. Open document editor
2. Type some content: "This is test content"
3. Click **"Save"** button (Ctrl+S / Cmd+S)

**Expected Behavior:**

- Saving indicator appears (spinner or "Saving...")
- Changes saved
- Success indicator appears ("Saved")

**Auto-Save Test:**

1. Open document editor
2. Type some content
3. Wait 3-5 seconds (typical auto-save delay)

**Expected Behavior:**

- Auto-save triggers automatically
- "Auto-saving..." indicator appears
- No user action required

**Verify in Database:**
Check `Document` table:

- `content` updated with your text
- `updatedAt` timestamp updated
- `wordCount` updated (if implemented)

---

### 4.5 Test Editor UI Validation

**Toolbar Test:**

1. Open document editor
2. Verify toolbar buttons present:
   - **Bold** (Ctrl+B)
   - **Italic** (Ctrl+I)
   - **Heading** levels
   - **Link** insert
   - **Image** upload
   - **Code** block
   - **List** (bullet/numbered)

**Apply Formatting Test:**

1. Type text: "This is bold text"
2. Select "bold text"
3. Click Bold button
4. **Expected:** Text becomes **bold**
5. Save document
6. Reload page
7. **Expected:** Bold formatting persists

**Heading Test:**

1. Type: "Heading 1"
2. Select text, apply H1
3. **Expected:** Large heading format
4. Save and verify persistence

---

### 4.6 Test Image Upload

**Upload Image Test:**

1. Open document editor
2. Click **"Image"** button or drag image to editor
3. Select image file (e.g., PNG, JPG)
4. Click **"Upload"**

**Expected Behavior:**

- Upload progress indicator
- Image uploaded successfully
- Image embedded in document
- Image URL generated: `/uploads/images/{hash}.{ext}`

**Verify workspaceId Required:**
This is enforced at API level.

**Verify in Database:**
Check `UploadedImage` table:

- New record created
- `filename` = original filename
- `url` = `/uploads/images/{hash}.{ext}`
- `workspaceId` = current workspace ID
- `uploadedBy` = your user ID
- `hash` = MD5 hash of file content
- `size` = file size in bytes
- `contentType` = MIME type (e.g., "image/png")

**Test Image Deduplication:**

1. Upload same image again in same workspace
2. **Expected:** No duplicate record created
3. Existing image record reused

**Test Multi-Tenancy:**

1. Upload image in Workspace A
2. Upload same image in Workspace B
3. **Expected:** Two separate records created (same hash, different workspaceIds)

---

### 4.7 Verify Document Path Behavior

**Auto-Generated Path Test:**

1. Create document with title: "My Spec Document"
2. Leave path field empty
3. **Expected Path:** `/my-spec-document` (auto-generated from title)

**Custom Path Test:**

1. Create document with custom path: `/technical/specs/api`
2. **Expected:** Path saved as `/technical/specs/api`

**Nested Path Test:**

1. Create document with path: `/folder/subfolder/doc`
2. **Expected:** Path creates virtual folder structure

**Path Uniqueness Test:**

1. Create document: `Doc A` with path `/test-doc`
2. Try to create another document with same path `/test-doc`
3. **Expected:** Error message "Path already exists in workspace"

**Verify in Database:**
Check `Document` table:

- `path` field unique per workspace
- Unique constraint enforced: `@@unique([workspaceId, path])`

---

### 4.8 Verify Document Lock Behavior

**Document Lock Purpose:**
Prevents multiple users from editing same document simultaneously.

**Lock Acquisition Test:**

1. User A opens document in editor
2. **Expected:** Lock acquired automatically
3. Check `DocumentLock` table:
   - New record created
   - `documentId` = document ID
   - `userId` = User A ID
   - `expiresAt` = timestamp (usually 5-10 minutes from now)

**Lock Enforcement Test:**

1. User A has document open (lock acquired)
2. User B tries to open same document
3. **Expected:** Warning message displayed:
   - "This document is currently being edited by User A"
   - Editor in read-only mode for User B
   - Option to "Take Over" (if implemented)

**Lock Expiration Test:**

1. User A opens document
2. User A closes browser/tab without saving
3. Wait for lock expiration time (5-10 minutes)
4. User B tries to open document
5. **Expected:** Lock expired, User B can edit

**Lock Release Test:**

1. User A opens document (lock acquired)
2. User A clicks "Save" and closes document
3. **Expected:** Lock released immediately

**Verify in Database:**
Check `DocumentLock` table:

- Record deleted when lock released
- OR `releasedAt` timestamp set

---

### 4.9 Document Fields Reference

**Document Table Fields:**

| Field                 | Type          | Purpose                                      | Required |
| --------------------- | ------------- | -------------------------------------------- | -------- |
| `id`                  | String (CUID) | Unique identifier                            | Yes      |
| `title`               | String        | Document title                               | Yes      |
| `content`             | Text          | Document content (HTML/Markdown)             | Yes      |
| `path`                | String        | Virtual file path                            | Yes      |
| `phase`               | Enum          | Document phase (Planning, Development, etc.) | Yes      |
| `type`                | Enum          | Document type (Spec, Guide, etc.)            | Yes      |
| `workspaceId`         | String        | Workspace ID                                 | Yes      |
| `authorId`            | String        | Creator user ID                              | Yes      |
| `parentId`            | String        | Parent document ID (for nesting)             | No       |
| `emoji`               | String        | Document icon emoji                          | No       |
| `coverImage`          | String        | Cover image URL                              | No       |
| `status`              | Enum          | Draft/In Review/Approved                     | Yes      |
| `properties`          | JSON          | Custom key-value properties                  | No       |
| `diagrams`            | JSON          | Embedded diagrams data                       | No       |
| `wordCount`           | Int           | Word count                                   | Auto     |
| `readingTime`         | Int           | Estimated reading time (minutes)             | Auto     |
| `githubPath`          | String        | GitHub file path                             | No       |
| `githubSha`           | String        | Last synced commit SHA                       | No       |
| `githubAutoGenerated` | Boolean       | Path auto-generated?                         | Yes      |
| `createdAt`           | DateTime      | Creation timestamp                           | Auto     |
| `updatedAt`           | DateTime      | Last update timestamp                        | Auto     |
| `lastViewedAt`        | DateTime      | Last view timestamp                          | Auto     |

**DocumentPhase Enum Values:**

- `PLANNING`
- `DEVELOPMENT`
- `REVIEW`
- `COMPLETE`
- `ARCHIVED`

**DocumentType Enum Values:**

- `GENERAL`
- `SPECIFICATION`
- `MEETING_NOTES`
- `API_DOCS`
- `GUIDE`
- `RFC`
- `TEMPLATE`
- `FOLDER`

**DocumentStatus Enum Values:**

- `DRAFT`
- `IN_REVIEW`
- `APPROVED`

---

## Section 5: GitHub Integration - Main Priority

### Overview

This is the most critical section. Test GitHub OAuth, workspace integration, push/pull operations, webhooks, conflicts, and auto-sync.

---

## 5A: Connect GitHub Account

### 5A.1 GitHub OAuth Flow

**Prerequisites:**

- GitHub OAuth app created at: https://github.com/settings/developers
- Callback URL configured: `http://localhost:3000/api/auth/callback/github`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`

**Steps:**

1. Login to application
2. Navigate to user profile dropdown (top-right)
3. Click **"Settings"** or **"Connect GitHub"**
4. Click **"Connect GitHub Account"** button
5. Redirected to GitHub authorization page
6. Review permissions requested:
   - Read user profile
   - Access repositories
   - Create webhooks
7. Click **"Authorize {AppName}"** button

**Expected Behavior:**

- Redirected back to application
- Success message: "GitHub account connected successfully"
- GitHub username displayed in settings

**What Happens Behind the Scenes:**

1. User clicks "Connect GitHub"
2. Redirected to GitHub OAuth URL with client_id
3. User authorizes on GitHub
4. GitHub redirects back with authorization code
5. Application exchanges code for access token
6. Access token encrypted and stored in database

**Verify in Database:**

**User Table:**

```
githubLinked = true
githubUserId = 12345678
githubUsername = "yourusername"
githubAvatarUrl = "https://avatars.githubusercontent.com/..."
githubProfileUrl = "https://github.com/yourusername"
```

**Account Table:**

```
provider = "github"
providerAccountId = "12345678"
access_token = "ghu_..." (OAuth token - encrypted if using GitHub App)
```

**GitHubAuth Table (If using GitHub App for repository access):**

```
userId = "user-id"
workspaceId = NULL (NULL means user-level GitHub connection)
accessToken = "gho_..." (encrypted)
scope = "repo,user,admin:repo_hook"
createdAt = recent timestamp
```

**Common Failures:**

- **Error:** "OAuth app not found"
  - **Cause:** `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` incorrect
  - **Fix:** Verify credentials in GitHub OAuth app settings
- **Error:** "Redirect URI mismatch"
  - **Cause:** Callback URL in GitHub app doesn't match `NEXTAUTH_URL`
  - **Fix:** Update callback URL in GitHub OAuth app settings
- **Error:** "Token encryption failed"
  - **Cause:** `ENCRYPTION_KEY` missing or invalid
  - **Fix:** Add valid 32-character `ENCRYPTION_KEY` to `.env`

---

### 5A.2 Disconnect GitHub Account

**Steps:**

1. Navigate to user settings
2. Find GitHub connection section
3. Click **"Disconnect GitHub"** button
4. Confirm in dialog

**Expected Behavior:**

- GitHub disconnected successfully
- `githubLinked` set to `false`
- Access tokens remain in database (for historical data)
- Can no longer sync documents

---

## 5B: Connect Workspace to GitHub Repository

### 5B.1 Configure Workspace Integration

**Prerequisites:**

- GitHub account connected (see 5A)
- GitHub repository exists (e.g., `yourusername/test-repo`)
- User has `admin` access to repository (for webhook creation)

**Steps:**

1. Navigate to workspace: `http://localhost:3000/dashboard/{workspaceId}`
2. Click **"Settings"** tab
3. Click **"GitHub"** or **"Integrations"** section
4. Click **"Connect Repository"** button
5. Fill in integration form

**Integration Form Fields:**

**repoOwner:**

- **Description:** GitHub username or organization name
- **Example:** `yourusername` or `myorganization`
- **Purpose:** Identifies repository owner
- **Validation:** Must be valid GitHub username

**repoName:**

- **Description:** Repository name
- **Example:** `test-repo` or `documentation`
- **Purpose:** Identifies specific repository
- **Validation:** Repository must exist and be accessible
- **Combined:** Forms `repository` field as `owner/repo`

**branch:**

- **Description:** Target branch for syncing
- **Example:** `main` or `develop` or `docs`
- **Default:** `main`
- **Purpose:** Which branch to push/pull documents to/from
- **Validation:** Branch must exist in repository

**basePath:**

- **Description:** Base directory in repository for documents
- **Example:** `docs` or `content/documentation`
- **Default:** `docs`
- **Purpose:** All documents synced to this folder in repo
- **Example Path:** If basePath=`docs` and document path=`/spec.md`, GitHub path becomes `docs/spec.md`

**webhookId:**

- **Description:** GitHub webhook ID (auto-generated)
- **Example:** `12345678`
- **Purpose:** Identifies webhook created in GitHub
- **Auto-Generated:** Created by API when integration saved
- **User Action:** None - automatically managed

**webhookSecret:**

- **Description:** Secret for webhook signature verification
- **Example:** `a1b2c3d4e5f6...` (32-byte hex string)
- **Purpose:** Ensures webhook requests are from GitHub
- **Auto-Generated:** Automatically generated when integration created
- **Security:** Used to verify `X-Hub-Signature-256` header

**Form Example:**

```
Repository Owner: yourusername
Repository Name: test-repo
Branch: main
Base Path: docs
```

6. Click **"Save Integration"** button

**Expected Behavior:**

- Integration saved successfully
- Webhook automatically created in GitHub repository
- Webhook secret displayed once (copy it - needed for GitHub webhook config)
- Success message: "GitHub integration configured successfully"

**What Happens Behind the Scenes:**

1. Form validates repository exists and is accessible
2. GitHub App installation verified (or OAuth token checked)
3. Webhook secret auto-generated: `crypto.randomBytes(32).toString('hex')`
4. Webhook created in GitHub via API:
   - URL: `https://yourdomain.com/api/github/webhook`
   - Events: `push`
   - Secret: generated webhook secret
5. Integration saved to database
6. GitHub webhook ID stored

**Verify in Database:**

**WorkspaceGitHubIntegration Table:**

```
id = "clx..."
workspaceId = "{workspaceId}"
repository = "yourusername/test-repo"
branch = "main"
basePath = "docs"
webhookSecret = "a1b2c3d4..." (32-byte hex)
webhookId = "12345678" (GitHub webhook ID)
webhookUrl = "https://yourdomain.com/api/github/webhook"
webhookActive = true
webhookCreatedAt = recent timestamp
connectedAt = recent timestamp
updatedAt = recent timestamp
```

**Verify in GitHub:**

1. Navigate to repository: `https://github.com/yourusername/test-repo`
2. Click **"Settings"** tab
3. Click **"Webhooks"** in sidebar
4. **Expected:** New webhook listed
   - Payload URL: `https://yourdomain.com/api/github/webhook`
   - Content type: `application/json`
   - Secret: Configured
   - Events: Just the `push` event
   - Active: ✓

**Common Failures:**

- **Error:** "Repository not found"
  - **Cause:** Repository doesn't exist or no access
  - **Fix:** Verify repository path and access permissions
- **Error:** "Failed to create webhook"
  - **Cause:** Insufficient permissions (need admin access)
  - **Fix:** Grant admin access to repository
- **Error:** "GitHub App not installed"
  - **Cause:** GitHub App not installed on repository
  - **Fix:** Install GitHub App on repository

---

### 5B.2 Why Workspace-Level Integration?

**Design Decision:**
Integration is configured at workspace level, not per-document.

**Reasons:**

1. **Single Source of Truth:** All documents in workspace sync to same repository
2. **Consistent Configuration:** Same branch, basePath for all documents
3. **Single Webhook:** One webhook handles all document updates
4. **Easier Management:** Configure once, applies to all documents
5. **Team Collaboration:** All workspace members use same integration

**Document-Specific Settings:**

- Document path (determines GitHub file path)
- Auto-sync enabled/disabled per document
- Sync direction per document

**Example:**

- **Workspace Integration:** `yourusername/test-repo`, branch `main`, basePath `docs`
- **Document A:** path `/api-spec.md` → GitHub path `docs/api-spec.md`
- **Document B:** path `/guide.md` → GitHub path `docs/guide.md`
- **Document C:** path `/architecture/design.md` → GitHub path `docs/architecture/design.md`

---

## 5C: Webhook Secret UX

### 5C.1 Automatic Secret Generation

**Default Behavior (Phase 2 Improvement):**
When you configure workspace integration, webhook secret is automatically generated.

**Process:**

1. User fills integration form
2. Clicks "Save Integration"
3. Backend generates webhook secret: `crypto.randomBytes(32).toString('hex')`
4. Webhook created in GitHub with this secret
5. Secret stored in database: `WorkspaceGitHubIntegration.webhookSecret`
6. Secret displayed once in success message

**Example Success Message:**

```
✓ GitHub integration configured successfully!

Webhook Secret (copy this):
┌────────────────────────────────────────┐
│ a1b2c3d4e5f6789012345678901234567890ab │
└────────────────────────────────────────┘
[Copy to Clipboard]

Configure this secret in your GitHub webhook settings.
```

**Security Note:** Secret is only displayed once on creation. Store it securely.

---

### 5C.2 Missing Secret Warning Banner

**Scenario:** Integration exists but webhook secret is missing (rare edge case).

**When Displayed:**

- `webhookId` exists (webhook was created)
- `webhookSecret` is NULL (secret missing from database)

**UI Behavior:**
Warning banner displayed at top of GitHub settings page:

```
⚠ Webhook Secret Missing

Your GitHub webhook is configured but the secret is missing. This may cause
webhook deliveries to fail signature verification.

[Generate Webhook Secret]
```

**What to Do:**
Click "Generate Webhook Secret" button to create new secret.

---

### 5C.3 Generate Secret Button

**Purpose:** Manually regenerate webhook secret (e.g., if compromised).

**Location:** GitHub settings page, when warning banner displayed.

**Steps:**

1. Click **"Generate Webhook Secret"** button
2. API endpoint called: `POST /api/github/workspace-integration/generate-secret`
3. New secret generated
4. Database updated with new secret
5. Success card displayed with new secret

**Expected Response:**

```
✓ Webhook secret generated successfully!

New Webhook Secret:
┌────────────────────────────────────────┐
│ b2c3d4e5f6789012345678901234567890abcd │
└────────────────────────────────────────┘
[Copy to Clipboard]

Update this secret in your GitHub webhook settings.
```

**Important:** After regenerating secret, you must update it in GitHub webhook settings, otherwise webhook deliveries will fail signature verification.

---

### 5C.4 What Happens If Secret Missing?

**Webhook Signature Verification:**
When GitHub sends webhook request to `/api/github/webhook`, it includes header:

```
X-Hub-Signature-256: sha256=abc123...
```

This is HMAC-SHA256 signature of request body using webhook secret.

**If Secret Missing in Database:**

1. Webhook received
2. API attempts to verify signature
3. No secret found in database
4. **Result:** Webhook rejected with 401 Unauthorized
5. GitHub marks delivery as failed

**How to Fix:**

1. Generate new webhook secret via UI
2. Update secret in GitHub webhook settings
3. Test webhook delivery

---

## 5D: GitHub PUSH from Website (MOST IMPORTANT)

### 5D.1 Push Single Document

**Prerequisites:**

- Workspace connected to GitHub repository
- Document created in workspace
- GitHub account has write access to repository

**Complete Manual Test:**

**Step 1: Create Workspace**

1. Login to application
2. Navigate to: `http://localhost:3000/dashboard`
3. Create workspace: "Test Sync Workspace"

**Step 2: Connect GitHub Account**

1. Go to user settings
2. Connect GitHub account (see section 5A)
3. Verify GitHub username displayed

**Step 3: Configure Workspace Integration**

1. Navigate to workspace settings
2. Click "GitHub" tab
3. Fill integration form:
   - Repository Owner: `yourusername`
   - Repository Name: `test-repo`
   - Branch: `main`
   - Base Path: `docs`
4. Save integration
5. Copy webhook secret (save for later)

**Step 4: Create Document**

1. Navigate to workspace
2. Click "New Document"
3. Fill form:
   - Title: "API Specification"
   - Path: `/api-spec.md` (or leave empty for auto-generation)
4. Create document

**Step 5: Add Content**

1. Document editor opens
2. Type content:

```markdown
# API Specification

## Overview

This document describes the REST API endpoints.

## Endpoints

### GET /api/users

Returns list of users.

**Response:**
\`\`\`json
{
"users": [
{ "id": 1, "name": "John Doe" }
]
}
\`\`\`
```

3. Click "Save" or wait for auto-save

**Step 6: Enable GitHub Sync for Document**

1. In document editor, look for "Sync" button or "GitHub" menu
2. Click **"Enable GitHub Sync"** or **"Link to GitHub"**
3. Confirm GitHub path:
   - Suggested path: `docs/api-spec.md`
   - Can customize if needed
4. Click "Enable Sync"

**Expected Behavior:**

- `DocSyncInfo` record created
- `syncStatus = "PENDING"`
- Document marked for sync

**Verify in Database:**
Check `DocSyncInfo` table:

```
documentId = "{documentId}"
workspaceId = "{workspaceId}"
githubRepository = "yourusername/test-repo"
githubBranch = "main"
githubPath = "docs/api-spec.md"
syncStatus = "PENDING"
needSyncToGitHub = true
lastSyncedAt = NULL
```

**Step 7: Trigger Push to GitHub**

**Option A - Manual Push Button:**

1. Click **"Push to GitHub"** button in editor toolbar
2. Confirmation dialog: "Push this document to GitHub?"
3. Click "Confirm"

**Option B - Sync Menu:**

1. Click "Sync" dropdown menu
2. Select **"Push to GitHub"**

**Expected UI Behavior:**

- Button changes to "Pushing..." with spinner
- Toast notification: "Pushing to GitHub..."
- After ~2-5 seconds: "Successfully pushed to GitHub!"

**Step 8: Verify Worker Logs**

**In worker terminal window, look for:**

```
[Job Received] Processing GitHub sync job: {jobId}
[Job Data] { documentId: '{documentId}', action: 'push', userId: '{userId}' }
[GitHub Push] Starting push for document: {documentId}
[GitHub API] Fetching current file: docs/api-spec.md
[GitHub API] File not found, creating new file
[GitHub API] Creating file: docs/api-spec.md
[GitHub Commit] Created commit: abc123def456...
[Database Update] Updating DocSyncInfo: lastCommitSha=abc123def456, syncStatus=SYNCED
[Job Completed] Job {jobId} completed successfully
```

**Step 9: Verify File Created in GitHub**

**Check GitHub Repository:**

1. Navigate to: `https://github.com/yourusername/test-repo`
2. Navigate to `docs/` folder
3. **Expected:** New file `api-spec.md` created
4. Click file to view content
5. **Expected:** Content matches what you typed in editor

**Check Commit:**

1. Click "Commits" or commit history
2. **Expected:** Recent commit message:

   ```
   Update api-spec.md from DocHub

   Updated by: Your Name
   Document ID: {documentId}
   ```

**Step 10: Verify Database Updates**

**DocSyncInfo Table:**

```
syncStatus = "SYNCED"
lastSyncedAt = recent timestamp
lastCommitSha = "abc123def456..." (GitHub commit SHA)
lastCommitUrl = "https://github.com/yourusername/test-repo/commit/abc123..."
needSyncToGitHub = false
lastDerivedHash = "md5-hash-of-content"
derivedVersion = 1
```

**Document Table:**

```
githubPath = "docs/api-spec.md"
githubSha = "abc123def456..."
githubAutoGenerated = false (if you specified path manually)
                    = true (if path was auto-generated)
```

**SyncEvent Table (Event History):**

```
documentId = "{documentId}"
syncInfoId = "{syncInfoId}"
action = "PUSH"
status = "SUCCESS"
direction = "TO_GITHUB"
commitSha = "abc123def456..."
triggeredBy = "{userId}"
triggeredAt = recent timestamp
completedAt = recent timestamp
```

**Activity Table (Activity Feed):**

```
workspaceId = "{workspaceId}"
userId = "{userId}"
action = "GITHUB_PUSH"
targetType = "DOCUMENT"
targetId = "{documentId}"
metadata = { "githubPath": "docs/api-spec.md", "commitSha": "abc123..." }
createdAt = recent timestamp
```

---

### 5D.2 Push Workspace (Bulk Push)

**Purpose:** Push all documents in workspace to GitHub at once.

**Steps:**

1. Navigate to workspace with multiple documents
2. Click **"Sync"** dropdown in workspace header/settings
3. Select **"Push All to GitHub"**
4. Confirmation dialog lists documents to be pushed
5. Click "Push All"

**Expected Behavior:**

- Multiple sync jobs queued (one per document)
- Progress indicator shows: "Pushing 5 documents..."
- Documents pushed sequentially or in parallel
- Success message: "All documents pushed successfully!"

**Verify Worker Logs:**

```
[Bulk Push] Queuing 5 documents for push
[Job Queued] Document: api-spec.md (Job ID: job-1)
[Job Queued] Document: user-guide.md (Job ID: job-2)
[Job Queued] Document: architecture.md (Job ID: job-3)
...
[Job Completed] job-1 completed successfully
[Job Completed] job-2 completed successfully
...
```

**Verify GitHub:**

- All documents appear in `docs/` folder
- Multiple commits created (one per document)

---

### 5D.3 Update Existing File (Push After Edit)

**Steps:**

1. Open document that was already pushed to GitHub
2. Edit content: Add new section "## Authentication"
3. Save document
4. Click "Push to GitHub" again

**Expected Behavior:**

- GitHub file updated (not created new)
- Commit message: "Update api-spec.md from..."
- Previous commit SHA replaced with new one

**Verify GitHub:**

1. View file history
2. **Expected:** Two commits:
   - First: "Update api-spec.md..." (initial creation)
   - Second: "Update api-spec.md..." (update)
3. Click second commit
4. **Expected:** Diff shows added "## Authentication" section

---

### 5D.4 Expected Database Changes Summary

**When Push Completes Successfully:**

**DocSyncInfo Updates:**

- `syncStatus`: `PENDING` → `SYNCING` → `SYNCED`
- `lastSyncedAt`: Updated to current timestamp
- `lastCommitSha`: Set to GitHub commit SHA
- `lastCommitUrl`: Set to GitHub commit URL
- `needSyncToGitHub`: Set to `false`
- `lastDerivedHash`: Set to MD5 hash of current content
- `derivedVersion`: Incremented by 1

**Document Updates:**

- `githubPath`: Set to GitHub file path
- `githubSha`: Set to commit SHA
- `updatedAt`: Updated timestamp

**New Records Created:**

- **SyncEvent:** Records push operation details
- **Activity:** Records activity feed entry

---

## 5E: GitHub PULL from Website (MOST IMPORTANT)

### 5E.1 Manual Pull

**Prerequisites:**

- Document already synced to GitHub (pushed at least once)
- File exists in GitHub repository

**Complete Manual Test:**

**Step 1: Modify File in GitHub**

1. Navigate to GitHub repository: `https://github.com/yourusername/test-repo`
2. Navigate to file: `docs/api-spec.md`
3. Click **"Edit"** button (pencil icon)
4. Add new content at end:

```markdown
## Rate Limiting

API requests are limited to 100 requests per minute.
```

5. Scroll down to commit section
6. Commit message: "Add rate limiting section"
7. Click **"Commit changes"**

**Expected in GitHub:**

- File updated with new content
- New commit created
- Commit SHA generated (e.g., `def456abc789...`)

**Step 2: Pull Changes to Platform**

1. Return to application
2. Open same document in editor
3. **Expected:** Document still shows old content (no auto-update yet)
4. Click **"Pull from GitHub"** button OR click **"Sync"** → **"Pull from GitHub"**

**Expected UI Behavior:**

- Button changes to "Pulling..." with spinner
- Toast notification: "Pulling from GitHub..."
- After ~2-5 seconds: "Successfully pulled from GitHub!"
- **Editor content updates automatically**
- New section "## Rate Limiting" appears at end

**Step 3: Verify Worker Logs**

```
[Job Received] Processing GitHub sync job: {jobId}
[Job Data] { documentId: '{documentId}', action: 'pull', userId: '{userId}' }
[GitHub Pull] Starting pull for document: {documentId}
[GitHub API] Fetching file: docs/api-spec.md
[GitHub API] File found, SHA: def456abc789...
[GitHub API] Fetching file content
[Conflict Check] Local SHA: abc123..., Remote SHA: def456...
[Conflict Check] No conflict detected (remote is newer)
[Database Update] Updating document content
[Database Update] Updating DocSyncInfo: lastCommitSha=def456..., syncStatus=SYNCED
[Job Completed] Job {jobId} completed successfully
```

**Step 4: Verify Database Updates**

**Document Table:**

```
content = "# API Specification\n\n## Overview\n...\n\n## Rate Limiting\nAPI requests..."
githubSha = "def456abc789..." (updated to latest commit)
updatedAt = recent timestamp
```

**DocSyncInfo Table:**

```
syncStatus = "SYNCED"
lastSyncedAt = recent timestamp
lastCommitSha = "def456abc789..." (GitHub commit SHA)
needSyncFromGitHub = false
lastExternalHash = "md5-hash-of-github-content"
externalVersion = 1 (incremented)
```

**SyncEvent Table:**

```
action = "PULL"
status = "SUCCESS"
direction = "FROM_GITHUB"
commitSha = "def456abc789..."
triggeredBy = "{userId}"
triggeredAt = recent timestamp
completedAt = recent timestamp
```

**Activity Table:**

```
action = "GITHUB_PULL"
targetType = "DOCUMENT"
targetId = "{documentId}"
metadata = { "githubPath": "docs/api-spec.md", "commitSha": "def456..." }
```

---

### 5E.2 Webhook-Triggered Pull (Automatic)

**This is the most important sync mechanism in production.**

**Prerequisites:**

- Webhook configured in GitHub (see section 5B)
- Webhook secret configured correctly
- Worker running

**Complete Manual Test:**

**Step 1: Verify Webhook Configured**

1. Navigate to: `https://github.com/yourusername/test-repo/settings/hooks`
2. Click on webhook
3. Verify:
   - Payload URL: `https://yourdomain.com/api/github/webhook`
   - Content type: `application/json`
   - Secret: Configured (hidden)
   - SSL verification: Enabled (if using HTTPS)
   - Events: Just the `push` event
   - Active: ✓

**Step 2: Edit File in GitHub**

1. Navigate to file: `docs/api-spec.md`
2. Click "Edit"
3. Add new content:

```markdown
## Error Handling

API returns standard HTTP status codes.
```

4. Commit message: "Add error handling section"
5. Click "Commit changes"

**Step 3: Webhook Delivery**

**What Happens Automatically:**

1. GitHub commit saved
2. GitHub sends POST request to: `https://yourdomain.com/api/github/webhook`
3. Webhook endpoint receives request
4. Verifies signature using `X-Hub-Signature-256` header
5. Parses webhook payload
6. Identifies changed files
7. Queues pull jobs for affected documents

**Check Webhook Delivery in GitHub:**

1. Go to webhook settings
2. Click "Recent Deliveries" tab
3. Click on most recent delivery
4. **Expected Response:**
   - Status: 200 OK
   - Response body: `{ "received": true }`
5. Click "Request" tab to see payload sent

**Step 4: Verify Worker Processes Webhook**

**Worker Logs:**

```
[Webhook] Received GitHub push webhook
[Webhook] Signature verified successfully
[Webhook] Parsing payload...
[Webhook] Changed files: docs/api-spec.md
[Webhook] Finding matching documents...
[Webhook] Found document: {documentId}
[Job Queued] Pull job queued for document: {documentId}
[Job Received] Processing pull job: {jobId}
[GitHub Pull] Fetching updated content from GitHub
[Database Update] Document content updated
[Job Completed] Pull completed successfully
```

**Step 5: Verify Content Updated in Platform**

1. Return to application
2. If document is open in editor: Content updates automatically (via real-time sync/polling)
3. If document is closed: Re-open document
4. **Expected:** New section "## Error Handling" visible

**Step 6: Verify Database**

**SyncEvent Table:**

```
action = "PULL"
status = "SUCCESS"
direction = "FROM_GITHUB"
triggeredBy = "WEBHOOK" (or webhook system user)
triggeredAt = recent timestamp (right after GitHub commit)
```

**Activity Table:**

```
action = "GITHUB_SYNC"
metadata = { "source": "webhook", "commitSha": "...", "author": "GitHub User" }
```

---

### 5E.3 Troubleshooting Webhook Failures

**Check Webhook Delivery Status:**

1. Go to GitHub webhook settings
2. Check "Recent Deliveries"
3. Look for failed deliveries (red X icon)

**Common Failure #1: 401 Unauthorized**

- **Cause:** Signature verification failed
- **Solution:**
  1. Verify webhook secret in database matches GitHub webhook secret
  2. Regenerate webhook secret if needed
  3. Update GitHub webhook with new secret

**Common Failure #2: 500 Internal Server Error**

- **Cause:** Worker error or database error
- **Solution:**
  1. Check worker logs for errors
  2. Check application logs: `npm run dev` output
  3. Verify Redis is running
  4. Verify database is accessible

**Common Failure #3: Timeout**

- **Cause:** Worker not processing jobs fast enough
- **Solution:**
  1. Check if worker is running: `npm run worker:github-sync`
  2. Check Redis queue status: `curl http://localhost:3000/api/health/redis`
  3. Clear failed jobs if queue is stuck

**Test Webhook Manually:**

```bash
curl -X POST http://localhost:3000/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=SIGNATURE_HERE" \
  -d '{ "ref": "refs/heads/main", "commits": [...] }'
```

---

## 5F: Conflict Testing (IMPORTANT)

### 5F.1 Force Conflict Scenario

**Purpose:** Test conflict detection and resolution when document is edited in both GitHub and platform without syncing.

**Complete Manual Test:**

**Step 1: Setup Document with Sync Enabled**

1. Create document: "Conflict Test Document"
2. Add content:

```markdown
# Conflict Test

## Section 1

Original content here.
```

3. Push to GitHub
4. Verify file in GitHub: `docs/conflict-test.md`

**Step 2: Edit Document in Platform (WITHOUT Pushing)**

1. Open document in platform editor
2. Edit content:

```markdown
# Conflict Test

## Section 1

Original content here.

## Section 2 (Added in Platform)

This section was added in the platform.
```

3. Save document
4. **Important:** Do NOT push to GitHub yet

**Step 3: Edit Same File in GitHub (Creating Divergence)**

1. Navigate to GitHub: `docs/conflict-test.md`
2. Click "Edit"
3. Edit content:

```markdown
# Conflict Test

## Section 1

Original content here.

## Section 2 (Added in GitHub)

This section was added in GitHub.
```

4. Commit changes: "Add section 2 in GitHub"

**Step 4: Trigger Pull (Conflict Detection)**

1. Return to platform
2. Click **"Pull from GitHub"** button in document editor

**Expected UI Behavior:**

- Pull attempt starts
- Conflict detected
- **UI shows CONFLICT badge/banner:**

  ```
  ⚠ Conflict Detected

  This document has been modified both locally and in GitHub.
  Please resolve the conflict before continuing.

  [Resolve Conflict]
  ```

**Step 5: Verify Conflict Record Created**

**ConflictResolution Table:**

```
id = "clx..."
documentId = "{documentId}"
syncInfoId = "{syncInfoId}"
localContent = "# Conflict Test\n\n## Section 1\n...\n## Section 2 (Added in Platform)..."
remoteContent = "# Conflict Test\n\n## Section 1\n...\n## Section 2 (Added in GitHub)..."
localSha = "sha-of-local-content"
remoteSha = "sha-of-github-content"
status = "pending"
resolution = NULL
resolvedBy = NULL
resolvedAt = NULL
createdAt = recent timestamp
```

**DocSyncInfo Table:**

```
syncStatus = "CONFLICT"
needSyncToGitHub = true
needSyncFromGitHub = true
```

**SyncEvent Table:**

```
action = "PULL"
status = "CONFLICT"
error = "Conflict detected: local and remote content diverged"
```

---

### 5F.2 Resolve Conflict - Keep Local Strategy

**Steps:**

1. Click **"Resolve Conflict"** button
2. Conflict resolution UI opens
3. Shows three columns:
   - **Local Version** (Platform content)
   - **Remote Version** (GitHub content)
   - **Resolved Version** (editable)
4. Click **"Keep Local"** button

**Expected Behavior:**

- Resolved version set to local content
- Document content unchanged in platform
- GitHub file updated with local content
- Conflict resolved

**Verify in Database:**

**ConflictResolution Table:**

```
status = "resolved"
resolution = local content
resolvedBy = "{userId}"
resolvedAt = recent timestamp
```

**DocSyncInfo Table:**

```
syncStatus = "SYNCED"
needSyncToGitHub = false
needSyncFromGitHub = false
```

**GitHub File:**
Content matches local version (platform wins).

---

### 5F.3 Resolve Conflict - Keep Remote (GitHub) Strategy

**Steps:**

1. In conflict resolution UI
2. Click **"Keep Remote"** button

**Expected Behavior:**

- Resolved version set to GitHub content
- Document content in platform updated to match GitHub
- No push needed (already in sync with GitHub)
- Conflict resolved

**Verify in Database:**

**Document Table:**

```
content = remote content (GitHub version)
```

**DocSyncInfo Table:**

```
syncStatus = "SYNCED"
lastCommitSha = latest GitHub commit SHA
```

---

### 5F.4 Resolve Conflict - Manual Merge Strategy

**Steps:**

1. In conflict resolution UI
2. Review **Local Version** and **Remote Version** side-by-side
3. Edit **Resolved Version** manually to merge both:

```markdown
# Conflict Test

## Section 1

Original content here.

## Section 2 (Merged)

This section combines changes from both platform and GitHub.

Platform addition: This section was added in the platform.
GitHub addition: This section was added in GitHub.
```

4. Click **"Save Resolution"** button

**Expected Behavior:**

- Resolved version saved as merged content
- Document content in platform updated to merged version
- GitHub file updated with merged content
- Conflict resolved

**Verify in Database:**

**ConflictResolution Table:**

```
status = "resolved"
resolution = merged content (custom)
resolvedBy = "{userId}"
resolvedAt = recent timestamp
```

**Document Table:**

```
content = merged content
```

**GitHub File:**
Content is merged version.

---

### 5F.5 Verify Conflict Resolved

**After any resolution strategy:**

**DocSyncInfo Table:**

```
syncStatus = "SYNCED"
conflictResolution = "MANUAL" (or "PLATFORM_WINS" or "GITHUB_WINS")
```

**SyncEvent Table:**

```
action = "CONFLICT_RESOLVED"
status = "SUCCESS"
metadata = { "strategy": "manual_merge" / "keep_local" / "keep_remote" }
```

**UI:**

- Conflict badge removed
- Document editor enabled for editing
- Sync buttons enabled

---

## 5G: AutoSync Testing

### 5G.1 Enable AutoSync for Document

**Steps:**

1. Open document in editor
2. Look for **"Sync Settings"** or **"AutoSync"** toggle
3. Click toggle to enable
4. **Expected:** "AutoSync enabled" confirmation

**Verify in Database:**

**DocSyncInfo Table:**

```
autoSync = true
```

---

### 5G.2 Test AutoSync Triggers Automatically

**Steps:**

1. With AutoSync enabled, edit document content
2. Type: "This change should auto-sync"
3. Save document (or wait for autosave)
4. Wait 5 seconds

**Expected Behavior:**

- Auto-save triggers
- 5 seconds after save, autoSync triggers
- Push job automatically queued
- No manual "Push to GitHub" click needed
- Toast notification: "Auto-syncing to GitHub..."
- After ~5 seconds: "Auto-synced successfully!"

**Verify Worker Logs:**

```
[AutoSync] Detected change in document: {documentId}
[AutoSync] AutoSync enabled, queuing push job
[Job Queued] AutoSync push job: {jobId}
[Job Received] Processing push job: {jobId}
[GitHub Push] Pushing content to GitHub
[Job Completed] AutoSync completed successfully
```

**Verify GitHub:**

- File updated in GitHub automatically
- Commit message includes "Auto-synced" or similar indicator

---

### 5G.3 Disable AutoSync

**Steps:**

1. Click AutoSync toggle to disable
2. Edit document
3. Save document
4. Wait 5+ seconds

**Expected Behavior:**

- No automatic push triggered
- Changes remain local only
- Must manually click "Push to GitHub" to sync

---

## 5H: Webhook Testing

### 5H.1 Configure Webhook in GitHub

**Prerequisites:**

- Workspace integration configured
- Webhook secret generated

**Steps:**

1. Navigate to: `https://github.com/yourusername/test-repo/settings/hooks`
2. Click **"Add webhook"** button (if not auto-created)
3. Fill webhook form:

**Payload URL:**

```
https://yourdomain.com/api/github/webhook
```

For local testing with ngrok:

```
https://abc123.ngrok.io/api/github/webhook
```

**Content type:**

```
application/json
```

**Secret:**

```
{paste webhook secret from platform}
```

**Which events would you like to trigger this webhook?**

- Select: **"Just the `push` event"**

**Active:**

- ✓ Checked

4. Click **"Add webhook"** button

**Expected Behavior:**

- Webhook created successfully
- GitHub sends test ping request
- Webhook listed in webhooks page

---

### 5H.2 Test Webhook Delivery

**Steps:**

1. Edit any file in repository
2. Commit changes
3. GitHub automatically sends webhook request

**Check Delivery Status:**

1. Go to: `https://github.com/yourusername/test-repo/settings/hooks`
2. Click on webhook
3. Click **"Recent Deliveries"** tab
4. Click on most recent delivery

**Expected Response (Success):**

```
Status: 200 OK

Response Body:
{
  "received": true
}

Headers:
X-GitHub-Delivery: abc123-def456-...
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...
```

**Expected Timing:**

- Delivery timestamp within seconds of commit time

---

### 5H.3 Webhook Signature Verification

**What Happens:**

1. GitHub sends webhook request with header:

```
X-Hub-Signature-256: sha256=abc123def456...
```

2. Platform webhook endpoint (`/api/github/webhook`) receives request

3. Platform retrieves webhook secret from database

4. Platform computes HMAC-SHA256 signature:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(requestBody))
  .digest('hex');
```

5. Platform compares signatures:

```typescript
if (receivedSignature !== expectedSignature) {
  return Response 401 Unauthorized
}
```

**Test Invalid Signature:**

1. Manually send webhook request with wrong signature:

```bash
curl -X POST http://localhost:3000/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=INVALID_SIGNATURE" \
  -d '{"ref":"refs/heads/main","commits":[]}'
```

**Expected Response:**

```
Status: 401 Unauthorized
Body: { "error": "Invalid signature" }
```

---

### 5H.4 Debug Failed Webhooks

**Scenario:** Webhook delivery shows error in GitHub.

**Step 1: Check Webhook Delivery Details**

1. Navigate to webhook settings
2. Click "Recent Deliveries"
3. Click failed delivery (red X icon)
4. Review:
   - **Response Status:** e.g., 500 Internal Server Error
   - **Response Body:** Error message
   - **Request:** Full webhook payload sent

**Step 2: Check Application Logs**

1. Check `npm run dev` terminal output
2. Look for errors around webhook receipt time
3. Common errors:
   - "Webhook secret not found"
   - "Database connection failed"
   - "Worker not responding"

**Step 3: Check Worker Logs**

1. Check `npm run worker:github-sync` terminal output
2. Verify worker is running and processing jobs

**Step 4: Test Webhook Endpoint Manually**

**Health Check:**

```bash
curl http://localhost:3000/api/health/github-sync
```

Expected: `{ "status": "healthy" }`

**Send Test Webhook:**

```bash
curl -X POST http://localhost:3000/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"ref":"refs/heads/main"}' | openssl dgst -sha256 -hmac 'YOUR_WEBHOOK_SECRET' | cut -d' ' -f2)" \
  -d '{"ref":"refs/heads/main","commits":[]}'
```

Expected: `{ "received": true }`

---

### 5H.5 Redeliver Failed Webhook

**Steps:**

1. In GitHub webhook settings, click failed delivery
2. Click **"Redeliver"** button
3. Confirm redelivery

**Expected:**

- GitHub resends same webhook payload
- Platform processes webhook again
- If issue fixed, delivery succeeds

---

## Section 6: Security Testing Checklist

### Overview

Verify security measures are correctly implemented and cannot be bypassed.

---

### 6.1 Test API Routes Without Session

**Purpose:** Verify all protected API routes require authentication.

**Test Cases:**

**Test 1: Access Workspace API Without Login**

```bash
curl -X GET http://localhost:3000/api/workspaces/{workspaceId}
```

**Expected Response:**

```
Status: 401 Unauthorized
Body: { "error": "Unauthorized" }
```

**Test 2: Create Document Without Login**

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","workspaceId":"workspace123"}'
```

**Expected Response:**

```
Status: 401 Unauthorized
Body: { "error": "Unauthorized" }
```

**Test 3: Access GitHub Integration Without Login**

```bash
curl -X GET http://localhost:3000/api/github/workspace-integration?workspaceId={workspaceId}
```

**Expected Response:**

```
Status: 401 Unauthorized
Body: { "error": "Unauthorized" }
```

**Verification:**

- ALL API routes return 401 without valid session
- No sensitive data exposed in error messages

---

### 6.2 Test Webhook Without Signature

**Purpose:** Verify webhook requests without valid signature are rejected.

**Test:**

```bash
curl -X POST http://localhost:3000/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","commits":[{"id":"abc123"}]}'
```

**Note:** No `X-Hub-Signature-256` header included.

**Expected Response:**

```
Status: 401 Unauthorized
Body: { "error": "Invalid signature" }
```

**Test Invalid Signature:**

```bash
curl -X POST http://localhost:3000/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=FAKE_SIGNATURE_12345" \
  -d '{"ref":"refs/heads/main"}'
```

**Expected Response:**

```
Status: 401 Unauthorized
Body: { "error": "Invalid signature" }
```

**Verification:**

- Webhook endpoint ALWAYS verifies signature
- No webhook processing occurs without valid signature

---

### 6.3 Test Image Delete Without Permission

**Purpose:** Verify only authorized users can delete images.

**Setup:**

1. User A uploads image in Workspace A
2. Note image ID

**Test 1: Delete as Uploader (Should Succeed)**

```bash
curl -X DELETE http://localhost:3000/api/upload/image \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_A_SESSION" \
  -d '{"imageId":"{imageId}"}'
```

**Expected Response:**

```
Status: 200 OK
Body: { "success": true }
```

**Test 2: Delete as Non-Member (Should Fail)**

1. Login as User B (not in Workspace A)
2. Try to delete User A's image:

```bash
curl -X DELETE http://localhost:3000/api/upload/image \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_B_SESSION" \
  -d '{"imageId":"{imageId}"}'
```

**Expected Response:**

```
Status: 403 Forbidden
Body: { "error": "Not authorized" }
```

**Verification:**

- Only uploader, workspace member, or owner can delete
- Non-members cannot delete images

---

### 6.4 Test GitHub Integration Update as Non-Owner

**Purpose:** Verify only workspace owner can configure GitHub integration.

**Setup:**

1. User A creates workspace (becomes owner)
2. User A adds User B as member

**Test:**

1. Login as User B
2. Try to configure GitHub integration:

```bash
curl -X POST http://localhost:3000/api/github/workspace-integration \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_B_SESSION" \
  -d '{"workspaceId":"{workspaceId}","repository":"test/repo",...}'
```

**Expected Response:**

```
Status: 403 Forbidden
Body: { "error": "Only workspace owner can configure GitHub integration" }
```

**Verification:**

- Only workspace owner can configure integration
- Members cannot modify GitHub settings

---

### 6.5 Test Document Access Across Workspaces

**Purpose:** Verify documents cannot be accessed across workspaces without permission.

**Setup:**

1. User A creates Workspace A with Document A
2. User B creates Workspace B
3. User B is NOT a member of Workspace A

**Test:**

1. Login as User B
2. Try to access Document A directly:

```
http://localhost:3000/dashboard/{workspaceA-Id}/docs/{documentA-Id}
```

**Expected Behavior:**

- Access denied
- Redirected to dashboard
- Error: "You don't have access to this workspace"

**API Test:**

```bash
curl -X GET http://localhost:3000/api/documents/{documentA-Id} \
  -H "Cookie: next-auth.session-token=USER_B_SESSION"
```

**Expected Response:**

```
Status: 403 Forbidden
Body: { "error": "Not authorized" }
```

---

### 6.6 Test CSRF Protection

**Purpose:** Verify Cross-Site Request Forgery protection.

**Test:**
Create malicious HTML page:

```html
<form action="http://localhost:3000/api/documents" method="POST">
  <input name="title" value="Malicious Document" />
  <input name="workspaceId" value="{workspaceId}" />
</form>
<script>
  document.forms[0].submit();
</script>
```

**Expected Behavior:**

- Request rejected due to missing CSRF token
- OR request rejected due to same-origin policy

---

### 6.7 Security Checklist Summary

✅ **Authentication:**

- [ ] All API routes require valid session
- [ ] Unauthorized requests return 401
- [ ] Session tokens properly validated

✅ **Authorization:**

- [ ] Workspace owner permissions enforced
- [ ] Member permissions enforced
- [ ] Cross-workspace access denied

✅ **GitHub Integration Security:**

- [ ] Webhook signature verification works
- [ ] Invalid signatures rejected (401)
- [ ] GitHub tokens encrypted in database
- [ ] Webhook secrets generated securely

✅ **Data Isolation:**

- [ ] Users cannot access other workspaces
- [ ] Documents isolated per workspace
- [ ] Images scoped to workspace

✅ **Input Validation:**

- [ ] File upload size limits enforced
- [ ] File type restrictions enforced
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React)

---

## Section 7: Database Table Reference

### Overview

Complete reference of key database tables and their fields.

---

### 7.1 Workspace Table

**Purpose:** Stores workspace (team/project) information.

| Field         | Type          | Description           | Example                        |
| ------------- | ------------- | --------------------- | ------------------------------ |
| `id`          | String (CUID) | Unique workspace ID   | `clx123abc`                    |
| `name`        | String        | Workspace name        | `Engineering Team`             |
| `description` | String?       | Optional description  | `Main documentation workspace` |
| `ownerId`     | String        | User ID of owner      | `cluser123`                    |
| `createdAt`   | DateTime      | Creation timestamp    | `2026-02-14T10:00:00Z`         |
| `updatedAt`   | DateTime      | Last update timestamp | `2026-02-14T15:30:00Z`         |

**What Updates During Push/Pull:** `updatedAt` when workspace activity occurs

**Relationships:**

- `owner` → User (workspace owner)
- `members` → WorkspaceMember[] (team members)
- `documents` → Document[] (all documents)
- `githubIntegration` → WorkspaceGitHubIntegration (GitHub config)

---

### 7.2 WorkspaceMember Table

**Purpose:** Stores workspace membership with permissions.

| Field         | Type          | Description                  | Example                                |
| ------------- | ------------- | ---------------------------- | -------------------------------------- |
| `id`          | String (CUID) | Unique membership ID         | `clxmem123`                            |
| `workspaceId` | String        | Workspace ID                 | `clx123abc`                            |
| `userId`      | String        | User ID                      | `cluser456`                            |
| `permissions` | String[]      | Capability-based permissions | `["document:create", "document:edit"]` |
| `createdAt`   | DateTime      | When user joined             | `2026-02-14T10:00:00Z`                 |

**Permission Values:**

- `document:create` - Can create documents
- `document:edit` - Can edit documents
- `document:delete` - Can delete documents
- `workspace:settings` - Can modify workspace settings
- `members:manage` - Can add/remove members

**What Updates During Push/Pull:** Nothing directly

---

### 7.3 Document Table

**Purpose:** Stores document content and metadata.

| Field                 | Type          | Description                      | Updated During Push/Pull      |
| --------------------- | ------------- | -------------------------------- | ----------------------------- |
| `id`                  | String (CUID) | Unique document ID               | No                            |
| `title`               | String        | Document title                   | No (unless renamed)           |
| `content`             | Text          | Document content (HTML/Markdown) | **✅ Yes (during pull)**      |
| `path`                | String        | Virtual file path                | No                            |
| `phase`               | Enum          | Document phase                   | No                            |
| `type`                | Enum          | Document type                    | No                            |
| `workspaceId`         | String        | Workspace ID                     | No                            |
| `authorId`            | String        | Creator user ID                  | No                            |
| `status`              | Enum          | Draft/Review/Approved            | No                            |
| `githubPath`          | String?       | GitHub file path                 | **✅ Yes (on first push)**    |
| `githubSha`           | String?       | Last synced commit SHA           | **✅ Yes (during push/pull)** |
| `githubAutoGenerated` | Boolean       | Path auto-generated?             | **✅ Yes (on first push)**    |
| `createdAt`           | DateTime      | Creation timestamp               | No                            |
| `updatedAt`           | DateTime      | Last update timestamp            | **✅ Yes (during push/pull)** |

**What Updates During:**

- **Push:** `githubPath`, `githubSha`, `updatedAt`
- **Pull:** `content`, `githubSha`, `updatedAt`

---

### 7.4 DocSyncInfo Table

**Purpose:** Stores GitHub sync configuration and status per document.

| Field                | Type          | Description                         | Updated During Push/Pull     |
| -------------------- | ------------- | ----------------------------------- | ---------------------------- |
| `id`                 | String (CUID) | Unique sync info ID                 | No                           |
| `documentId`         | String        | Document ID (one-to-one)            | No                           |
| `workspaceId`        | String        | Workspace ID                        | No                           |
| `githubRepository`   | String        | Repository (`owner/repo`)           | No                           |
| `githubBranch`       | String        | Target branch                       | No                           |
| `githubPath`         | String        | GitHub file path                    | No                           |
| `lastSyncedAt`       | DateTime?     | Last successful sync                | **✅ Yes (both)**            |
| `externalVersion`    | Int           | GitHub version counter              | **✅ Yes (during pull)**     |
| `derivedVersion`     | Int           | Platform version counter            | **✅ Yes (during push)**     |
| `lastExternalHash`   | String?       | SHA of GitHub content               | **✅ Yes (during pull)**     |
| `lastDerivedHash`    | String?       | SHA of platform content             | **✅ Yes (during push)**     |
| `lastCommitSha`      | String?       | GitHub commit SHA                   | **✅ Yes (both)**            |
| `lastCommitUrl`      | String?       | GitHub commit URL                   | **✅ Yes (during push)**     |
| `autoSync`           | Boolean       | Auto-sync enabled?                  | No                           |
| `syncDirection`      | Enum          | TO_GITHUB/FROM_GITHUB/BIDIRECTIONAL | No                           |
| `conflictResolution` | Enum          | Conflict strategy                   | No                           |
| `syncStatus`         | Enum          | Current sync status                 | **✅ Yes (both)**            |
| `lastError`          | Text?         | Last sync error                     | **✅ Yes (on error)**        |
| `errorCount`         | Int           | Consecutive errors                  | **✅ Yes (on error)**        |
| `needSyncToGitHub`   | Boolean       | Platform has newer changes          | **✅ Yes (push sets false)** |
| `needSyncFromGitHub` | Boolean       | GitHub has newer changes            | **✅ Yes (pull sets false)** |
| `createdAt`          | DateTime      | Creation timestamp                  | No                           |
| `updatedAt`          | DateTime      | Last update timestamp               | **✅ Yes (both)**            |

**SyncStatus Enum Values:**

- `SYNCED` - In sync
- `PENDING` - Sync queued
- `SYNCING` - Currently syncing
- `CONFLICT` - Conflict detected
- `ERROR` - Sync failed
- `PAUSED` - Sync disabled

**What Updates During:**

- **Push:** `lastSyncedAt`, `lastCommitSha`, `lastCommitUrl`, `lastDerivedHash`, `derivedVersion`, `syncStatus`, `needSyncToGitHub`, `updatedAt`
- **Pull:** `lastSyncedAt`, `lastCommitSha`, `lastExternalHash`, `externalVersion`, `syncStatus`, `needSyncFromGitHub`, `updatedAt`

---

### 7.5 WorkspaceGitHubIntegration Table

**Purpose:** Stores workspace-level GitHub integration configuration.

| Field              | Type          | Description               | Example                              |
| ------------------ | ------------- | ------------------------- | ------------------------------------ |
| `id`               | String (CUID) | Unique integration ID     | `clxint123`                          |
| `workspaceId`      | String        | Workspace ID (unique)     | `clx123abc`                          |
| `repository`       | String        | Repository (`owner/repo`) | `myuser/docs-repo`                   |
| `branch`           | String        | Target branch             | `main`                               |
| `basePath`         | String        | Base directory in repo    | `docs`                               |
| `webhookSecret`    | String?       | Auto-generated secret     | `a1b2c3d4e5f6...`                    |
| `webhookId`        | String?       | GitHub webhook ID         | `12345678`                           |
| `webhookUrl`       | String?       | Webhook URL               | `https://app.com/api/github/webhook` |
| `webhookActive`    | Boolean       | Webhook active?           | `true`                               |
| `webhookCreatedAt` | DateTime?     | Webhook creation time     | `2026-02-14T10:00:00Z`               |
| `webhookUpdatedAt` | DateTime?     | Webhook updated time      | `2026-02-14T15:30:00Z`               |
| `connectedAt`      | DateTime      | When connected            | `2026-02-14T10:00:00Z`               |
| `updatedAt`        | DateTime      | Last update               | `2026-02-14T15:30:00Z`               |

**What Updates During Push/Pull:** Nothing directly (config table)

---

### 7.6 GitHubAuth Table

**Purpose:** Stores encrypted GitHub access tokens per user/workspace.

| Field         | Type          | Description                        | Example                     |
| ------------- | ------------- | ---------------------------------- | --------------------------- |
| `id`          | String (CUID) | Unique auth ID                     | `clxauth123`                |
| `userId`      | String        | User ID                            | `cluser123`                 |
| `workspaceId` | String?       | Workspace ID (NULL for user-level) | `clx123abc`                 |
| `accessToken` | String        | Encrypted GitHub token             | `encrypted:abc123...`       |
| `tokenType`   | String        | Token type                         | `Bearer`                    |
| `scope`       | String        | OAuth scopes                       | `repo,user,admin:repo_hook` |
| `expiresAt`   | DateTime?     | Token expiration                   | `2027-02-14T10:00:00Z`      |
| `createdAt`   | DateTime      | Creation timestamp                 | `2026-02-14T10:00:00Z`      |
| `updatedAt`   | DateTime      | Last update timestamp              | `2026-02-14T15:30:00Z`      |

**Security:** `accessToken` is encrypted using `ENCRYPTION_KEY` before storage.

**What Updates During Push/Pull:** Nothing (unless token refresh occurs)

---

### 7.7 UploadedImage Table

**Purpose:** Stores uploaded image metadata with workspace association.

| Field         | Type          | Description          | Example                      |
| ------------- | ------------- | -------------------- | ---------------------------- |
| `id`          | String (CUID) | Unique image ID      | `clximg123`                  |
| `filename`    | String        | Original filename    | `diagram.png`                |
| `url`         | String        | Image URL path       | `/uploads/images/abc123.png` |
| `size`        | Int           | File size (bytes)    | `245678`                     |
| `contentType` | String        | MIME type            | `image/png`                  |
| `hash`        | String        | MD5 hash (for dedup) | `abc123def456...`            |
| `uploadedBy`  | String        | Uploader user ID     | `cluser123`                  |
| `workspaceId` | String        | Workspace ID         | `clx123abc`                  |
| `createdAt`   | DateTime      | Upload timestamp     | `2026-02-14T10:00:00Z`       |

**Unique Constraint:** `@@unique([workspaceId, hash])` - Hash unique per workspace (multi-tenancy)

**What Updates During Push/Pull:** Nothing (images uploaded separately)

---

### 7.8 ConflictResolution Table

**Purpose:** Tracks merge conflicts between platform and GitHub.

| Field           | Type          | Description                      | Updated During Conflict    |
| --------------- | ------------- | -------------------------------- | -------------------------- |
| `id`            | String (CUID) | Unique conflict ID               | No                         |
| `documentId`    | String        | Document ID                      | No                         |
| `syncInfoId`    | String        | DocSyncInfo ID                   | No                         |
| `localContent`  | Text          | Platform version content         | No                         |
| `remoteContent` | Text          | GitHub version content           | No                         |
| `localSha`      | String        | SHA of local content             | No                         |
| `remoteSha`     | String        | SHA of GitHub content            | No                         |
| `status`        | String        | `pending`/`resolved`/`cancelled` | **✅ Yes (when resolved)** |
| `resolution`    | Text?         | Merged/chosen content            | **✅ Yes (when resolved)** |
| `resolvedBy`    | String?       | User who resolved                | **✅ Yes (when resolved)** |
| `resolvedAt`    | DateTime?     | Resolution timestamp             | **✅ Yes (when resolved)** |
| `createdAt`     | DateTime      | Conflict detection time          | No                         |
| `updatedAt`     | DateTime      | Last update                      | **✅ Yes (when resolved)** |

**What Updates During:**

- **Conflict Detection:** New record created with `status = "pending"`
- **Conflict Resolution:** `status`, `resolution`, `resolvedBy`, `resolvedAt`, `updatedAt`

---

### 7.9 SyncEvent Table

**Purpose:** Records sync operation history (audit trail).

| Field         | Type          | Description                       | Created During |
| ------------- | ------------- | --------------------------------- | -------------- |
| `id`          | String (CUID) | Unique event ID                   | All syncs      |
| `documentId`  | String        | Document ID                       | All syncs      |
| `syncInfoId`  | String        | DocSyncInfo ID                    | All syncs      |
| `action`      | String        | `PUSH`/`PULL`/`CONFLICT_RESOLVED` | All syncs      |
| `status`      | String        | `SUCCESS`/`ERROR`/`CONFLICT`      | All syncs      |
| `direction`   | String        | `TO_GITHUB`/`FROM_GITHUB`         | Push/Pull      |
| `commitSha`   | String?       | GitHub commit SHA                 | Push/Pull      |
| `commitUrl`   | String?       | GitHub commit URL                 | Push           |
| `error`       | Text?         | Error message                     | On error       |
| `triggeredBy` | String?       | User or system                    | All syncs      |
| `triggeredAt` | DateTime      | When triggered                    | All syncs      |
| `completedAt` | DateTime?     | When completed                    | On completion  |
| `createdAt`   | DateTime      | Event timestamp                   | All syncs      |

**What Updates During:**

- **Push:** New record with `action = "PUSH"`, `direction = "TO_GITHUB"`
- **Pull:** New record with `action = "PULL"`, `direction = "FROM_GITHUB"`
- **Conflict:** New record with `status = "CONFLICT"`

**Example Query - Recent Syncs:**

```sql
SELECT * FROM SyncEvent
WHERE documentId = '{documentId}'
ORDER BY createdAt DESC
LIMIT 10;
```

---

### 7.10 Activity Table

**Purpose:** Stores activity feed entries for workspace.

| Field         | Type          | Description                     | Created During |
| ------------- | ------------- | ------------------------------- | -------------- |
| `id`          | String (CUID) | Unique activity ID              | All actions    |
| `workspaceId` | String        | Workspace ID                    | All actions    |
| `userId`      | String        | User who performed action       | All actions    |
| `action`      | String        | Action type                     | All actions    |
| `targetType`  | String        | `DOCUMENT`/`WORKSPACE`/`MEMBER` | All actions    |
| `targetId`    | String        | Target entity ID                | All actions    |
| `metadata`    | JSON?         | Additional data                 | All actions    |
| `createdAt`   | DateTime      | Activity timestamp              | All actions    |

**Action Values:**

- `GITHUB_PUSH` - Document pushed to GitHub
- `GITHUB_PULL` - Document pulled from GitHub
- `GITHUB_SYNC` - Bidirectional sync
- `CONFLICT_RESOLVED` - Conflict resolved
- `DOCUMENT_CREATED` - New document
- `DOCUMENT_UPDATED` - Document edited
- `MEMBER_ADDED` - Member invited

**Example Metadata (GitHub Push):**

```json
{
  "githubPath": "docs/api-spec.md",
  "commitSha": "abc123def456...",
  "commitUrl": "https://github.com/user/repo/commit/abc123..."
}
```

**What Updates During:**

- **Push:** New activity with `action = "GITHUB_PUSH"`
- **Pull:** New activity with `action = "GITHUB_PULL"`
- **Webhook:** New activity with `action = "GITHUB_SYNC"`

---

## Section 8: Final Production Checklist

### Prerequisites Checklist

Before deploying to production, verify all items:

#### 8.1 Build & Validation

- [ ] **Build passes:** `npm run build` completes with 0 errors
- [ ] **Prisma schema valid:** `npx prisma validate` passes
- [ ] **Lint check:** `npm run lint` has no critical errors (warnings acceptable)
- [ ] **Type check:** `npm run type-check` passes (no TypeScript errors)
- [ ] **Database migration:** `npx prisma migrate deploy` succeeds

#### 8.2 Infrastructure

- [ ] **PostgreSQL running:** Database accessible
- [ ] **Redis running:** `docker ps` shows Redis container OR `redis-cli ping` returns PONG
- [ ] **Worker running:** `npm run worker:github-sync` running in separate process/container
- [ ] **Application running:** `npm start` starts successfully

#### 8.3 Environment Variables

- [ ] `DATABASE_URL` configured correctly
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `NEXTAUTH_SECRET` generated (32-character random string)
- [ ] `GITHUB_CLIENT_ID` configured (GitHub OAuth app)
- [ ] `GITHUB_CLIENT_SECRET` configured (GitHub OAuth app)
- [ ] `GITHUB_APP_ID` configured (GitHub App)
- [ ] `GITHUB_APP_PRIVATE_KEY` configured (GitHub App private key)
- [ ] `ENCRYPTION_KEY` generated (32-character random string)
- [ ] `REDIS_URL` configured correctly
- [ ] `GITHUB_WEBHOOK_SECRET` configured (optional global secret)

#### 8.4 GitHub Configuration

- [ ] **GitHub OAuth App created:** Callback URL matches `{NEXTAUTH_URL}/api/auth/callback/github`
- [ ] **GitHub App created:** Permissions configured (repo, webhooks)
- [ ] **GitHub App installed:** Installed on test organization/repository
- [ ] **Webhook endpoint accessible:** `https://yourdomain.com/api/github/webhook` is publicly accessible

#### 8.5 Health Checks

- [ ] **Redis health:** `curl https://yourdomain.com/api/health/redis` returns `{"redisConnected": true}`
- [ ] **GitHub sync health:** `curl https://yourdomain.com/api/health/github-sync` returns `{"status": "healthy"}`
- [ ] **Application health:** Homepage loads correctly
- [ ] **Worker health:** Recent jobs processed in last 5 minutes

#### 8.6 Functional Testing

- [ ] **User signup works:** Can create new account
- [ ] **User login works:** Can login with credentials
- [ ] **GitHub OAuth works:** Can login with GitHub
- [ ] **Workspace creation works:** Can create workspace
- [ ] **Document creation works:** Can create document
- [ ] **Image upload works:** Can upload images
- [ ] **GitHub account connection works:** Can connect GitHub account
- [ ] **GitHub integration works:** Can configure workspace integration
- [ ] **Push works:** Can push document to GitHub
- [ ] **Pull works:** Can pull changes from GitHub
- [ ] **Webhook works:** GitHub push triggers auto-pull
- [ ] **Conflict resolution works:** Can resolve merge conflicts
- [ ] **AutoSync works:** Auto-sync pushes after edit

#### 8.7 Security Verification

- [ ] **Authentication required:** API routes return 401 without session
- [ ] **Authorization enforced:** Non-owners cannot configure GitHub integration
- [ ] **Webhook signature verified:** Invalid signatures rejected
- [ ] **Tokens encrypted:** GitHub tokens encrypted in database
- [ ] **CSRF protection enabled:** NextAuth.js CSRF tokens working
- [ ] **HTTPS enabled:** Production uses HTTPS (for webhook security)
- [ ] **Secrets not exposed:** No secrets in client-side code or logs

#### 8.8 Performance

- [ ] **Page load time:** Homepage loads in <2 seconds
- [ ] **Document load time:** Document editor opens in <1 second
- [ ] **Push/Pull time:** Sync completes in <10 seconds for typical document
- [ ] **Webhook response time:** Webhook responds in <1 second
- [ ] **Worker throughput:** Worker can process 10+ jobs per minute

#### 8.9 Monitoring & Logging

- [ ] **Application logs:** Logging configured (Winston/Pino)
- [ ] **Error tracking:** Sentry or similar configured
- [ ] **Worker logs:** Worker logs accessible
- [ ] **Queue monitoring:** BullMQ dashboard accessible (optional)
- [ ] **Database monitoring:** PostgreSQL logs accessible
- [ ] **Webhook logs:** GitHub webhook delivery logs monitored

#### 8.10 Backup & Recovery

- [ ] **Database backups:** Automated daily backups configured
- [ ] **Environment variables backed up:** `.env` stored securely
- [ ] **Redis persistence:** Redis persistence enabled (AOF/RDB)
- [ ] **File uploads backed up:** Image uploads backed up

---

## Quick Test Script (Automated Checklist)

Save this as `scripts/production-readiness-check.sh`:

```bash
#!/bin/bash

echo "🚀 Production Readiness Check"
echo "=============================="

# Build check
echo "✓ Checking build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Build: PASS"
else
  echo "  ❌ Build: FAIL"
fi

# Prisma validate
echo "✓ Checking Prisma schema..."
npx prisma validate > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Prisma: PASS"
else
  echo "  ❌ Prisma: FAIL"
fi

# Redis health
echo "✓ Checking Redis..."
REDIS_STATUS=$(curl -s http://localhost:3000/api/health/redis | grep -o '"redisConnected":true')
if [ -n "$REDIS_STATUS" ]; then
  echo "  ✅ Redis: PASS"
else
  echo "  ❌ Redis: FAIL"
fi

# GitHub sync health
echo "✓ Checking GitHub Sync Worker..."
SYNC_STATUS=$(curl -s http://localhost:3000/api/health/github-sync | grep -o '"status":"healthy"')
if [ -n "$SYNC_STATUS" ]; then
  echo "  ✅ Worker: PASS"
else
  echo "  ⚠️  Worker: WARNING (check if worker is running)"
fi

echo ""
echo "Production Readiness: Review results above"
```

**Run:**

```bash
chmod +x scripts/production-readiness-check.sh
./scripts/production-readiness-check.sh
```

---

## Final Notes

### Common Issues & Solutions

**Issue:** Worker not processing jobs

- **Solution:** Ensure Redis is running, restart worker

**Issue:** Webhook deliveries failing

- **Solution:** Check webhook secret matches, verify endpoint is publicly accessible

**Issue:** Conflict on every pull

- **Solution:** Check if timestamps are causing issues, verify conflict detection logic

**Issue:** Images not uploading

- **Solution:** Check `workspaceId` is included in request, verify upload directory permissions

**Issue:** Slow sync operations

- **Solution:** Check GitHub API rate limits, optimize document size

---

## Support & Documentation

For more details, refer to:

- **Authentication:** `/AUTHENTICATION_SYSTEM.md`
- **GitHub Integration:** `/docs/GITHUB_INTEGRATION.md`
- **Webhook Setup:** `/docs/GITHUB_WEBHOOKS.md`
- **Background Sync:** `/docs/BACKGROUND_SYNC.md`
- **Security Audit:** `/docs/GITHUB_SECURITY_AUDITING.md`
- **Final Validation:** `/FINAL_VALIDATION_REPORT.md`

---

**End of Manual Testing Guide**

This guide covers comprehensive testing of the entire system. Follow each section systematically to ensure production readiness.
