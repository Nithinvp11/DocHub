'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ShieldCheck, Eye, BriefcaseBusiness } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  githubLinked: boolean;
  _count: {
    ownedWorkspaces: number;
    workspaces: number;
    documentLocks: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-300">
            View all users in the system with a cleaner account-focused summary.
          </p>
        </div>
        <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10">
          {users.length} Total Users
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search users by email or name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 rounded-2xl border-white/12 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/15"
        />
      </div>

      {/* User list */}
      <div className="relative overflow-hidden rounded-4xl border border-white/12 bg-slate-900/52 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No users found</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {user.name || user.email}
                    </span>
                    {user.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Admin
                      </span>
                    )}
                    {user.githubLinked && (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        GitHub Linked
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2.5 py-1">
                      <BriefcaseBusiness className="h-3 w-3" />
                      {user._count.ownedWorkspaces + user._count.workspaces} workspaces
                    </span>
                    {user._count.documentLocks > 0 && (
                      <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-violet-300">
                        {user._count.documentLocks} active locks
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read-only banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3.5 backdrop-blur-xl">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <div>
          <p className="text-sm font-semibold text-sky-300">Read-Only Access</p>
          <p className="mt-0.5 text-xs text-sky-400/70">
            Admin has view-only access to user information. User management operations (create,
            edit, delete, promote, demote) are not available.
          </p>
        </div>
      </div>
    </div>
  );
}
