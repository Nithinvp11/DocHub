'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildPathPreview = (phase: string, type: string, title: string) =>
  `/${toSlug(phase)}/${toSlug(type)}/${toSlug(title)}`;

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

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
      return;
    }

    setInternalOpen(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          workspaceId,
          content: '', // Start with blank content
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('Document name already exists in this phase/type path');
          toast.error('Document name already exists in this phase/type path');
        } else {
          setError(data.error || 'Failed to create document');
          toast.error(data.error || 'Failed to create document');
        }
        return;
      }

      toast.success('Document created successfully!');
      setOpen(false);
      setFormData({ title: '', phase: 'PLANNING', type: 'GENERAL' });
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
    <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="grid gap-2">
              <Label className="text-white">Path Preview</Label>
              <Input
                value={buildPathPreview(formData.phase, formData.type, formData.title)}
                readOnly
                className="border-white/20 bg-white/5 text-slate-300"
              />
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
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
