# Project Overview

## Product Summary

DocHub is a collaborative documentation platform with workspace-based access, rich editing, version history, and GitHub synchronization.

## Goals

- Enable teams to co-author technical documentation.
- Preserve document history with version snapshots and restoration.
- Sync documentation with GitHub repositories.
- Provide secure collaboration through capability-based permissions.

## Tech Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Shadcn UI
- Backend: Next.js API routes, Prisma ORM
- Database: PostgreSQL
- Auth: NextAuth (credentials + GitHub OAuth)
- Integrations: GitHub API (Octokit), webhooks, background sync

## High-Level Architecture

1. Client UI in `src/app` and shared UI in `src/components`.
2. API and server-side logic in `src/app/api` and supporting libraries in `src/lib`.
3. Database schema and migrations in `prisma`.
4. Background/sync infrastructure via scheduled and webhook-driven flows.

## Core Domain Modules

- Authentication and account management
- Workspace/member/permission management
- Document editor and document lifecycle
- Versioning and restore workflows
- GitHub integration and sync orchestration
- Notifications and activity tracking

## Environment Requirements

- Node.js 20+
- PostgreSQL
- Required secrets for NextAuth and GitHub (if OAuth/sync is enabled)

## Local Development

1. Install dependencies: `npm install`
2. Configure environment variables (`.env.local`)
3. Generate Prisma client: `npm run db:generate`
4. Apply schema/migrations: `npm run db:push` or `npx prisma migrate deploy`
5. Start app: `npm run dev`

## Documentation Ownership

When implementing a feature, update at least one of:

- Feature documentation (new or changed behavior)
- API documentation (request/response changes)
- Runbook documentation (ops/deployment/support impact)

## Last Updated

- Date: 2026-02-23
- Update trigger: Initial documentation foundation setup
