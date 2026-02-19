'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Users,
  FolderOpen,
  Inbox,
  UserPlus,
  Search,
  Tag,
  GitBranch,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  Plus,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-fuchsia-600/5 to-purple-600/5" />

      <CardContent className="relative flex flex-col items-center justify-center px-8 py-16 text-center">
        {icon && (
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 ring-1 ring-white/10">
            {icon}
          </div>
        )}
        <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
        <p className="mb-8 max-w-md text-base leading-relaxed text-slate-400">{description}</p>
        <div className="flex gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              className="h-12 gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <Plus className="h-5 w-5" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </div>
  );
}

// Pre-built empty states for common scenarios

export function NoWorkspacesEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="h-10 w-10 text-purple-400" />}
      title="No workspaces yet"
      description="Create your first workspace to start organizing your documentation and collaborate with your team!"
      action={{
        label: 'Create Workspace',
        onClick: onCreate,
      }}
    />
  );
}

export function NoDocumentsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-10 w-10 text-purple-400" />}
      title="No documents yet"
      description="Start documenting your ideas, specs, and meeting notes. Click below to create your first document!"
      action={{
        label: 'Create Document',
        onClick: onCreate,
      }}
    />
  );
}

export function NoConnectionsEmpty({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={<UserPlus className="h-10 w-10 text-purple-400" />}
      title="No connections yet"
      description="Start building your professional network! Connect with colleagues to collaborate on documents and share knowledge."
      action={{
        label: 'Find People',
        onClick: onInvite,
      }}
    />
  );
}

export function NoMembersEmpty({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-10 w-10 text-purple-400" />}
      title="No team members yet"
      description="Invite your team to collaborate! Add members to start working together on documents."
      action={{
        label: 'Invite Members',
        onClick: onInvite,
      }}
    />
  );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="h-10 w-10 text-purple-400" />}
      title="No results found"
      description={`We couldn't find any documents matching "${query}". Try different keywords or create a new document.`}
    />
  );
}

export function NoActivityEmpty() {
  return (
    <EmptyState
      icon={<Inbox className="h-10 w-10 text-purple-400" />}
      title="No recent activity"
      description="Your workspace is quiet right now. Activity will appear here when you and your team start creating and editing documents."
    />
  );
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      icon={<Bell className="h-10 w-10 text-purple-400" />}
      title="You're all caught up!"
      description="No new notifications. We'll let you know when something needs your attention."
    />
  );
}

export function NoCommentsEmpty() {
  return (
    <EmptyState
      icon={<MessageSquare className="text-muted-foreground h-8 w-8" />}
      title="No comments yet"
      description="Be the first to start a discussion! Add comments to collaborate with your team."
    />
  );
}

export function NoTagsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Tag className="text-muted-foreground h-8 w-8" />}
      title="No tags yet"
      description="Create tags to organize and categorize your documents for easier discovery."
      action={{
        label: 'Create Tag',
        onClick: onCreate,
      }}
    />
  );
}

export function NoVersionsEmpty() {
  return (
    <EmptyState
      icon={<GitBranch className="text-muted-foreground h-8 w-8" />}
      title="No version history"
      description="This is the first version of this document. Version history will appear here as you make changes."
    />
  );
}

export function NoScheduledSyncsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="text-muted-foreground h-8 w-8" />}
      title="No scheduled syncs"
      description="Set up automatic synchronization with GitHub on a schedule to keep your documents in sync effortlessly."
      action={{
        label: 'Create Schedule',
        onClick: onCreate,
      }}
    />
  );
}

export function GitHubNotConnectedEmpty({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={<GitBranch className="text-muted-foreground h-8 w-8" />}
      title="GitHub not connected"
      description="Connect your GitHub account to enable two-way sync, issue tracking, and more powerful collaboration features."
      action={{
        label: 'Connect GitHub',
        onClick: onConnect,
      }}
    />
  );
}

export function NoTemplatesEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="text-muted-foreground h-8 w-8" />}
      title="No templates available"
      description="Create reusable templates to speed up document creation and maintain consistency across your workspace."
      action={{
        label: 'Create Template',
        onClick: onCreate,
      }}
    />
  );
}

export function NoFavoritesEmpty() {
  return (
    <EmptyState
      icon={<FileText className="text-muted-foreground h-8 w-8" />}
      title="No favorites yet"
      description="Star documents to add them to your favorites for quick access. Your most important docs, always one click away!"
    />
  );
}

export function NoRecentDocumentsEmpty() {
  return (
    <EmptyState
      icon={<FileText className="text-muted-foreground h-8 w-8" />}
      title="No recent documents"
      description="Documents you view will appear here for quick access. Start exploring your workspace!"
    />
  );
}

// Generic error state
export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="bg-destructive/10 mb-4 rounded-full p-3">
          <Settings className="text-destructive h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Export aliases for backward compatibility
export const NoWorkspaces = NoWorkspacesEmpty;
export const NoDocuments = NoDocumentsEmpty;
export const NoConnections = NoConnectionsEmpty;
export const NoPendingRequests = NoConnectionsEmpty; // Assuming same component
export const NoSearchResults = NoSearchResultsEmpty;
export const NoActivity = NoActivityEmpty;
