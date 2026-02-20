import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// GET /api/feedback/[id] - Get specific feedback
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    const adminCookie = request.cookies.get('admin-token')?.value;

    // Allow NextAuth session or admin-token JWT
    if (!currentUser && !adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check if user is admin or owner
    let isAdmin = false;
    if (currentUser) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true },
      });
      isAdmin = dbUser?.role === 'ADMIN';
    }

    // Accept admin-token cookie as admin authority (admin console uses this)
    if (!isAdmin) {
      try {
        const adminToken = request.cookies.get('admin-token')?.value;
        if (adminToken) {
          const decoded = verify(adminToken, JWT_SECRET) as { isAdmin?: boolean };
          if (decoded?.isAdmin) {
            isAdmin = true;
            console.debug('[GET /api/feedback/[id]] admin access granted via admin-token');
          }
        }
      } catch (err) {
        // ignore invalid admin token
      }
    }

    const isOwner = currentUser ? feedback.userId === currentUser.id : false;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ feedback, isAdmin });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

// PATCH /api/feedback/[id] - Update feedback (admin only for status/priority/assignment)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    const adminCookie = request.cookies.get('admin-token')?.value;

    // Allow NextAuth session or admin-token JWT
    if (!currentUser && !adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if user is admin (guard currentUser may be undefined)
    let isAdmin = false;

    if (currentUser?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true },
      });
      isAdmin = dbUser?.role === 'ADMIN';
    }

    if (!isAdmin) {
      try {
        const adminToken = request.cookies.get('admin-token')?.value;
        if (adminToken) {
          const decoded = verify(adminToken, JWT_SECRET) as { isAdmin?: boolean };
          if (decoded?.isAdmin) {
            isAdmin = true;
            console.debug('[PATCH /api/feedback/[id]] admin access granted via admin-token');
          }
        }
      } catch (err) {
        // ignore invalid admin token
      }
    }

    // Verify feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const isOwner = currentUser ? existingFeedback.userId === currentUser.id : false;

    // Determine what can be updated based on role
    const updateData: Record<string, unknown> = {};

    if (isOwner && !isAdmin) {
      // Regular users can only update their own feedback content
      if (body.title) updateData.title = body.title;
      if (body.description) updateData.description = body.description;
      if (body.rating !== undefined) updateData.rating = body.rating;
    } else if (isAdmin) {
      // Admins can update everything
      if (body.status) {
        updateData.status = body.status;
        if (body.status === 'RESOLVED' || body.status === 'CLOSED') {
          updateData.resolvedAt = new Date();
        }
      }
      if (body.priority) updateData.priority = body.priority;
      if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
      if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
      if (body.category) updateData.category = body.category;
      if (body.type) updateData.type = body.type;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
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
      feedback,
      message: 'Feedback updated successfully',
    });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

// DELETE /api/feedback/[id] - Delete feedback (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const adminCookie = request.cookies.get('admin-token')?.value;

    // Allow NextAuth session or admin-token JWT
    if (!currentUser && !adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin (guard currentUser may be undefined)
    let userIsAdmin = false;

    if (currentUser?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true },
      });
      userIsAdmin = dbUser?.role === 'ADMIN';
    }

    if (!userIsAdmin) {
      try {
        const adminToken = request.cookies.get('admin-token')?.value;
        if (adminToken) {
          const decoded = verify(adminToken, JWT_SECRET) as { isAdmin?: boolean };
          if (decoded?.isAdmin) {
            userIsAdmin = true;
            console.debug('[DELETE /api/feedback/[id]] admin access granted via admin-token');
          }
        }
      } catch (err) {
        // ignore invalid admin token
      }
    }

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
