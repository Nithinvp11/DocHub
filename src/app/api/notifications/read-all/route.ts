import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

import { NotificationService } from '@/lib/notifications';

// POST /api/notifications/read-all
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await NotificationService.markAllAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
