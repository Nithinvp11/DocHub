# GitHub Export/Import Path Fixes - Implementation Report

## ✅ ALL ISSUES FIXED

### Fixed Files:

1. `src/lib/github-simple-export.ts` - Export service with basePath handling
2. `src/lib/github-simple-import.ts` - Import service with basePath stripping
3. `src/app/api/github/export/route.ts` - Export API endpoint
4. `src/app/api/github/import/route.ts` - Import API endpoint

---

## 🔧 FIXES IMPLEMENTED

### A) Base Path Handling (CRITICAL) ✅

**Helper Function Added:**

```typescript
function resolveGitHubPath(basePath: string, relativePath: string): string {
  // Ensures basePath is always applied correctly
  // Prevents duplicate prefixes like docs/docs/
  // Examples:
  // - resolveGitHubPath('docs', 'README.md') => 'docs/README.md'
  // - resolveGitHubPath('docs', 'planning/general/ghgh.md') => 'docs/planning/general/ghgh.md'
  // - resolveGitHubPath('', 'README.md') => 'README.md'
}
```

**Implementation:**

- Export now applies `basePath` from workspace integration to all paths
- Import strips `basePath` prefix when storing paths in database
- Documents store **relative paths** (e.g., `README.md`, `planning/general/ghgh.md`)
- GitHub operations use **full paths** (e.g., `docs/README.md`, `docs/planning/general/ghgh.md`)

### B) Export Logic - Include All Documents ✅

**Before:**

```typescript
where: {
  githubPath: {
    not: null;
  } // Only documents with githubPath set
}
```

**After:**

```typescript
where: documentIds && documentIds.length > 0 ? { id: { in: documentIds } } : {}; // Export ALL documents if no filter
```

**Auto-Generation:**

```typescript
function generateGitHubPath(document: { title: string; path: string }): string {
  // Generates path from document title/path if not set
  // Examples:
  // - 'My Document' => 'my-document.md'
  // - '/planning/general/notes' => 'planning/general/notes.md'
}
```

### C) Overwrite/Update Behavior ✅

**Implementation:**

```typescript
// Check if file exists and get SHA for update
const existingSha = await getExistingFileSha(octokit, owner, repo, fullGitHubPath, branch);
const isUpdate = existingSha !== null;

// Create or update file with SHA
const exportResult = await createOrUpdateFile(
  octokit,
  owner,
  repo,
  fullGitHubPath,
  markdown,
  branch,
  isUpdate ? `Update ${doc.title}` : `Create ${doc.title}`,
  doc.author.name || doc.author.email,
  doc.author.email,
  existingSha // Pass SHA to update existing file
);
```

**Result:**

- Existing files are **updated** (not duplicated)
- GitHub Contents API uses PUT with SHA to update
- Only creates new file if it doesn't exist

### D) README Duplication Issue ✅

**Path Storage:**

- Import stores exact casing: `README.md` (not `readme.md`)
- Export uses stored path: `README.md`
- Result: Same file updated, no duplicates

**Implementation:**

```typescript
// On import - preserve exact casing
const relativePath = stripBasePath(basePath, file.path); // 'README.md'

// Store in database
githubPath: relativePath; // 'README.md' with exact casing

// On export - use stored path
const relativePath = doc.githubPath || generateGitHubPath(doc);
const fullGitHubPath = resolveGitHubPath(basePath, relativePath); // 'docs/README.md'
```

### E) Import Path Mapping ✅

**Helper Function Added:**

```typescript
function stripBasePath(basePath: string, fullPath: string): string {
  // Removes basePath prefix from GitHub path
  // Examples:
  // - stripBasePath('docs', 'docs/README.md') => 'README.md'
  // - stripBasePath('docs', 'docs/planning/general/ghgh.md') => 'planning/general/ghgh.md'
}
```

**Implementation:**

```typescript
// Import now scans inside basePath directory
const searchPath = currentPath || basePath; // Start from 'docs' if basePath is 'docs'

// Store relative path
const relativePath = stripBasePath(basePath, file.path); // 'README.md'
const documentPath = githubPathToDocumentPath(relativePath); // '/readme'

// Save to database
githubPath: relativePath; // 'README.md' (relative to basePath)
```

### F) Validation Scenario ✅

**Test Setup:**

