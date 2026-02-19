import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// GET /api/recent - Get recent documents
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const workspaceId = searchParams.get('workspaceId');

    // Build query
    const where: Prisma.RecentDocumentWhereInput = {
      userId: user.id,
    };

    if (workspaceId) {
      where.document = {
        workspaceId,
      };
    }

    // Fetch recent documents
    const recentDocuments = await prisma.recentDocument.findMany({
      where,
      select: {
        id: true,
        accessedAt: true,
        document: {
          select: {
            id: true,
            title: true,
            path: true,
            emoji: true,
            status: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              take: 3,
              select: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
            _count: {
              select: {
                comments: true,
                versions: true,
              },
            },
          },
        },
      },
      orderBy: {
        accessedAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      documents: recentDocuments.map((recent) => ({
        id: recent.id,
        accessedAt: recent.accessedAt,
        document: recent.document,
      })),
      count: recentDocuments.length,
    });
  } catch (error) {
    console.error('Failed to fetch recent documents:', error);
    return NextResponse.json({ error: 'Failed to fetch recent documents' }, { status: 500 });
  }
}

// POST /api/recent - Track document access
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update or create recent document entry
    const recent = await prisma.recentDocument.upsert({
      where: {
        userId_documentId: {
          userId: user.id,
          documentId,
        },
      },
      create: {
        userId: user.id,
        documentId,
        accessedAt: new Date(),
      },
      update: {
        accessedAt: new Date(),
      },
    });

    // Also update document's lastViewedAt
    await prisma.document.update({
      where: { id: documentId },
      data: {
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Document access tracked',
      recent,
    });
  } catch (error) {
    console.error('Failed to track document access:', error);
    return NextResponse.json({ error: 'Failed to track document access' }, { status: 500 });
  }
}
