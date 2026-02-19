'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors border',
  {
    variants: {
      variant: {
        success: 'bg-success-50 text-success-600 border-success-500/20',
        warning: 'bg-warning-50 text-warning-600 border-warning-500/20',
        danger: 'bg-danger-50 text-danger-600 border-danger-500/20',
        info: 'bg-info-50 text-info-500 border-info-500/20',
        primary: 'bg-primary-50 text-primary-600 border-primary-500/20',
        secondary: 'bg-base-200 text-text-secondary border-base-300',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function PremiumBadge({ className, variant, showDot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <div
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-success-500': variant === 'success',
            'bg-warning-500': variant === 'warning',
            'bg-danger-500': variant === 'danger',
            'bg-info-500': variant === 'info',
            'bg-primary-500': variant === 'primary',
            'bg-text-tertiary': variant === 'secondary',
          })}
        />
      )}
      {children}
    </div>
  );
}

export { PremiumBadge, badgeVariants };
