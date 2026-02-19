import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const labelSchema = z.object({
  label: z.string().min(1).max(50),
});

// PATCH /api/documents/[id]/versions/[versionId]/label - Update version label
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
    const { label } = labelSchema.parse(body);

    // Get the document
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

    // Update version label
    const updatedVersion = await prisma.version.update({
      where: { id: versionId },
      data: {
        label,
      },
    });

    return NextResponse.json({
      message: 'Label updated successfully',
      version: updatedVersion,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid label', details: error.issues }, { status: 400 });
    }

    console.error('Error updating version label:', error);
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 });
  }
}
