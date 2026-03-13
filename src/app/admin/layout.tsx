'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, BarChart3, LogOut, Menu, X, MessageSquare, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage) {
      verifyAuth();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginPage]);

  const verifyAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth/verify');
      if (res.ok) {
        const data = await res.json();
        setAuthenticated(data.authenticated);
        setAdminUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#111827_0%,#1f2937_42%,#0f172a_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-purple-500" />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-linear-to-br from-purple-600 to-fuchsia-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-sm tracking-wide text-slate-400">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#111827_0%,#1f2937_42%,#0f172a_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-28 h-112 w-md rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-12 -right-32 h-120 w-120 rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 h-104 w-104 rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 h-88 w-88 rounded-full bg-indigo-600/6 blur-[100px]" />
        <div className="absolute -right-16 -bottom-20 h-80 w-80 rounded-full bg-fuchsia-600/7 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[52px_52px] opacity-[0.04]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.018)_0px,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_64px)]" />
        <div className="absolute -top-32 -right-32 h-160 w-160 rounded-full border border-violet-500/8" />
        <div className="absolute -bottom-48 -left-24 h-192 w-3xl rounded-full border border-indigo-500/6" />
      </div>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-slate-900/72 backdrop-blur-2xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Subtle top border accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
                <Shield className="h-5 w-5 text-white" />
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 ring-inset" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Admin Panel</h1>
                <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                  Control Center
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
              title="Close navigation"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    isActive
                      ? 'bg-linear-to-r from-indigo-500/15 via-violet-500/20 to-fuchsia-500/15 font-semibold text-white shadow-sm'
                      : 'font-medium text-slate-400 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-linear-to-b from-indigo-400 via-violet-400 to-fuchsia-400" />
                  )}
                  <item.icon
                    className={`h-4 w-4 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="space-y-3 border-t border-white/8 p-4">
            {adminUser && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 shadow-lg shadow-black/10">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-600 to-fuchsia-600 text-xs font-bold text-white">
                  {adminUser.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{adminUser.email}</p>
                  <p className="text-[10px] text-slate-500">Administrator</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/55 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
              title="Toggle navigation"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to App
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="relative p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
