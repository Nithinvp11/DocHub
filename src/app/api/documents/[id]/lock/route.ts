import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const LOCK_TIMEOUT_MINUTES = 15; // Lock expires after 15 minutes of inactivity
const LOCK_EXTENSION_MINUTES = 10; // Extend lock by 10 minutes on each ping

// GET - Check lock status for a document
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', locked: false }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Get document and workspace
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found', locked: false }, { status: 404 });
    }

    // Check permissions
    try {
      await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);
    } catch (error) {
      if (error instanceof WorkspacePermissionError) {
        return NextResponse.json({ error: error.message, locked: false }, { status: error.status });
      }
      throw error;
    }

    // Get current lock
    const lock = await prisma.documentLock.findUnique({
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

    if (!lock) {
      return NextResponse.json({ locked: false });
    }

    // Check if lock is expired
    if (new Date() > lock.expiresAt) {
      // Clean up expired lock
      try {
        await prisma.documentLock.delete({
          where: { id: lock.id },
        });
      } catch (err) {
        console.warn('Failed to delete expired lock:', err);
      }
      return NextResponse.json({ locked: false });
    }

    return NextResponse.json({
      locked: true,
      lock: {
        userId: lock.userId,
        userName: lock.user.name,
        userEmail: lock.user.email,
        userImage: lock.user.image,
        acquiredAt: lock.acquiredAt,
        expiresAt: lock.expiresAt,
      },
      isOwnLock: lock.userId === user.id,
    });
  } catch (error) {
    console.error('Error checking lock status:', error);
    // Return default response so client doesn't error
    return NextResponse.json({ locked: false, error: 'Failed to check lock' }, { status: 200 });
  }
}

// POST - Acquire lock for editing
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Get document and check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TIMEOUT_MINUTES * 60 * 1000);

    // Try to acquire lock
    try {
      // Check for existing lock
      const existingLock = await prisma.documentLock.findUnique({
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

      // If lock exists
      if (existingLock) {
        // If it's the same user, always allow (force-reclaim)
        if (existingLock.userId === user.id) {
          const updatedLock = await prisma.documentLock.update({
            where: { id: existingLock.id },
            data: {
              acquiredAt: now,
              lastPingAt: now,
              expiresAt,
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

          return NextResponse.json({
            success: true,
            lock: updatedLock,
            message: 'Lock acquired',
          });
        }

        // Lock is held by another user and not expired
        if (now <= existingLock.expiresAt) {
          return NextResponse.json(
            {
              error: 'Document is currently being edited',
              lockedBy: existingLock.user,
              expiresAt: existingLock.expiresAt,
            },
            { status: 423 } // 423 Locked
          );
        }
      }

      // Lock expired or doesn't exist - create/update
      const lock = await prisma.documentLock.upsert({
        where: { documentId },
        create: {
          documentId,
          userId: user.id,
          expiresAt,
          lastPingAt: now,
        },
        update: {
          userId: user.id,
          acquiredAt: now,
          expiresAt,
          lastPingAt: now,
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

      return NextResponse.json({
        success: true,
        lock,
        message: 'Lock acquired',
      });
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return NextResponse.json({ error: 'Failed to acquire lock' }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error in lock acquisition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Extend lock (heartbeat/ping)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });

    if (!lock) {
      return NextResponse.json({ error: 'No lock found' }, { status: 404 });
    }

    if (lock.userId !== user.id) {
      return NextResponse.json({ error: 'Lock is held by another user' }, { status: 403 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_EXTENSION_MINUTES * 60 * 1000);

    const updatedLock = await prisma.documentLock.update({
      where: { id: lock.id },
      data: {
        lastPingAt: now,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      lock: updatedLock,
      message: 'Lock extended',
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error extending lock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Release lock
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    const lock = await prisma.documentLock.findUnique({
      where: { documentId },
    });

    if (!lock) {
      // No lock to release
      return NextResponse.json({ success: true, message: 'No lock found' });
    }

    // Only the lock owner can release it (or admins - add logic if needed)
    if (lock.userId !== user.id) {
      return NextResponse.json(
        { error: 'Cannot release lock held by another user' },
        { status: 403 }
      );
    }

    await prisma.documentLock.delete({
      where: { id: lock.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Lock released',
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error releasing lock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
