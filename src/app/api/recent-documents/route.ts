import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  workspaceId: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

/**
 * GET /api/recent-documents
 * Get recently viewed documents for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      workspaceId: searchParams.get('workspaceId'),
      limit: searchParams.get('limit'),
    });

    // Build workspace filter
    const workspaceFilter = params.workspaceId ? { workspaceId: params.workspaceId } : {};

    // Get recent documents
    const recentDocs = await prisma.recentDocument.findMany({
      where: {
        userId,
        document: workspaceFilter,
      },
      include: {
        document: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        accessedAt: 'desc',
      },
      take: params.limit,
    });

    // Format response
    const documents = recentDocs.map((rd) => ({
      id: rd.document.id,
      title: rd.document.title,
      path: rd.document.path,
      emoji: rd.document.emoji,
      status: rd.document.status,
      viewedAt: rd.accessedAt,
      workspace: rd.document.workspace,
    }));

    return NextResponse.json({
      documents,
      total: documents.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching recent documents:', error);
    return NextResponse.json({ error: 'Failed to fetch recent documents' }, { status: 500 });
  }
}

/**
 * POST /api/recent-documents
 * Track a document view (update or create recent document entry)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const body = await request.json();
    const { documentId } = z
      .object({
        documentId: z.string(),
      })
      .parse(body);

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 });
    }

    // Upsert recent document entry
    const recentDoc = await prisma.recentDocument.upsert({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
      update: {
        accessedAt: new Date(),
      },
      create: {
        userId,
        documentId,
        accessedAt: new Date(),
      },
    });

    // Also update document's lastViewedAt field
    await prisma.document.update({
      where: { id: documentId },
      data: { lastViewedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      viewedAt: recentDoc.accessedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error tracking document view:', error);
    return NextResponse.json({ error: 'Failed to track document view' }, { status: 500 });
  }
}
