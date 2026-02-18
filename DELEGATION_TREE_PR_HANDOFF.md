# Delegation Tree — PR Handoff

## Scope (This PR)

Implements and hardens delegation-aware member and invite management in workspace permissions, including backend enforcement, UI gating, safe deletion preview, and owner-only cascade behavior.

---

## What Changed

### 1) Delegation-aware member/invite visibility and action gating

- Extended member and invite payload rendering to include delegation metadata (`grantedBy`, `grantRoot`, `canManage`, etc.).
- Added row-level context labels in members UI:
  - `Invited by`
  - `Managed under`
- Hid mutating actions (edit/remove/resend/cancel) when `canManage` is `false`.

### 2) Invite API delegation behavior

- Invite GET now computes actor access and returns delegation-aware `canManage` and `grantRoot` fields per invite.
- Grant root data is resolved via user lookup mapping.

### 3) Member DELETE route hardening

- Added delegation subtree awareness for deletions.
- Non-owner behavior:
  - Returns `409` if delegated subtree members and/or pending delegated invites would be impacted.
- Owner behavior:
  - Performs recursive cascade delete for delegated subtree members.
  - Cancels pending invites created by subtree nodes.
  - Emits activity metadata with cascade impact details.
  - Sends notifications to affected users.

### 4) Delete preview mode (safety UX)

- Added `DELETE ...?preview=true` mode that returns impact counts without mutating data.
- UI now calls preview first and shows impact counts in confirmation text.
- UI blocks early for non-cascade callers when preview reports delegation impact.
- UI parses and surfaces backend `409` detail payload clearly.

### 5) Permission/delegation helper updates

- Delegation target typing supports email-only invite paths (`userId` optional/null where applicable).
- Centralized delegation checks continue to enforce direct/root management constraints.

### 6) Debug validation coverage

- Extended permission debug script with explicit recursive chain assertions (`A -> B -> C`):
  - root can manage descendant
  - direct delegator can manage child
  - descendant cannot manage ancestor

### 7) Audit documentation

- Updated permission audit doc with:
  - Delegation Tree behavior
  - owner cascade policy
  - preview mode behavior
  - final validation outcomes

---

## Files Touched (Delegation Work)

- `src/components/workspace-members-panel.tsx`
- `src/app/api/workspaces/[id]/invite/route.ts`
- `src/app/api/workspaces/[id]/members/[memberId]/route.ts`
- `src/lib/workspace-permissions.ts`
- `scripts/dev/permission-system-debug.ts`
- `PERMISSION_SYSTEM_AUDIT.md`

---

## Verification Evidence

Run sequence used during final pass:

1. `npm run debug:permission-audit`
2. `npx tsc --noEmit`
3. `npm run build`

Result: all pass.

---

## Suggested Commit Plan

If you want clean history, split into these commits:

### Commit 1

**Message**
`feat(permissions): add delegation-aware member and invite management controls`

**Include**

- `src/components/workspace-members-panel.tsx`
- `src/app/api/workspaces/[id]/invite/route.ts`
- `src/lib/workspace-permissions.ts`

### Commit 2

**Message**
`feat(members-api): enforce delegation subtree delete rules with owner cascade`

**Include**

- `src/app/api/workspaces/[id]/members/[memberId]/route.ts`

### Commit 3

**Message**
`feat(members-ui): add delete preview flow and delegated-impact confirmation`

**Include**

- `src/components/workspace-members-panel.tsx` (preview UX changes)

### Commit 4

**Message**
`test(debug): extend permission audit script with recursive delegation assertions`

**Include**

- `scripts/dev/permission-system-debug.ts`

### Commit 5

**Message**
`docs(security): finalize delegation tree audit and validation evidence`

**Include**

- `PERMISSION_SYSTEM_AUDIT.md`
- `DELEGATION_TREE_PR_HANDOFF.md`

---

## PR Description (Ready to Paste)

### Summary

This PR completes delegation-tree enforcement for workspace member and invite management. It adds strict management visibility rules, owner-only cascade behavior for delegated subtree removals, and a preview-first deletion UX to prevent accidental destructive operations.

### Key Behavior

- Delegation-aware `canManage` is enforced in both API and UI.
- Non-owner users cannot remove delegators when delegated subtree impact exists.
- Owners can perform safe recursive cascade removal (members + pending delegated invites).
- Frontend previews impact before deletion and blocks invalid non-cascade actions early.

### Validation

- Permission debug audit: pass (including recursive `A -> B -> C` checks)
- Typecheck: pass
- Build: pass

### Risk / Migration Notes

- Requires delegation schema fields to exist in DB (`grantedById`, `grantRootId`, `grantDepth`).
- Behavior change is intentional for deletion safety: non-owner removals now fail fast when delegation impact exists.

---

## Reviewer Checklist

- [ ] Verify non-owner receives `409` when deleting a member with delegated descendants.
- [ ] Verify owner delete cascades descendants and cancels delegated pending invites.
- [ ] Verify `?preview=true` response includes accurate impact counts.
- [ ] Verify member/invite actions are hidden when `canManage === false`.
- [ ] Verify activity/notification side effects are created during owner cascade.
