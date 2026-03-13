# GitHub Image Sync Implementation

## Overview

This document describes the image handling system for GitHub synchronization in DocHub. The system prevents base64 image bloat in GitHub repositories by extracting embedded images and storing them separately.

## Problem Statement

Previously, images were embedded as base64 data URIs directly in the HTML content:

```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." />
```

This caused several issues:

1. **Large file sizes**: Base64 encoding increases file size by ~33%
2. **Poor GitHub integration**: GitHub can't display base64 images in markdown preview
3. **Difficult diffing**: Changes appear as massive binary blobs in git diffs
4. **Repository bloat**: Every image change duplicates the entire image data

## Solution Architecture

### Two-Part System

#### 1. Editor Image Uploads (Real-time)

When users paste or drag-and-drop images in the TipTap editor:

- Images are uploaded to `/public/uploads/images/` via API
- Files are named using MD5 hash for deduplication
- Editor receives URL path: `/uploads/images/[hash].png`
- Images stored locally (not in GitHub yet)

**Flow:**

```
User pastes image → uploadImage() → POST /api/upload/image
→ Save to /public/uploads/images/[hash].ext → Return URL
→ TipTap inserts <img src="/uploads/images/[hash].ext">
```

#### 2. GitHub Sync Image Processing (On sync)

When syncing document to GitHub:

- Extract all base64 images from HTML
- Upload each image to GitHub at: `${basePath}/assets/${documentId}/[hash].ext`
- Replace image src with relative path: `./assets/${documentId}/[hash].ext`
- Convert HTML to Markdown with updated paths
- Commit markdown file with relative image references

**Flow:**

```
syncToGitHub() → processImagesForGitHub()
→ extractBase64Images() → Find all data:image URIs
→ uploadImagesToGitHub() → Upload each to GitHub
→ replaceImagesInHtml() → Update src attributes
→ htmlToMarkdown() → Convert to markdown
→ Commit markdown file
```

## Implementation Files

### Core Files

1. **`src/lib/github-image-extractor.ts`**
   - `extractBase64Images()` - Find all data URIs in HTML
   - `uploadImagesToGitHub()` - Upload images to GitHub API
   - `replaceImagesInHtml()` - Update image src attributes
   - `replaceImagesInMarkdown()` - Update markdown image syntax
   - `processImagesForGitHub()` - Main orchestration function

2. **`src/lib/imageUpload.ts`**
   - `uploadImage()` - Upload to server API (updated)
   - `handleImagePaste()` - Handle paste events
   - `handleImageDrop()` - Handle drag-and-drop

3. **`src/app/api/upload/image/route.ts`**
   - `POST /api/upload/image` - Upload endpoint
   - `DELETE /api/upload/image` - Cleanup endpoint

4. **`src/lib/github-sync-service.ts`**
   - Updated `syncToGitHub()` to process images before markdown conversion

## GitHub Repository Structure

```
repository/
├── docs/
│   ├── planning/
│   │   ├── general/
│   │   │   └── project-overview.md
│   │   └── assets/
│   │       └── doc-id-123/
│   │           ├── a1b2c3d4.png
│   │           └── e5f6g7h8.jpg
│   └── development/
│       ├── api-docs/
│       │   └── authentication.md
│       └── assets/
│           └── doc-id-456/
│               └── screenshot.png
```

## Image Processing Details

### Filename Generation

Images are named using MD5 hash of content:

```typescript
const hash = crypto.createHash('md5').update(base64Data).digest('hex').substring(0, 8);
const filename = `${hash}.${extension}`;
```

### Relative Path Format

From markdown file to image:

```markdown
# Document in: docs/planning/general/project-overview.md

# Image at: docs/planning/assets/doc-id-123/screenshot.png

![Screenshot](./assets/doc-id-123/screenshot.png)
```

### Markdown Conversion

