import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import {
  getFileContent,
  generateContentHash,
  markdownToHtml,
  createGitHubClient,
} from '@/lib/github';
import { z } from 'zod';
import { ActivityTracker } from '@/lib/activity';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const batchImportSchema = z.object({
  workspaceId: z.string(),
  githubRepository: z.string(),
  githubBranch: z.string().default('main'),
  paths: z.array(z.string()).optional(), // Specific paths to import
  includeSubdirectories: z.boolean().default(true),
  linkToGitHub: z.boolean().default(true),
  autoSync: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = batchImportSchema.parse(body);

    await assertPermission(user.id, data.workspaceId, WORKSPACE_PERMISSION.GITHUB_IMPORT);

    // Check workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: data.workspaceId,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 });
    }

    // Get GitHub auth token
    const githubAuth = await prisma.gitHubAuth.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: data.workspaceId,
        },
      },
    });

    if (!githubAuth) {
      return NextResponse.json({ error: 'GitHub not linked' }, { status: 400 });
    }

    const [owner, repo] = data.githubRepository.split('/');
    const octokit = createGitHubClient(githubAuth.accessToken);

    // Get repository tree
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${data.githubBranch}`,
    });

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: refData.object.sha,
      recursive: data.includeSubdirectories ? 'true' : undefined,
    });

    // Filter markdown files
    let filesToImport = treeData.tree.filter(
      (item) =>
        item.type === 'blob' &&
        item.path &&
        (item.path.endsWith('.md') || item.path.endsWith('.mdx'))
    );

    // Filter by specific paths if provided
    if (data.paths && data.paths.length > 0) {
      filesToImport = filesToImport.filter((item) =>
        data.paths!.some((path) => item.path?.startsWith(path))
      );
    }

    const importedDocuments = [];
    const errors = [];

    // Import each file
    for (const file of filesToImport) {
      if (!file.path) continue;

      try {
        // Check if document already exists
        const existingDoc = await prisma.document.findFirst({
          where: {
            workspaceId: data.workspaceId,
            path: file.path,
          },
        });

        if (existingDoc) {
          errors.push({
            path: file.path,
            error: 'Document already exists',
          });
          continue;
        }

        // Fetch content
        const fileData = await getFileContent(owner, repo, file.path, githubAuth.accessToken);

        if (!fileData) {
          errors.push({
            path: file.path,
            error: 'File not found on GitHub',
          });
          continue;
        }

        // Convert to HTML
        const htmlContent = markdownToHtml(fileData.content);

        // Generate title from path
        const title =
          file.path
            .split('/')
            .pop()
            ?.replace(/\.mdx?$/, '') || 'Untitled';

        // Create document
        const document = await prisma.document.create({
          data: {
            title,
            content: htmlContent,
            path: file.path,
            workspaceId: data.workspaceId,
            authorId: user.id,
            type: 'GENERAL',
            status: 'PUBLISHED',
          },
        });

        // Create initial version
        await prisma.version.create({
          data: {
            documentId: document.id,
            content: htmlContent,
            message: `Imported from GitHub: ${data.githubRepository}/${file.path}`,
            authorId: user.id,
            version: 1,
            sha: generateContentHash(htmlContent).slice(0, 40),
          },
        });

        // Create sync link if requested
        if (data.linkToGitHub && fileData) {
          const markdownHash = generateContentHash(fileData.content);
          const htmlHash = generateContentHash(htmlContent);

          const syncInfo = await prisma.docSyncInfo.create({
            data: {
              documentId: document.id,
              workspaceId: data.workspaceId,
              githubRepository: data.githubRepository,
              githubBranch: data.githubBranch,
              githubPath: file.path,
              syncDirection: 'BIDIRECTIONAL',
              autoSync: data.autoSync,
              lastDerivedHash: htmlHash,
              lastExternalHash: markdownHash,
              derivedVersion: 1,
              externalVersion: 1,
              syncStatus: 'SYNCED',
              needSyncToGitHub: false,
              needSyncFromGitHub: false,
              lastSyncedAt: new Date(),
            },
          });

          await prisma.syncEvent.create({
            data: {
              syncInfoId: syncInfo.id,
              eventType: 'batch_import',
              direction: 'from_github',
              status: 'success',
              message: `Document imported via batch import`,
              metadata: {
                repository: data.githubRepository,
                branch: data.githubBranch,
                path: file.path,
              },
            },
          });
        }

        importedDocuments.push({
          id: document.id,
          title: document.title,
          path: file.path,
        });
      } catch (error) {
        errors.push({
          path: file.path,
          error: error instanceof Error ? error.message : 'Import error',
        });
      }
    }

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'GITHUB_REPO_SYNCED',
        actorId: user.id,
        workspaceId: data.workspaceId,
        entityType: 'GitHubRepo',
        entityId: data.githubRepository,
        metadata: {
          repository: data.githubRepository,
          branch: data.githubBranch,
          importedCount: importedDocuments.length,
          errorCount: errors.length,
        },
      },
    });

    // Track import activity if there were successful imports
    if (importedDocuments.length > 0) {
      await ActivityTracker.trackGitHubImport(
        user.id,
        data.workspaceId,
        data.githubRepository,
        importedDocuments.length
      );
    }

    return NextResponse.json({
      success: true,
      imported: importedDocuments,
      errors,
      summary: {
        total: filesToImport.length,
        imported: importedDocuments.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error in batch import:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
