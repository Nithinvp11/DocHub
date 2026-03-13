import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    const where: Prisma.WorkspaceFavoriteWhereInput = {
      userId: user.id,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const favorites = await prisma.workspaceFavorite.findMany({
      where,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      favorites: favorites.map((favorite) => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        workspace: favorite.workspace,
      })),
      count: favorites.length,
    });
  } catch (error) {
    console.error('Failed to fetch workspace favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 });
    }

    const existing = await prisma.workspaceFavorite.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (existing) {
      await prisma.workspaceFavorite.delete({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
      });

      return NextResponse.json({
        isFavorite: false,
        message: 'Removed from favorites',
      });
    }

    const favorite = await prisma.workspaceFavorite.create({
      data: {
        userId: user.id,
        workspaceId,
      },
    });

    return NextResponse.json({
      isFavorite: true,
      message: 'Added to favorites',
      favorite,
    });
  } catch (error) {
    console.error('Failed to toggle workspace favorite:', error);
    return NextResponse.json({ error: 'Failed to toggle workspace favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('id');
    const workspaceId = searchParams.get('workspaceId');

    if (!favoriteId && !workspaceId) {
      return NextResponse.json(
        { error: 'Favorite ID or Workspace ID is required' },
        { status: 400 }
      );
    }

    if (favoriteId) {
      await prisma.workspaceFavorite.delete({
        where: {
          id: favoriteId,
          userId: user.id,
        },
      });
    } else if (workspaceId) {
      await prisma.workspaceFavorite.delete({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
      });
    }

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Failed to remove workspace favorite:', error);
    return NextResponse.json({ error: 'Failed to remove workspace favorite' }, { status: 500 });
  }
}
