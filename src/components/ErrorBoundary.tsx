/**
 * Error Boundary Component
 * Catches React errors and provides graceful error recovery
 */

'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error monitoring service (Sentry, etc.)
    // captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We&apos;re sorry, but something unexpected happened. Don&apos;t worry, your data is
                safe.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-900/10">
                <p className="font-mono text-sm break-all text-red-800 dark:text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async boundary for handling promise rejections
 */
export function AsyncErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Failed to load content. Please try again.
            </p>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
