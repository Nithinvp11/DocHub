'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileDropdownProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user.name || user.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 shadow-sm backdrop-blur-xl transition-all hover:border-white/20 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-purple-500/10"
      >
        <Avatar className="h-8 w-8 ring-2 ring-purple-500/20 transition-all group-hover:ring-purple-500/40">
          <AvatarImage src={user.image || undefined} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left md:block">
          <p className="text-sm font-semibold text-white">{displayName}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-full right-0 z-50 mt-2 w-64 origin-top-right"
            >
              <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl">
                {/* User Info Header */}
                <div className="border-b border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-purple-500/30">
                      <AvatarImage src={user.image || undefined} alt={displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-sm font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                      <p className="truncate text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                  >
                    <div className="rounded-md bg-slate-800/50 p-1.5 transition-colors group-hover:bg-purple-600/20">
                      <User className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                  >
                    <div className="rounded-md bg-slate-800/50 p-1.5 transition-colors group-hover:bg-blue-600/20">
                      <Settings className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </Link>

                  <div className="my-2 h-px bg-white/10" />

                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/', redirect: true });
                    }}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-all hover:bg-red-500/10 hover:text-red-400"
                  >
                    <div className="rounded-md bg-slate-800/50 p-1.5 transition-colors group-hover:bg-red-600/20">
                      <LogOut className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
