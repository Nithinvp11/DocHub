'use client';

import { useParams } from 'next/navigation';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity as ActivityIcon } from 'lucide-react';

export default function ActivityPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Activity Feed</h1>
        </div>
        <p className="text-gray-600">
          Track all activities in this workspace - document changes, comments, GitHub events, and member actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            View all workspace activities in chronological order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed workspaceId={workspaceId} limit={100} />
        </CardContent>
      </Card>
    </div>
  );
}
