import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const integrationSchema = z.object({
  workspaceId: z.string(),
  repository: z.string(),
  branch: z.string().optional(),
  basePath: z.string().optional(),
});

const normalizeBasePath = (value?: string | null) => {
  const fallback = 'docs';
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/^\/+/, '');
};

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

    // Check permissions
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

    const integration = await prisma.workspaceGitHubIntegration.findUnique({
      where: { workspaceId },
      select: {
        id: true,
        repository: true,
        branch: true,
        basePath: true,
        connectedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ integration });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[GitHub Integration] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = integrationSchema.parse(body);

    // Check permissions
    await assertPermission(user.id, data.workspaceId, WORKSPACE_PERMISSION.GITHUB_CONFIGURE);

    if (!data.repository.includes('/')) {
      return NextResponse.json(
        { error: 'Repository must be in format: owner/repo' },
        { status: 400 }
      );
    }

    const branch = data.branch?.trim() || 'main';
    const basePath = normalizeBasePath(data.basePath);

    const integration = await prisma.workspaceGitHubIntegration.upsert({
      where: { workspaceId: data.workspaceId },
      update: {
        repository: data.repository.trim(),
        branch,
        basePath,
      },
      create: {
        workspaceId: data.workspaceId,
        repository: data.repository.trim(),
        branch,
        basePath,
      },
      select: {
        id: true,
        repository: true,
        branch: true,
        basePath: true,
        connectedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'GitHub integration updated successfully',
      integration,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.error('[GitHub Integration] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    // Check permissions
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_CONFIGURE);

    await prisma.workspaceGitHubIntegration.deleteMany({
      where: { workspaceId },
    });

    return NextResponse.json({ success: true, message: 'GitHub integration removed' });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[GitHub Integration] Error:', error);
    return NextResponse.json({ error: 'Failed to remove integration' }, { status: 500 });
  }
}
