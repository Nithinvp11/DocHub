'use client';

import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { documents: number };
}

interface TagSelectorProps {
  workspaceId: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#64748B', // slate
  '#6B7280', // gray
];

export function TagSelector({
  workspaceId,
  selectedTags,
  onTagsChange,
  disabled = false,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Load available tags
  const loadTags = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tags?workspaceId=${workspaceId}`);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && availableTags.length === 0) {
      loadTags();
    }
  }, [isOpen]);

  const handleAddTag = (tag: Tag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: newTagName.trim(),
          color: selectedColor,
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setAvailableTags([...availableTags, newTag]);
        handleAddTag(newTag);
        setNewTagName('');
        setIsCreating(false);
        setSelectedColor(PRESET_COLORS[0]);
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.find((t) => t.id === tag.id)
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="gap-1"
          style={{
            backgroundColor: `${tag.color}20`,
            borderColor: tag.color,
            color: tag.color,
          }}
        >
          {tag.name}
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:opacity-70"
              aria-label="Remove tag"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}

      {!disabled && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1">
              <Plus className="h-3 w-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              {!isCreating ? (
                <>
                  <div>
                    <Input
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        Loading tags...
                      </div>
                    ) : filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <button
                          type="button"
                          key={tag.id}
                          onClick={() => handleAddTag(tag)}
                          className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm"
                        >
                          <div
                            className="h-3 w-3 shrink-0 rounded"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1 text-left">{tag.name}</span>
                          {tag._count && (
                            <span className="text-muted-foreground text-xs">
                              {tag._count.documents}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        No tags found
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Create New Tag
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    autoFocus
                  />

                  <div>
                    <div className="mb-2 text-xs font-medium">Color</div>
                    <div className="grid grid-cols-9 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            'h-6 w-6 rounded border-2 transition-transform',
                            selectedColor === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsCreating(false);
                        setNewTagName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// Simple read-only tag display
export function TagDisplay({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <TagIcon className="text-muted-foreground h-3 w-3" />
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs"
          style={{
            backgroundColor: `${tag.color}20`,
            borderColor: tag.color,
            color: tag.color,
          }}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  );
}
