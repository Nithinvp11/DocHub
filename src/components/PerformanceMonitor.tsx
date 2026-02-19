'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance';

/**
 * Performance monitoring component
 * Initializes Web Vitals tracking on mount
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals().catch((error) => {
      console.warn('[Performance] Failed to initialize Web Vitals:', error);
    });
  }, []);

  // This component doesn't render anything
  return null;
}
