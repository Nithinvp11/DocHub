import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const createMentionSchema = z.object({
  userId: z.string(),
  position: z.number(),
});

/**
 * GET /api/documents/[id]/mentions
 * Get all mentions in a document
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

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_VIEW);

    // Get all mentions
    const mentions = await prisma.mention.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ mentions });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching mentions:', error);
    return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/mentions
 * Create a mention (and send notification)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        workspaceId: true,
        title: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_CREATE);

    const body = await request.json();
    const { userId, position } = createMentionSchema.parse(body);

    // Verify mentioned user exists and has access to workspace
    const mentionedUserMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: document.workspaceId,
          userId,
        },
      },
    });

    if (!mentionedUserMembership) {
      return NextResponse.json({ error: 'Mentioned user not found in workspace' }, { status: 400 });
    }

    // Check if mention already exists
    const existingMention = await prisma.mention.findFirst({
      where: {
        documentId,
        userId,
        position,
      },
    });

    if (existingMention) {
      return NextResponse.json({ error: 'Mention already exists' }, { status: 409 });
    }

    // Create mention
    const mention = await prisma.mention.create({
      data: {
        documentId,
        userId,
        position,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create notification for mentioned user
    if (userId !== user.id) {
      // Don't notify if user mentions themselves
      await prisma.notification.create({
        data: {
          userId,
          type: 'COMMENT_MENTION',
          title: 'You were mentioned',
          message: `${user.name || user.email} mentioned you in "${document.title}"`,
          link: `/dashboard/${document.workspaceId}/documents/${documentId}`,
        },
      });
    }

    return NextResponse.json({ mention });
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

    console.error('Error creating mention:', error);
    return NextResponse.json({ error: 'Failed to create mention' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]/mentions?mentionId=xxx
 * Delete a mention
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
    const mentionId = searchParams.get('mentionId');

    if (!mentionId) {
      return NextResponse.json({ error: 'mentionId is required' }, { status: 400 });
    }

    // Get mention to verify permissions
    const mention = await prisma.mention.findUnique({
      where: { id: mentionId },
      select: {
        id: true,
        document: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!mention) {
      return NextResponse.json({ error: 'Mention not found' }, { status: 404 });
    }

    const mentionDocumentId = mention.document?.id;
    if (!mentionDocumentId || mentionDocumentId !== documentId) {
      return NextResponse.json({ error: 'Mention not found in this document' }, { status: 404 });
    }

    await assertPermission(
      user.id,
      mention.document.workspaceId,
      WORKSPACE_PERMISSION.COMMENTS_DELETE
    );

    // Delete mention
    await prisma.mention.delete({
      where: { id: mentionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting mention:', error);
    return NextResponse.json({ error: 'Failed to delete mention' }, { status: 500 });
  }
}
