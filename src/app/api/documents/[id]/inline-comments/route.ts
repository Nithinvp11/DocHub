import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityTracker } from '@/lib/activity';
import { z } from 'zod';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';

const createCommentSchema = z.object({
  content: z.string().min(1),
  selectionStart: z.number(),
  selectionEnd: z.number(),
  selectedText: z.string(),
  parentId: z.string().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  resolved: z.boolean().optional(),
});

/**
 * GET /api/documents/[id]/inline-comments
 * Get all inline comments for a document
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document and verify access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_VIEW);

    // Get all comments with their replies
    const comments = await prisma.inlineComment.findMany({
      where: {
        documentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching inline comments:', error);
    return NextResponse.json({ error: 'Failed to fetch inline comments' }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/inline-comments
 * Create a new inline comment
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document and verify access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true, title: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_CREATE);

    const body = await request.json();
    const { content, selectionStart, selectionEnd, selectedText, parentId } =
      createCommentSchema.parse(body);

    // If parentId provided, create a reply instead of a comment
    if (parentId) {
      const parentComment = await prisma.inlineComment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.documentId !== documentId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      // Create reply
      const reply = await prisma.inlineCommentReply.create({
        data: {
          commentId: parentId,
          authorId: user.id,
          content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({ comment: reply }, { status: 201 });
    }

    // Create comment
    const comment = await prisma.inlineComment.create({
      data: {
        documentId,
        authorId: user.id,
        content,
        startOffset: selectionStart,
        endOffset: selectionEnd,
        highlightedText: selectedText,
        resolved: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Create activity log
    await ActivityTracker.create({
      workspaceId: document.workspaceId,
      actorId: user.id,
      type: 'COMMENT_ADDED',
      entityType: 'InlineComment',
      entityId: comment.id,
      metadata: {
        commentId: comment.id,
        documentTitle: document.title,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating inline comment:', error);
    return NextResponse.json({ error: 'Failed to create inline comment' }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/[id]/inline-comments?commentId=xxx
 * Update an inline comment (edit or resolve/unresolve)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    // Get comment to verify permissions
    const comment = await prisma.inlineComment.findUnique({
      where: { id: commentId },
      include: {
        document: {
          select: { workspaceId: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.documentId !== documentId) {
      return NextResponse.json({ error: 'Comment not found in this document' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(
      user.id,
      comment.document.workspaceId,
      WORKSPACE_PERMISSION.COMMENTS_DELETE
    );

    const body = await request.json();
    const { content, resolved } = updateCommentSchema.parse(body);

    // Only author can edit content
    if (content !== undefined && comment.authorId !== user.id) {
      return NextResponse.json({ error: 'Only comment author can edit content' }, { status: 403 });
    }

    // Update comment
    const updatedComment = await prisma.inlineComment.update({
      where: { id: commentId },
      data: {
        ...(content !== undefined && { content }),
        ...(resolved !== undefined && { resolved }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ comment: updatedComment });
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

    console.error('Error updating inline comment:', error);
    return NextResponse.json({ error: 'Failed to update inline comment' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]/inline-comments?commentId=xxx
 * Delete an inline comment
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
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    // Get comment to verify permissions
    const comment = await prisma.inlineComment.findUnique({
      where: { id: commentId },
      include: {
        document: {
          select: { workspaceId: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.documentId !== documentId) {
      return NextResponse.json({ error: 'Comment not found in this document' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(
      user.id,
      comment.document.workspaceId,
      WORKSPACE_PERMISSION.COMMENTS_DELETE
    );

    // Delete comment (cascade will delete replies)
    await prisma.inlineComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting inline comment:', error);
    return NextResponse.json({ error: 'Failed to delete inline comment' }, { status: 500 });
  }
}
