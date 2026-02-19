# Manual Test Plan — Repo-Aware Knowledge Hub

**Author:** GitHub Copilot  
**Date:** 2026-02-18  
**Version:** 1.0

---

## Table of contents

- [Project overview](#project-overview)
- [Scope of testing](#scope-of-testing)
- [Testing approach](#testing-approach)
- [Test environment requirements](#test-environment-requirements)
- [Assumptions & dependencies](#assumptions--dependencies)
- [Entry / exit criteria](#entry--exit-criteria)
- [Full Manual Test Case Coverage](#full-manual-test-case-coverage)
  - [Authentication & Session](#authentication--session)
  - [Workspaces](#workspaces)
  - [Members & Invites](#members--invites)
  - [Documents & Versioning](#documents--versioning)
  - [Comments, Mentions & Inline Comments](#comments-mentions--inline-comments)
  - [Presence, Locks & Concurrency](#presence-locks--concurrency)
  - [GitHub Integration](#github-integration)
  - [Notifications & Activity](#notifications--activity)
  - [Admin & Settings](#admin--settings)
  - [Uploads / Search / Feedback / Favorites](#uploads--search--feedback--favorites)
  - [API Validation, Rate Limiting & Security](#api-validation-rate-limiting--security)
  - [UI/UX, Responsive & Cross-Browser](#uiux-responsive--cross-browser)
  - [Negative & Edge Case Testing](#negative--edge-case-testing)
- [Test Data & Seed Guidance](#test-data--seed-guidance)
- [Traceability & Coverage Summary](#traceability--coverage-summary)
- [Execution Checklist](#execution-checklist)
- [Appendix — Quick Reference (Important files & endpoints)](#appendix--quick-reference-important-files--endpoints)

---

## Project overview

- Repo-Aware Knowledge Hub is a collaborative documentation platform built with Next.js + TypeScript, Prisma (Postgres), NextAuth, Tailwind and ShadCN UI.
- Observed features (code-derived): workspaces (single owner), capability-based permissions, invite-first member flow, documents with versioning & locking, comments/mentions/inline-comments, presence/cursors, notifications & activity logs, GitHub import/export and workspace-level GitHub integration, admin console, uploads, search, favorites.
- Key security/behavior rules enforced in code: delegation ceiling & chain, centralized permission helpers, owner stored in `Workspace.ownerId` (owner not stored in member table), Zod validation across API routes.

---

## Scope of testing

In-scope (derived from codebase):

- Authentication (credentials + GitHub), session behavior
- Workspace lifecycle and settings
- Members / invite lifecycle (PENDING → ACCEPTED/REJECTED/CANCELLED/EXPIRED)
- Capability-based permission system and delegation enforcement
- Document CRUD, versioning, restore, locks, presence
- Comments / inline comments / mentions
- Notifications & Activity feed
- GitHub workspace integration (import/export, conflict handling)
- Admin endpoints and settings
- Uploads, Search, Feedback, Favorites, Rate-limits

Out-of-scope: any external email delivery systems (invites create DB notifications only) and automated load/performance testing (manual perception checks included).

---

## Testing approach (manual)

- Structured manual test cases mapped directly to code files / endpoints.
- Execute high-priority flows first (auth, permissions, member/invite, document edit/locks).
- Use Postman / curl for API verification and browser devtools for UI checks.
- Trace any defect to the specific source file(s) listed in each test case.

---

## Test environment requirements

- OS: Windows / macOS / Linux (modern)
- Browsers: Chrome, Firefox, Safari, Edge (latest)
- Resolutions: Desktop 1440×900, Tablet 768×1024, Mobile 375×812
- Backend: local dev server (npm run dev) with seeded DB (`prisma/seed.ts`)
- Required env vars: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET; GitHub OAuth tokens for integration tests
- Tools: Postman/curl, SQL client, browser devtools

---

## Assumptions & dependencies

- DB seeded using `prisma/seed.ts` or equivalent fixtures.
- GitHub tests require valid tokens or will be exercised with negative checks.
- Email delivery is out-of-scope; invites create DB notifications instead.

---

## Entry / Exit criteria

- Entry: Dev server running, DB seeded, test accounts available.
- Exit: All High priority tests pass; no unresolved Critical/High defects; main user flows verified.

---

# Full Manual Test Case Coverage

Each test case contains: Test Case ID, Module, Feature, Preconditions, Test Steps, Test Data, Expected Result, (Actual Result / Status left blank), Priority, and Related files/endpoints.

---

## Authentication & Session (AUTH)

### AUTH-001 — Sign in (valid credentials)

- Module: Authentication
- Feature: Credentials sign-in
- Preconditions: Seeded user (alice@example.com / password123)
- Steps: Open `/auth` → fill credentials → submit
- Test Data: alice@example.com / password123
- Expected: Redirect to `/dashboard`; session set; API returns success
- Priority: High
- Related: `src/components/auth/SignInForm.tsx`, `src/app/api/auth/[...nextauth]/route.ts`

### AUTH-002 — Sign in (invalid password)

- Preconditions: same as above
- Steps: Attempt sign in with wrong password
- Expected: UI shows "Invalid email or password"; API 401
- Priority: High
- Related: `SignInForm.tsx`

### AUTH-003 — GitHub OAuth sign-in

- Preconditions: GitHub provider configured (or check redirect behavior)
- Steps: Click GitHub sign-in
- Expected: Redirect to GitHub OAuth (or graceful error if not configured)
- Priority: Medium
- Related: `src/lib/auth.ts`, `/api/auth/[...nextauth]`

### AUTH-004 — Sign up (happy path)

- Preconditions: test email not taken
- Steps: Fill SignUp form → submit
- Expected: Registration 201; auto sign-in and redirect
- Priority: High
- Related: `src/components/auth/SignUpForm.tsx`, `src/app/api/auth/register/route.ts`

### AUTH-005 — Sign up validation (username/password rules)

- Preconditions: none
- Steps: Submit invalid inputs (bad username, weak password, mismatch)
- Expected: Inline validation messages; request rejected server-side as needed
- Priority: High
- Related: `SignUpForm.tsx`, `src/lib/sanitize.ts`

### AUTH-006 — Session expiration & refresh

- Preconditions: logged in
- Steps: Inspect cookie & /api/auth/session; simulate expired session
- Expected: Expired session returns 401; client redirects to /auth
- Priority: High
- Related: `src/lib/auth.ts`, `src/components/providers/AuthProvider.tsx`

### AUTH-007 — Link GitHub account (settings)

- Preconditions: user logged in
- Steps: /settings → Link GitHub → complete OAuth
- Expected: `githubLinked` true; Account/GitHubAuth entries created
- Priority: Medium
- Related: `src/app/settings/page.tsx`, `src/app/api/github/*`

### AUTH-008 — Add password for OAuth user

- Preconditions: user created via GitHub
- Steps: Call add-password API or UI
- Expected: Password stored hashed; credential sign-in works
- Priority: Medium

### AUTH-009 — Admin login & access restriction

- Preconditions: admin user exists
- Steps: POST /api/admin/auth/login with admin creds
- Expected: admin-token cookie set; non-admin receives 403
- Priority: High
- Related: `src/app/api/admin/auth/login/route.ts`

### AUTH-010 — Sign out behavior

- Preconditions: logged in
- Steps: Trigger signOut (UI or /api/auth/signout)
- Expected: Session invalidated; protected pages redirect to /auth
- Priority: High

### AUTH-011 — Registration rate-limit (3/hour)

- Preconditions: none
- Steps: Call /api/auth/register repeatedly to exceed limit
- Expected: 429 Too Many Requests
- Priority: Medium
- Related: `src/app/api/auth/register/route.ts`, `src/lib/rate-limit.ts`

### AUTH-012 — Multi-tab session sync

- Preconditions: logged in in two tabs
- Steps: Logout in Tab B, focus Tab A
- Expected: Tab A detects logout and redirects to /auth
- Priority: Medium
- Related: `AuthProvider.tsx`

---

## Workspaces (WKS)

### WKS-001 — Create workspace

- Preconditions: authenticated user
- Steps: POST /api/workspaces
- Expected: 201 created; ownerId set; workspace returned
- Priority: High
- Related: `src/app/api/workspaces/route.ts`

### WKS-002 — Get workspace details

- Preconditions: workspace exists; user is member or owner
- Steps: GET /api/workspaces/[id]
- Expected: JSON includes ownerId, members, integration
- Priority: High

### WKS-003 — Update workspace settings

- Preconditions: is owner or has workspace:edit
- Steps: PATCH /api/workspaces/[id]/settings
- Expected: Settings updated only for authorized users
- Priority: High

### WKS-004 — Transfer ownership

- Preconditions: owner logged in; target is member
- Steps: POST /api/workspaces/[id]/transfer-ownership
- Expected: ownerId updated; notifications created
- Priority: High

### WKS-005 — Leave workspace

- Preconditions: member logged in
- Steps: POST /api/workspaces/[id]/leave
- Expected: Member removed or blocked by delegation constraints
- Priority: High

### WKS-006 — Owner cannot be removed

- Preconditions: owner exists
- Steps: Attempt to remove owner via members API
- Expected: 403 with explanatory message
- Priority: High

### WKS-007 — Workspace list pagination/limits

- Preconditions: many workspaces exist
- Steps: GET /api/workspaces?limit=X
- Expected: Respect `PAGINATION_LIMITS`
- Priority: Medium

### WKS-008 — GitHubAuth creation on workspace create (if user linked)

- Preconditions: user has GitHub account linked
- Steps: Create workspace
- Expected: GitHubAuth record created if Account exists (non-blocking)
- Priority: Medium

### WKS-009 — Workspace creation rate-limit (5/hour)

- Preconditions: same client
- Steps: Create workspaces until rate-limited
- Expected: 429 with X-RateLimit-Remaining
- Priority: Medium

### WKS-010 — Members view permission enforcement

- Preconditions: user lacks members:view
- Steps: GET /api/workspaces/[id]/members
- Expected: 403 Forbidden
- Priority: High

---

## Members & Invites (MEM)

### MEM-001 — Invite existing user

- Preconditions: actor has members:invite
- Steps: POST /api/workspaces/[id]/invite (email of existing user)
- Expected: Invite PENDING, Notification to invited user, Activity logged
- Priority: High

### MEM-002 — Invite unregistered email

- Preconditions: actor has permission
- Steps: POST invite with non-registered email
- Expected: Invite created; message states user can accept after registering
- Priority: Medium

### MEM-003 — Duplicate invite prevented

- Preconditions: pending invite exists
- Steps: Send duplicate invite
- Expected: 400 "An invitation has already been sent..."
- Priority: Medium

### MEM-004 — Accept invite (invite-first flow)

- Preconditions: PENDING invite exists and user is invitedUser or registers
- Steps: POST /api/workspaces/invites/[inviteId]/accept
- Expected: WorkspaceMember created with normalized permissions; invite UPDATED to ACCEPTED
- Priority: High

### MEM-005 — Reject invite

- Preconditions: invited user logged in
- Steps: POST /api/workspaces/invites/[inviteId]/reject
- Expected: invite REJECTED; notification to inviter
- Priority: Medium

### MEM-006 — Resend invite

- Preconditions: inviter/owner permissions
- Steps: POST /api/workspaces/invites/[inviteId]/resend
- Expected: expiresAt refreshed; notification created
- Priority: Medium

### MEM-007 — Cancel invite

- Preconditions: inviter or owner
- Steps: POST /api/workspaces/invites/[inviteId]/cancel
- Expected: invite CANCELLED; notification to invited user if exists
- Priority: Medium

### MEM-008 — Add member (direct add)

- Preconditions: actor has MEMBERS_INVITE
- Steps: POST /api/workspaces/[id]/members with userId/email
- Expected: Invite or member created; activity + notification created
- Priority: High

### MEM-009 — Update member permissions & delegation ceiling

- Preconditions: actor has MEMBERS_UPDATE_PERMISSIONS
- Steps: PATCH /api/workspaces/[id]/members/[memberId] with new permissions
- Expected: `assertDelegatablePermissions` enforces ceiling; 403 on over-delegation
- Priority: High
- Related: `src/lib/workspace-permissions.ts`

### MEM-010 — Prevent self-permission modification unless owner

- Preconditions: actor updates own membership (non-owner)
- Steps: PATCH own member record
- Expected: 403 with explanatory message
- Priority: High

### MEM-011 — Remove member (preview/cascade)

- Preconditions: delegated members/invites exist
- Steps: DELETE /api/workspaces/[id]/members/[memberId]?preview=true then actual DELETE
- Expected: preview returns summary; non-owner cannot remove while delegated entities exist (409); owner can cascade
- Priority: High

### MEM-012 — Owner not stored in WorkspaceMember

- Steps: Inspect DB and UI
- Expected: owner appears in `Workspace.ownerId`, not in `WorkspaceMember`
- Priority: Medium

### MEM-013 — Delegation chain enforcement

- Preconditions: A -> B -> C chain exists
- Steps: A attempts to manage C
- Expected: Allowed if within grantRoot; enforced by `assertCanManageDelegatedTarget`
- Priority: High

### MEM-014 — Pending invites visible in members UI

- Preconditions: PENDING invite exists
- Steps: Open members UI
- Expected: Pending entry present with appropriate actions
- Priority: Medium

### MEM-015 — Invite expiration (7 days)

- Preconditions: stale PENDING invite older than 7 days
- Steps: GET invites list
- Expected: invite status updated to EXPIRED by GET logic
- Priority: Medium

### MEM-016 — Owner-only operations enforced

- Preconditions: non-owner tries owner-only operation
- Steps: Attempt transfer-ownership or cascade remove as non-owner
- Expected: 403 or 409
- Priority: High

### MEM-017 — Permission normalization on create/update

- Preconditions: create member with `documents:edit`
- Steps: Inspect saved `permissions`
- Expected: Normalized includes `documents:view` and `workspace:view`
- Priority: Medium

### MEM-018 — Permission picker validation (UI)

- Preconditions: permission picker present
- Steps: Try selecting invalid combinations
- Expected: UI prevents invalid combos per `PERMISSION_PACK_DEFINITIONS`
- Priority: Medium

### MEM-019 — Resend/cancel permission checks

- Preconditions: non-inviter tries to resend/cancel
- Steps: Attempt action
- Expected: 403
- Priority: High

### MEM-020 — Activity logs for member changes

- Preconditions: Add/update/remove member
- Steps: Check `activity` table/UI
- Expected: Corresponding activity records created
- Priority: High

---

## Documents & Versioning (DOC)

> Major areas: document CRUD, versioning (create/restore/delete), lock/concurrency, diff/sha generation, GitHub sync mapping.

### DOC-001 — Create document

- Preconditions: `documents:create` permission
- Steps: Create document via UI or API
- Expected: Document created; DB record exists; first version created where applicable
- Priority: High

### DOC-002 — GET document includes versions & comments

- Preconditions: document exists
- Steps: GET /api/documents/[id]
- Expected: includes `versions` (limited), unresolved comments, author and workspace info
- Priority: High

### DOC-003 — Manual save requires commit message

- Preconditions: content changed, createVersion=true, isAutoSave=false
- Steps: PATCH /api/documents/[id] without `message`
- Expected: 400 "Commit message is required for manual saves"
- Priority: High

### DOC-004 — Auto-save allowed without message

- Preconditions: isAutoSave=true
- Steps: PATCH with isAutoSave true
- Expected: Version created with `isAutoSave` flag
- Priority: High

### DOC-005 — Versions list & restore

- Preconditions: multiple versions exist
- Steps: GET /api/documents/[id]/versions; POST /api/documents/[id]/versions/[versionId]/restore
- Expected: versions returned; restore creates new version and updates document content
- Priority: High

### DOC-006 — Label/delete version (where supported)

- Preconditions: version present
- Steps: call label endpoint and delete (if present)
- Expected: label applied; delete behavior validated; permission checks enforced
- Priority: Medium

### DOC-007 — Delete document

- Preconditions: user has `documents:delete`
- Steps: DELETE /api/documents/[id]
- Expected: Activity logged; document removed
- Priority: High

### DOC-008 — Lock prevents editing by others

- Preconditions: user A holds valid lock
- Steps: user B PATCH /api/documents/[id]
- Expected: 423 Locked returned with `lockedBy` and `expiresAt`
- Priority: High

### DOC-009 — Presence updates & read editors

- Preconditions: document open
- Steps: POST presence and GET presence list
- Expected: presence records upserted; cursor positions and isEditing states set
- Priority: Medium

### DOC-010 — Inline comments / mentions flow

- Preconditions: comments & mentions supported
- Steps: Create inline comment, mention user
- Expected: comment created; mention creates notification
- Priority: High

### DOC-011 — GitHub conflict resolution UI

- Preconditions: conflicting content between repo and local
- Steps: Trigger import conflict and open `/conflicts`
- Expected: Both versions visible; resolution creates new version
- Priority: Medium

### DOC-012 — Save-as duplicate path handling

- Preconditions: existing path collisions
- Steps: POST save-as with duplicate path
- Expected: Unique constraint error handled; UI shows message
- Priority: Medium

### DOC-013 — PR linking & activity

- Preconditions: GitHub PRs tracked
- Steps: Inspect PR-related activity entries
- Expected: PR events appear in Activity feed and link to resources
- Priority: Low

### DOC-014 — Search & Recent reflect changes

- Preconditions: documents exist/updated
- Steps: Search and view Recent list
- Expected: Updated results and Recent list entries
- Priority: Medium

### DOC-015 — Sanitization prevents XSS

- Preconditions: attempt to save `<script>` in content/comment
- Steps: Save malicious content and render
- Expected: `sanitizeHtml()` removes dangerous content; no XSS
- Priority: High

### DOC-016 — SHA generation for versions

- Preconditions: different contents produce SHA
- Steps: Create versions and inspect SHA fields
- Expected: SHA present and consistent with content
- Priority: Low

### DOC-017 — Lock expiry cleanup

- Preconditions: expired lock exists
- Steps: Attempt to edit; code should remove expired lock automatically
- Expected: expired lock deleted and edit allowed
- Priority: Medium

### DOC-018 — Mentions trigger notifications

- Preconditions: mentioned user exists
- Steps: Create mention via API/UI
- Expected: Notification created for mentioned user
- Priority: Medium

### DOC-019 — Versions ordering & pagination

- Preconditions: many versions exist
- Steps: GET /api/documents/[id]/versions
- Expected: Ordered by `version: desc`, limited by PAGINATION_LIMITS
- Priority: Low

### DOC-020 — Deleted document returns 404

- Preconditions: document deleted
- Steps: GET /api/documents/[deletedId]
- Expected: 404 Document not found
- Priority: High

---

## Comments, Mentions & Inline Comments (COM)

- COM-001: Create / retrieve comments — permissions enforced (COMMENTS_CREATE / COMMENTS_VIEW)
- COM-002: Resolve/unresolve comment requires COMMENTS_DELETE permission
- COM-003: Inline comment reply threading validated
- COM-004: Mentions create notifications
- COM-005: Comments rate-limit enforced (rate-limit.ts)
- COM-006: Comments sanitized before storage (sanitize.ts)
- COM-007: UI shows resolved/unresolved filters correctly
- COM-008: Commenting on non-existing document returns 404

(Each case maps to `src/app/api/documents/[id]/comments|mentions|inline-comments/route.ts`)

---

## Presence, Locks & Concurrency (PRS)

- PRS-001: Presence updates & GET presence — cursor & lastSeen
- PRS-002: Lock denies concurrent edits (423 Locked)
- PRS-003: Concurrent auto-save behavior produces auto-save versions
- PRS-004: Expired lock cleaned up on edit
- PRS-005: Presence cleanup for stale entries
- PRS-006: Presence POST with invalid doc/workspace returns 404

---

## GitHub Integration (GHB)

- GHB-001: Connect workspace to GitHub (WorkspaceGitHubIntegration)
- GHB-002: Import markdown files → create documents under `/docs/...`
- GHB-003: Export documents with `githubPath` back to repo
- GHB-004: Import/Export UI warns when not configured
- GHB-005: Webhook events processed by server callback
- GHB-006: Branch/commits endpoints return repo metadata
- GHB-007: Conflict resolution UI for local vs remote
- GHB-008: `github:import` / `github:export` permission checks enforced
- GHB-009: GitHub rate-limit handling in `github-rate-limit.ts`
- GHB-010: Batch import endpoint behavior
- GHB-011: Workspace creation creates GitHubAuth when user linked
- GHB-012: UI shows connected/disconnected states correctly

(See `src/app/api/github/**` and `src/app/dashboard/[id]/settings/github/page.tsx`)

---

## Notifications & Activity (NOT)

- NOT-001: NotificationBell shows unread counts & dropdown
- NOT-002: Mark read/unread & delete operations work via API
- NOT-003: Invite notifications created when invite sent
- NOT-004: Activity feed lists member/document/GitHub events
- NOT-005: Notification preferences persist and used
- NOT-006: `/api/notifications/count` returns unread count
- NOT-007: Mark-all-as-read endpoint works
- NOT-008: Notification links to removed targets handled gracefully

---

## Admin & Settings (ADM / SET)

- ADM-001: Admin login sets `admin-token`; non-admin blocked
- ADM-002: Admin routes protected
- ADM-003: Admin verify endpoint returns correct info
- ADM-004: Admin logout clears cookie
- SET-001: Profile update validation (username rules)
- SET-003: Link/unlink GitHub from user settings
- SET-004: Account deletion cleans up user data
- SET-005: Session sync across tabs validated
- SET-006: Notification toggles persist and are respected

---

## Uploads / Search / Feedback / Favorites (SUP)

- SUP-001: Image upload validation and rate-limit enforced
- SUP-002: Invalid file types rejected
- SUP-003: Search returns relevant results; rate-limited
- SUP-004: Feedback submission rate-limited and stored
- SUP-004a: Feedback submissions generate in-app notifications for admins (notification appears in Notification Bell and links to the admin feedback page)
- SUP-005: Favorite/unfavorite persists per user
- SUP-006: Recent documents updated on view
- SUP-007: API docs page renders `src/lib/api-docs.ts` content
- SUP-008: Search returns empty state gracefully

---

## API Validation, Rate Limiting & Security (SEC)

- SEC-001: Zod input validation returns 400 with details
- SEC-002: Unauthorized access returns 401
- SEC-003: Forbidden returns 403 for insufficient permissions
- SEC-004: Rate-limits enforced (429)
- SEC-005: Secure cookies & CSRF handled by NextAuth
- SEC-006: Sanitization prevents XSS
- SEC-007: Passwords hashed (bcrypt)
- SEC-008: Session tokens contain `session.user.id`
- SEC-009: WorkspacePermissionError mapped correctly to HTTP codes
- SEC-010: Invalid paths return 404
- SEC-011: Session isolation across browsers/tabs
- SEC-012: Admin routes protected by role checks
- SEC-013: Proxy attaches rate-limit headers
- SEC-014: Cleanup cron endpoints behave as expected

---

## UI/UX, Responsive & Cross-Browser (UI)

- UI-001: Core pages render (auth, dashboard, document editor)
- UI-002: Responsive behavior for Desktop/Tablet/Mobile
- UI-003: Form validation messages visible and accurate
- UI-004: NotificationBell UX and navigation
- UI-005: Activity feed filters operate correctly
- UI-006: Password visibility toggle works
- UI-007: Keyboard accessibility & focus states
- UI-008: Empty states show meaningful messages

---

## Negative & Edge Case Testing (selected highlights)

- Invalid inputs → 400 (Zod)
- Unauthorized calls → 401
- Forbidden operations → 403
- Not found → 404
- Conflict on delegated member removal → 409
- Locked document → 423
- Rate limit exceeded → 429
- Session expired → 401 and redirect
- Attempt to modify owner permissions → 403
- DB unique constraint violations (duplicate paths) handled gracefully

(Each negative case should be verified against the specific routes listed above.)

---

## Test Data & Seed Guidance

- Seed DB: run `prisma/seed.ts` (script located at `prisma/seed.ts`).
- Sample credentials from seed:
  - alice@example.com / password123 (Owner — Engineering Team)
  - bob@example.com / password123 (Owner — Product Team)
  - charlie@example.com / password123 (Member)
- Use Postman collection for API endpoints; include session cookie where required.

---

## Traceability & Coverage Summary

- Primary enforcement points: `src/lib/workspace-permissions.ts`, `src/lib/workspace-permission-definitions.ts`.
- Core API routes under `src/app/api/**` map directly to test cases above.
- UI components under `src/components/**` and pages under `src/app/**` correspond to UI test cases.

---

## Execution Checklist (quick-run)

1. Run DB seed: `node prisma/seed.ts` or configured seed command.
2. Start dev server: `npm run dev`.
3. Run High priority test cases first (Auth, Permissions, Documents, Members, Invites).
4. Log defects with reproduction steps and code file references as noted in this plan.

---

## Appendix — Quick Reference (Important files & endpoints)

- Permission helpers: `src/lib/workspace-permissions.ts`, `src/lib/workspace-permission-definitions.ts`
- Auth: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/components/auth/*`
- Workspaces & members: `src/app/api/workspaces/**`
- Documents & versions: `src/app/api/documents/**`
- GitHub: `src/app/api/github/**`, `src/app/dashboard/[id]/settings/github/page.tsx`
- Notifications: `src/app/api/notifications/**`, `src/components/NotificationBell.tsx`
- Rate-limiting & sanitization: `src/lib/rate-limit.ts`, `src/lib/sanitize.ts`
- Seed script: `prisma/seed.ts`

---

## Next recommended actions

- Execute High-priority tests and record actual results.
- Create a Postman collection for automated API regression checks.
- (Optional) Export this markdown to Word (`.docx`) if required for formal QA reporting.

---

_Document generated from repository source files. All test cases are derived from code and UI components present in the workspace._
