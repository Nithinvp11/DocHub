/**
 * Sentry Error Monitoring Integration
 *
 * This file provides centralized error tracking and monitoring
 * for the application using Sentry.
 *
 * Setup Instructions:
 * 1. Install Sentry SDK: npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
 * 3. Initialize Sentry in instrumentation.ts
 * 4. Import and use in error boundaries and API routes
 */

// Type-only import to avoid errors when Sentry is not installed
type SentryScope = {
  setTag: (key: string, value: string) => void;
  setUser: (user: { id: string; email?: string; username?: string } | null) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  setLevel: (level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug') => void;
};

type SentryHub = {
  captureException: (error: Error, hint?: { tags?: Record<string, string> }) => string;
  captureMessage: (
    message: string,
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  ) => string;
  withScope: (callback: (scope: SentryScope) => void) => void;
};

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SENTRY_DSN &&
    process.env.NODE_ENV === 'production'
  );
}

/**
 * Get Sentry instance (lazy loaded)
 */
let sentryInstance: SentryHub | null = null;

async function getSentry(): Promise<SentryHub | null> {
  if (!isSentryEnabled()) {
    return null;
  }

  if (sentryInstance) {
    return sentryInstance;
  }

  try {
    // Dynamic import to avoid errors when Sentry is not installed
    // @ts-expect-error - Optional dependency
    const Sentry = await import('@sentry/nextjs');
    sentryInstance = Sentry as unknown as SentryHub;
    return sentryInstance;
  } catch (error) {
    console.warn('Sentry not installed or failed to load:', error);
    return null;
  }
}

/**
 * Log an error to Sentry
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logErrorToSentry(error as Error, {
 *     tags: { feature: 'document-sync' }
 *   });
 * }
 */
export async function logErrorToSentry(
  error: Error,
  options?: {
    tags?: Record<string, string>;
    user?: { id: string; email?: string; username?: string };
    context?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  }
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) {
    // Fallback to console in development
    console.error('[Error]', error, options);
    return;
  }

  Sentry.withScope((scope) => {
    // Set tags for filtering in Sentry dashboard
    if (options?.tags) {
      Object.entries(options.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set user context
    if (options?.user) {
      scope.setUser(options.user);
    }

    // Set additional context
    if (options?.context) {
      scope.setContext('additional', options.context);
    }

    // Set severity level
    if (options?.level) {
      scope.setLevel(options.level);
    }

    // Capture the exception
    Sentry.captureException(error);
  });
}

/**
 * Log a message to Sentry
 *
 * @example
 * logMessageToSentry('User completed onboarding', 'info', {
 *   tags: { feature: 'onboarding' }
 * });
 */
export async function logMessageToSentry(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  options?: {
    tags?: Record<string, string>;
    user?: { id: string; email?: string; username?: string };
  }
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) {
    console.log(`[${level.toUpperCase()}]`, message, options);
    return;
  }

  Sentry.withScope((scope) => {
    if (options?.tags) {
      Object.entries(options.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (options?.user) {
      scope.setUser(options.user);
    }

    scope.setLevel(level);
    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for all future error reports
 *
 * @example
 * setUserContext({
 *   id: 'user-123',
 *   email: 'user@example.com',
 *   username: 'johndoe'
 * });
 */
export async function setUserContext(
  user: {
    id: string;
    email?: string;
    username?: string;
  } | null
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.withScope((scope) => {
    scope.setUser(user);
  });
}

/**
 * Performance monitoring utilities
 */
export const SentryPerformance = {
  /**
   * Start a performance transaction
   *
   * @example
   * const transaction = await SentryPerformance.startTransaction('document-load');
   * // ... do work
   * await SentryPerformance.finishTransaction(transaction);
   */
  startTransaction: async (name: string, op: string = 'custom') => {
    const Sentry = await getSentry();
    if (!Sentry) return null;

    // Would use Sentry.startTransaction() if available
    console.log(`[Performance] Started: ${name} (${op})`);
    return { name, startTime: Date.now() };
  },

  finishTransaction: async (transaction: { name: string; startTime: number } | null) => {
    if (!transaction) return;

    const duration = Date.now() - transaction.startTime;
    console.log(`[Performance] Finished: ${transaction.name} (${duration}ms)`);
  },
};

/**
 * Error boundary integration
 */
export function getErrorBoundaryConfig() {
  return {
    onError: async (error: Error, errorInfo: React.ErrorInfo) => {
      await logErrorToSentry(error, {
        tags: {
          feature: 'error-boundary',
        },
        context: {
          componentStack: errorInfo.componentStack,
        },
        level: 'error',
      });
    },
  };
}
