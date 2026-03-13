'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/ui/aurora-background';

interface WorkspaceGitHubIntegration {
  id: string;
  repository: string;
  branch: string;
  basePath: string;
  connectedAt: Date;
  updatedAt: Date;
}

interface OperationSummary {
  total: number;
  succeeded: number;
  skipped: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

export default function WorkspaceGitHubSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fetchingIntegration, setFetchingIntegration] = useState(true);
  const [integration, setIntegration] = useState<WorkspaceGitHubIntegration | null>(null);
  const [syncSummary, setSyncSummary] = useState<OperationSummary | null>(null);
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [basePath, setBasePath] = useState('docs');

  useEffect(() => {
    fetchIntegration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const fetchIntegration = async () => {
    setFetchingIntegration(true);
    try {
      const response = await fetch(`/api/github/workspace-integration?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.integration) {
          setIntegration(data.integration);
          setRepository(data.integration.repository);
          setBranch(data.integration.branch);
          setBasePath(data.integration.basePath);
        }
      }
    } catch (error) {
      console.error('Error fetching integration:', error);
      toast.error('Failed to load GitHub integration settings');
    } finally {
      setFetchingIntegration(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!repository) {
      toast.error('Please enter a repository');
      return;
    }

    // Validate repository format (must be owner/repo)
    if (!repository.includes('/')) {
      toast.error('Repository must be in format: owner/repo (e.g., yourUsername/your-repo)');
      return;
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      toast.error('Invalid repository format. Use: owner/repo');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/github/workspace-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          repository,
          branch,
          basePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to save GitHub integration');
        return;
      }

      toast.success(data.message || 'GitHub integration configured successfully');

      setIntegration(data.integration);
      router.refresh();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast.error('Failed to save GitHub integration');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub from this workspace?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/github/workspace-integration?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to disconnect GitHub');
        return;
      }

      toast.success('GitHub integration disconnected successfully');
      setIntegration(null);
      setRepository('');
      setBranch('main');
      setBasePath('docs');
      router.refresh();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast.error('Failed to disconnect GitHub integration');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!integration) {
      toast.error('Please configure GitHub integration first');
      return;
    }

    if (
      !confirm(
        'Import all markdown files from your GitHub repository into this workspace? Any existing files with the same path will be skipped.'
      )
    ) {
      return;
    }

    setSyncing(true);
    setSyncSummary(null);

    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          repository: integration.repository,
          branch: integration.branch,
          basePath: integration.basePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import');
      }

      setSyncSummary({
        total: data.totalImported + data.totalSkipped,
        succeeded: data.totalImported,
        skipped: data.totalSkipped || 0,
        failed: (data.errors || []).length,
        errors: data.errors || [],
      });

      toast.success(
        `Imported ${data.totalImported} files from GitHub (${data.totalSkipped} skipped)`
      );
    } catch (error) {
      console.error('Error importing from GitHub:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import';
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    if (!integration) {
      toast.error('Please configure GitHub integration first');
      return;
    }

    if (
      !confirm(
        'Export all documents to your GitHub repository? Documents without a GitHub path will be skipped.'
      )
    ) {
      return;
    }

    setSyncing(true);
    setSyncSummary(null);

    try {
      const response = await fetch('/api/github/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          repository: integration.repository,
          branch: integration.branch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to export');
      }

      setSyncSummary({
        total: data.totalExported + data.totalSkipped,
        succeeded: data.totalExported,
        skipped: data.totalSkipped || 0,
        failed: (data.errors || []).length,
        errors: data.errors || [],
      });

      toast.success(
        `Exported ${data.totalExported} files to GitHub (${data.totalSkipped} skipped)`
      );
    } catch (error) {
      console.error('Error exporting to GitHub:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export';
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  if (fetchingIntegration) {
    return (
      <AuroraBackground showGrids showGlowOrbs>
        <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-12 shadow-xl backdrop-blur-xl">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-lg font-medium text-white">Loading GitHub settings...</span>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground showGrids showGlowOrbs>
      <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 -ml-3 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30">
              <Github className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Workspace GitHub Integration
              </h1>
              <p className="text-sm text-slate-300 md:text-base">
                Configure manual GitHub import and export for this workspace
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {integration && (
          <Card className="border-emerald-500/25 bg-emerald-500/10 text-white shadow-xl">
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <div className="flex-1">
                <p className="font-medium text-emerald-100">GitHub Connected</p>
                <p className="text-sm text-emerald-200/90">
                  Connected to <span className="font-mono">{integration.repository}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Form */}
        <Card className="border-white/10 bg-slate-900/70 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">
              {integration ? 'Update GitHub Configuration' : 'Connect GitHub'}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {integration
                ? 'Modify the repository, branch, and base path for manual import/export'
                : 'Set up GitHub integration to import and export workspace documents'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Repository */}
              <div className="space-y-2">
                <Label htmlFor="repository">
                  Repository <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="repository"
                  placeholder="owner/repo (e.g., yourUsername/my-docs)"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 font-mono text-slate-100"
                />
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">
                    The GitHub repository used for manual import and export (format: owner/repo)
                  </p>
                  <p className="text-xs text-orange-300">
                    Make sure your GitHub token has access to this repository.
                  </p>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label htmlFor="branch">
                  Branch <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="branch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 font-mono text-slate-100"
                />
                <p className="text-xs text-slate-400">
                  The branch to sync documents to (usually &quot;main&quot; or &quot;master&quot;)
                </p>
              </div>

              {/* Base Path */}
              <div className="space-y-2">
                <Label htmlFor="basePath">
                  Base Path <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="basePath"
                  placeholder="docs"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 font-mono text-slate-100"
                />
                <p className="text-xs text-slate-400">
                  The directory in the repository where documents will be stored (e.g.,
                  &quot;docs&quot;, &quot;docs/api&quot;)
                </p>
              </div>

              {/* Info Banner */}
              <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-sky-300" />
                  <div className="space-y-1 text-sm text-sky-100">
                    <p className="font-medium">About Workspace GitHub Integration</p>
                    <ul className="ml-4 list-disc space-y-1 text-sky-200/90">
                      <li>Import pulls markdown files from the repository into this workspace</li>
                      <li>
                        Export pushes documents that have a GitHub path back to the repository
                      </li>
                      <li>Paths are preserved under the configured base path</li>
                      <li>Only workspace owners can modify these settings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {integration ? 'Update Configuration' : 'Connect GitHub'}
                </Button>
                {integration && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading}
                    onClick={handleDisconnect}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Import and Export */}
        {integration && (
          <Card className="border-white/10 bg-slate-900/70 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Github className="h-5 w-5" />
                Import and Export
              </CardTitle>
              <CardDescription className="text-slate-300">
                Manual import from GitHub and export back to your repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 p-4">
                <div className="flex gap-3">
                  <Github className="h-5 w-5 shrink-0 text-sky-300" />
                  <div className="space-y-1 text-sm text-sky-100">
                    <p className="font-medium">Import/Export</p>
                    <ul className="ml-4 list-disc space-y-1 text-sky-200/90">
                      <li>
                        <strong>Import:</strong> Fetch all markdown files from your GitHub
                        repository into this workspace
                      </li>
                      <li>
                        <strong>Export:</strong> Push all documents with GitHub paths to your
                        repository
                      </li>
                      <li>Automatically creates new documents for imported files</li>
                      <li>Skips files that already exist locally</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={syncing}
                  className="flex-1 bg-linear-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
                >
                  {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {syncing ? 'Importing...' : 'Import from GitHub'}
                </Button>

                <Button
                  onClick={handleExport}
                  disabled={syncing}
                  className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                >
                  {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {syncing ? 'Exporting...' : 'Export to GitHub'}
                </Button>
              </div>

              {/* Import/Export Summary */}
              {syncSummary && (
                <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Operation Summary</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-600">{syncSummary.succeeded}</p>
                      <p className="text-muted-foreground text-xs">Succeeded</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-orange-600">{syncSummary.skipped}</p>
                      <p className="text-muted-foreground text-xs">Skipped</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-red-600">{syncSummary.failed}</p>
                      <p className="text-muted-foreground text-xs">Failed</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-blue-600">{syncSummary.total}</p>
                      <p className="text-muted-foreground text-xs">Total</p>
                    </div>
                  </div>

                  {syncSummary.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600">
                        Errors ({syncSummary.errors.length})
                      </p>
                      <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-red-500/20 bg-red-500/10 p-3">
                        {syncSummary.errors.map((err, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-mono text-red-300">{err.file}</span>
                            <span className="text-red-200">: {err.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="border-white/10 bg-slate-900/70 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-200">
                1
              </div>
              <p>
                Configure the repository, branch, and base path for your workspace here (one-time
                setup)
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-200">
                2
              </div>
              <p>Use the Import and Export buttons to pull from or push to GitHub</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-200">
                3
              </div>
              <p>Imported files keep their repository paths under the base path you set</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-200">
                4
              </div>
              <p>Export only includes documents that already have a GitHub path</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuroraBackground>
  );
}
