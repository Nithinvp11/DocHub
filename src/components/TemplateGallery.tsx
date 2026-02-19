'use client';

import React, { useState } from 'react';
import { FileText, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  title: string;
  description?: string | null;
  emoji?: string | null;
  coverImage?: string | null;
  category: string;
  isPublic: boolean;
  usageCount: number;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface TemplateGalleryProps {
  workspaceId: string;
  onSelectTemplate: (templateId: string, title: string) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'General', label: 'General' },
  { value: 'Meeting', label: 'Meeting Notes' },
  { value: 'Project', label: 'Project Docs' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Design', label: 'Design' },
  { value: 'Personal', label: 'Personal' },
];

export function TemplateGallery({ workspaceId, onSelectTemplate }: TemplateGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/templates', window.location.origin);
      url.searchParams.set('workspaceId', workspaceId);
      if (selectedCategory !== 'all') {
        url.searchParams.set('category', selectedCategory);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, selectedCategory]);

  const filteredTemplates = templates.filter(template =>
    searchQuery === '' ||
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template.id, template.title);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-built template to get going faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Template
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="whitespace-nowrap"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading templates...</div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      'group relative p-4 rounded-lg border bg-card text-left',
                      'hover:border-primary hover:shadow-md transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-primary'
                    )}
                  >
                    {/* Cover/Emoji */}
                    {template.coverImage ? (
                      <div className="w-full h-32 mb-3 rounded overflow-hidden">
                        <img
                          src={template.coverImage}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : template.emoji ? (
                      <div className="text-4xl mb-3">{template.emoji}</div>
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                    )}

                    {/* Title */}
                    <h3 className="font-semibold mb-1 line-clamp-2">
                      {template.title}
                    </h3>

                    {/* Description */}
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.usageCount > 0 && (
                        <span>{template.usageCount} uses</span>
                      )}
                    </div>

                    {/* Public Badge */}
                    {template.isPublic && (
                      <Badge
                        variant="outline"
                        className="absolute top-2 right-2 text-xs"
                      >
                        Public
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
