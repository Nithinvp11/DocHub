# PR Title

Delegation Tree: enforce manage boundaries, owner cascade delete, and preview-safe removal UX

---

# PR Body

## Summary

This PR completes delegation-tree enforcement for workspace member and invite management. It adds strict management visibility rules, owner-only cascade behavior for delegated subtree removals, and a preview-first deletion UX to prevent accidental destructive operations.

## What changed

- Added delegation-aware management visibility in member/invite flows (`canManage`, `grantRoot`, `grantedBy`).
- Enforced delegation-safe member deletion in API:
  - Non-owner receives `409` when delegated subtree impact exists.
  - Owner can cascade-delete delegated subtree members and cancel subtree-created pending invites.
- Added preview mode for deletion impact (`?preview=true`) with count summary and no mutation.
- Updated members UI to call preview first, display impact counts, and block invalid non-cascade removals early.
- Expanded permission debug script with recursive delegation checks (`A -> B -> C`).
- Updated security/audit documentation for delegation tree behavior and validation outcomes.

## Files in scope

- `src/components/workspace-members-panel.tsx`
- `src/app/api/workspaces/[id]/invite/route.ts`
- `src/app/api/workspaces/[id]/members/[memberId]/route.ts`
- `src/lib/workspace-permissions.ts`
- `scripts/dev/permission-system-debug.ts`
- `PERMISSION_SYSTEM_AUDIT.md`
- `DELEGATION_TREE_PR_HANDOFF.md`

## Validation

- `npm run debug:permission-audit` ✅
- `npx tsc --noEmit` ✅
- `npm run build` ✅

## Behavior notes

- Requires delegation schema fields in DB (`grantedById`, `grantRootId`, `grantDepth`).
- Deletion behavior intentionally changed for safety:
  - non-owner deletion is blocked with impact details when delegated descendants/invites exist,
  - owner deletion performs controlled cascade.

## Reviewer checklist

- [ ] Confirm non-owner delete is blocked with `409` when delegated descendants exist.
- [ ] Confirm owner delete cascades delegated subtree and cancels pending delegated invites.
- [ ] Confirm preview mode returns accurate impact counts without mutation.
- [ ] Confirm UI hides actions when `canManage` is false.
- [ ] Confirm activity/notification side effects occur for owner cascade path.

## Commit

- `f274cc6` feat(permissions): finalize delegation tree enforcement and safe member removal flow
