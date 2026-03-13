'use client';

// TODO: verify if still needed

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Trash2 } from 'lucide-react';

interface WorkspaceSettingsDialogProps {
  workspaceId: string;
  currentName: string;
  currentDescription: string | null;
  userRole: string;
}

export function WorkspaceSettingsDialog({ 
  workspaceId, 
  currentName, 
  currentDescription,
  userRole 
}: WorkspaceSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canEdit = userRole === 'OWNER' || userRole === 'ADMIN';
  const canDelete = userRole === 'OWNER';

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update workspace');
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      alert('Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    const confirmed = confirm(
      'Are you sure you want to delete this workspace? This action cannot be undone and will delete all documents, versions, and comments.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Failed to delete workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Update workspace details or manage workspace settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Update Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">General Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your workspace..."
                rows={3}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Danger Zone */}
          {canDelete && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Once you delete a workspace, there is no going back. This will permanently delete all documents, versions, comments, and workspace data.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Workspace
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
