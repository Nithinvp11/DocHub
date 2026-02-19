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
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Base gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900" />

      {/* Animated Aurora Orbs */}
      {showGlowOrbs && (
        <>
          <motion.div
            className="pointer-events-none fixed top-[20%] left-[10%] h-96 w-96 rounded-full bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 blur-3xl"
            animate={{
              x: interactive ? mousePosition.x * 0.02 : [0, 50, 0],
              y: interactive ? mousePosition.y * 0.02 : [0, 30, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.4, 0.3],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="pointer-events-none fixed top-[40%] right-[10%] h-[32rem] w-[32rem] rounded-full bg-gradient-to-r from-blue-600/25 to-purple-600/25 blur-3xl"
            animate={{
              x: interactive ? -mousePosition.x * 0.015 : [0, -30, 0],
              y: interactive ? -mousePosition.y * 0.015 : [0, 50, 0],
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.35, 0.25],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="pointer-events-none fixed bottom-[10%] left-[40%] h-80 w-80 rounded-full bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 blur-3xl"
            animate={{
              x: [0, 40, 0],
              y: [0, -40, 0],
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* Grid Overlay */}
      {showGrids && (
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      )}

      {/* Noise Texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
