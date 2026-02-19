'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { logErrorToSentry } from '@/lib/sentry';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to Sentry if available
    logErrorToSentry(error, {
      tags: {
        feature: 'error-boundary',
        errorBoundary: 'true',
      },
      context: {
        componentStack: errorInfo.componentStack,
      },
      level: 'error',
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                  <p className="font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = window.location.href;
                    }
                  }}
                  className="flex-1"
                >
                  Reload Page
                </Button>
                <Button
                  onClick={() => this.setState({ hasError: false })}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
