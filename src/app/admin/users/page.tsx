'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, AlertCircle, Eye } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  githubLinked: boolean;
  _count: {
    workspaces: number;
    documents: number;
    versions: number;
    comments: number;
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

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Viewing</h1>
          <p className="text-muted-foreground mt-2">
            View all users in the system (Read-only)
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {users.length} Total Users
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || user.email}</span>
                          {user.role === 'ADMIN' && (
                            <Badge variant="default" className="bg-blue-600">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.githubLinked && (
                            <Badge variant="outline" className="text-xs">
                              GitHub Linked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground ml-13">
                      <span>{user._count.workspaces} workspaces</span>
                      <span>{user._count.documents} documents</span>
                      <span>{user._count.versions} versions</span>
                      <span>{user._count.comments} comments</span>
                      {user._count.documentLocks > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          {user._count.documentLocks} active locks
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Read-Only Access
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Admin has view-only access to user information. User management operations (create, edit, delete, promote, demote) are not available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
