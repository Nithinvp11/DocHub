import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/count - Get unread notification count
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 });
  }
}
