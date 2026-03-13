import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ensureDailyLoginEvent(userId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const existingLoginToday = await prisma.loginEvent.findFirst({
    where: {
      userId,
      createdAt: { gte: startOfToday },
    },
    select: { id: true },
  });

  if (!existingLoginToday) {
    await prisma.loginEvent.create({
      data: { userId },
    });
  }
}

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (session?.user?.id) {
    try {
      await ensureDailyLoginEvent(session.user.id);
    } catch (error) {
      console.error('Failed to ensure daily login event:', error);
    }
  }

  return session?.user;
}
