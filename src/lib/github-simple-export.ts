/**
 * Simple GitHub Export Service
 * Exports documents back to GitHub repository
 *
 * Features:
 * - Exports only documents with githubPath set
 * - Preserves folder structure
 * - Updates existing files or creates new ones
 * - Sequential processing (no memory spikes)
 */

import { Octokit } from 'octokit';
import { prisma } from './prisma';
import { htmlToMarkdownSafe } from './converters';

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
 * Resolve GitHub export path:
 * - Root files (README.md, LICENSE, etc.) stay at root
 * - All other documents go into docs/ folder
 *
 * Examples:
 * - resolveGitHubExportPath('README.md') => 'README.md'
 * - resolveGitHubExportPath('planning/general/ghgh.md') => 'docs/planning/general/ghgh.md'
 * - resolveGitHubExportPath('review/guide/file11.md') => 'docs/review/guide/file11.md'
 */
function resolveGitHubExportPath(relativePath: string): string {
  // Normalize path - remove leading/trailing slashes
  const normalizedPath = relativePath.replace(/^\/+/, '').replace(/\/+$/, '');

  // Extract filename from path
  const parts = normalizedPath.split('/');
  const filename = parts[parts.length - 1];

  // Check if this is a root file (case-insensitive)
  const isRootFile = ROOT_FILES.some((rf) => rf.toLowerCase() === filename.toLowerCase());

  if (isRootFile) {
    // Keep root files at root
    return filename;
  } else {
    // Everything else goes in docs/
    return `docs/${normalizedPath}`;
  }
}

/**
 * Generate GitHub path from document title or path if not set
 * Examples:
 * - 'My Document' => 'my-document.md'
 * - '/planning/general/notes' => 'planning/general/notes.md'
 */
function generateGitHubPath(document: { title: string; path: string }): string {
  // Try to use document path first, fallback to title
  let pathBase = document.path || document.title;

  // Remove leading slashes
  pathBase = pathBase.replace(/^\/+/, '');

  // Convert to lowercase and replace spaces with hyphens
  pathBase = pathBase.toLowerCase().replace(/\s+/g, '-');

  // Add .md extension if not present
  if (!pathBase.endsWith('.md') && !pathBase.endsWith('.markdown')) {
    pathBase = pathBase + '.md';
  }

  return pathBase;
}

interface ExportOptions {
  workspaceId: string;
  repository: string; // owner/repo format
  branch: string;
  accessToken: string;
  documentIds?: string[]; // Optional: specific documents to export
  customPath?: string; // Optional: custom path for single document export
}

interface ExportResult {
  success: boolean;
  totalExported: number;
  totalSkipped: number;
  files: Array<{
    documentPath: string;
    githubPath: string;
    status: 'created' | 'updated' | 'skipped' | 'error';
    reason?: string;
  }>;
  errors: string[];
}

/**
 * Convert HTML content to markdown-compatible text
 */
async function contentToMarkdown(content: string): Promise<string> {
  try {
    return await htmlToMarkdownSafe(content);
  } catch {
    // Fallback: return as-is if conversion fails
    return content;
  }
}

/**
 * Get file SHA from GitHub (for updating existing files)
 */
async function getExistingFileSha(
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

    if (!Array.isArray(response.data) && 'sha' in response.data) {
      return response.data.sha;
    }

    return null;
  } catch (_error) {
    // File doesn't exist or error occurred, return null
    return null;
  }
}

/**
 * Create or update file in GitHub
 */
