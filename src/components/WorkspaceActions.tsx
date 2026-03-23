'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, MoreVertical, Settings, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceActionsProps {
  workspaceId: string;
  workspaceName: string;
  workspaceDescription: string | null;
  workspaceMemberLimit: number | null;
  isOwner: boolean;
  canManage: boolean;
}

export function WorkspaceActions({
  workspaceId,
  workspaceName,
  workspaceDescription,
  workspaceMemberLimit,
  isOwner,
  canManage,
}: WorkspaceActionsProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(workspaceName);
  const [description, setDescription] = useState(workspaceDescription || '');
  const [memberLimit, setMemberLimit] = useState(
    workspaceMemberLimit === null ? '' : workspaceMemberLimit.toString()
  );

  const canEdit = isOwner || canManage;
  const canDelete = isOwner;

  const handleEdit = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    const trimmedMemberLimit = memberLimit.trim();
    if (trimmedMemberLimit !== '') {
      const parsedLimit = Number.parseInt(trimmedMemberLimit, 10);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        toast.error('Member limit must be a whole number greater than or equal to 1');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          memberLimit: trimmedMemberLimit === '' ? null : Number.parseInt(trimmedMemberLimit, 10),
        }),
      });

      if (res.ok) {
        toast.success('Workspace updated successfully');
        setShowEditDialog(false);
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(
          typeof errorData.error === 'string' ? errorData.error : 'Failed to update workspace'
        );
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/settings`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Workspace deleted successfully');
        setShowDeleteDialog(false);
        router.push('/dashboard');
      } else {
        const errorData = await res.json();
        toast.error(
          typeof errorData.error === 'string' ? errorData.error : 'Failed to delete workspace'
        );
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-slate-200 shadow-sm backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-purple-500/10"
            aria-label="Workspace actions"
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-white/10 bg-slate-900 text-white">
          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Workspace
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Workspace
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Workspace</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update workspace name, description, and member limit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Workspace Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workspace name"
                className="border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter workspace description"
                rows={3}
                className="border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-limit" className="text-white">
                Member Limit (optional)
              </Label>
              <Input
                id="member-limit"
                type="number"
                min={1}
                step={1}
                value={memberLimit}
                onChange={(e) => setMemberLimit(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-xs text-slate-400">
                Set an upper bound for joined members in this workspace.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={loading}
              className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Workspace</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete &ldquo;{workspaceName}&rdquo;? This will permanently
              delete all documents, comments, and data in this workspace. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="bg-linear-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
