import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/favorites - Get user's favorite documents
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    // Build query
    const where: Prisma.UserFavoriteWhereInput = {
      userId: user.id,
    };

    if (workspaceId) {
      where.document = {
        workspaceId,
      };
    }

    // Fetch favorites with document details
    const favorites = await prisma.userFavorite.findMany({
      where,
      include: {
        document: {
          include: {
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
              include: {
                tag: true,
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      favorites: favorites.map((fav) => ({
        id: fav.id,
        createdAt: fav.createdAt,
        document: fav.document,
      })),
      count: favorites.length,
    });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Toggle favorite status
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

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.workspace.members.length === 0) {
      return NextResponse.json(
        { error: 'You do not have access to this document' },
        { status: 403 }
      );
    }

    // Check if already favorited
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_documentId: {
          userId: user.id,
          documentId,
        },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.userFavorite.delete({
        where: {
          userId_documentId: {
            userId: user.id,
            documentId,
          },
        },
      });

      return NextResponse.json({
        isFavorite: false,
        message: 'Removed from favorites',
      });
    } else {
      // Add to favorites
      const favorite = await prisma.userFavorite.create({
        data: {
          userId: user.id,
          documentId,
        },
      });

      return NextResponse.json({
        isFavorite: true,
        message: 'Added to favorites',
        favorite,
      });
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites/:id - Remove favorite
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('id');
    const documentId = searchParams.get('documentId');

    if (!favoriteId && !documentId) {
      return NextResponse.json(
        { error: 'Favorite ID or Document ID is required' },
        { status: 400 }
      );
    }

    if (favoriteId) {
      // Delete by favorite ID
      await prisma.userFavorite.delete({
        where: {
          id: favoriteId,
          userId: user.id,
        },
      });
    } else if (documentId) {
      // Delete by document ID
      await prisma.userFavorite.delete({
        where: {
          userId_documentId: {
            userId: user.id,
            documentId,
          },
        },
      });
    }

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
