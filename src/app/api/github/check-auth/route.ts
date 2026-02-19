import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
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

    // Check if user has GitHub auth for this workspace
    const githubAuth = await prisma.gitHubAuth.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspaceId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      connected: !!githubAuth,
      connectedAt: githubAuth?.createdAt || null,
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
