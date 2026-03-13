'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Github,
  Loader2,
  Upload,
  Download,
  ExternalLink,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentGitHubSyncProps {
  documentId: string;
  workspaceId: string;
  documentTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface GitHubIntegration {
  id: string;
  repository: string;
  branch: string;
}

interface Document {
  id: string;
  title: string;
  githubPath: string | null;
  githubSha: string | null;
}

export function DocumentGitHubSync({
  documentId,
  workspaceId,
  documentTitle,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}: DocumentGitHubSyncProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [integration, setIntegration] = useState<GitHubIntegration | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [githubPath, setGithubPath] = useState('');

  // Use controlled or uncontrolled pattern
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (open) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workspaceId, documentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch workspace integration
      const integrationRes = await fetch(
        `/api/github/workspace-integration?workspaceId=${workspaceId}`
      );
      if (integrationRes.ok) {
        const integrationData = await integrationRes.json();
        setIntegration(integrationData.integration || null);
      }

      // Fetch document details
      const docRes = await fetch(`/api/documents/${documentId}`);
      if (docRes.ok) {
        const docData = await docRes.json();
        setDocument(docData);
        setGithubPath(
          docData.githubPath || `${documentTitle.toLowerCase().replace(/\s+/g, '-')}.md`
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = () => {
    setOpen(false);
    router.push(`/dashboard/${workspaceId}/settings/github`);
  };

  const handleExport = async () => {
    if (!integration) {
      toast.error('Please configure GitHub integration first');
      return;
    }

    if (!githubPath.trim()) {
      toast.error('Please enter a GitHub path');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/github/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          repository: integration.repository,
          branch: integration.branch,
          documentIds: [documentId],
          customPath: githubPath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to export to GitHub');
        return;
      }

      toast.success('Document exported to GitHub successfully');

      // Update document githubPath
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubPath }),
      });

      router.refresh();
      fetchData();
    } catch (error) {
      console.error('Error exporting to GitHub:', error);
      toast.error('Failed to export to GitHub');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!integration) {
      toast.error('Please configure GitHub integration first');
      return;
    }

    if (!githubPath.trim()) {
      toast.error('Please enter a GitHub path to import from');
      return;
    }

    setImporting(true);
    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          githubRepository: integration.repository,
          githubBranch: integration.branch,
          githubPath,
          documentId, // Update existing document
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to import from GitHub');
        return;
      }

      toast.success('Document imported from GitHub successfully');
      router.refresh();
      fetchData();
    } catch (error) {
      console.error('Error importing from GitHub:', error);
      toast.error('Failed to import from GitHub');
    } finally {
      setImporting(false);
    }
  };

  const handleViewOnGitHub = () => {
    if (integration && githubPath) {
      // Check if this is a root file (README.md, LICENSE, etc.)
      const isRootFile = [
        'README.md',
        'readme.md',
        'LICENSE',
        'license',
        'CONTRIBUTING.md',
        'contributing.md',
        'CODE_OF_CONDUCT.md',
        'code_of_conduct.md',
      ].includes(githubPath.split('/').pop() || '');

      let url: string;
      if (isRootFile) {
        // Root file - use filename only
        const filename = githubPath.split('/').pop() || githubPath;
        url = `https://github.com/${integration.repository}/blob/${integration.branch}/${filename}`;
      } else {
        // Regular document - use docs/ prefix
        url = `https://github.com/${integration.repository}/blob/${integration.branch}/docs/${githubPath}`;
      }

      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <Github className="mr-2 h-4 w-4" />
              GitHub Sync
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Github className="mr-2 h-5 w-5" />
            GitHub Sync - {documentTitle}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Sync this document with GitHub repository
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : !integration ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-200">
                GitHub integration is not configured for this workspace.
              </p>
            </div>
            <Button onClick={handleConfigure} className="w-full bg-blue-600 hover:bg-blue-700">
              <Settings className="mr-2 h-4 w-4" />
              Configure GitHub Integration
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Integration Info */}
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Repository</span>
                <span className="font-medium text-white">{integration.repository}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Branch</span>
                <span className="font-medium text-white">{integration.branch}</span>
              </div>
            </div>

            {/* GitHub Path Input */}
            <div className="space-y-2">
              <Label htmlFor="github-path" className="text-sm text-slate-300">
                GitHub Path
              </Label>
              <Input
                id="github-path"
                value={githubPath}
                onChange={(e) => setGithubPath(e.target.value)}
                placeholder="e.g., planning/my-document.md"
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                Relative path (root files like README.md stay at root, others go in docs/)
              </p>
            </div>

            {/* Sync Status */}
            {document?.githubSha && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs font-medium text-green-200">Synced with GitHub</p>
                  <p className="text-xs text-green-300/70">
                    SHA: {document.githubSha.substring(0, 7)}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleExport}
                disabled={exporting || importing || !githubPath.trim()}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-3 w-3" />
                    Export
                  </>
                )}
              </Button>

              <Button
                onClick={handleImport}
                disabled={exporting || importing || !githubPath.trim()}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-3 w-3" />
                    Import
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {document?.githubPath && (
                <Button
                  onClick={handleViewOnGitHub}
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10"
                  size="sm"
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View on GitHub
                </Button>
              )}

              <Button
                onClick={handleConfigure}
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                size="sm"
              >
                <Settings className="mr-2 h-3 w-3" />
                Settings
              </Button>
            </div>

            {/* Help Text */}
            <div className="space-y-1 border-t border-white/10 pt-2 text-xs text-slate-400">
              <p>
                <strong>Export:</strong> Push this document to GitHub as a markdown file
              </p>
              <p>
                <strong>Import:</strong> Pull content from GitHub markdown file into this document
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
