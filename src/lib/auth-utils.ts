import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

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

/**
 * Get the current session on the server side
 * Returns null if no session exists
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication for a server component or API route
 * Redirects to /auth if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/auth');
  }

  if (session.user.id) {
    try {
      await ensureDailyLoginEvent(session.user.id);
    } catch (error) {
      console.error('Failed to ensure daily login event:', error);
    }
  }

  return session;
}

/**
 * Get current user or redirect to auth page
 */
export async function getCurrentUser() {
  const session = await requireAuth();
  return session.user;
}

/**
 * Check if user is authenticated (returns boolean)
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Validate session for API routes
 * Returns session or throws error
 */
export async function validateApiAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  return session;
}
