import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
