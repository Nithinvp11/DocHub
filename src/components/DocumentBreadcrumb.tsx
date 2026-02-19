'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, FileText, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  id: string;
  title: string;
  path?: string;
  type?: 'workspace' | 'folder' | 'document';
  emoji?: string;
}

interface DocumentBreadcrumbProps {
  items: BreadcrumbItem[];
  workspaceId: string;
  className?: string;
}

export function DocumentBreadcrumb({
  items,
  workspaceId,
  className,
}: DocumentBreadcrumbProps) {
  const getIcon = (item: BreadcrumbItem, index: number) => {
    if (index === 0) {
      return <Home className="h-4 w-4" />;
    }
    
    if (item.emoji) {
      return <span className="text-base">{item.emoji}</span>;
    }
    
    if (item.type === 'folder') {
      return <Folder className="h-4 w-4" />;
    }
    
    return <FileText className="h-4 w-4" />;
  };

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const href = item.path 
          ? `/workspace/${workspaceId}/document/${item.path}`
          : `/workspace/${workspaceId}`;

        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            
            {isLast ? (
              <span className="flex items-center gap-1.5 text-foreground font-medium truncate">
                {getIcon(item, index)}
                <span className="truncate">{item.title}</span>
              </span>
            ) : (
              <Link
                href={href}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {getIcon(item, index)}
                <span className="truncate">{item.title}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Helper to build breadcrumb trail from document and parent chain
type DocumentWithParent = {
  id: string;
  title: string;
  path: string;
  emoji?: string | null;
  parent?: DocumentWithParent | null;
};

export function buildBreadcrumbTrail(
  document: {
    id: string;
    title: string;
    path: string;
    emoji?: string | null;
    parent?: {
      id: string;
      title: string;
      path: string;
      emoji?: string | null;
      parent?: DocumentWithParent;
    } | null;
  },
  workspace: {
    id: string;
    name: string;
  }
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [
    {
      id: workspace.id,
      title: workspace.name,
      type: 'workspace',
    },
  ];

  // Build parent chain recursively
  const buildParentChain = (doc: DocumentWithParent): BreadcrumbItem[] => {
    if (!doc.parent) return [];
    
    const parentItems = buildParentChain(doc.parent);
    
    return [
      ...parentItems,
      {
        id: doc.parent.id,
        title: doc.parent.title,
        path: doc.parent.path,
        type: 'folder',
        emoji: doc.parent.emoji || undefined,
      },
    ];
  };

  const parentChain = buildParentChain(document);
  
  return [
    ...trail,
    ...parentChain,
    {
      id: document.id,
      title: document.title,
      path: document.path,
      type: 'document',
      emoji: document.emoji || undefined,
    },
  ];
}
