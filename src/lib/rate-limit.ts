import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (for development)
// In production, use Redis or a dedicated service like Upstash
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

// Development: Very relaxed limits (1000 req/min)
// Production: Stricter limits (100 req/min)
const DEFAULT_LIMIT = isDevelopment ? 1000 : 100;
const DEFAULT_WINDOW = 60000; // 1 minute

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 60000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  // Bypass rate limiting in development if disabled
  if (!RATE_LIMIT_ENABLED && isDevelopment) {
    return {
      success: true,
      remaining: limit,
      resetAt: Date.now() + windowMs,
    };
  }

  const now = Date.now();
  const key = `${identifier}`;

  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      success: true,
      remaining: limit - 1,
      resetAt: store[key].resetAt,
    };
  }

  store[key].count++;

  const remaining = Math.max(0, limit - store[key].count);
  const success = store[key].count <= limit;

  return {
    success,
    remaining,
    resetAt: store[key].resetAt,
  };
}

export function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  // In development, use a combination of IP and user agent to create unique identifier
  // This prevents all local requests from being counted as one
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'localhost';

  if (isDevelopment && ip === 'localhost') {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    // Create a simple hash of user agent to differentiate browser tabs/sessions
    const hash = userAgent
      .split('')
      .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
    return `dev-${Math.abs(hash)}`;
  }

  return ip;
}
