'use client';

/**
 * Skip Navigation Component
 * Provides keyboard users with a way to skip repetitive navigation
 * and jump directly to main content (WCAG 2.1 - 2.4.1)
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
      tabIndex={0}
    >
      Skip to main content
    </a>
  );
}
