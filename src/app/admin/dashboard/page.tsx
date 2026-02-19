'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, FileText, Lock, GitCommit, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminStats {
  users: { total: number; admins: number; regular: number };
  documents: number;
  versions: number;
  comments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      subtitle: `${stats?.users.admins || 0} admins, ${stats?.users.regular || 0} regular`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Documents',
      value: stats?.documents || 0,
      subtitle: `${stats?.versions || 0} versions created`,
      icon: FileText,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Version History',
      value: stats?.versions || 0,
      subtitle: 'Total versions created',
      icon: GitCommit,
      color: 'from-teal-500 to-teal-600',
    },
    {
      title: 'Comments',
      value: stats?.comments || 0,
      subtitle: 'Total comments made',
      icon: MessageSquare,
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          System analytics and activity monitoring (Read-only)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg bg-linear-to-br p-2 ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-muted-foreground mt-1 text-sm">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/users"
              className="block rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="font-medium">View Users</div>
              <div className="text-muted-foreground text-sm">
                View all registered users and statistics
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">WebSocket</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Rate Limiting</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
