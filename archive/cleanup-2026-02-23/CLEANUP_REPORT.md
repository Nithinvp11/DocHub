# CLEANUP_REPORT

Generated on 2026-02-23 (conservative, production-safe pass).

## Scope completed

- Phase 1: Unused imports/locals cleanup (safe subset, no behavior changes)
- Phase 2: Unused component review (conservative)
- Phase 3: Permission/constants review (no removals due uncertainty)
- Phase 4: API route orphan review (TODO markers added; no deletions)
- Phase 5: Dependency analysis report created
- Phase 6: Unused types/interfaces cleanup (safe subset only)
- Phase 7: Validation run (`tsc --noEmit`)
- Phase 8: Dependency removal (4 unused packages)
- Phase 9: Final validation (TypeScript + production build)

## Files removed

- `src/app/settings/page-old-backup.tsx` (unreferenced backup file)

## Imports/locals cleaned (high-confidence)

Updated files include:

- `src/app/api/admin/users/route.ts`
- `src/app/api/documents/[id]/route.ts`
- `src/app/api/documents/[id]/comments/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/github/branches/route.ts`
- `src/app/api/workspaces/[id]/members/route.ts`
- `src/app/api/workspaces/route.ts`
- `src/app/api/notifications/read-all/route.ts`
- `src/app/api/workspaces/invites/route.ts`
- `src/app/api/admin/auth/verify/route.ts`
- `src/app/api/feedback/route.ts`
- `src/app/api/feedback/stats/route.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/[id]/page.tsx`
- `src/app/dashboard/[id]/settings/page.tsx`
- `src/app/dashboard/[id]/documents/[documentId]/page.tsx`
- `src/app/dashboard/invites/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/components/workspace-settings-dialog.tsx`
- `src/lib/admin-utils.ts`
- `src/lib/auth.ts`
- `src/lib/github-simple-import.ts`
- `src/lib/github/pr-tracker.ts`
- `src/lib/performance.ts`
- `src/lib/queries.ts`
- `src/lib/typography.ts`
- `src/lib/websocket.ts`

## TODO markers added

### Potentially orphan API routes

- `src/app/api/admin/env-check/route.ts`
- `src/app/api/admin/locks/route.ts`
- `src/app/api/cron/cleanup-locks/route.ts`
- `src/app/api/docs/openapi.json/route.ts`

Marker used:

- `// TODO: unused API route — verify before deletion`

### Potentially unused component

- `src/components/workspace-settings-dialog.tsx`

Marker used:

- `// TODO: verify if still needed`

## Permission/constants status

- No permission constants/enums were removed in this pass.
- Reason: unsafe to prove non-usage/planned-feature status without product-level confirmation.

## Dependencies Removed

- `@octokit/webhooks-types`
- `react-mermaid2`
- `tippy.js`
- `baseline-browser-mapping`

Total packages removed: 2,134 (including transitive dependencies)

## Validation

- ✅ TypeScript check passed (pre-removal): `npm run type-check` (`tsc --noEmit`)
- ✅ Production build passed (pre-removal): `npm run build`
- ✅ Dependency removal completed: `npm uninstall` (4 packages)
- ✅ Production build passed (post-removal): `npm run build` (all 107 routes generated)
- ✅ TypeScript check passed (post-removal): `npm run type-check`
- ⚠️ Lint still reports pre-existing errors/warnings in unrelated files (not introduced by this pass)

## Dependency verification update

- Verified transitive availability for previously flagged imports: `@tiptap/core`, `@tiptap/pm`, `katex`, `highlight.js`, `lowlight`.
- `@sentry/nextjs` should remain explicitly installed when Sentry integration is enabled.

## Potential risks / follow-ups

- Some lint warnings remain across UI components and scripts; resolving all would require broader refactor-level changes.
- API route usage can include external consumers (cron/webhooks/manual tooling), so routes were marked for review rather than deleted.
- See `UNUSED_DEPENDENCIES.md` for dependency removal candidates and required packages.
