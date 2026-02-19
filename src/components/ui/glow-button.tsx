'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlowButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border border-purple-500/20 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40',
  secondary: 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  outline:
    'bg-transparent text-purple-400 border border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-500/20 shadow-lg shadow-red-600/20 hover:shadow-red-600/40',
};

const sizeStyles = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10',
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

GlowButton.displayName = 'GlowButton';
