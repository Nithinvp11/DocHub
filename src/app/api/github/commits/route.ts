import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Octokit } from '@octokit/rest';
import { getCurrentUser } from '@/lib/session';
import { decryptToken } from '@/lib/encryption';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author?: { avatar_url: string } | null;
  html_url: string;
  stats?: { additions: number; deletions: number; total: number };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!documentId || !workspaceId) {
      return NextResponse.json({ error: 'documentId and workspaceId required' }, { status: 400 });
    }

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

    // Get document sync info
    const syncInfo = await prisma.docSyncInfo.findUnique({
      where: { documentId },
    });

    if (!syncInfo) {
      return NextResponse.json({ error: 'Document not synced with GitHub' }, { status: 404 });
    }

    // Get GitHub auth
    const githubAuth = await prisma.gitHubAuth.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });

    if (!githubAuth) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    const [owner, repo] = syncInfo.githubRepository.split('/');
    const octokit = new Octokit({ auth: decryptToken(githubAuth.accessToken) });

    // Fetch commits for the file
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      path: syncInfo.githubPath,
      per_page: limit,
      sha: syncInfo.githubBranch,
    });

    // Format commit data
    const formattedCommits = (commits as GitHubCommit[]).map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        avatar: commit.author?.avatar_url || null,
        date: commit.commit.author.date,
      },
      url: commit.html_url,
      stats: commit.stats
        ? {
            additions: commit.stats.additions,
            deletions: commit.stats.deletions,
            total: commit.stats.total,
          }
        : undefined,
    }));

    return NextResponse.json({
      commits: formattedCommits,
      repository: syncInfo.githubRepository,
      path: syncInfo.githubPath,
      branch: syncInfo.githubBranch,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Fetch commits error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch commits' },
      { status: 500 }
    );
  }
}
