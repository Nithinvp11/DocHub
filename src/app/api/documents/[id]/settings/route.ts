import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  path: z.string().optional(),
  emoji: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
});

// PATCH /api/documents/[id]/settings - Update document settings (rename, etc.)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const data = updateDocumentSchema.parse(body);

    // Get document and check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data,
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_UPDATED',
        actorId: user.id,
        workspaceId: document.workspaceId,
        entityType: 'document',
        entityId: documentId,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error updating document settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/settings - Delete document
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Get document and check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        workspaceId: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_DELETE);

    // Delete document (cascade will delete all related data)
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_DELETED',
        actorId: user.id,
        workspaceId: document.workspaceId,
        entityType: 'document',
        entityId: documentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
