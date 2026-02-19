/**
 * GitHub Image Extraction & Upload
 * Extracts base64 images from HTML and uploads them to GitHub
 */

import { Octokit } from 'octokit';
import crypto from 'crypto';

export interface ExtractedImage {
  originalSrc: string;
  base64Data: string;
  mimeType: string;
  extension: string;
  filename: string;
  githubPath: string;
  relativePath: string;
}

export interface ImageUploadResult {
  originalSrc: string;
  githubUrl: string;
  relativePath: string;
}

/**
 * Extract all base64 images from HTML (memory-safe regex version)
 */
export function extractBase64Images(
  html: string,
  documentId: string,
  basePath: string
): ExtractedImage[] {
  const images: ExtractedImage[] = [];

  // Use regex to find img tags with base64 data URIs (memory-efficient)
  // Match: <img...src="data:image/...;base64,..."...>
  const imgRegex = /<img[^>]+src=["']data:(image\/[a-z]+);base64,([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const mimeType = match[1];
    const base64Data = match[2];

    // Get file extension from MIME type
    const extension = mimeType.split('/')[1] || 'png';

    // Generate unique filename based on content hash
    const hash = crypto.createHash('md5').update(base64Data).digest('hex').substring(0, 8);
    const filename = `${hash}.${extension}`;

    // GitHub path and relative path
    const githubPath = `${basePath}/assets/${documentId}/${filename}`;
    const relativePath = `./assets/${documentId}/${filename}`;

    images.push({
      originalSrc: `data:${mimeType};base64,${base64Data}`,
      base64Data,
      mimeType,
      extension,
      filename,
      githubPath,
      relativePath,
    });
  }

  return images;
}

/**
 * Upload images to GitHub
 */
export async function uploadImagesToGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  images: ExtractedImage[],
  commitMessage: string,
  author: { name: string; email: string }
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];

  for (const image of images) {
    try {
      console.log(`[GitHub Images] Uploading ${image.filename} to ${image.githubPath}`);

      // Check if image already exists
      let existingSha: string | undefined;
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: image.githubPath,
          ref: branch,
        });

        if (!Array.isArray(data) && data.type === 'file') {
          existingSha = data.sha;
          console.log(`[GitHub Images] Image ${image.filename} already exists, updating`);
        }
      } catch (error) {
        const status =
          error && typeof error === 'object' && 'status' in error
            ? (error as { status?: number }).status
            : undefined;

        if (status !== 404) {
          throw error;
        }
        // Image doesn't exist, will create new
      }

      // Upload image to GitHub
      const result = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: image.githubPath,
        message: `${commitMessage} - Upload image ${image.filename}`,
        content: image.base64Data,
        branch,
        ...(existingSha && { sha: existingSha }),
        author,
        committer: author,
      });

      console.log(`[GitHub Images] Successfully uploaded ${image.filename}`);

      results.push({
        originalSrc: image.originalSrc,
        githubUrl: result.data.content?.html_url || '',
        relativePath: image.relativePath,
      });
    } catch (error) {
      console.error(`[GitHub Images] Failed to upload ${image.filename}:`, error);
      throw new Error(`Failed to upload image ${image.filename}: ${error}`);
    }
  }

  return results;
}

/**
 * Replace base64 images in HTML with GitHub paths
 */
export function replaceImagesInHtml(html: string, imageResults: ImageUploadResult[]): string {
  let updatedHtml = html;

  // Replace each base64 image src with GitHub path using regex (memory-safe)
  for (const result of imageResults) {
    // Escape special regex characters in the original src
    const escapedSrc = result.originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace src="data:image/..." with src="./assets/..."
    const regex = new RegExp(`src=["']${escapedSrc}["']`, 'gi');
    updatedHtml = updatedHtml.replace(regex, `src="${result.relativePath}"`);
  }

  return updatedHtml;
}

/**
 * Replace base64 images in markdown with GitHub paths
 */
export function replaceImagesInMarkdown(
  markdown: string,
  imageResults: ImageUploadResult[]
): string {
  let updatedMarkdown = markdown;

  for (const result of imageResults) {
    // Replace inline images: ![alt](data:image/...)
    // Match both with and without alt text
    const inlinePattern = new RegExp(
      `!\\[([^\\]]*)\\]\\(${escapeRegex(result.originalSrc)}\\)`,
      'g'
    );
    updatedMarkdown = updatedMarkdown.replace(inlinePattern, `![$1](${result.relativePath})`);

    // Replace reference-style images: [id]: data:image/...
    const referencePattern = new RegExp(
      `^\\[([^\\]]+)\\]:\\s*${escapeRegex(result.originalSrc)}`,
      'gm'
    );
    updatedMarkdown = updatedMarkdown.replace(referencePattern, `[$1]: ${result.relativePath}`);
  }

  return updatedMarkdown;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main function: Extract images from HTML, upload to GitHub, return updated HTML
 */
export async function processImagesForGitHub(
  html: string,
  documentId: string,
  octokit: Octokit,
  config: {
    owner: string;
    repo: string;
    branch: string;
    basePath: string;
    commitMessage: string;
    author: { name: string; email: string };
  }
): Promise<{ updatedHtml: string; imageCount: number }> {
  // Extract all base64 images
  const images = extractBase64Images(html, documentId, config.basePath);

  if (images.length === 0) {
    console.log('[GitHub Images] No base64 images found in document');
    return { updatedHtml: html, imageCount: 0 };
  }

  console.log(`[GitHub Images] Found ${images.length} base64 images to upload`);

  // Upload images to GitHub
  const imageResults = await uploadImagesToGitHub(
    octokit,
    config.owner,
    config.repo,
    config.branch,
    images,
    config.commitMessage,
    config.author
  );

  // Replace base64 images with GitHub paths in HTML
  const updatedHtml = replaceImagesInHtml(html, imageResults);

  console.log(`[GitHub Images] Replaced ${imageResults.length} images with GitHub paths`);

  return { updatedHtml, imageCount: imageResults.length };
}
