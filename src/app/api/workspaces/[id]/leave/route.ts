import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// POST /api/workspaces/[id]/leave - Leave workspace (for members, not owners)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.WORKSPACE_VIEW);

    const userId = user.id;

    // Check if workspace exists and get owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, name: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Prevent owner from leaving their own workspace
    if (workspace.ownerId === userId) {
      return NextResponse.json(
        {
          error:
            'Workspace owners cannot leave their workspace. Please delete the workspace or transfer ownership first.',
        },
        { status: 400 }
      );
    }

    // Check if user is a member
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Remove membership
    await prisma.workspaceMember.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `You have left ${workspace.name}`,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error leaving workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
