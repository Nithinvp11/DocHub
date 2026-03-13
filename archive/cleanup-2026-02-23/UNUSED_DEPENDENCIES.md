# UNUSED_DEPENDENCIES

Generated on 2026-02-23 using static import/dependency scan (`depcheck`).

## ✅ REMOVED (completed 2026-02-23)

### dependencies

- `@octokit/webhooks-types` ✅ REMOVED
- `react-mermaid2` ✅ REMOVED
- `tippy.js` ✅ REMOVED

### devDependencies

- `baseline-browser-mapping` ✅ REMOVED

**Validation Results:**

- ✅ TypeScript check passed (`npm run type-check`)
- ✅ Production build passed (`npm run build`)
- ✅ All 107 routes generated successfully
- Total packages removed: 2,134 (including transitive dependencies)

## Verify manually (likely unused, but confirm runtime/jobs/docs first)

### dependencies

- `@tiptap/extension-character-count`
- `@tiptap/extension-mention`
- `bullmq`
- `cheerio`
- `cron`
- `ioredis`
- `turndown-plugin-gfm`

### devDependencies

- `@tailwindcss/postcss`
- `@types/cheerio`
- `@types/cron`
- `@types/react-syntax-highlighter`
- `prettier-plugin-tailwindcss`
- `tailwindcss`
- `tw-animate-css`

## Required (keep/add)

### required transitively installed deps (imported in source)

- `@tiptap/core` (present via TipTap extensions)
- `@tiptap/pm` (present via TipTap extensions)
- `katex` (present via `mermaid`/`rehype-katex`)
- `highlight.js` (present via `@tiptap/extension-code-block-lowlight`)
- `lowlight` (present via `@tiptap/extension-code-block-lowlight` / `rehype-highlight`)

### verify explicit installation policy

- `@sentry/nextjs` is imported in source and should be explicitly present if Sentry is enabled in this environment.
- If your policy requires direct (non-transitive) pinning for imported modules, add direct entries for the packages above.

### required existing deps

- Keep core framework/auth/db/runtime packages (`next`, `react`, `next-auth`, `@prisma/client`, `prisma`, `zod`, `octokit`, etc.).

## Notes

- This report is intentionally conservative for production safety.
- Do not uninstall automatically in production without validating: `npm run type-check`, `npm run build`, and key user flows.
