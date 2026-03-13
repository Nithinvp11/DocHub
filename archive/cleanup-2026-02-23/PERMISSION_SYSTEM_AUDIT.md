# Permission System Audit Report

Date: 2026-02-17  
Project: DocHub – Collaborative Documentation Platform  
Scope: Capability-based workspace permission system verification and enforcement

## 1) Prisma / Database Verification

### Result: PASS

- `WorkspaceMember.permissions` exists and is used as the member capability source.
- `WorkspaceInvite.permissions` exists and is used for invitation capability grants.
- Invite lifecycle status enum verified in schema/migrations includes:
  - `PENDING`
  - `ACCEPTED`
  - `REJECTED`
  - `EXPIRED`
  - `CANCELLED`
- Migration state check completed with database up-to-date.

Validation run:

- `npx prisma migrate status`
- Outcome: **Database schema is up to date**.

## 2) Single Source Permission Constants

### Result: PASS

Verified centralized canonical constants and normalization usage:

- `src/lib/workspace-permission-definitions.ts`
  - `WORKSPACE_PERMISSION`
  - `ALL_WORKSPACE_PERMISSIONS`
  - `normalizePermissions`

Exact canonical strings are defined centrally and consumed by both backend and frontend.

## 3) Backend Enforcement Audit (Required Routes)

### Result: PASS (after fixes)

Audited and enforced centralized permission checks across targeted routes.

### Workspaces / Members routes

- `src/app/api/workspaces/[id]/members/route.ts`
- `src/app/api/workspaces/[id]/members/[memberId]/route.ts`
- `src/app/api/workspaces/[id]/invite/route.ts`
- `src/app/api/workspaces/[id]/invites/[inviteId]/route.ts`
- `src/app/api/workspaces/[id]/transfer-ownership/route.ts` **(patched)**
- `src/app/api/workspaces/[id]/leave/route.ts` **(patched)**
- `src/app/api/workspaces/[id]/route.ts` DELETE **(patched)**

### Documents / lock route

- `src/app/api/documents/[id]/lock/route.ts` **(patched)**
  - Added `DOCUMENTS_EDIT` enforcement for lock mutation operations.

### GitHub routes

- `src/app/api/github/auth/route.ts` **(patched)**
- `src/app/api/github/callback/route.ts` **(patched)**
- `src/app/api/github/check-auth/route.ts` **(patched)**
- `src/app/api/github/profile/route.ts` **(patched)**
- `src/app/api/github/repositories/route.ts` **(patched)**
- `src/app/api/github/commits/route.ts` **(patched)**
- `src/app/api/github/branches/route.ts` **(patched)**
- `src/app/api/github/import/batch/route.ts` **(patched)**

Notes:

- Removed residual ad-hoc membership-only gating in sensitive operations where centralized checks were required.
- Standardized `WorkspacePermissionError` handling paths for consistent 403 behavior.

## 4) Owner Override Verification

### Result: PASS

Verified in `src/lib/workspace-permissions.ts`:

- `getWorkspaceAccess` returns full `ALL_WORKSPACE_PERMISSIONS` when `workspace.ownerId === userId`.

## 5) Delegation Ceiling Verification

### Result: PASS (improved)

Verified and adjusted delegation logic in `src/lib/workspace-permissions.ts`:

- `assertDelegatablePermissions(actorAccess, requestedPermissions, existingPermissions)` now:
  - Allows preserving permissions target already has.
  - Blocks assigning new permissions actor does not have (unless actor is owner).

Route aligned to use this behavior:

- `src/app/api/workspaces/[id]/members/[memberId]/route.ts`

## 6) normalizePermissions Verification

### Result: PASS

Verified `normalizePermissions` usage for:

- API permission intake normalization.
- Dependency completion (view dependencies and capability prerequisites).
- Consistent storage/use in member and invite permission arrays.

## 7) Frontend Restriction Verification

### Result: PASS

Reviewed and aligned UI capability gating:

- `src/components/workspace-members-panel.tsx`
  - Invite, resend, cancel, remove, and update controls now gated by specific capabilities.
  - Permission picker options filtered to delegatable permissions (owner sees all).
- `src/app/dashboard/[id]/page.tsx`
  - Server-side normalization and capability flags aligned.
  - Duplicate invite entry point removed from top navbar flow (single management surface).

