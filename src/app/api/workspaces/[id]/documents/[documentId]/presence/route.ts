import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// GET /api/workspaces/[id]/documents/[documentId]/presence
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, documentId } = await params;

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    // Get presence data for the document
    const presenceRecords = await prisma.presence.findMany({
      where: {
        documentId,
        workspaceId,
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
      orderBy: {
        lastSeen: 'desc',
      },
    });

    // Get document lock info
    const documentLock = await prisma.documentLock.findUnique({
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
    });

    const users = presenceRecords.map((presence) => ({
      userId: presence.user.id,
      userName: presence.user.name,
      userEmail: presence.user.email,
      userImage: presence.user.image,
      isEditing: documentLock?.userId === presence.user.id,
      lastSeen: presence.lastSeen,
      cursorPosition: presence.cursor as { x: number; y: number } | undefined,
    }));

    return NextResponse.json({
      users,
      count: users.length,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to fetch presence data:', error);
    return NextResponse.json({ error: 'Failed to fetch presence data' }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/documents/[documentId]/presence
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, documentId } = await params;
    const body = await request.json();
    const { cursorPosition } = body;

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document || document.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Document not found in workspace' }, { status: 404 });
    }

    // Update or create presence (use a socketId from session or generate one)
    const socketId = user.id + '-' + Date.now(); // Simple socket ID for now

    const presence = await prisma.presence.upsert({
      where: {
        userId_socketId: {
          userId: user.id,
          socketId,
        },
      },
      create: {
        userId: user.id,
        workspaceId,
        documentId,
        socketId,
        lastSeen: new Date(),
        cursor: cursorPosition || {},
      },
      update: {
        workspaceId,
        documentId,
        lastSeen: new Date(),
        cursor: cursorPosition || {},
      },
    });

    return NextResponse.json({
      message: 'Presence updated',
      presence,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to update presence:', error);
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}
