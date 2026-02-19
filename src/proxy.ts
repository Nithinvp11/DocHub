import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { withAuth } from 'next-auth/middleware';

/**
 * Global proxy for the application
 * Handles authentication and rate limiting for all routes
 */

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/workspace',
  '/settings',
  '/favorites',
  '/recent',
  '/search',
  '/admin',
];

// Auth routes that should redirect if already authenticated
const authRoutes = ['/auth', '/auth/signin', '/auth/signup'];

export default withAuth(
  async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authRequest = request as NextRequest & { nextauth?: { token?: unknown } };
    const token = authRequest.nextauth?.token;
    const isAuth = !!token;

    // Check authentication for protected routes
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedRoute && !isAuth) {
      const url = new URL('/auth', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Apply rate limiting to API routes
    if (pathname.startsWith('/api/')) {
      // Skip rate limiting for:
      // - Auth routes (have their own specific limits)
      // - WebSocket routes (persistent connections)
      // - Polling/real-time endpoints
      // - Health checks
      const excludedPaths = [
        '/api/auth/',
        '/api/socket',
        '/api/presence',
        '/api/notifications/poll',
        '/api/health',
      ];

      if (excludedPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
      }

      // Development: 1000 req/min, Production: 100 req/min
      const identifier = getClientIdentifier(request);
      const { success, remaining, resetAt } = await rateLimit(`global:${identifier}`);

      if (!success) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': process.env.NODE_ENV === 'development' ? '1000' : '100',
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(resetAt).toISOString(),
              'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      const limit = process.env.NODE_ENV === 'development' ? '1000' : '100';
      response.headers.set('X-RateLimit-Limit', limit);
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(resetAt).toISOString());

      return response;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow all requests to proceed, we handle auth logic in the middleware function
      authorized: () => true,
    },
    pages: {
      signIn: '/auth',
    },
  }
);

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - /api/auth/* (NextAuth handles these internally)
     * - /api/docs (public API documentation)
     * - /api/health (public health check)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\..*|api/docs|api/health).*)',
  ],
};
