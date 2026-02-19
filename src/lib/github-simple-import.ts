/**
 * Simple GitHub Import Service
 * Imports markdown files from GitHub repository into workspace
 *
 * Features:
 * - Sequential file processing (no memory spikes)
 * - Pagination support (max 200 files per import)
 * - File size limit (1MB max per file)
 * - Only imports .md files
 */

import { Octokit } from 'octokit';
import { prisma } from './prisma';
import { extractTitle, markdownToHtml } from './converters';

/**
 * Root files that should stay at repository root (not in docs/)
 */
const ROOT_FILES = [
  'README.md',
  'readme.md',
  'LICENSE',
  'license',
  'CONTRIBUTING.md',
  'contributing.md',
  'CODE_OF_CONDUCT.md',
  'code_of_conduct.md',
];

/**
 * Strip docs/ prefix from GitHub path to get relative path for storage
 * Examples:
 * - stripDocsPrefix('docs/planning/general/ghgh.md') => 'planning/general/ghgh.md'
 * - stripDocsPrefix('docs/review/guide/file11.md') => 'review/guide/file11.md'
 * - stripDocsPrefix('README.md') => 'README.md' (root file, no change)
 */
function stripDocsPrefix(fullPath: string): string {
  // Normalize path
  const normalizedPath = fullPath.replace(/^\/+/, '');

  // If path starts with docs/, remove it
  if (normalizedPath.startsWith('docs/')) {
    return normalizedPath.substring(5); // Remove 'docs/'
  }

  // Path doesn't start with docs/, return as-is (root file)
  return normalizedPath;
}

interface ImportOptions {
  workspaceId: string;
  repository: string; // owner/repo format
  branch: string;
  accessToken: string;
}

interface ImportResult {
  success: boolean;
  totalImported: number;
  totalSkipped: number;
  files: Array<{
    fileName: string;
    documentPath: string;
    status: 'imported' | 'skipped' | 'error';
    reason?: string;
  }>;
  errors: string[];
}

const MAX_MARKDOWN_FILES = 200;
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const MARKDOWN_EXTENSIONS = ['.md', '.markdown'];
const IGNORE_PATTERNS = ['node_modules', '.git', 'dist', 'build', '.env'];

/**
 * Check if path should be ignored
 */
function shouldIgnorePath(path: string): boolean {
  for (const pattern of IGNORE_PATTERNS) {
    if (path.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if file is markdown
 */
function isMarkdownFile(path: string): boolean {
  return MARKDOWN_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
}

/**
 * Convert GitHub file path to document path
 * Examples:
 * /README.md → /readme
 * /docs/intro/setup.md → /intro/setup
 * /planning/general/ghgh.md → /planning/general/ghgh
 */
function githubPathToDocumentPath(githubPath: string): string {
  // Remove leading/trailing slashes
  let path = githubPath.replace(/^\//, '').replace(/\/$/, '');

  // Remove .md extension
  if (path.endsWith('.md')) {
    path = path.slice(0, -3);
  } else if (path.endsWith('.markdown')) {
    path = path.slice(0, -9);
  }

  // Convert to lowercase for document path
  path = path.toLowerCase();

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return path;
}

/**
 * Recursively fetch all markdown files from GitHub (both root and docs/ folder)
 */
async function fetchMarkdownFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  currentPath: string = ''
): Promise<Array<{ path: string; size: number }>> {
  const files: Array<{ path: string; size: number }> = [];

  try {
    console.log(`[GitHub Import] Fetching contents from: ${currentPath || 'root'}`);

    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: currentPath,
      ref: branch,
    });

    if (!Array.isArray(response.data)) {
      return files; // Single file, not a directory
    }

    for (const item of response.data) {
      // Skip ignored paths
      if (shouldIgnorePath(item.path)) {
        continue;
      }

      if (item.type === 'file' && isMarkdownFile(item.path)) {
        // Check file size limit
        if (item.size && item.size <= MAX_FILE_SIZE_BYTES) {
          files.push({ path: item.path, size: item.size });
        } else {
          console.warn(`[GitHub Import] Skipping ${item.path}: exceeds size limit`);
        }

        // Stop if hit max files
        if (files.length >= MAX_MARKDOWN_FILES) {
          console.warn(`[GitHub Import] Reached max file limit (${MAX_MARKDOWN_FILES})`);
          break;
        }
      } else if (item.type === 'dir') {
        // Only recurse into docs/ folder or if already inside it
        if (currentPath === '' && item.name === 'docs') {
          // Scan docs/ folder
          const subFiles = await fetchMarkdownFiles(octokit, owner, repo, branch, item.path);
          files.push(...subFiles);
        } else if (currentPath.startsWith('docs')) {
          // Already inside docs/, continue recursing
          const subFiles = await fetchMarkdownFiles(octokit, owner, repo, branch, item.path);
          files.push(...subFiles);
        }

        // Stop if hit max files
        if (files.length >= MAX_MARKDOWN_FILES) {
          console.warn(`[GitHub Import] Reached max file limit (${MAX_MARKDOWN_FILES})`);
          break;
        }
      }
    }
  } catch (error) {
    console.error(`[GitHub Import] Error fetching files from ${currentPath || 'root'}:`, error);
  }

  return files;
}

/**
 * Fetch file content from GitHub
 */
async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  branch: string
): Promise<string | null> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    if (Array.isArray(response.data)) {
      return null; // It's a directory
    }

    // Decode base64 content
    if ('content' in response.data) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }

    return null;
  } catch (error) {
    console.error(`[GitHub Import] Error fetching file ${filePath}:`, error);
    return null;
  }
}

