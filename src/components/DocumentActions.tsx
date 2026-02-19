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
import { Copy, Edit3, MoreVertical, Save, Trash2, FileText, Loader2, Github } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentGitHubSync } from '@/components/DocumentGitHubSync';

interface DocumentActionsProps {
  documentId: string;
  documentTitle: string;
  workspaceId: string;
}

export function DocumentActions({ documentId, documentTitle, workspaceId }: DocumentActionsProps) {
  const router = useRouter();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGitHubSync, setShowGitHubSync] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newTitle, setNewTitle] = useState(documentTitle);
  const [saveAsTitle, setSaveAsTitle] = useState(`Copy of ${documentTitle}`);

  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        toast.success('Document renamed successfully');
        setShowRenameDialog(false);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to rename document');
      }
    } catch (error) {
      console.error('Error renaming document:', error);
      toast.error('Failed to rename document');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAs = async () => {
    if (!saveAsTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/save-as`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: saveAsTitle, workspaceId }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        toast.success('Document saved as new copy');
        setShowSaveAsDialog(false);
        router.push(`/dashboard/${workspaceId}/documents/${newDoc.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save as new document');
      }
    } catch (error) {
      console.error('Error saving as new document:', error);
      toast.error('Failed to save as new document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/settings`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Document deleted successfully');
        setShowDeleteDialog(false);
        router.push(`/dashboard/${workspaceId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-purple-400/40 bg-slate-900/70 text-white shadow-sm shadow-purple-500/20 transition-all hover:border-purple-300/80 hover:bg-slate-800/80 hover:shadow-md hover:shadow-purple-500/30"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-52 border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl"
        >
          <DropdownMenuItem
            onClick={() => setShowRenameDialog(true)}
            className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowSaveAsDialog(true)}
            className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
          >
            <Copy className="mr-2 h-4 w-4" />
            Save As...
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            onClick={() => setShowGitHubSync(true)}
            className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub Sync
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Rename Document</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a new name for this document
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-title" className="text-slate-300">
              Document Title
            </Label>
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              className="mt-2 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-purple-500/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={loading}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save As Dialog */}
      <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Save As New Document</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a copy of this document with a new name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="save-as-title" className="text-slate-300">
              New Document Title
            </Label>
            <Input
              id="save-as-title"
              value={saveAsTitle}
              onChange={(e) => setSaveAsTitle(e.target.value)}
              placeholder="Enter title for copy"
              className="mt-2 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-purple-500/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveAs();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveAsDialog(false)}
              disabled={loading}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAs}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Copy className="mr-2 h-4 w-4" />
              Save As
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="text-destructive h-5 w-5" />
              Delete Document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Document Title Display */}
            <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
              <p className="mb-1 text-sm text-slate-400">Document to delete:</p>
              <p className="text-lg font-semibold">{documentTitle}</p>
            </div>

            {/* Warning Message */}
            <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="mt-0.5 flex-shrink-0">
                <svg
                  className="text-destructive h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-destructive mb-1 font-semibold">
                  Warning: This cannot be undone
                </p>
                <p className="text-sm text-slate-300">
                  This will permanently delete the document and all its versions, comments, and
                  history.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300">Are you absolutely sure you want to proceed?</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GitHub Sync Dialog */}
      <DocumentGitHubSync
        documentId={documentId}
        workspaceId={workspaceId}
        documentTitle={documentTitle}
        open={showGitHubSync}
        onOpenChange={setShowGitHubSync}
      />
    </>
  );
}
