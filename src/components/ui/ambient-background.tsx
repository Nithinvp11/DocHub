'use client';

/**
 * AmbientBackground Component
 *
 * Provides a premium, animated background with:
 * - Subtle gradient layers
 * - Floating ambient shapes with blur
 * - Noise texture for depth
 * - Respects prefers-reduced-motion
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base gradient layer */}
      <div
        className="from-base-50 via-primary-50/30 to-secondary-400/10 absolute inset-0 bg-linear-to-br"
        style={{
          background:
            'linear-gradient(135deg, #FAFBFC 0%, rgba(240, 244, 255, 0.3) 50%, rgba(61, 217, 235, 0.1) 100%)',
        }}
      />

      {/* Noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Floating ambient shapes */}
      <div
        className="bg-primary-200/30 motion-safe:animate-ambient-float absolute top-1/4 -left-48 h-96 w-96 rounded-full blur-3xl motion-reduce:animate-none"
        style={{ willChange: 'transform' }}
      />

      <div
        className="bg-secondary-400/20 motion-safe:animate-ambient-float absolute -right-48 bottom-1/3 h-96 w-96 rounded-full blur-3xl motion-reduce:animate-none"
        style={{
          willChange: 'transform',
          animationDelay: '5s',
        }}
      />

      <div
        className="bg-success-500/15 motion-safe:animate-ambient-pulse absolute top-2/3 left-1/3 h-72 w-72 rounded-full blur-3xl motion-reduce:animate-none"
        style={{
          willChange: 'opacity',
          animationDelay: '3s',
        }}
      />

      {/* Additional subtle shape for depth */}
      <div
        className="bg-primary-300/20 motion-safe:animate-ambient-pulse absolute top-1/2 right-1/4 h-80 w-80 rounded-full blur-3xl motion-reduce:animate-none"
        style={{
          willChange: 'opacity',
          animationDelay: '8s',
        }}
      />
    </div>
  );
}
