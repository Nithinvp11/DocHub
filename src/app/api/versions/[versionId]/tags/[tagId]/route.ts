import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// DELETE a tag
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string; tagId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { versionId, tagId } = await params;

    // Verify tag exists and user has access
    const tag = await prisma.versionTag.findUnique({
      where: { id: tagId },
      select: {
        versionId: true,
        version: {
          select: {
            document: {
              select: {
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    if (!tag || tag.versionId !== versionId) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await assertPermission(
      user.id,
      tag.version.document.workspaceId,
      WORKSPACE_PERMISSION.VERSIONS_DELETE
    );

    await prisma.versionTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting version tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
