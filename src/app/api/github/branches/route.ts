import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Octokit } from '@octokit/rest';
import { getCurrentUser } from '@/lib/session';
import { decryptToken } from '@/lib/encryption';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const listBranchesSchema = z.object({
  workspaceId: z.string(),
  githubRepository: z.string(),
});

const switchBranchSchema = z.object({
  documentId: z.string(),
  workspaceId: z.string(),
  branch: z.string(),
});

const createBranchSchema = z.object({
  documentId: z.string(),
  workspaceId: z.string(),
  newBranch: z.string(),
  fromBranch: z.string().default('main'),
});

const compareBranchesSchema = z.object({
  documentId: z.string(),
  workspaceId: z.string(),
  baseBranch: z.string(),
  compareBranch: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const githubRepository = searchParams.get('githubRepository');

    if (!workspaceId || !githubRepository) {
      return NextResponse.json(
        { error: 'workspaceId and githubRepository required' },
        { status: 400 }
      );
    }

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

    // Get GitHub auth
    const githubAuth = await prisma.gitHubAuth.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });

    if (!githubAuth) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    const [owner, repo] = githubRepository.split('/');
    const octokit = new Octokit({ auth: decryptToken(githubAuth.accessToken) });

    // List all branches
    const { data: branches } = await octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });

    interface GitHubBranch {
      name: string;
      protected: boolean;
      commit: { sha: string; url: string };
    }

    return NextResponse.json({
      branches: branches.map((branch: GitHubBranch) => ({
        name: branch.name,
        protected: branch.protected,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url,
        },
      })),
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('List branches error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'switch':
        return await switchBranch(body, user.id);

      case 'create':
        return await createBranch(body, user.id);

      case 'compare':
        return await compareBranches(body, user.id);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Branch action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

interface BranchData {
  documentId?: string;
  workspaceId?: string;
  branch?: string;
  newBranch?: string;
  fromBranch?: string;
  baseBranch?: string;
  compareBranch?: string;
}

async function switchBranch(data: BranchData, userId: string) {
  const { documentId, workspaceId, branch } = switchBranchSchema.parse(data);
  await assertPermission(userId, workspaceId, WORKSPACE_PERMISSION.GITHUB_CONFIGURE);

  // Get document with sync info
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { syncInfo: true },
  });

  if (!document || document.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (!document.syncInfo) {
    return NextResponse.json({ error: 'Document not synced with GitHub' }, { status: 400 });
  }

  // Get GitHub auth
  const githubAuth = await prisma.gitHubAuth.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!githubAuth) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
  }

  const [owner, repo] = document.syncInfo.githubRepository.split('/');
  const octokit = new Octokit({ auth: decryptToken(githubAuth.accessToken) });

  // Verify branch exists
  try {
    await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  }

  // Update sync info to use new branch
  await prisma.docSyncInfo.update({
    where: { id: document.syncInfo.id },
    data: {
      githubBranch: branch,
      needSyncFromGitHub: true, // Mark to pull latest from new branch
      syncStatus: 'PENDING',
    },
  });

  // Create activity
  await prisma.activity.create({
    data: {
      type: 'GITHUB_REPO_SYNCED',
      actorId: userId,
      workspaceId,
      entityType: 'Document',
      entityId: documentId,
      metadata: {
        action: 'branch_switched',
        branch,
        repository: document.syncInfo.githubRepository,
      },
    },
  });

  return NextResponse.json({
    success: true,
    branch,
    message: 'Branch switched. Pull from GitHub to sync content.',
  });
}

async function createBranch(data: BranchData, userId: string) {
  const { documentId, workspaceId, newBranch, fromBranch } = createBranchSchema.parse(data);
  await assertPermission(userId, workspaceId, WORKSPACE_PERMISSION.GITHUB_CONFIGURE);

  // Get document with sync info
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { syncInfo: true },
  });

  if (!document || document.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (!document.syncInfo) {
    return NextResponse.json({ error: 'Document not synced with GitHub' }, { status: 400 });
  }

  // Get GitHub auth
  const githubAuth = await prisma.gitHubAuth.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!githubAuth) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
  }

  const [owner, repo] = document.syncInfo.githubRepository.split('/');
  const octokit = new Octokit({ auth: decryptToken(githubAuth.accessToken) });

  // Get source branch SHA
  const { data: sourceBranch } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: fromBranch,
  });

  // Create new branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: sourceBranch.commit.sha,
  });

  // Switch document to new branch
  await prisma.docSyncInfo.update({
    where: { id: document.syncInfo.id },
    data: {
      githubBranch: newBranch,
    },
  });

  // Create activity
  await prisma.activity.create({
    data: {
      type: 'GITHUB_REPO_SYNCED',
      actorId: userId,
      workspaceId,
      entityType: 'Document',
      entityId: documentId,
      metadata: {
        action: 'branch_created',
        newBranch,
        fromBranch,
        repository: document.syncInfo.githubRepository,
      },
    },
  });

  return NextResponse.json({
    success: true,
    branch: newBranch,
    message: `Branch '${newBranch}' created from '${fromBranch}'`,
  });
}

async function compareBranches(data: BranchData, userId: string) {
  const { documentId, workspaceId, baseBranch, compareBranch } = compareBranchesSchema.parse(data);
  await assertPermission(userId, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

  // Get document with sync info
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { syncInfo: true },
  });

  if (!document || document.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (!document.syncInfo) {
    return NextResponse.json({ error: 'Document not synced with GitHub' }, { status: 400 });
  }

  // Get GitHub auth
  const githubAuth = await prisma.gitHubAuth.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!githubAuth) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
  }

  const [owner, repo] = document.syncInfo.githubRepository.split('/');
  const octokit = new Octokit({ auth: decryptToken(githubAuth.accessToken) });

  // Get file content from both branches
  const [baseFile, compareFile] = await Promise.all([
    octokit.rest.repos.getContent({
      owner,
      repo,
      path: document.syncInfo.githubPath,
      ref: baseBranch,
    }),
    octokit.rest.repos.getContent({
      owner,
      repo,
      path: document.syncInfo.githubPath,
      ref: compareBranch,
    }),
  ]);

  interface FileContent {
    content: string;
  }

  const baseContent = Buffer.from((baseFile.data as FileContent).content, 'base64').toString(
    'utf-8'
  );
  const compareContent = Buffer.from((compareFile.data as FileContent).content, 'base64').toString(
    'utf-8'
  );

  // Simple diff summary
  const baseLines = baseContent.split('\n');
  const compareLines = compareContent.split('\n');

  return NextResponse.json({
    success: true,
    baseBranch,
    compareBranch,
    baseContent,
    compareContent,
    diff: {
      linesAdded: compareLines.length - baseLines.length,
      identical: baseContent === compareContent,
    },
  });
}