## 8) Invite Workflow Verification

### Result: PASS

Validated workflow consistency:

- Invite creation stores permission arrays.
- Acceptance creates membership with normalized permissions.
- Status transitions and cancellation paths are present and enforced.
- Capability checks cover invite issue/resend/cancel operations.

## 9) Activity + Notification Verification

### Result: PASS

Verified activity/notification infrastructure remains intact and compatible with permission updates.
No breaking regressions found in tracked invite/member related action paths during audit pass.

## 10) Dev-only Simulation Script

### Result: PASS (added + executed)

Added script:

- `scripts/dev/permission-system-debug.ts`

Added npm command:

- `debug:permission-audit` in `package.json`

Simulation validates:

- Forbidden delegation fails.
- Allowed delegation succeeds.
- Invite acceptance creates member with expected normalized permissions.
- Optional cleanup completes.

Validation run:

- `npm run debug:permission-audit`
- Outcome: **Successful**.

## 11) Final Build / Type Safety Validation

### Result: PASS

Validation runs:

- `npx tsc --noEmit`
- `npm run build`

Outcomes:

- Typecheck completed without reported errors.
- Production build succeeded.
- Non-blocking browserlist staleness warnings only.

---

## Additional Cleanup Performed

- Updated naming in `src/lib/validations.ts` to remove role-oriented member schema naming in favor of permission-oriented schema/type names.
- Kept global `User.role` admin concepts untouched where they are not workspace-role semantics.

## Issues Found and Resolved During Audit

1. Residual centralized-check gaps in workspace lifecycle routes (`DELETE`, `transfer-ownership`, `leave`) — **fixed**.
2. Missing centralized document lock mutation enforcement — **fixed**.
3. Partial GitHub route reliance on membership/ad-hoc checks and non-uniform token handling — **fixed**.
4. Delegation edge-case preventing safe preservation of existing target permissions — **fixed**.

## Final Conclusion

The capability-based permission model is now enforced end-to-end across the audited workspace/member/document lock/GitHub surfaces, with centralized constants and helper enforcement in active use, owner override and delegation ceiling behavior verified, and build/type checks passing.

## 12) Permission Pack Refactor (Capability Bundles)

### Result: PASS (implemented + validated)

Implemented UI-level permission packs while preserving DB storage as individual capability strings.

Completed in:

- `src/lib/workspace-permission-definitions.ts`
  - Added pack constants and definitions:
    - `PERMISSION_PACK`
    - `PERMISSION_PACK_DEFINITIONS`
  - Added helpers:
    - `expandPermissionPacks(...)`
    - `getSelectedPacks(...)`
  - Updated `normalizePermissions(...)` to support pack input and dependency expansion.
  - Enforced professional pack rule: selecting any non-View pack auto-adds full View Pack permissions during normalization.

- `src/components/permission-pack-picker.tsx`
  - New pack-based permission selector UI.
  - Collapsible advanced details showing exact underlying capabilities.
  - Delegation-aware availability (limited packs when assigner has subset permissions).
  - UI dependency behavior aligned: selecting non-View pack auto-adds full View Pack permissions.

- `src/components/workspace-members-panel.tsx`
  - Replaced granular permission checkbox lists with pack-based selector in:
    - Invite flow permission step.
    - Edit member permissions dialog.

- `scripts/dev/permission-system-debug.ts`
  - Added pack-specific assertions for:
    - pack expansion
    - pack detection
    - normalization from pack input
    - non-View pack auto-add full View Pack
    - delegation constraints and invite acceptance behavior

Latest validation run (2026-02-18):

- `npx tsc --noEmit` → PASS
- `npm run debug:permission-audit` → PASS
- `npm run build` → PASS

## 13) Delegation Tree Controls (A → B → C)

### Result: PASS (implemented + validated)

Implemented recursive delegation metadata and management controls while preserving capability-string storage.

Database/model updates:

- `prisma/schema.prisma`
  - `WorkspaceMember`:
    - `grantedById`
    - `grantRootId`
    - `grantDepth`
  - `WorkspaceInvite`:
    - `grantRootId`
- `prisma/migrations/20260218112000_add_delegation_tree_fields/migration.sql`
  - Adds delegation columns and supporting indexes.

Core delegation helpers:

