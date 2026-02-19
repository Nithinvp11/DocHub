'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-premium text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-premium-md hover:shadow-premium-lg hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-surface-white border border-base-300 text-text-secondary shadow-premium-sm hover:shadow-premium-md hover:border-primary-300 hover:text-primary-600',
        ghost: 'text-text-secondary hover:bg-base-100 hover:text-text-primary',
        success:
          'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-premium-md hover:shadow-premium-lg',
        danger:
          'bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-premium-md hover:shadow-premium-lg',
        link: 'text-primary-600 underline-offset-4 hover:underline',
        glass:
          'bg-white/70 backdrop-blur-glass border border-white/20 text-text-primary shadow-premium-md hover:shadow-premium-lg',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        default: 'h-10 px-6 py-2.5',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
