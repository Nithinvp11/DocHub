import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */
export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): boolean => {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    if (record.count >= config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  };
}

/**
 * API route wrapper with common middleware
 * - Authentication
 * - Error handling
 * - Logging
 * - Rate limiting
 */
export function withApiMiddleware<T = unknown>(
  handler: (request: NextRequest, context: Record<string, unknown>) => Promise<NextResponse<T>>,
  options: {
    requireAuth?: boolean;
    rateLimit?: RateLimitConfig;
  } = {}
) {
  return async (request: NextRequest, context: Record<string, unknown>): Promise<NextResponse<T | { error: string }>> => {
    const startTime = performance.now();
    const path = new URL(request.url).pathname;

    try {
      // Authentication check
      if (options.requireAuth !== false) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
          const forwarded = request.headers.get('x-forwarded-for');
          const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
          logger.warn('Unauthorized access attempt', { path, ip });
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          ) as NextResponse<never>;
        }
      }

      // Rate limiting
      if (options.rateLimit) {
        const forwarded = request.headers.get('x-forwarded-for');
        const identifier = forwarded ? forwarded.split(',')[0] : 'unknown';
        const limiter = rateLimit(options.rateLimit);
        
        if (!limiter(identifier)) {
          logger.warn('Rate limit exceeded', { path, identifier });
          return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          ) as NextResponse<never>;
        }
      }

      // Execute handler
      const response = await handler(request, context);

      // Log successful request
      const duration = performance.now() - startTime;
      logger.debug('API request completed', {
        method: request.method,
        path,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`,
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('API request failed', error, {
        method: request.method,
        path,
        duration: `${duration.toFixed(2)}ms`,
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ) as NextResponse<never>;
    }
  };
}

/**
 * Health check helper
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}
