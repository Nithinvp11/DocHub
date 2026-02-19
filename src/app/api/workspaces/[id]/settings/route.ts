import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

// PATCH /api/workspaces/[id]/settings - Update workspace settings
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const body = await request.json();
    const data = updateWorkspaceSchema.parse(body);
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.WORKSPACE_EDIT);

    // Update workspace
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });

    return NextResponse.json(workspace);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error updating workspace settings:', error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/settings - Delete workspace
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.WORKSPACE_EDIT);

    // Check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only workspace owners can delete workspaces' },
        { status: 403 }
      );
    }

    // Delete workspace (cascade will delete all related data)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