async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  branch: string,
  message: string,
  authorName: string,
  authorEmail: string,
  existingSha?: string | null
): Promise<{ success: boolean; sha?: string; error?: string }> {
  try {
    const encodedContent = Buffer.from(content).toString('base64');

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: encodedContent,
      branch,
      author: {
        name: authorName,
        email: authorEmail,
      },
      committer: {
        name: authorName,
        email: authorEmail,
      },
      ...(existingSha && { sha: existingSha }),
    });

    const contentData = response.data.content;
    const contentSha =
      contentData && typeof contentData === 'object' && 'sha' in contentData
        ? (contentData as { sha?: string }).sha
        : undefined;

    return {
      success: true,
      sha: contentSha,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Export documents to GitHub
 */
export async function exportToGitHub(options: ExportOptions): Promise<ExportResult> {
  const { workspaceId, repository, branch, accessToken, documentIds, customPath } = options;

  console.log(`[GitHub Export] Starting export to ${repository}:${branch} (docs/ + root files)`);

  const result: ExportResult = {
    success: true,
    totalExported: 0,
    totalSkipped: 0,
    files: [],
    errors: [],
  };

  try {
    // Fetch workspace with integration to get basePath
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: true,
        githubIntegration: true,
        documents: {
          where: documentIds && documentIds.length > 0 ? { id: { in: documentIds } } : {}, // Export ALL documents if no filter
          include: {
            author: true,
          },
        },
      },
    });

    if (!workspace) {
      result.errors.push('Workspace not found');
      result.success = false;
      return result;
    }

    const documentsToExport = workspace.documents;
    console.log(`[GitHub Export] Found ${documentsToExport.length} documents to export`);

    if (documentsToExport.length === 0) {
      result.totalSkipped = 0;
      return result;
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: accessToken });
    const [owner, repo] = repository.split('/');

    // Export documents sequentially
    for (const doc of documentsToExport) {
      try {
        // Determine relative GitHub path
        let relativePath: string;

        if (customPath) {
          // Use custom path for single document export
          relativePath = customPath;
        } else if (doc.githubPath) {
          // Use existing githubPath (stored as relative path)
          relativePath = doc.githubPath;
        } else {
          // Generate path from document title/path
          relativePath = generateGitHubPath(doc);
          console.log(`[GitHub Export] Generated path for "${doc.title}": ${relativePath}`);
        }

        // Ensure .md extension
        if (!relativePath.endsWith('.md') && !relativePath.endsWith('.markdown')) {
          relativePath = relativePath + '.md';
        }

        // Resolve full GitHub path - root files stay at root, others go to docs/
        const fullGitHubPath = resolveGitHubExportPath(relativePath);
        console.log(`[GitHub Export] Exporting "${doc.title}" to ${fullGitHubPath}`);

        // Convert content to markdown
        const markdown = await contentToMarkdown(doc.content);

        // Check if file exists and get SHA for update
        const existingSha = await getExistingFileSha(octokit, owner, repo, fullGitHubPath, branch);
        const isUpdate = existingSha !== null;

        // Create or update file
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
          existingSha
        );

        if (exportResult.success) {
          console.log(`[GitHub Export] ✓ ${isUpdate ? 'Updated' : 'Created'} ${fullGitHubPath}`);
          result.files.push({
            documentPath: doc.path,
            githubPath: fullGitHubPath,
            status: isUpdate ? 'updated' : 'created',
          });
          result.totalExported++;

          // Update document with relative githubPath (without basePath prefix)
          if (relativePath !== doc.githubPath) {
            await prisma.document.update({
              where: { id: doc.id },
              data: {
                githubPath: relativePath,
                githubSha: exportResult.sha,
              },
            });
          }
        } else {
          console.error(
            `[GitHub Export] ✗ Failed to export ${fullGitHubPath}: ${exportResult.error}`
          );
          result.files.push({
            documentPath: doc.path,
            githubPath: fullGitHubPath,
            status: 'error',
            reason: exportResult.error,
          });
          result.totalSkipped++;
        }

        // Force GC every 10 files to prevent memory buildup
        if (result.totalExported % 10 === 0) {
          const runtime = globalThis as typeof globalThis & { gc?: () => void };
          if (typeof runtime.gc === 'function') {
            runtime.gc();
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[GitHub Export] Error exporting ${doc.path}:`, errorMsg);
        result.files.push({
          documentPath: doc.path,
          githubPath: doc.githubPath || '',
          status: 'error',
          reason: errorMsg,
        });
        result.totalSkipped++;
      }
    }

    console.log(
      `[GitHub Export] Export completed: ${result.totalExported} exported, ${result.totalSkipped} skipped`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[GitHub Export] Fatal error:`, error);
    result.errors.push(errorMsg);
    result.success = false;
  }

  return result;
}
