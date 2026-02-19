import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { validateEnvironment } from '@/lib/env-validation';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth();

    // Check environment configuration
    const envValidation = validateEnvironment();

    const health = {
      status: dbHealthy && envValidation.valid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbHealthy ? 'ok' : 'error',
        environment: envValidation.valid ? 'ok' : 'warning',
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      envWarnings: envValidation.warnings.length,
      envErrors: envValidation.errors.length,
    };

    const duration = performance.now() - startTime;

    if (!dbHealthy) {
      logger.warn('Health check failed', { health, duration: `${duration.toFixed(2)}ms` });
      return NextResponse.json(health, { status: 503 });
    }

    // Log environment errors in production
    if (!envValidation.valid && process.env.NODE_ENV === 'production') {
      logger.error('Environment validation failed', { errors: envValidation.errors });
    }

    logger.debug('Health check passed', { duration: `${duration.toFixed(2)}ms` });
    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Health check error', error, { duration: `${duration.toFixed(2)}ms` });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
