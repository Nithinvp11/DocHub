'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Folder, Clock, Tag, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  path: string;
  emoji?: string;
  status: string;
  type: string;
  workspaceId: string;
  updatedAt: string;
  relevance: number;
  matches: {
    title: boolean;
    content: boolean;
    path: boolean;
  };
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface WorkspaceResult {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    documents: number;
    members: number;
  };
}

interface SearchComponentProps {
  workspaceId?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchComponent({ workspaceId, className, autoFocus = false }: SearchComponentProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    documents: SearchResult[];
    workspaces: WorkspaceResult[];
    total: number;
  }>({ documents: [], workspaces: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Custom debounce function
  const debounce = <T extends unknown[]>(
    func: (...args: T) => void | Promise<void>,
    wait: number
  ): ((...args: T) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: T) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ documents: [], workspaces: [], total: 0 });
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(workspaceId && { workspaceId }),
      });

      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => performSearch(searchQuery), 300),
    [workspaceId]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDocumentClick = (doc: SearchResult) => {
    router.push(`/dashboard/${doc.workspaceId}/documents/${doc.id}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleWorkspaceClick = (workspace: WorkspaceResult) => {
    router.push(`/dashboard/${workspace.id}`);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ documents: [], workspaces: [], total: 0 });
    setIsOpen(false);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search documents... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.total > 0 && (
        <Card
          ref={resultsRef}
          className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto z-50 shadow-lg"
        >
          <CardContent className="p-2">
            {/* Workspaces */}
            {results.workspaces.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  Workspaces
                </div>
                {results.workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceClick(workspace)}
                    className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <Folder className="h-5 w-5 mt-0.5 shrink-0 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{highlightText(workspace.name, query)}</div>
                      {workspace.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {highlightText(workspace.description, query)}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{workspace._count.documents} documents</span>
                        <span>{workspace._count.members} members</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Documents */}
            {results.documents.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  Documents ({results.documents.length})
                </div>
                {results.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <div className="shrink-0">
                      {doc.emoji ? (
                        <span className="text-2xl">{doc.emoji}</span>
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{highlightText(doc.title, query)}</span>
                        {doc.matches.title && (
                          <Badge variant="secondary" className="text-xs">Title match</Badge>
                        )}
                      </div>
                      
                      {doc.snippet && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {highlightText(doc.snippet, query)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{doc.workspace.name}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(doc.updatedAt)}
                        </span>
                        {doc.tags.length > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            {doc.tags.slice(0, 2).map((tagDoc) => (
                              <Badge
                                key={tagDoc.tag.id}
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: tagDoc.tag.color } as React.CSSProperties}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tagDoc.tag.name}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && results.total === 0 && !loading && (
        <Card ref={resultsRef} className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try different keywords or check your spelling
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
