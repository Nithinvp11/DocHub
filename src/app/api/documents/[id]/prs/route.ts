/**
 * Document Pull Requests API
 * Get PRs that affect this document
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  await request;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await context.params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        githubPath: true,
        workspaceId: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    // Get PRs that include this document's GitHub path
    const pullRequests = await prisma.gitHubPullRequest.findMany({
      where: {
        OR: [
          { linkedDocumentIds: { has: documentId } },
          { affectedFiles: { has: document.githubPath || '' } },
        ],
        state: { in: ['open', 'draft'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ pullRequests });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to fetch document PRs:', error);
    return NextResponse.json({ error: 'Failed to fetch pull requests' }, { status: 500 });
  }
}
