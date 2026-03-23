import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { resolveWorkspaceGitHubAuth } from '@/lib/github-workspace-auth';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

/**
 * GET /api/github/check-auth?workspaceId=xxx
 * Check if GitHub is connected for the current user in a specific workspace
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

    // Check if the workspace has any GitHub auth connected (current user preferred, then owner, then any member)
    const githubAuth = await resolveWorkspaceGitHubAuth(workspaceId, user.id);

    return NextResponse.json({
      connected: !!githubAuth,
      connectedAt: githubAuth?.createdAt || null,
      // Indicate whether the current user personally has GitHub connected
      selfConnected: !!(await prisma.gitHubAuth.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId } },
        select: { id: true },
      })),
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[GitHub Check Auth] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
