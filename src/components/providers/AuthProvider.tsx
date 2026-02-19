'use client';

import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Protected routes that require authentication
// Note: admin pages use a separate admin-token flow and are guarded by
// the admin layout; do not auto-redirect admin routes from the global
// auth guard (prevents /admin/login -> /auth redirect).
const protectedRoutes = [
  '/dashboard',
  '/workspace',
  '/settings',
  '/favorites',
  '/recent',
  '/search',
];

// Auth guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route));

    // Redirect to auth if accessing protected route without authentication
    if (status === 'unauthenticated' && isProtectedRoute) {
      const callbackUrl = encodeURIComponent(pathname || '/dashboard');
      router.push(`/auth?callbackUrl=${callbackUrl}`);
    }

    // Redirect to dashboard if accessing auth page while authenticated
    if (status === 'authenticated' && pathname === '/auth') {
      router.push('/dashboard');
    }
  }, [status, pathname, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session on window focus
      refetchOnWindowFocus={true}
    >
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}
