import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeMarkdown } from '@/lib/sanitize';
import { PAGINATION_LIMITS } from '@/lib/constants';
import { ActivityTracker } from '@/lib/activity';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const commentSchema = z.object({
  content: z.string().min(1),
});

const resolveCommentSchema = z.object({
  commentId: z.string(),
  resolved: z.boolean(),
});

// GET all comments for a document
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get document to access workspace
    const document = await prisma.document.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_VIEW);

    const comments = await prisma.comment.findMany({
      where: {
        documentId: id,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGINATION_LIMITS.COMMENTS_PER_PAGE,
    });

    return NextResponse.json(comments);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get document to access workspace
    const document = await prisma.document.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_CREATE);

    const body = await req.json();
    const { content } = commentSchema.parse(body);

    const comment = await prisma.comment.create({
      data: {
        documentId: id,
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

    // Track comment activity
    await ActivityTracker.trackCommentAdded(comment.id, id, user.id, document.workspaceId);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH resolve/unresolve comment
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get document to access workspace
    const document = await prisma.document.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.COMMENTS_DELETE);

    const body = await req.json();
    const { commentId, resolved } = resolveCommentSchema.parse(body);

    const targetComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        documentId: true,
        document: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!targetComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (targetComment.documentId !== id) {
      return NextResponse.json(
        { error: 'Comment does not belong to this document' },
        { status: 403 }
      );
    }

    await assertPermission(
      user.id,
      targetComment.document.workspaceId,
      WORKSPACE_PERMISSION.COMMENTS_DELETE
    );

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { resolved },
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

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