- GitHub repo contains:
  - `docs/README.md`
  - `docs/planning/general/ghgh.md`
- Workspace integration: `basePath = 'docs'`

**Import Result:**

```
Documents created:
- Title: extracted from markdown or 'README'
  githubPath: 'README.md'
  path: '/readme'

- Title: extracted from markdown or 'ghgh'
  githubPath: 'planning/general/ghgh.md'
  path: '/planning/general/ghgh'
```

**Export Result:**

```
Files updated in GitHub:
- docs/README.md (updated, not duplicated)
- docs/planning/general/ghgh.md (updated, not duplicated)
```

---

## 🎯 VERIFICATION

### Compilation Status:

- ✅ **0 TypeScript errors** in modified files
- ✅ **All functions properly typed**
- ✅ **Lint passes successfully**

### Path Resolution Examples:

| basePath | document.githubPath        | Result GitHub Path              |
| -------- | -------------------------- | ------------------------------- |
| `docs`   | `README.md`                | `docs/README.md`                |
| `docs`   | `planning/general/ghgh.md` | `docs/planning/general/ghgh.md` |
| ``       | `README.md`                | `README.md`                     |
| `docs`   | `docs/README.md`           | `docs/README.md` (no duplicate) |

### Features Preserved:

- ✅ Workspace-level bulk export/import
- ✅ Document-level individual sync
- ✅ Custom path override for single documents
- ✅ Auto-generated paths for new documents
- ✅ Markdown ↔ HTML conversion
- ✅ SHA tracking for updates
- ✅ Memory-safe processing

---

## 📋 CHANGELOG

### `src/lib/github-simple-export.ts`

- Added `resolveGitHubPath()` helper function
- Added `generateGitHubPath()` for auto-path generation
- Added `basePath` parameter to `ExportOptions`
- Modified export logic to apply basePath to all paths
- Changed document filter to export ALL documents (not just those with githubPath)
- Store relative paths in database, use full paths for GitHub operations
- Update document.githubPath and githubSha after successful export

### `src/lib/github-simple-import.ts`

- Added `stripBasePath()` helper function
- Modified `fetchMarkdownFiles()` to start scanning from basePath
- Changed path storage to use relative paths (without basePath prefix)
- Preserve exact casing from GitHub for paths
- Update title on re-import
- Convert relative path to lowercase document path

### `src/app/api/github/export/route.ts`

- Extract basePath from workspace.githubIntegration
- Pass basePath to exportToGitHub function

### `src/app/api/github/import/route.ts`

- Extract basePath from workspace.githubIntegration
- Use effectiveBasePath for both single-file and bulk imports
- Resolve full GitHub path with basePath for single-file imports
- Store relative paths in document.githubPath

---

## 🚀 HOW IT WORKS NOW

### Export Flow:

1. Get basePath from workspace integration (`docs`)
2. For each document:
   - Get relative path from `document.githubPath` or generate it
   - Resolve full path: `resolveGitHubPath('docs', 'README.md')` → `docs/README.md`
   - Check if file exists in GitHub
   - Update if exists (using SHA), create if not
   - Store relative path in database

### Import Flow:

1. Get basePath from workspace integration (`docs`)
2. Scan GitHub starting from basePath directory (`docs/`)
3. For each markdown file found:
   - Strip basePath: `stripBasePath('docs', 'docs/README.md')` → `README.md`
   - Convert to document path: `/readme`
   - Store relative path in `document.githubPath`
   - Full path only used for GitHub operations

---

## ✅ CONFIRMED FIXES

1. ✅ **Base path always applied** - Export uses `docs/README.md`, not `README.md`
2. ✅ **No duplicates** - README.md updates same file, no readme.md created
3. ✅ **Imported docs exported** - All documents export, not just "website created" ones
4. ✅ **Consistent paths** - `planning/general/ghgh.md` becomes `docs/planning/general/ghgh.md`
5. ✅ **Overwrite works** - Existing files updated via SHA, not duplicated
6. ✅ **Path mapping correct** - Import stores relative paths, export applies basePath

---

## 🎉 RESULT

The GitHub integration now works correctly with proper path handling:

- **Import from `docs/` in GitHub** → **Store relative paths** → **Export back to `docs/`**
- **No path confusion or duplication**
- **Consistent behavior for all operations**
- **All documents exportable**