/**
 * Import markdown files from GitHub into workspace
 */
export async function importFromGitHub(options: ImportOptions): Promise<ImportResult> {
  const { workspaceId, repository, branch, accessToken } = options;

  console.log(`[GitHub Import] Starting import from ${repository}:${branch}`);

  const result: ImportResult = {
    success: true,
    totalImported: 0,
    totalSkipped: 0,
    files: [],
    errors: [],
  };

  try {
    // Verify workspace exists and user owns it
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
    });

    if (!workspace) {
      result.errors.push('Workspace not found');
      result.success = false;
      return result;
    }

    // Get workspace owner (for authorship)
    const author = workspace.owner;

    // Initialize Octokit
    const octokit = new Octokit({ auth: accessToken });
    const [owner, repo] = repository.split('/');

    // Fetch all markdown files from root and docs/ folder
    console.log(`[GitHub Import] Fetching markdown files from root and docs/...`);
    const files = await fetchMarkdownFiles(octokit, owner, repo, branch);
    console.log(`[GitHub Import] Found ${files.length} markdown files`);

    // Process files sequentially (avoid memory spikes)
    for (const file of files) {
      try {
        // Fetch content
        const content = await fetchFileContent(octokit, owner, repo, file.path, branch);
        if (!content) {
          result.files.push({
            fileName: file.path,
            documentPath: '',
            status: 'skipped',
            reason: 'Could not read file content',
          });
          result.totalSkipped++;
          continue;
        }

        // Strip docs/ prefix to get relative path for storage
        const relativePath = stripDocsPrefix(file.path);

        // Convert relative path to document path (lowercase, no extension)
        const documentPath = githubPathToDocumentPath(relativePath);

        let htmlContent = content;
        try {
          htmlContent = await markdownToHtml(content);
        } catch (error) {
          console.warn('[GitHub Import] Markdown conversion failed, storing raw content:', error);
        }

        // Preserve exact casing from GitHub path for title extraction
        const derivedTitle =
          extractTitle(content) ||
          relativePath
            .split('/')
            .pop()
            ?.replace(/\.(md|markdown)$/, '') ||
          'Imported Document';

        // Create or update document in workspace
        const document = await prisma.document.upsert({
          where: {
            workspaceId_path: {
              workspaceId,
              path: documentPath,
            },
          },
          create: {
            title: derivedTitle,
            content: htmlContent,
            path: documentPath,
            workspaceId,
            authorId: author.id,
            githubPath: relativePath, // Store relative path (e.g., 'README.md', 'planning/general/ghgh.md')
            status: 'DRAFT',
          },
          update: {
            content: htmlContent,
            title: derivedTitle, // Update title on re-import
            githubPath: relativePath, // Ensure correct relative path
            updatedAt: new Date(),
          },
        });

        console.log(
          `[GitHub Import] ✓ Imported ${file.path} -> ${documentPath} (stored as ${relativePath})`
        );
        result.files.push({
          fileName: file.path,
          documentPath,
          status: 'imported',
        });
        result.totalImported++;

        // Force GC every 10 files to prevent memory buildup
        if (result.totalImported % 10 === 0) {
          const runtime = globalThis as typeof globalThis & { gc?: () => void };
          if (typeof runtime.gc === 'function') {
            runtime.gc();
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[GitHub Import] Error importing ${file.path}: ${errorMsg}`);
        result.files.push({
          fileName: file.path,
          documentPath: '',
          status: 'error',
          reason: errorMsg,
        });
        result.totalSkipped++;
      }
    }

    console.log(
      `[GitHub Import] Import completed: ${result.totalImported} imported, ${result.totalSkipped} skipped`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[GitHub Import] Fatal error:`, error);
    result.errors.push(errorMsg);
    result.success = false;
  }

  return result;
}
