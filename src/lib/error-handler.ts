/**
 * Centralized Error Handling
 * Provides consistent error handling across the application
 */

import { logger } from './logger';

export interface ErrorResponse {
  message: string;
  status: number;
  code?: string;
}

/**
 * Handle errors consistently across API routes
 */
export function handleError(error: unknown, context?: string): ErrorResponse {
  // Log the error with context
  logger.error(`Error ${context ? `in ${context}` : ''}:`, error);

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown };

    switch (prismaError.code) {
      case 'P2002':
        return {
          message: 'A record with this value already exists',
          status: 409,
          code: 'DUPLICATE_ENTRY',
        };
      case 'P2025':
        return {
          message: 'Record not found',
          status: 404,
          code: 'NOT_FOUND',
        };
      case 'P2003':
        return {
          message: 'Foreign key constraint failed',
          status: 400,
          code: 'INVALID_REFERENCE',
        };
      default:
        if (process.env.NODE_ENV === 'development') {
          return {
            message: `Database error: ${prismaError.code}`,
            status: 500,
            code: prismaError.code,
          };
        }
    }
  }

  // Validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return {
      message: error.message,
      status: 400,
      code: 'VALIDATION_ERROR',
    };
  }

  // Standard errors
  if (error instanceof Error) {
    if (process.env.NODE_ENV === 'development') {
      return {
        message: error.message,
        status: 500,
        code: 'INTERNAL_ERROR',
      };
    }
  }

  // Generic error for production
  return {
    message: 'An unexpected error occurred. Please try again later.',
    status: 500,
    code: 'INTERNAL_ERROR',
  };
}

/**
 * Error logging utility with Sentry integration placeholder
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  logger.error('Exception captured:', error, context);

  // TODO: Add Sentry integration
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Create a safe error response for API routes
 */
export function createErrorResponse(error: unknown, context?: string) {
  const { message, status, code } = handleError(error, context);

  return Response.json(
    {
      error: message,
      code,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
