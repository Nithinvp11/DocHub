'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, RotateCcw } from 'lucide-react';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildAutoPath = (phase: string, type: string, title: string) => {
  const p = toSlug(phase);
  const t = toSlug(type);
  const ti = toSlug(title);
  if (!ti) return '';
  return `/${p}/${t}/${ti}`;
};

const validatePathFormat = (path: string): string | null => {
  if (!path || path === '/') return 'Path cannot be empty';
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return 'Path cannot be empty';
  if (segments.length > 10) return 'Path cannot have more than 10 segments';
  for (const seg of segments) {
    if (seg.length > 100) return `Segment "${seg}" exceeds 100 characters`;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(seg))
      return `Invalid segment "${seg}": use lowercase letters, numbers, and hyphens`;
  }
  return null;
};

interface CreateDocumentDialogProps {
  workspaceId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDocumentDialog({
  workspaceId,
  open: controlledOpen,
  onOpenChange,
}: CreateDocumentDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    phase: 'PLANNING',
    type: 'GENERAL',
  });
  const [customPath, setCustomPath] = useState('');
  const [pathEdited, setPathEdited] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
      return;
    }
    setInternalOpen(value);
  };

  // Auto-update path when title/phase/type changes (only when not edited manually)
  useEffect(() => {
    if (!pathEdited) {
      setCustomPath(buildAutoPath(formData.phase, formData.type, formData.title));
    }
  }, [formData.title, formData.phase, formData.type, pathEdited]);

  const handlePathChange = (value: string) => {
    setPathEdited(true);
    setCustomPath(value);
    // Validate live but only show error after user types a real path
    if (value && value !== '/') {
      setPathError(validatePathFormat(value));
    } else {
      setPathError(null);
    }
  };

  const resetPath = () => {
    setPathEdited(false);
    setPathError(null);
    setCustomPath(buildAutoPath(formData.phase, formData.type, formData.title));
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      // Reset form on close
      setFormData({ title: '', phase: 'PLANNING', type: 'GENERAL' });
      setCustomPath('');
      setPathEdited(false);
      setPathError(null);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate path before submitting
    const pErr = customPath ? validatePathFormat(customPath) : null;
    if (pErr) {
      setPathError(pErr);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          workspaceId,
          content: '',
          // Only send path if user explicitly set one
          ...(pathEdited && customPath ? { path: customPath } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          const msg = 'A document already exists at this path';
          setError(msg);
          setPathError(msg);
          toast.error(msg);
        } else {
          setError(data.error || 'Failed to create document');
          toast.error(data.error || 'Failed to create document');
        }
        return;
      }

      toast.success('Document created successfully!');
      handleOpenChange(false);
      if (data?.id) {
        router.push(`/dashboard/${workspaceId}/documents/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700">
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Create New Document</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a blank document in this workspace. Start writing immediately!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-white">
                Document Title *
              </Label>
              <Input
                id="title"
                placeholder="Getting Started"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-xs text-slate-400">A descriptive title for your document</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phase" className="text-white">
                  Phase
                </Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value) => setFormData({ ...formData, phase: value })}
                >
                  <SelectTrigger
                    id="phase"
                    className="border-white/20 bg-white/5 text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type" className="text-white">
                  Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger
                    id="type"
                    className="border-white/20 bg-white/5 text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="SPECIFICATION">Specification</SelectItem>
                    <SelectItem value="MEETING_NOTES">Meeting Notes</SelectItem>
                    <SelectItem value="API_DOCS">API Docs</SelectItem>
                    <SelectItem value="GUIDE">Guide</SelectItem>
                    <SelectItem value="RFC">RFC</SelectItem>
                    <SelectItem value="TEMPLATE">Template</SelectItem>
                    <SelectItem value="FOLDER">Folder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom path field */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-path" className="text-white">
                  Document Path
                </Label>
                {pathEdited && (
                  <button
                    type="button"
                    onClick={resetPath}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to auto
                  </button>
                )}
              </div>
              <Input
                id="custom-path"
                placeholder="/onboarding/my-sop"
                value={customPath}
                onChange={(e) => handlePathChange(e.target.value)}
                className={`border-white/20 bg-white/5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 ${
                  pathEdited ? 'border-purple-500/50' : ''
                } ${pathError ? 'border-red-500/60' : ''}`}
              />
              {pathError ? (
                <p className="text-xs text-red-400">{pathError}</p>
              ) : (
                <p className="text-xs text-slate-400">
                  {pathEdited
                    ? 'Custom path — also used as GitHub file path'
                    : 'Auto-generated from phase, type, and title'}
                </p>
              )}
              {customPath && !pathError && (
                <p className="font-mono text-xs text-slate-500">
                  GitHub: {customPath.replace(/^\/+/, '')}.md
                </p>
              )}
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !!pathError}
              className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
