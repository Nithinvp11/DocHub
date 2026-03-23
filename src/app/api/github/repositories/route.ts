import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { listUserRepositories } from '@/lib/github';
import { decryptToken } from '@/lib/encryption';
import { resolveWorkspaceGitHubAuth } from '@/lib/github-workspace-auth';
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

    // Get GitHub auth token — falls back to owner or any connected workspace member
    const githubAuth = await resolveWorkspaceGitHubAuth(workspaceId, user.id);

    if (!githubAuth) {
      return NextResponse.json({ error: 'GitHub not linked' }, { status: 400 });
    }

    // Fetch repositories from GitHub
    const repos = await listUserRepositories(decryptToken(githubAuth.accessToken));

    interface GitHubRepo {
      id: number;
      name: string;
      full_name: string;
      owner: { login: string };
      private: boolean;
      default_branch: string;
      description: string | null;
      html_url: string;
    }

    return NextResponse.json({
      repositories: repos.map((repo: GitHubRepo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        defaultBranch: repo.default_branch,
        description: repo.description,
        url: repo.html_url,
      })),
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
