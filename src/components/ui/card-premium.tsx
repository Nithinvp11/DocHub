'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  hover?: boolean;
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-premium-lg p-6 transition-all duration-300',
          {
            'bg-surface-white shadow-premium-md border-base-200/50 border': variant === 'default',
            'backdrop-blur-glass shadow-premium-lg border border-white/20 bg-white/70':
              variant === 'glass',
            'bg-surface-white shadow-premium-lg border-base-200/50 border': variant === 'elevated',
          },
          hover && 'hover:shadow-premium-xl cursor-pointer hover:-translate-y-0.5',
          className
        )}
        {...props}
      />
    );
  }
);
PremiumCard.displayName = 'PremiumCard';

const PremiumCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
  )
);
PremiumCardHeader.displayName = 'PremiumCardHeader';

const PremiumCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-text-primary text-xl leading-none font-semibold tracking-tight', className)}
    {...props}
  />
));
PremiumCardTitle.displayName = 'PremiumCardTitle';

const PremiumCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-text-tertiary text-sm leading-relaxed', className)} {...props} />
));
PremiumCardDescription.displayName = 'PremiumCardDescription';

const PremiumCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-4', className)} {...props} />
);
PremiumCardContent.displayName = 'PremiumCardContent';

const PremiumCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-base-200 mt-4 flex items-center border-t pt-4', className)}
      {...props}
    />
  )
);
PremiumCardFooter.displayName = 'PremiumCardFooter';

export {
  PremiumCard,
  PremiumCardHeader,
  PremiumCardFooter,
  PremiumCardTitle,
  PremiumCardDescription,
  PremiumCardContent,
};
