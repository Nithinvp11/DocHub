import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/github';
import { decryptToken } from '@/lib/encryption';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

    // Get GitHub auth token
    const githubAuth = await prisma.gitHubAuth.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!githubAuth) {
      return NextResponse.json(
        {
          linked: false,
          message: 'GitHub not linked',
        },
        { status: 200 }
      );
    }

    // Get GitHub user info
    const githubUser = await getAuthenticatedUser(decryptToken(githubAuth.accessToken));

    return NextResponse.json({
      linked: true,
      github: {
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
        profile_url: `https://github.com/${githubUser.login}`,
      },
      scope: githubAuth.scope,
      linkedAt: githubAuth.createdAt,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching GitHub profile:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub profile' }, { status: 500 });
  }
}
