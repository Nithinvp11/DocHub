import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const tagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

// PATCH /api/tags/[tagId] - Update tag
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tagId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await params;
    const body = await req.json();

    // Validate input
    const validation = tagSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tag data', details: validation.error },
        { status: 400 }
      );
    }

    // Check tag exists and user has access
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { workspaceId: true },
    });

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, existingTag.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: validation.data,
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating tag:', error);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A tag with this name already exists in the workspace' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE /api/tags/[tagId] - Delete tag
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tagId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await params;

    // Check tag exists and user has access
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { workspaceId: true },
    });

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, existingTag.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // Delete tag (will cascade delete DocumentTag relations)
    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
