'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Star,
  FileText,
  FolderOpen,
  MoreVertical,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  GitBranch,
  Loader2,
  Heart,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoriteDocument {
  id: string;
  createdAt: string;
  document: {
    id: string;
    title: string;
    path: string;
    type: string;
    status: string;
    emoji: string | null;
    coverImage: string | null;
    updatedAt: string;
    workspace: {
      id: string;
      name: string;
    };
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    tags: {
      tag: {
        id: string;
        name: string;
        color: string;
      };
    }[];
    _count: {
      comments: number;
      versions: number;
    };
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteDocument[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');

  // Fetch favorites
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites');

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
        setFilteredFavorites(data.favorites);
      } else {
        toast.error('Failed to fetch favorites');
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  useEffect(() => {
    let filtered = [...favorites];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((fav) =>
        fav.document.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Workspace filter
    if (filterWorkspace !== 'all') {
      filtered = filtered.filter((fav) => fav.document.workspace.id === filterWorkspace);
    }

    // Sort
    if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.document.title.localeCompare(b.document.title));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    setFilteredFavorites(filtered);
  }, [searchQuery, filterWorkspace, sortBy, favorites]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites?id=${favoriteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
        toast.success('Removed from favorites');
      } else {
        toast.error('Failed to remove favorite');
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('An error occurred');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'IN_REVIEW':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ARCHIVED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const uniqueWorkspaces = Array.from(
    new Set(favorites.map((fav) => fav.document.workspace.id))
  ).map((id) => {
    const workspace = favorites.find((fav) => fav.document.workspace.id === id)!.document.workspace;
    return workspace;
  });

  if (loading) {
    return (
      <AuroraBackground showGrids showGlowOrbs>
        <div className="container mx-auto min-h-screen px-4 py-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-400" />
              <p className="text-slate-400">Loading your favorites...</p>
            </div>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground showGrids showGlowOrbs>
      <div className="container mx-auto min-h-screen max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-pink-500 p-4 shadow-lg shadow-amber-500/30">
              <Star className="h-7 w-7 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">My Favorites</h1>
              <p className="text-slate-400">Quick access to your starred documents</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center gap-4">
            <Badge className="gap-2 border-red-500/30 bg-red-500/10 text-red-400">
              <Heart className="h-3.5 w-3.5 fill-red-400" />
              <span>{favorites.length} favorites</span>
            </Badge>
            <Badge className="gap-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>{uniqueWorkspaces.length} workspaces</span>
            </Badge>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-white/20 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Workspace Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Filter className="h-4 w-4" />
                {filterWorkspace === 'all'
                  ? 'All Workspaces'
                  : uniqueWorkspaces.find((w) => w.id === filterWorkspace)?.name || 'Workspace'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/10 bg-slate-900 text-white">
              <DropdownMenuItem
                onClick={() => setFilterWorkspace('all')}
                className="text-white hover:bg-white/10 focus:bg-white/10"
              >
                All Workspaces
              </DropdownMenuItem>
              {uniqueWorkspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setFilterWorkspace(workspace.id)}
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  {workspace.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Calendar className="h-4 w-4" />
                {sortBy === 'recent' ? 'Recent' : 'A-Z'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/10 bg-slate-900 text-white">
              <DropdownMenuItem
                onClick={() => setSortBy('recent')}
                className="text-white hover:bg-white/10 focus:bg-white/10"
              >
                Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('alphabetical')}
                className="text-white hover:bg-white/10 focus:bg-white/10"
              >
                Alphabetical (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Empty State */}
        {filteredFavorites.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 p-8">
              <Sparkles className="h-16 w-16 text-amber-400" />
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-white">
              {searchQuery ? 'No matching favorites' : 'No favorites yet'}
            </h3>
            <p className="mx-auto mb-6 max-w-md text-slate-400">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Star documents to quickly access them here'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
              >
                Browse Documents
              </Button>
            )}
          </motion.div>
        )}

        {/* Favorites Grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFavorites.map((favorite, index) => (
              <motion.div
                key={favorite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                }}
              >
                <GlassCard className="group relative overflow-hidden transition-all hover:border-purple-500/50">
                  {/* Cover Image or Gradient */}
                  {favorite.document.coverImage ? (
                    <div
                      className="h-32 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${favorite.document.coverImage})`,
                      }}
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
                      {favorite.document.emoji ? (
                        <span className="text-5xl">{favorite.document.emoji}</span>
                      ) : (
                        <FileText className="h-12 w-12 text-slate-500" />
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <Link
                        href={`/workspace/${favorite.document.workspace.id}/document/${favorite.document.id}`}
                        className="min-w-0 flex-1"
                      >
                        <h3 className="line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-purple-400">
                          {favorite.document.title}
                        </h3>
                      </Link>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="h-8 w-8 border-white/10 bg-white/5 p-0 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/10 bg-slate-900 text-white"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/workspace/${favorite.document.workspace.id}/document/${favorite.document.id}`
                              )
                            }
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeFavorite(favorite.id)}
                            className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from Favorites
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-3">
                      {/* Workspace */}
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span className="truncate">{favorite.document.workspace.name}</span>
                      </div>

                      {/* Status & Type */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getStatusColor(favorite.document.status)} text-xs`}>
                          {favorite.document.status.replace('_', ' ')}
                        </Badge>
                        {favorite.document.type !== 'GENERAL' && (
                          <Badge className="border-white/20 bg-white/5 text-xs text-white">
                            {favorite.document.type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      {/* Tags */}
                      {favorite.document.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {favorite.document.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.tag.id}
                              style={{
                                borderColor: tag.tag.color,
                                color: tag.tag.color,
                              }}
                              className="border bg-transparent text-xs"
                            >
                              {tag.tag.name}
                            </Badge>
                          ))}
                          {favorite.document.tags.length > 3 && (
                            <Badge className="border-white/20 bg-white/5 text-xs text-white">
                              +{favorite.document.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 border-t border-white/10 pt-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{favorite.document._count.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          <span>{favorite.document._count.versions}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                        {/* Author */}
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={favorite.document.author.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(
                                favorite.document.author.name || favorite.document.author.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground truncate text-xs">
                            {favorite.document.author.name ||
                              favorite.document.author.email.split('@')[0]}
                          </span>
                        </div>

                        {/* Updated */}
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDistanceToNow(new Date(favorite.document.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Favorite Badge */}
                    <div className="absolute top-4 right-4">
                      <Star className="h-5 w-5 fill-amber-500 text-amber-500 drop-shadow-lg" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </AuroraBackground>
  );
}
