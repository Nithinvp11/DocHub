import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';

const saveAsSchema = z.object({
  title: z.string().min(1).max(200),
  workspaceId: z.string().optional(), // Can save to different workspace
  path: z.string().optional(),
  emoji: z.string().optional(),
});

// POST /api/documents/[id]/save-as - Save document as new document
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sourceDocumentId } = await params;
    const body = await request.json();
    const data = saveAsSchema.parse(body);

    // Get source document
    const sourceDocument = await prisma.document.findUnique({
      where: { id: sourceDocumentId },
      select: {
        workspaceId: true,
        content: true,
        title: true,
        emoji: true,
        coverImage: true,
        phase: true,
        type: true,
        wordCount: true,
        readingTime: true,
        properties: true,
      },
    });

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Source document not found' }, { status: 404 });
    }

    // Check read permission on source
    await assertPermission(
      user.id,
      sourceDocument.workspaceId,
      WORKSPACE_PERMISSION.DOCUMENTS_VIEW
    );

    const targetWorkspaceId = data.workspaceId || sourceDocument.workspaceId;

    // Check write permission on target workspace
    await assertPermission(user.id, targetWorkspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);

    // Generate unique path if not provided
    const path = data.path || `/${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Create new document with content from source
    const newDocument = await prisma.document.create({
      data: {
        title: data.title,
        content: sourceDocument.content,
        path,
        workspaceId: targetWorkspaceId,
        authorId: user.id,
        emoji: data.emoji || sourceDocument.emoji,
        coverImage: sourceDocument.coverImage,
        status: 'DRAFT',
        phase: sourceDocument.phase,
        type: sourceDocument.type,
        wordCount: sourceDocument.wordCount,
        readingTime: sourceDocument.readingTime,
        properties: sourceDocument.properties || {},
      },
    });

    // Create initial version
    await prisma.version.create({
      data: {
        documentId: newDocument.id,
        content: newDocument.content,
        message: `Saved as new document from "${sourceDocument.title}"`,
        sha: crypto.createHash('sha256').update(newDocument.content).digest('hex'),
        authorId: user.id,
        version: 1,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_CREATED',
        actorId: user.id,
        workspaceId: targetWorkspaceId,
        entityType: 'document',
        entityId: newDocument.id,
      },
    });

    return NextResponse.json(newDocument);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error saving document as new:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
