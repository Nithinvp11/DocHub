'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface AuroraBackgroundProps {
  children?: ReactNode;
  showGrids?: boolean;
  showGlowOrbs?: boolean;
  interactive?: boolean;
}

export function AuroraBackground({
  children,
  showGrids = true,
  showGlowOrbs = true,
  interactive = false,
}: AuroraBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Radial gradient mesh */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.18),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.14),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.12),transparent_50%)]" />

      {/* Animated Aurora Orbs */}
      {showGlowOrbs && (
        <>
          <motion.div
            className="pointer-events-none fixed -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-linear-to-br from-purple-600/35 via-violet-600/25 to-transparent blur-[100px]"
            animate={{
              x: interactive ? mousePosition.x * 0.02 : [0, 50, 0],
              y: interactive ? mousePosition.y * 0.02 : [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="pointer-events-none fixed -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-linear-to-tl from-indigo-600/30 via-violet-600/20 to-transparent blur-[120px]"
            animate={{
              x: interactive ? -mousePosition.x * 0.015 : [0, -40, 0],
              y: interactive ? -mousePosition.y * 0.015 : [0, -50, 0],
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="pointer-events-none fixed top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-blue-600/22 to-cyan-600/18 blur-[90px]"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* Grid Overlay */}
      {showGrids && (
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      )}

      {/* Noise Texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
