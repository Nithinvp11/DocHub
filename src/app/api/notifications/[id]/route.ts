import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { NotificationService } from '@/lib/notifications';

// PATCH /api/notifications/[id] - Mark as read
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await req;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await NotificationService.markAsRead(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await req;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await NotificationService.deleteNotification(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
