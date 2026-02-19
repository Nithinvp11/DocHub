import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category'); // Filter by type
    const limit = parseInt(searchParams.get('limit') || '20');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { read: false }),
        ...(category && category !== 'all' && { type: category as NotificationType }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notification(s) as read/unread
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead, markAsRead } = body;

    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // Mark specific notification as read or unread
      const readStatus = markAsRead !== undefined ? markAsRead : true;

      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id, // Ensure user owns the notification
        },
        data: { read: readStatus },
      });

      return NextResponse.json({
        message: readStatus ? 'Notification marked as read' : 'Notification marked as unread',
      });
    }

    return NextResponse.json(
      { error: 'Must provide notificationId or markAllRead' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