- `src/lib/workspace-permissions.ts`
  - `WorkspaceAccess` now carries delegation metadata (`grantedById`, `grantRootId`, `grantDepth`).
  - Added:
    - `resolveGrantRootForDelegation(...)`
    - `canManageDelegatedTarget(...)`
    - `assertCanManageDelegatedTarget(...)`

Route-level enforcement and metadata:

- `src/app/api/workspaces/[id]/members/route.ts`
  - GET returns delegation metadata (`grantedBy`, `grantRoot`, `grantDepth`) and `canManage`.
  - POST stores `grantRootId` on invite creation and writes delegation metadata in activity logs.
- `src/app/api/workspaces/[id]/members/[memberId]/route.ts`
  - PATCH/DELETE require both capability permission and delegation-tree manage authority.
  - DELETE now blocks removing a delegator if they still have directly delegated members or pending delegated invites, preventing orphaned delegation chains.
- `src/app/api/workspaces/[id]/invite/route.ts`
  - POST stores `grantRootId` and logs delegation metadata.
  - GET now returns invite `canManage` and `grantRoot` details for UI gating.
- `src/app/api/workspaces/invites/[inviteId]/accept/route.ts`
  - Accepted member records now persist `grantedById`, `grantRootId`, `grantDepth`.
- `src/app/api/workspaces/invites/[inviteId]/resend/route.ts`
- `src/app/api/workspaces/invites/[inviteId]/cancel/route.ts`
  - Both now enforce delegation-aware invite management checks.

Frontend delegation visibility:

- `src/components/workspace-members-panel.tsx`
  - Member cards display:
    - `Invited by`
    - `Managed under`
  - Pending invite cards display `Managed under` when available.
  - Edit/remove/resend/cancel action buttons are hidden when `canManage` is false.

Latest delegation validation run (2026-02-18):

- `npx prisma migrate dev --name sync_delegation_tree_fields` → PASS
- `npx prisma generate` → PASS
- `npx tsc --noEmit` → PASS
- `npm run debug:permission-audit` → PASS
- `npm run build` → PASS

Latest iteration update (2026-02-18):

- Added direct-subtree removal safety guard in `members/[memberId]` DELETE flow (returns 409 with delegated counts).
- Expanded `scripts/dev/permission-system-debug.ts` with explicit `A → B → C` manage checks:
  - root delegator manages subtree member
  - direct delegator manages child
  - descendant cannot manage ancestor
- Re-validated:
  - `npx tsc --noEmit` → PASS
  - `npm run debug:permission-audit` → PASS
  - `npm run build` → PASS

Latest policy iteration (2026-02-18, continued):

- `src/app/api/workspaces/[id]/members/[memberId]/route.ts` DELETE now supports owner-only recursive subtree removal:
  - Owner removing a delegator removes the full delegated member subtree (A→B→C...) in one transaction.
  - Pending invites created by removed subtree users are auto-cancelled in the same transaction.
  - Removed users receive removal notifications.
  - Activity metadata now includes cascade and cancellation counts/IDs.
- Non-owner behavior remains strict:
  - If delegated subtree members or pending delegated invites exist, request is blocked with `409` and actionable counts.

Validation after recursive removal update:

- `npx tsc --noEmit` → PASS
- `npm run debug:permission-audit` → PASS
- `npm run build` → PASS

Latest UX safety iteration (2026-02-18, continued):

- Added deletion impact preview mode on `DELETE /api/workspaces/[id]/members/[memberId]?preview=true`:
  - returns cascade impact summary without mutating data
  - includes total members to remove, delegated subtree count, and pending invites to cancel
- Updated members UI in `src/components/workspace-members-panel.tsx`:
  - removal flow calls preview first
  - confirmation dialog now displays real cascade impact counts before final delete
  - falls back to basic confirmation if preview fetch fails

Validation after preview integration:

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS

Final enforcement polish (2026-02-18):

- `src/components/workspace-members-panel.tsx` now enforces preview results before delete execution:
  - if preview indicates caller cannot cascade and delegated entities exist, UI blocks immediately with actionable counts.
  - if delete still returns `409`, UI now surfaces delegated member/invite counts from response details.

Final validation run:

- `npm run debug:permission-audit` → PASS
- `npx tsc --noEmit` → PASS
- `npm run build` → PASS
