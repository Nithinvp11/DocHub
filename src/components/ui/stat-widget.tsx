'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatWidgetProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatWidget({
  title,
  value,
  icon: Icon,
  iconColor,
  subtitle,
  trend,
}: StatWidgetProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-lg border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-white/20"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <div
              className={`mt-2 flex items-center gap-1 text-sm ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconColor.replace('text-', 'bg-')}/10`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
}
