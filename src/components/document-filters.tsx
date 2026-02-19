'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface DocumentFiltersProps {
  onFilterChange: (filters: DocumentFilters) => void;
}

export interface DocumentFilters {
  search: string;
  phase: string;
  type: string;
  author: string;
}

export function DocumentFilters({ onFilterChange }: DocumentFiltersProps) {
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    phase: 'ALL',
    type: 'ALL',
    author: 'ALL',
  });

  const updateFilter = (key: keyof DocumentFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="search" className="text-sm font-medium text-white">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="search"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="h-11 border-white/20 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phase" className="text-sm font-medium text-white">
            Phase
          </Label>
          <Select value={filters.phase} onValueChange={(value) => updateFilter('phase', value)}>
            <SelectTrigger
              id="phase"
              className="h-11 border-white/20 bg-white/5 text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-slate-900 text-white">
              <SelectItem value="ALL">All Phases</SelectItem>
              <SelectItem value="PLANNING">Planning</SelectItem>
              <SelectItem value="DEVELOPMENT">Development</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-white">
            Type
          </Label>
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger
              id="type"
              className="h-11 border-white/20 bg-white/5 text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-slate-900 text-white">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
              <SelectItem value="SPECIFICATION">Specification</SelectItem>
              <SelectItem value="MEETING_NOTES">Meeting Notes</SelectItem>
              <SelectItem value="API_DOCS">API Docs</SelectItem>
              <SelectItem value="GUIDE">Guide</SelectItem>
              <SelectItem value="RFC">RFC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
