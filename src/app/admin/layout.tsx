'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, LogOut, Menu, X, MessageSquare } from 'lucide-react';

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

  // Skip authentication check for login page
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

  // Render login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-muted-foreground">Verifying admin access...</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-700 dark:bg-gray-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Panel</h1>
                <p className="text-muted-foreground text-xs">Control Center</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            {adminUser && (
              <div className="mb-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="truncate text-sm font-medium">{adminUser.email}</p>
                <p className="text-muted-foreground text-xs">Administrator</p>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between px-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
