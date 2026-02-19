'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, Trash2, Edit, Eye, MoreVertical, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { VersionContentRenderer } from '@/components/VersionContentRenderer';

interface Version {
  id: string;
  version: number;
  content: string;
  diff: string | null;
  message: string;
  sha: string | null;
  label?: string | null;
  isAutoSave?: boolean;
  isDraft?: boolean;
  createdAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

interface VersionHistoryProps {
  versions: Version[];
  documentId: string;
  currentContent: string;
  onRestore?: (versionId: string) => void;
}

type VersionStatus = 'current' | 'restored' | 'imported' | 'autosave' | 'saved' | 'initial';

function buildVersionCode(version: Version): string {
  if (version.sha) {
    return `#${version.sha.slice(0, 4).toUpperCase()}`;
  }

  const stamp = new Date(version.createdAt).getTime().toString(36).slice(-4).toUpperCase();
  const orderCode = (version.version % 36).toString(36).toUpperCase();
  return `#${stamp}${orderCode}`;
}

function getVersionStatus(version: Version, isCurrent: boolean): VersionStatus {
  const message = version.message.toLowerCase();

  if (isCurrent) return 'current';
  if (version.version === 1) return 'initial';
  if (version.isAutoSave || version.isDraft) return 'autosave';
  if (message.includes('restor')) return 'restored';
  if (message.includes('import') || message.includes('github')) return 'imported';

  return 'saved';
}

function getVersionName(status: VersionStatus): string {
  if (status === 'initial') return 'Initial Version';
  if (status === 'autosave') return 'Auto Save';
  if (status === 'restored') return 'Restored Version';
  if (status === 'imported') return 'Imported from GitHub';
  return 'Saved Version';
}

function getStatusBadgeClass(status: VersionStatus): string {
  if (status === 'current') {
    return 'border-blue-400/40 bg-blue-500/15 text-blue-200';
  }
  if (status === 'restored') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200';
  }
  if (status === 'imported') {
    return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200';
  }
  if (status === 'autosave') {
    return 'border-amber-400/40 bg-amber-500/15 text-amber-200';
  }
  if (status === 'initial') {
    return 'border-violet-400/40 bg-violet-500/15 text-violet-200';
  }

  return 'border-purple-400/40 bg-purple-500/15 text-purple-200';
}

function formatVersionDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function VersionHistory({ versions, documentId, onRestore }: VersionHistoryProps) {
  const router = useRouter();

  const [activeVersionId, setActiveVersionId] = useState<string | null>(versions[0]?.id ?? null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [versionToView, setVersionToView] = useState<Version | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<Version | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [versionToRename, setVersionToRename] = useState<Version | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [versionToLabel, setVersionToLabel] = useState<Version | null>(null);
  const [labelInput, setLabelInput] = useState('');

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions]
  );

  const handleRestore = async (version: Version) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${version.id}/restore`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to restore version');
        return;
      }

      toast.success('Version restored');
      setShowRestoreDialog(false);
      setVersionToRestore(null);

      if (onRestore) {
        onRestore(version.id);
      }

      router.refresh();
    } catch {
      toast.error('Failed to restore version');
    }
  };

  const handleDeleteVersion = async () => {
    if (!versionToDelete) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete version');
        return;
      }

      toast.success('Version deleted');
      setShowDeleteDialog(false);
      setVersionToDelete(null);
      router.refresh();
    } catch {
      toast.error('Failed to delete version');
    }
  };

  const handleRenameVersion = async () => {
    if (!versionToRename || !renameInput.trim()) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionToRename.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: renameInput.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to rename version');
        return;
      }

      toast.success('Version renamed');
      setShowRenameDialog(false);
      setVersionToRename(null);
      setRenameInput('');
      router.refresh();
    } catch {
      toast.error('Failed to rename version');
    }
  };

  const handleUpdateLabel = async () => {
    if (!versionToLabel || !labelInput.trim()) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionToLabel.id}/label`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: labelInput.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to update label');
        return;
      }

      toast.success('Version label updated');
      setShowLabelDialog(false);
      setVersionToLabel(null);
      setLabelInput('');
      router.refresh();
    } catch {
      toast.error('Failed to update label');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 shadow-sm">
          <Clock className="h-4 w-4 text-purple-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Version History</h3>
          <p className="text-xs text-slate-400">{sortedVersions.length} versions</p>
        </div>
      </div>

      <div className="max-h-[470px] space-y-2 overflow-y-auto pr-1">
        {sortedVersions.map((version, index) => {
          const isCurrent = index === 0;
          const isActive = activeVersionId === version.id;
          const status = getVersionStatus(version, isCurrent);
          const versionCode = buildVersionCode(version);
          const displayName = getVersionName(status);
          const displayAuthor = version.author.name || version.author.email.split('@')[0];

          return (
            <div
              key={version.id}
              className={`group rounded-xl border p-3 transition-all ${
                isActive
                  ? 'border-purple-400/50 bg-purple-500/10 shadow-md shadow-purple-500/10'
                  : 'border-white/10 bg-slate-900/50 hover:border-purple-500/35 hover:bg-slate-900/70 hover:shadow-md hover:shadow-purple-500/10'
              }`}
              onClick={() => setActiveVersionId(version.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{displayName}</span>
                    <Badge
                      className={`h-5 border px-1.5 text-[10px] ${getStatusBadgeClass(status)}`}
                    >
                      {status === 'current'
                        ? 'Current'
                        : status === 'restored'
                          ? 'Restored'
                          : status === 'imported'
                            ? 'Imported'
                            : status === 'autosave'
                              ? 'Auto-save'
                              : status === 'initial'
                                ? 'Initial'
                                : 'Saved'}
                    </Badge>
                    {version.label && (
                      <Badge className="h-5 border border-fuchsia-400/40 bg-fuchsia-500/15 px-1.5 text-[10px] text-fuchsia-200">
                        {version.label}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">{versionCode}</span>
                    <span>•</span>
                    <span className="tracking-wide text-slate-500 uppercase">
                      v{version.version}
                    </span>
                  </div>

                  <p className="line-clamp-1 text-xs text-slate-300">
                    {version.message || 'No message'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>{displayAuthor}</span>
                    <span>•</span>
                    <span>{formatVersionDate(version.createdAt)}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 border border-white/10 bg-slate-900/70 text-slate-200 opacity-80 transition-all group-hover:opacity-100 hover:border-purple-400/60 hover:bg-slate-800/90 hover:text-white hover:shadow-sm hover:shadow-purple-500/25"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    collisionPadding={12}
                    className="w-44 border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl"
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setVersionToView(version);
                        setShowViewDialog(true);
                      }}
                      className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setVersionToRestore(version);
                        setShowRestoreDialog(true);
                      }}
                      className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setVersionToRename(version);
                        setRenameInput(version.message || '');
                        setShowRenameDialog(true);
                      }}
                      className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setVersionToLabel(version);
                        setLabelInput(version.label || '');
                        setShowLabelDialog(true);
                      }}
                      className="text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white"
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      {version.label ? 'Edit Label' : 'Add Label'}
                    </DropdownMenuItem>
                    {!isCurrent && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setVersionToDelete(version);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-h-[80vh] max-w-4xl border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {versionToView
                ? `${getVersionName(getVersionStatus(versionToView, false))} ${buildVersionCode(versionToView)}`
                : 'Version'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {versionToView?.message || 'No message'} •{' '}
              {versionToView ? formatVersionDate(versionToView.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <VersionContentRenderer content={versionToView?.content || ''} className="prose-sm" />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Restore Version?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This creates a new latest version from the selected version content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => versionToRestore && handleRestore(versionToRestore)}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Version?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVersion}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Rename Version</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the version message.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="rename-version-input" className="text-slate-300">
              Version Message
            </Label>
            <Input
              id="rename-version-input"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Enter new version message"
              className="mt-2 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-purple-500/60"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameVersion}
              disabled={!renameInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent className="border border-white/10 bg-slate-900/95 text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Label</DialogTitle>
            <DialogDescription className="text-slate-400">
              Assign a label to make this version easier to identify.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="label-version-input" className="text-slate-300">
              Label
            </Label>
            <Input
              id="label-version-input"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Example: Stable release"
              maxLength={50}
              className="mt-2 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-purple-500/60"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLabelDialog(false)}
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLabel}
              disabled={!labelInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              Save Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
