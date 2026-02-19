'use client';

import { LucideIcon } from 'lucide-react';
import { GlowButton } from './glow-button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-slate-900/20 p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <Icon className="h-8 w-8 text-slate-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-slate-400">{description}</p>
      {action && (
        <GlowButton variant="primary" onClick={action.onClick}>
          {action.label}
        </GlowButton>
      )}
    </div>
  );
}
