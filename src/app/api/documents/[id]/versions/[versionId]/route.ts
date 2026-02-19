import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';

// DELETE /api/documents/[id]/versions/[versionId] - Delete a version
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId, versionId } = await params;

    // Get the document and check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        workspaceId: true,
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.VERSIONS_DELETE);

    // Get the version to delete
    const versionToDelete = await prisma.version.findFirst({
      where: {
        id: versionId,
        documentId,
      },
    });

    if (!versionToDelete) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Check if this is the latest version
    const latestVersion = document.versions[0];
    if (latestVersion && versionToDelete.id === latestVersion.id) {
      return NextResponse.json({ error: 'Cannot delete the current version' }, { status: 400 });
    }

    // Delete the version
    await prisma.version.delete({
      where: { id: versionId },
    });

    return NextResponse.json({ message: 'Version deleted successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting version:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}

// PATCH /api/documents/[id]/versions/[versionId] - Update version message (rename)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId, versionId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Get the document and check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.VERSIONS_CREATE);
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    const existingVersion = await prisma.version.findFirst({
      where: {
        id: versionId,
        documentId,
      },
      select: { id: true },
    });

    if (!existingVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Update the version message
    const updatedVersion = await prisma.version.update({
      where: { id: versionId },
      data: { message: message.trim() },
    });

    return NextResponse.json(updatedVersion, { status: 200 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error updating version:', error);
    return NextResponse.json({ error: 'Failed to update version' }, { status: 500 });
  }
}
