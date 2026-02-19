/**
 * GitHub Export API - Simple Endpoint
 * POST /api/github/export
 *
 * Exports documents back to GitHub repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptToken } from '@/lib/encryption';
import { exportToGitHub } from '@/lib/github-simple-export';
import { ActivityTracker } from '@/lib/activity';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

interface ExportRequest {
  workspaceId: string;
  repository: string;
  branch?: string;
  documentIds?: string[]; // Optional: specific documents to export
  customPath?: string; // Optional: custom GitHub path for single document
}

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ExportRequest;
    const { workspaceId, repository, branch = 'main', documentIds, customPath } = body;

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
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_EXPORT);

    // Get GitHub auth token
    const githubAuth = await prisma.gitHubAuth.findFirst({
      where: {
        userId: user.id,
        workspaceId,
      },
    });

    if (!githubAuth) {
      return NextResponse.json(
        { error: 'GitHub not connected. Please connect your GitHub account first.' },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = decryptToken(githubAuth.accessToken);

    // Perform export (basePath removed - now hardcoded in export logic)
    const result = await exportToGitHub({
      workspaceId,
      repository,
      branch,
      accessToken,
      documentIds,
      customPath,
    });

    // Track activity if export was successful
    if (result.success && result.totalExported > 0) {
      await ActivityTracker.trackGitHubExport(
        user.id,
        workspaceId,
        repository,
        result.totalExported
      );
    }

    return NextResponse.json(
      {
        success: result.success,
        totalExported: result.totalExported,
        totalSkipped: result.totalSkipped,
        files: result.files,
        errors: result.errors,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message, success: false }, { status: error.status });
    }

    console.error('[GitHub Export API] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
  }
}
