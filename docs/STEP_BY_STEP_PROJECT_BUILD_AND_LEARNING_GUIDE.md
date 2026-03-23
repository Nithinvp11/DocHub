# DocHub: Step-by-Step Project Build and Learning Guide

## 1) What This Project Is

DocHub is a full-stack collaborative documentation platform where teams can:

- Create workspaces and invite members
- Write and organize documents
- Track document versions and restore old versions
- Collaborate through comments, mentions, and notifications
- Sync documentation with GitHub repositories

At a technical level, it is a Next.js monorepo-style application (single app with UI + API), backed by PostgreSQL through Prisma.

---

## 2) Technology Stack and Why It Is Used

## Frontend

- **Next.js 16 (App Router)**: Full-stack React framework. Used for pages, layouts, server/client components, and API routes.
- **React 19**: UI composition and interactive client components.
- **TypeScript**: Type safety and better maintainability in a large codebase.
- **Tailwind CSS 4**: Utility-first styling for fast, consistent UI development.
- **Radix UI + Shadcn-style components**: Accessible, composable UI primitives.
- **TipTap**: Rich text editor for document editing.

## Backend

- **Next.js API routes**: Backend endpoints live inside the same codebase under `src/app/api`.
- **Prisma ORM**: Type-safe database access and schema management.
- **PostgreSQL**: Relational database for users, workspaces, documents, versions, and integration metadata.
- **Zod**: Validation of input payloads.

## Authentication and Security

- **NextAuth.js**: Session-based authentication.
- **Credentials + GitHub OAuth**: Supports email/password and GitHub login/linking.
- **bcryptjs**: Password hashing.
- **Token encryption utilities**: Sensitive integration credentials are protected.

## Collaboration and Integration

- **Octokit / GitHub APIs**: GitHub repository, issue, PR, and content sync.
- **GitHub webhooks**: Near real-time updates from GitHub events.
- **BullMQ + ioredis**: Queue-based background sync jobs.
- **Socket.IO**: Real-time notification/collaboration events.

## Developer Tooling

- **ESLint + Prettier**: Code quality and consistency.
- **tsx**: TypeScript script execution (seed scripts, utilities).

---

## 3) High-Level Architecture (How the Pieces Fit)

1. Browser requests a page from Next.js.
2. UI components in `src/app` and `src/components` render the app.
3. User actions trigger API requests to endpoints in `src/app/api`.
4. API handlers call service/util modules in `src/lib`.
5. Prisma reads/writes PostgreSQL using models in `prisma/schema.prisma`.
6. Background workers/webhooks handle async GitHub synchronization.
7. Notifications/activity entries are stored and surfaced back in the UI.

---

## 4) Step-by-Step: How to Build This Project From Scratch

## Step 1: Initialize Base Application

1. Create a Next.js app with TypeScript and App Router.
2. Add Tailwind and base UI primitives.
3. Set strict TypeScript config.

## Step 2: Add Database Layer

1. Install Prisma and PostgreSQL driver.
2. Create `prisma/schema.prisma`.
3. Model core entities:
   - `User`, `Account`, `Session` (auth)
   - `Workspace`, `WorkspaceMember` (collaboration boundaries)
   - `Document`, `Version` (content and history)
   - Activity/notification/supporting entities
4. Run:
   - `npm run db:generate`
   - `npm run db:push`

## Step 3: Implement Authentication

1. Configure NextAuth with Prisma adapter.
2. Add credentials provider (email/password).
3. Add GitHub OAuth provider.
4. Create auth pages (sign up/sign in).
5. Add middleware/route protection and role checks.

## Step 4: Build Workspace and Member Management

1. Implement workspace CRUD.
2. Add member invitation/join flow.
3. Store explicit permissions in `WorkspaceMember.permissions`.
4. Enforce permissions at API boundary.

## Step 5: Build Document System

1. Create document CRUD and nested structure support (`parentId`).
2. Add metadata (status, type, phase, tags, custom properties).
3. Add rich-text editor with TipTap in frontend components.

## Step 6: Add Versioning

1. On document save, persist version snapshots in `Version` table.
2. Store `version` sequence, `message`, and optional `diff`/`sha`.
3. Implement restore endpoint to roll back content from any version.

## Step 7: Add Collaboration Features

1. Implement mentions, comments, inline comments, and replies.
2. Persist notifications and activity logs.
3. Wire Socket.IO for real-time update delivery.

## Step 8: Add GitHub Integration

1. Connect workspace to a repository (`WorkspaceGitHubIntegration`).
2. Store GitHub sync metadata on documents (path/SHA fields).
3. Use Octokit for push/pull sync operations.
4. Register webhook endpoint for push/PR/issue events.

## Step 9: Add Background Sync Infrastructure

1. Queue sync jobs (BullMQ + Redis).
2. Create cron/worker endpoint to process jobs safely.
3. Add conflict detection and resolution strategy.
4. Save sync events for observability.

## Step 10: Harden and Validate

1. Add input validation and error handling.
2. Add rate limiting, health checks, and structured logging.
3. Run quality checks:
   - `npm run type-check`
   - `npm run lint`
   - `npm run test`

---

## 5) Step-by-Step: How to Understand This Existing Project

Use this sequence if you are learning the current codebase.

