import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const createLinkSchema = z.object({
  linkedDocumentId: z.string(),
});

/**
 * GET /api/documents/[id]/links
 * Get all links from/to a document
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await request;
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    // Get outgoing links (links from this document)
    const outgoingLinks = await prisma.documentLink.findMany({
      where: { sourceDocumentId: documentId },
      include: {
        linkedDocument: {
          select: {
            id: true,
            title: true,
            path: true,
            emoji: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get incoming links (backlinks - links to this document)
    const incomingLinks = await prisma.documentLink.findMany({
      where: { linkedDocumentId: documentId },
      include: {
        sourceDocument: {
          select: {
            id: true,
            title: true,
            path: true,
            emoji: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      outgoing: outgoingLinks.map((link) => ({
        id: link.id,
        document: link.linkedDocument,
        createdAt: link.createdAt,
      })),
      incoming: incomingLinks.map((link) => ({
        id: link.id,
        document: link.sourceDocument,
        createdAt: link.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching document links:', error);
    return NextResponse.json({ error: 'Failed to fetch document links' }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/links
 * Create a link from this document to another
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document exists and user has write access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        workspaceId: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    const body = await request.json();
    const { linkedDocumentId } = createLinkSchema.parse(body);

    // Verify linked document exists and is in the same workspace
    const linkedDoc = await prisma.document.findUnique({
      where: { id: linkedDocumentId },
    });

    if (!linkedDoc || linkedDoc.workspaceId !== document.workspaceId) {
      return NextResponse.json(
        { error: 'Linked document not found or not in same workspace' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.documentLink.findUnique({
      where: {
        sourceDocumentId_linkedDocumentId: {
          sourceDocumentId: documentId,
          linkedDocumentId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json({ error: 'Link already exists' }, { status: 409 });
    }

    // Create the link
    const link = await prisma.documentLink.create({
      data: {
        sourceDocumentId: documentId,
        linkedDocumentId,
      },
      include: {
        linkedDocument: {
          select: {
            id: true,
            title: true,
            path: true,
            emoji: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: link.id,
      document: link.linkedDocument,
      createdAt: link.createdAt,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating document link:', error);
    return NextResponse.json({ error: 'Failed to create document link' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]/links?linkId=xxx
 * Delete a document link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    // Get the link to verify permissions
    const link = await prisma.documentLink.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        sourceDocument: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const linkSourceDocumentId = link.sourceDocument?.id;
    if (!linkSourceDocumentId || linkSourceDocumentId !== documentId) {
      return NextResponse.json({ error: 'Link not found in this document' }, { status: 404 });
    }

    await assertPermission(
      user.id,
      link.sourceDocument.workspaceId,
      WORKSPACE_PERMISSION.DOCUMENTS_EDIT
    );

    // Delete the link
    await prisma.documentLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting document link:', error);
    return NextResponse.json({ error: 'Failed to delete document link' }, { status: 500 });
  }
}
