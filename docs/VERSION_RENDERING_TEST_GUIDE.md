# Version Content Rendering - Manual Test Guide

## Overview

This guide helps you verify that the version preview correctly renders HTML content from TipTap editor.

---

## Test 1: Basic HTML Rendering

### Setup:

1. Create a new document with the following content:

```markdown
# API Guide

## Authentication

This section explains **authentication**.

### Steps:

1. First step
2. Second step
3. Third step

Use `code blocks` for inline code.

> This is a blockquote with _emphasis_ and **bold** text.
```

2. Save as "Version 1"

### Test:

1. Open Version History sidebar
2. Click the three dots (⋮) next to Version 1
3. Click **"View"**

### Expected Result:

✅ Version preview shows:

- Properly formatted heading hierarchy (# → large, ## → medium, ### → small)
- Bold text renders as **bold**
- Italic text renders as _italic_
- Numbered list displays correctly (1, 2, 3)
- Inline code has gray background
- Blockquote has left border

### Current Bug (if unfixed):

❌ Would show raw HTML like:

```
<h1>API Guide</h1><h2>Authentication</h2><p>This section explains <strong>authentication</strong>.</p>...
```

---

## Test 2: Complex Content (Tables, Task Lists, Code Blocks)

### Setup:

Create a document with:

```markdown
## Feature Comparison

| Feature | Basic | Pro  |
| ------- | ----- | ---- |
| Storage | 5GB   | 50GB |
| Users   | 1     | 10   |

## Task List

- [x] Implement auth
- [ ] Add tests
- [ ] Deploy

## Code Example

\`\`\`javascript
function hello() {
console.log("Hello World");
}
\`\`\`
```

### Test:

1. Save version
2. View version in preview modal

### Expected Result:

✅ Version preview shows:

- Table with proper borders and alignment
- Checkboxes render (✓ for checked, ☐ for unchecked)
- Code block has syntax highlighting (if available) or monospace font

---

## Test 3: XSS Protection

### Setup:

**IMPORTANT:** This test verifies security. Do NOT skip this.

1. Create a document and switch to HTML source mode (if available) or use API
2. Insert malicious HTML:

```html
<p>Safe content</p>
<script>
  alert('XSS Attack!');
</script>
<img src="x" onerror="alert('XSS')" />
<a href="javascript:alert('XSS')">Click me</a>
```

3. Save version

### Test:

1. View version in preview modal
2. Check browser console for errors

### Expected Result:

✅ Security verification:

- NO alert popups appear
- `<script>` tags completely removed
- `onerror` attributes stripped from `<img>`
- `javascript:` URLs sanitized from links
- Safe content (`<p>`) preserved
- Browser console shows no XSS warnings

### If This Fails:

❌ **CRITICAL SECURITY ISSUE** - Stop and investigate immediately

---

## Test 4: Empty/Edge Cases

### Test 4a: Empty Version

1. Create document
2. Save version with only whitespace
3. View version

**Expected:** Shows "No content available" message

### Test 4b: Very Large Content

1. Create document with 1000+ lines
2. Save version
3. View version

**Expected:**

- Content renders without crashing
- Scrollbar appears in preview modal
- Performance is acceptable (<2s load time)

---

## Test 5: GitHub Export Compatibility

### Setup:

1. Create document with mixed formatting:
   - Headings (H1-H6)
   - Lists (ordered/unordered)
   - Code blocks
   - Tables
   - Links
   - Images

2. Export to GitHub

### Test:

1. Go to GitHub repository
2. Find exported file
3. Open file in GitHub's markdown preview

### Expected Result:

✅ GitHub file shows:

- Content properly formatted as markdown
- All formatting preserved (headings, lists, tables, code)
- No HTML tags visible in markdown source
- Images/links work correctly

---

## Test 6: Format Detection Logging

### Setup:

1. Open browser DevTools → Console
2. Create a new document
3. Add content and save

### Test:

Watch console for log messages like:

```
[Initial Version Creation] Document abc123 - Format: HTML, Size: 1234 chars
```

When saving subsequent versions:

```
[Version Creation] Document abc123 - Format: HTML, Version: 2, Size: 1456 chars
```

### Expected Result:

✅ Console logs show:

- Format detected as "HTML" (TipTap's output)
- Correct version number
- Accurate byte size

---

## Test 7: Regression Check

### Verify Previous Fixes Still Work:

#### Bug 1: Version Preview (from original fix)

- Version preview shows formatted content ✅
- NOT raw markdown or HTML tags ✅

#### Bug 2: Empty Initial Version (from original fix)

1. Create document
2. Use **Replace** (not Save Version)
3. Edit again and **Save Version**
4. Check Version History → Initial version still has content ✅

---

## Troubleshooting

### Issue: Preview shows "No content available"

**Possible causes:**

- Version content is actually empty
- Check database: `SELECT content FROM Version WHERE id='...'`
- Run repair script: `npx tsx scripts/repair-empty-versions.ts`

### Issue: Content still shows HTML tags

**Possible causes:**

- DOMPurify not installed: `npm install isomorphic-dompurify`
- Component not updated: Check VersionHistory.tsx uses `VersionContentRenderer`
- Browser cache: Hard refresh (Ctrl+Shift+R)

### Issue: XSS test shows alert popups

**Possible causes:**

- **CRITICAL:** DOMPurify not working
- Check sanitization config in VersionContentRenderer.tsx
- Verify `ALLOWED_TAGS` and `ALLOWED_ATTR` arrays
- Run: `npx tsx scripts/test-xss-protection.ts`

### Issue: GitHub export broken

**Possible causes:**

- Check `htmlToMarkdownSafe()` function in converters.ts
- Verify export route uses content conversion
- Test with: `npm run test` (if tests exist)

---

## Success Criteria

### ✅ All Tests Pass If:

1. Version preview renders HTML with proper formatting
2. Complex elements (tables, task lists, code) display correctly
3. NO XSS vulnerabilities (all malicious content stripped)
4. Empty versions handled gracefully
5. GitHub export produces valid markdown
6. Console logging shows format detection
7. Previous bug fixes remain functional

### 📊 Performance Benchmarks:

- Version preview opens: <500ms
- Large document (100KB): <2s render
- XSS sanitization: <10ms per version
- GitHub export: <5s for typical documents

---

## Reporting Issues

If any test fails:

1. **Note which test failed** (Test 1-7 number)
2. **Reproduce steps** (exact sequence)
3. **Check browser console** for errors
4. **Check network tab** for failed API calls
5. **Check server logs** for backend errors
6. **Run typecheck**: `npx tsc --noEmit`
7. **Check DB**: Verify version.content field

**Include in bug report:**

- Test number and name
- Expected vs actual result
- Console errors (if any)
- Browser and version
- Screenshot of issue
