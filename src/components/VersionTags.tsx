'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Tag } from 'lucide-react';

interface VersionTag {
  id: string;
  name: string;
  color: string;
  description?: string | null;
}

interface VersionTagsProps {
  versionId: string;
  existingTags: VersionTag[];
  onTagsChange?: (tags: VersionTag[]) => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

export function VersionTags({ versionId, existingTags, onTagsChange }: VersionTagsProps) {
  const [tags, setTags] = useState<VersionTag[]>(existingTags);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState({
    name: '',
    color: PRESET_COLORS[0].value,
    description: '',
  });

  const handleAddTag = async () => {
    if (!newTag.name.trim()) return;

    const tag: VersionTag = {
      id: `temp-${Date.now()}`,
      name: newTag.name.trim(),
      color: newTag.color,
      description: newTag.description || undefined,
    };

    // Call API to create tag
    try {
      const response = await fetch(`/api/versions/${versionId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tag.name,
          color: tag.color,
          description: tag.description,
        }),
      });

      if (response.ok) {
        const createdTag = await response.json();
        const updatedTags = [...tags, createdTag];
        setTags(updatedTags);
        onTagsChange?.(updatedTags);
        setNewTag({ name: '', color: PRESET_COLORS[0].value, description: '' });
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/versions/${versionId}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedTags = tags.filter((t) => t.id !== tagId);
        setTags(updatedTags);
        onTagsChange?.(updatedTags);
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          className="gap-1 pr-1"
          style={{ backgroundColor: tag.color, color: '#fff' }}
          title={tag.description || undefined}
        >
          <Tag className="h-3 w-3" />
          {tag.name}
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="ml-1 rounded-full p-0.5 hover:bg-black/20"
            aria-label={`Remove ${tag.name} tag`}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button size="sm" variant="outline" className="h-6" onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-1 h-3 w-3" />
        Add Tag
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Version Tag</DialogTitle>
            <DialogDescription>
              Tag this version to mark it as important or categorize it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">Tag Name *</Label>
              <Input
                id="tag-name"
                placeholder="e.g., v1.0-stable, final, draft"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tag-description">Description (optional)</Label>
              <Input
                id="tag-description"
                placeholder="What makes this version special?"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-10 rounded-lg border-2 transition-all ${
                      newTag.color === color.value
                        ? 'border-slate-900 ring-2 ring-slate-300'
                        : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewTag({ ...newTag, color: color.value })}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTag.name.trim()}>
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
