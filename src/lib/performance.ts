/**
 * Performance Monitoring and Web Vitals Tracking
 *
 * This module provides utilities for tracking Core Web Vitals and custom
 * performance metrics using the Web Performance API.
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 *
 * Additional Metrics:
 * - TTFB (Time to First Byte): Server response time
 * - FCP (First Contentful Paint): First render
 * - INP (Interaction to Next Paint): Responsiveness
 */

import { useEffect, useRef } from 'react';
import { logMessageToSentry } from './sentry';

export type MetricName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

export interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType:
    | 'navigate'
    | 'reload'
    | 'back-forward'
    | 'prerender'
    | 'back-forward-cache'
    | 'restore';
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
}

type PerformanceMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

/**
 * Thresholds for Web Vitals ratings (based on web.dev recommendations)
 */
const thresholds: Record<MetricName, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Determine rating based on metric value and thresholds
 */
function getRating(metricName: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[metricName];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: PerformanceMetric): Promise<void> {
  // Log to Sentry for tracking
  await logMessageToSentry(
    `Performance: ${metric.name} = ${metric.value.toFixed(2)}ms (${metric.rating})`,
    metric.rating === 'poor' ? 'warning' : 'info',
    {
      tags: {
        metric: metric.name,
        rating: metric.rating,
      },
    }
  );

  // In production, you can also send to your analytics service
  if (
    process.env.NODE_ENV === 'production' &&
    typeof navigator !== 'undefined' &&
    navigator.sendBeacon
  ) {
    try {
      const blob = new Blob([JSON.stringify(metric)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/performance', blob);
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  } else {
    console.log('[Performance]', metric);
  }
}

/**
 * Report a Web Vital metric
 */
export function reportWebVital(metric: Metric): void {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };

  sendToAnalytics(performanceMetric);
}

/**
 * Initialize Web Vitals tracking
 *
 * Usage in app/layout.tsx:
 * ```tsx
 * import { initWebVitals } from '@/lib/performance';
 *
 * useEffect(() => {
 *   initWebVitals();
 * }, []);
 * ```
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import to avoid SSR issues
    // @ts-expect-error - Optional dependency
    const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    onCLS(reportWebVital);
    onFID(reportWebVital);
    onFCP(reportWebVital);
    onLCP(reportWebVital);
    onTTFB(reportWebVital);
    onINP(reportWebVital);

    console.log('[Performance] Web Vitals tracking initialized');
  } catch (error) {
    console.warn('[Performance] web-vitals package not installed:', error);
    console.log('[Performance] Install with: npm install web-vitals');
  }
}

/**
 * Measure custom performance marks
 *
 * @example
 * markStart('documentLoad');
 * // ... do work
 * markEnd('documentLoad');
 */
export function markStart(name: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`${name}-start`);
}

export function markEnd(name: string): number | null {
  if (typeof performance === 'undefined') return null;

  performance.mark(`${name}-end`);

  try {
    const measure = performance.measure(name, `${name}-start`, `${name}-end`);
    const duration = measure.duration;

    sendToAnalytics({
      name: `custom:${name}`,
      value: duration,
      rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    });

    return duration;
  } catch (error) {
    console.warn(`Failed to measure ${name}:`, error);
    return null;
  }
}

/**
 * Measure a function's execution time
 *
 * @example
 * const result = await measureAsync('fetchDocument', async () => {
 *   return await fetch('/api/documents/123');
 * });
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  markStart(name);
  try {
    const result = await fn();
    markEnd(name);
    return result;
  } catch (error) {
    markEnd(name);
    throw error;
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): {
  navigationTiming?: PerformanceTiming;
  memory?: PerformanceMemory; // Chrome-specific, not in standard Performance API
  entries: PerformanceEntryList;
} {
  if (typeof performance === 'undefined') {
    return { entries: [] };
  }

  const performanceWithMemory = performance as Performance & {
    memory?: PerformanceMemory;
  };

  return {
    navigationTiming: performance.timing,
    memory: performanceWithMemory.memory,
    entries: performance.getEntries(),
  };
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceData(): void {
  if (typeof performance === 'undefined') return;

  performance.clearMarks();
  performance.clearMeasures();
}

/**
 * React hook for tracking component render performance
 *
 * @example
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   return <div>...</div>;
 * }
 */
export function useRenderPerformance(componentName: string): void {
  const startTimeRef = useRef<number | null>(null);

  // Track component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const mountDuration = performance.now() - startTimeRef.current;

    if (mountDuration > 50) {
      // Only log slow renders
      sendToAnalytics({
        name: `render:${componentName}`,
        value: mountDuration,
        rating: mountDuration < 50 ? 'good' : mountDuration < 100 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
        url: window.location.href,
      });
    }

    return () => {
      // Optional: track component lifetime
    };
  }, [componentName]);
}

/**
 * Performance budget checker
 * Logs warnings when metrics exceed budgets
 */
export const performanceBudgets: Record<MetricName, number> = {
  LCP: 2500, // 2.5s
  FID: 100, // 100ms
  CLS: 0.1, // 0.1
  FCP: 1800, // 1.8s
  TTFB: 800, // 800ms
  INP: 200, // 200ms
};

export function checkPerformanceBudget(metric: Metric): boolean {
  const budget = performanceBudgets[metric.name];
  const exceeds = metric.value > budget;

  if (exceeds) {
    console.warn(
      `[Performance Budget] ${metric.name} exceeded budget: ${metric.value.toFixed(2)} > ${budget} (${metric.rating})`
    );
  }

  return !exceeds;
}

/**
 * Get performance summary for debugging
 */
export function getPerformanceSummary(): string {
  if (typeof performance === 'undefined') {
    return 'Performance API not available';
  }

  const timing = performance.timing;
  const navigation = performance.navigation;

  const metrics = {
    'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
    'TCP Connection': timing.connectEnd - timing.connectStart,
    'Request Time': timing.responseStart - timing.requestStart,
    'Response Time': timing.responseEnd - timing.responseStart,
    'DOM Processing': timing.domComplete - timing.domLoading,
    'DOM Ready': timing.domContentLoadedEventEnd - timing.navigationStart,
    'Page Load': timing.loadEventEnd - timing.navigationStart,
  };

  let summary = `Performance Summary:\n`;
  summary += `Navigation Type: ${['navigate', 'reload', 'back-forward'][navigation.type] || 'unknown'}\n`;
  summary += `Redirects: ${navigation.redirectCount}\n\n`;

  Object.entries(metrics).forEach(([name, value]) => {
    if (value > 0) {
      summary += `${name}: ${value}ms\n`;
    }
  });

  return summary;
}