## Step 1: Read Product-Level Docs First

1. `README.md`
2. `docs/PROJECT_OVERVIEW.md`
3. `docs/COMPLETE_FEATURE_SUMMARY.md`

Goal: Understand product scope before reading implementation details.

## Step 2: Read Dependency and Script Map

Open `package.json` and identify:

- Runtime dependencies (what powers app features)
- Dev dependencies (tooling)
- Scripts (`dev`, `build`, `db:*`, `test`, `validate`)

Goal: Know how the app is run and maintained.

## Step 3: Understand Database as the Source of Truth

Read `prisma/schema.prisma` in this order:

1. Auth models: `User`, `Account`, `Session`
2. Collaboration boundary: `Workspace`, `WorkspaceMember`
3. Core content: `Document`, `Version`
4. Integration/sync entities

Goal: Build a mental model of domain relationships.

## Step 4: Understand Routing and UI Entry Points

Explore `src/app`:

1. `layout.tsx` and `page.tsx` for global app shell
2. Route groups (`auth`, `dashboard`, `workspace`, `settings`, etc.)
3. API routes under `src/app/api`

Goal: Understand user navigation and endpoint structure.

## Step 5: Understand Shared Logic in Libraries

Explore `src/lib` and map:

- Auth helpers
- Permission checks
- API wrappers/middleware
- GitHub sync services
- Error handling utilities

Goal: Identify where business logic is centralized.

## Step 6: Trace One Full User Flow End-to-End

Example: "Create document"

1. Frontend page/component triggers action.
2. API route receives payload.
3. Validation + permission check runs.
4. Prisma transaction writes document + maybe version.
5. Response updates UI state.
6. Optional sync job enters queue.

Goal: Confirm request/response lifecycle.

## Step 7: Trace GitHub Sync Flow

1. Workspace linked to GitHub repo.
2. Save document in app.
3. Sync queue receives job.
4. Worker pushes content to GitHub.
5. GitHub webhook can trigger reverse sync updates.
6. Conflicts are tracked and resolved.

Goal: Understand asynchronous integration behavior.

## Step 8: Run Locally and Observe

1. Configure `.env.local`
2. Start database
3. Run `npm install`
4. Run `npm run db:generate`
5. Run `npm run db:push`
6. Run `npm run dev`

Then use the app while reading logs and database records.

Goal: Connect code structure with runtime behavior.

---

## 6) Feature-to-Folder Mapping (Quick Reference)

- UI pages and routes: `src/app/*`
- Shared components: `src/components/*`
- Hooks: `src/hooks/*`
- Server/client utilities and services: `src/lib/*`
- Types: `src/types/*`
- Database schema and migrations: `prisma/*`
- Product and workflow docs: `docs/*`

---

## 7) Important Environment Variables

Minimum for local development:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

For GitHub integration:

- `GITHUB_CLIENT_ID` (or project equivalent key)
- `GITHUB_CLIENT_SECRET` (or project equivalent key)
- `GITHUB_WEBHOOK_SECRET`
- `ENCRYPTION_KEY`
- `CRON_SECRET`
- `ENABLE_BACKGROUND_SYNC`

Always confirm exact variable names by checking current auth/integration config files in the codebase.

---

## 8) Recommended Learning Plan (Practical)

## Day 1: Foundation

1. Read README and project overview docs.
2. Install and run locally.
3. Inspect `package.json` scripts.

## Day 2: Data and Auth

1. Deep-read `prisma/schema.prisma`.
2. Follow sign-in/sign-up flow in UI and API.
3. Validate session/user records in database.

## Day 3: Workspaces and Documents

1. Create workspace/member scenarios.
2. Create/edit/delete documents.
3. Observe version history behavior.

## Day 4: Collaboration and Notifications

1. Test mentions/comments.
2. Track notification creation and delivery.
3. Map which tables and endpoints are involved.

## Day 5: GitHub Integration

1. Connect a test repository.
2. Run sync flow and inspect queue/webhook behavior.
3. Test conflict scenarios and resolution.

## Day 6: Quality and Deployment Readiness

1. Run `npm run validate`.
2. Run test suite.
3. Review production env requirements and health checks.

---

## 9) Operational Commands You Will Use Most

```bash
npm install
npm run dev
npm run build
npm run start
npm run type-check
npm run lint
npm run test
npm run db:generate
npm run db:push
npm run db:studio
npm run db:seed
```

---

## 10) Common Pitfalls and Tips

- Keep Prisma schema and generated client in sync after model changes.
- Validate permissions at API layer, not only in UI.
- Treat GitHub sync as eventually consistent (async), not immediate.
- Use activity/sync logs when debugging workflow issues.
- Start by understanding data models first; it speeds up all other learning.

---

## 11) Success Criteria: You Fully Understand the Project When

- You can explain how a request moves from UI to DB and back.
- You can add a new document field end-to-end (schema, API, UI).
- You can debug a failed sync by checking API, queue, and webhook layers.
- You can enforce a permission rule consistently across routes.

---

## 12) Next Expansion Ideas

- Add unit/integration tests around core services.
- Add architecture decision records (ADRs) for major design choices.
- Add sequence diagrams for auth, versioning, and GitHub sync flows.
- Add centralized observability dashboard for sync/queue metrics.
