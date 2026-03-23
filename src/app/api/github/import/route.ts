/**
 * GitHub Import API - Simple Endpoint
 * POST /api/github/import
 *
 * Imports markdown files from GitHub repository into workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptToken } from '@/lib/encryption';
import { importFromGitHub } from '@/lib/github-simple-import';
import { ActivityTracker } from '@/lib/activity';
import { getCurrentUser } from '@/lib/session';
import { deriveTitleFromMarkdownPath } from '@/lib/github-path-utils';
import { resolveWorkspaceGitHubAuth } from '@/lib/github-workspace-auth';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

interface ImportRequest {
  workspaceId: string;
  repository: string;
  branch?: string;
  githubPath?: string; // Optional: specific file to import
  documentId?: string; // Optional: update existing document
}

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ImportRequest;
    const { workspaceId, repository, branch = 'main', githubPath, documentId } = body;

    // Validate required fields
    if (!workspaceId || !repository) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, repository' },
        { status: 400 }
      );
    }

    // Verify workspace exists and check permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { githubIntegration: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_IMPORT);

    // Get GitHub auth token — falls back to owner or any connected workspace member
    const githubAuth = await resolveWorkspaceGitHubAuth(workspaceId, user.id);

    if (!githubAuth) {
      return NextResponse.json(
        {
          error:
            'No GitHub account is connected to this workspace. A member with GitHub permissions must connect a GitHub account in workspace GitHub settings.',
        },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = decryptToken(githubAuth.accessToken);

    // Handle single file import if githubPath is provided
    if (githubPath) {
      try {
        const { Octokit } = await import('octokit');
        const octokit = new Octokit({ auth: accessToken });
        const [owner, repo] = repository.split('/');

        // Strip docs/ prefix if present (user provides full GitHub path)
        const normalizedPath = githubPath.replace(/^\/+/, '');
        const filePathToFetch = normalizedPath.startsWith('docs/') ? normalizedPath : githubPath;
        const relativePathToStore = normalizedPath.startsWith('docs/')
          ? normalizedPath.substring(5)
          : normalizedPath;

        // Get file content from GitHub
        const response = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePathToFetch,
          ref: branch,
        });

        if (Array.isArray(response.data) || !('content' in response.data)) {
          return NextResponse.json({ error: 'Path is a directory, not a file' }, { status: 400 });
        }

        // Decode base64 content
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

        // Convert markdown to HTML
        const { markdownToHtml } = await import('@/lib/converters');
        let htmlContent = content;
        try {
          htmlContent = await markdownToHtml(content);
        } catch (error) {
          console.warn('[GitHub Import] Markdown conversion failed, storing raw content:', error);
        }

        const derivedTitle = deriveTitleFromMarkdownPath(relativePathToStore);

        // Update existing document or create new one
        if (documentId) {
          const existingDocument = await prisma.document.findUnique({
            where: { id: documentId },
            select: {
              id: true,
              workspaceId: true,
            },
          });

          if (!existingDocument) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
          }

          if (existingDocument.workspaceId !== workspaceId) {
            return NextResponse.json(
              { error: 'Document does not belong to the specified workspace' },
              { status: 403 }
            );
          }

          await assertPermission(
            user.id,
            existingDocument.workspaceId,
            WORKSPACE_PERMISSION.DOCUMENTS_EDIT
          );

          const updatedDoc = await prisma.document.update({
            where: { id: documentId },
            data: {
              content: htmlContent,
              title: derivedTitle, // Update title
              githubPath: relativePathToStore, // Store relative path
              githubSha: response.data.sha,
            },
          });

          return NextResponse.json({
            success: true,
            document: updatedDoc,
            message: 'Document imported successfully',
          });
        } else {
          // Generate document path (lowercase, no extension)
          const docPath = `/${relativePathToStore
            .replace(/\.(md|markdown)$/i, '')
            .toLowerCase()
            .replace(/\s+/g, '-')}`;

          const newDoc = await prisma.document.create({
            data: {
              title: derivedTitle,
              content: htmlContent,
              githubPath: relativePathToStore, // Store relative path
              githubSha: response.data.sha,
              workspaceId,
              authorId: user.id,
              path: docPath,
            },
          });

          // Track activity for single file import
          await ActivityTracker.trackGitHubImport(user.id, workspaceId, repository, 1);

          return NextResponse.json({
            success: true,
            document: newDoc,
            message: 'Document created successfully',
          });
        }
      } catch (error) {
        console.error('[GitHub Import] Error importing single file:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
      }
    }

    // Perform bulk import (basePath removed - now hardcoded in import logic)
    const result = await importFromGitHub({
      workspaceId,
      repository,
      branch,
      accessToken,
    });

    // Track activity if import was successful
    if (result.success && result.totalImported > 0) {
      await ActivityTracker.trackGitHubImport(
        user.id,
        workspaceId,
        repository,
        result.totalImported
      );
    }

    return NextResponse.json(
      {
        success: result.success,
        totalImported: result.totalImported,
        totalSkipped: result.totalSkipped,
        files: result.files,
        errors: result.errors,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[GitHub Import API] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
  }
}
