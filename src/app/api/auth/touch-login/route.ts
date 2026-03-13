import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Record a login event for today (UTC) if one doesn't already exist
    const startOfTodayUTC = new Date();
    startOfTodayUTC.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.loginEvent.findFirst({
      where: { userId, createdAt: { gte: startOfTodayUTC } },
      select: { id: true },
    });

    if (!existing) {
      await prisma.loginEvent.create({ data: { userId } });
    }

    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    console.error('Failed to touch login event:', error);
    return NextResponse.json({ error: 'Failed to touch login event' }, { status: 500 });
  }
}