```html
<!-- HTML -->
<img src="data:image/png;base64,..." alt="Screenshot" />

<!-- After processing -->
<img src="./assets/doc-id-123/a1b2c3d4.png" alt="Screenshot" />

<!-- Markdown output -->
![Screenshot](./assets/doc-id-123/a1b2c3d4.png)
```

## API Endpoints

### POST /api/upload/image

Upload an image file from the editor.

**Request:**

```typescript
FormData {
  file: File
}
```

**Response:**

```json
{
  "url": "/uploads/images/a1b2c3d4.png",
  "filename": "a1b2c3d4.png",
  "size": 12345,
  "type": "image/png"
}
```

**Usage in TipTap:**

```typescript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload/image', {
  method: 'POST',
  body: formData,
});

const { url } = await response.json();
editor.chain().focus().setImage({ src: url }).run();
```

## Error Handling

### Upload Failures

If server upload fails, system falls back to base64 encoding:

```typescript
try {
  // Try uploading to server
  return await uploadToServer(file);
} catch (error) {
  console.warn('Falling back to base64 encoding');
  return base64Encode(file);
}
```

### Missing Images on Sync

If base64 image extraction fails, the sync continues with the original markdown.

### GitHub API Errors

- **404**: Image upload path doesn't exist (creates new)
- **403**: Permission denied (throws error, stops sync)
- **409**: Conflict (overwrites with new SHA)

## Performance Optimizations

1. **Deduplication**: Same image content = same filename (MD5 hash)
2. **Parallel uploads**: Images uploaded concurrently to GitHub
3. **Conditional uploads**: Checks if image exists before uploading
4. **Efficient parsing**: Uses cheerio for fast HTML parsing

## Security Considerations

1. **File validation**:
   - Type checking (must be image/\*)
   - Size limit (5MB max)
   - Extension validation

2. **Path security**:
   - No path traversal allowed
   - Filenames sanitized
   - Directory restrictions enforced

3. **Authentication**:
   - User must be authenticated
   - GitHub token validated
   - Workspace permissions checked

## Migration Path

### Existing Documents with Base64 Images

On next sync:

1. System extracts all base64 images
2. Uploads to GitHub assets directory
3. Updates document content with relative paths
4. Future syncs use relative paths

### Manual Migration

To migrate all documents:

```typescript
// Run for each document with base64 images
await syncToGitHub(documentId, config);
// Images automatically extracted and uploaded
```

## Troubleshooting

### Images not displaying on GitHub

**Issue**: Relative paths incorrect

**Solution**: Check that:

- Base path configured correctly
- Document githubPath is accurate
- Assets directory structure matches

### Upload errors

**Issue**: Filesystem permissions

**Solution**: Ensure `/public/uploads/images/` is writable:

```bash
mkdir -p public/uploads/images
chmod 755 public/uploads/images
```

### Large repository size

**Issue**: Duplicate images

**Solution**: Images are deduplicated by content hash automatically

## Future Enhancements

1. **Cloud storage integration**: Upload to S3/CloudFlare R2 instead of local filesystem
2. **Image optimization**: Compress images before upload
3. **Batch processing**: Bulk migrate all documents
4. **CDN integration**: Serve images from CDN for faster loading
5. **Image versioning**: Track image changes over time
6. **Lazy loading**: Load images on-demand in editor

## Testing

### Unit Tests

```typescript
describe('extractBase64Images', () => {
  it('extracts multiple images from HTML', () => {
    const html = '<img src="data:image/png;base64,abc">';
    const images = extractBase64Images(html, 'doc-123', 'docs');
    expect(images).toHaveLength(1);
  });
});
```

### Integration Tests

```typescript
describe('GitHub sync with images', () => {
  it('uploads images and updates markdown', async () => {
    const result = await syncToGitHub(docId, config);
    expect(result.status).toBe('success');
    // Verify images uploaded to GitHub
    // Verify markdown contains relative paths
  });
});
```

## References

- [TipTap Image Extension](https://tiptap.dev/api/nodes/image)
- [GitHub REST API - Create or Update File](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Turndown (HTML to Markdown)](https://github.com/mixmark-io/turndown)
