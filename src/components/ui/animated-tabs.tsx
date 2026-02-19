'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onChange, className }: AnimatedTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement) {
      const parent = activeTabElement.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        setIndicatorStyle({
          left: tabRect.left - parentRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [activeTab]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 p-1.5 backdrop-blur-xl',
        className
      )}
    >
      {/* Animated pill indicator */}
      <motion.div
        className="absolute top-[6px] h-[calc(100%-12px)] rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30"
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isHovered = tab.id === hoveredTab;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => onChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className={cn(
              'relative z-10 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-200',
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {/* Hover glow effect */}
            {isHovered && !isActive && (
              <motion.div
                layoutId="hover"
                className="absolute inset-0 rounded-xl bg-white/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}

            {/* Icon */}
            {tab.icon && (
              <span
                className={cn(
                  'relative z-10 transition-all duration-200',
                  isActive && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                )}
              >
                {tab.icon}
              </span>
            )}

            {/* Label */}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
