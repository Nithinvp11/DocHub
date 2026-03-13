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
import { Plus } from 'lucide-react';

interface CreateWorkspaceDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open: controlledOpen,
  onOpenChange,
}: CreateWorkspaceDialogProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberLimit: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          memberLimit:
            formData.memberLimit.trim() === '' ? null : Number.parseInt(formData.memberLimit, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create workspace');
        toast.error(data.error || 'Failed to create workspace');
        return;
      }

      toast.success('Workspace created successfully!');
      setOpen(false);
      setFormData({ name: '', description: '', memberLimit: '' });
      router.refresh();
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="border border-white/10 bg-slate-900 text-white shadow-2xl shadow-purple-500/10 backdrop-blur-xl sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-white">Create Workspace</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new workspace to organize your documentation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-5">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                Name
              </Label>
              <Input
                id="name"
                placeholder="My Workspace"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-white/10 bg-slate-800/60 text-white placeholder-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-300">
                Description <span className="text-slate-500">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="What is this workspace for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="resize-none border-white/10 bg-slate-800/60 text-white placeholder-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memberLimit" className="text-sm font-medium text-slate-300">
                Member Limit <span className="text-slate-500">(optional)</span>
              </Label>
              <Input
                id="memberLimit"
                type="number"
                min={1}
                step={1}
                placeholder="Leave empty for unlimited"
                value={formData.memberLimit}
                onChange={(e) => setFormData({ ...formData, memberLimit: e.target.value })}
                className="border-white/10 bg-slate-800/60 text-white placeholder-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
              <p className="text-xs text-slate-500">
                Limits how many users can join this workspace as members.
              </p>
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-violet-500 hover:shadow-purple-500/40 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
