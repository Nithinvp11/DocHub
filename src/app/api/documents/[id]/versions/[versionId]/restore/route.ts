import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';

// POST /api/documents/[id]/versions/[versionId]/restore - Restore a version
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId, versionId } = await params;

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.VERSIONS_RESTORE);
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // Get the version to restore
    const versionToRestore = await prisma.version.findUnique({
      where: { id: versionId },
    });

    if (!versionToRestore || versionToRestore.documentId !== documentId) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Get the highest version number
    const latestVersion = await prisma.version.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create SHA hash
    const sha = crypto.createHash('sha256').update(versionToRestore.content).digest('hex');

    // Create new version with restored content
    const newVersion = await prisma.version.create({
      data: {
        documentId,
        content: versionToRestore.content,
        message: `Restored from version ${versionToRestore.version}`,
        authorId: user.id,
        version: nextVersion,
        sha,
      },
    });

    // Update document content
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: versionToRestore.content,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Version restored successfully',
      version: newVersion,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error restoring version:', error);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}
