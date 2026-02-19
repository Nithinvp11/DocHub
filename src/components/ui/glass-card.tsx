'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, hover = true, glow = false }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-lg border border-white/10 bg-slate-900/70',
        hover && 'transition-all hover:border-white/20',
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      {glow && (
        <div className="pointer-events-none absolute -inset-px rounded-lg bg-gradient-to-br from-purple-600/10 via-transparent to-fuchsia-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
