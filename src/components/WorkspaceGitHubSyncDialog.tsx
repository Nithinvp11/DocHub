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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Github,
  Loader2,
  Upload,
  Download,
  ExternalLink,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceGitHubSyncDialogProps {
  workspaceId: string;
  children?: React.ReactNode;
}

interface GitHubIntegration {
  id: string;
  repository: string;
  branch: string;
}

interface FileResult {
  documentPath?: string;
  fileName?: string;
  githubPath: string;
  status: 'created' | 'updated' | 'imported' | 'skipped' | 'error';
  reason?: string;
}

interface OperationResult {
  success: boolean;
  totalExported?: number;
  totalImported?: number;
  totalSkipped?: number;
  files: FileResult[];
  errors: string[];
}

export function WorkspaceGitHubSyncDialog({
  workspaceId,
  children,
}: WorkspaceGitHubSyncDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showConfirmExport, setShowConfirmExport] = useState(false);
  const [integration, setIntegration] = useState<GitHubIntegration | null>(null);
  const [operationResult, setOperationResult] = useState<OperationResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      fetchIntegration();
    }
  }, [open, workspaceId]);

  const fetchIntegration = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/github/workspace-integration?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setIntegration(data.integration || null);
      }
    } catch (error) {
      console.error('Error fetching GitHub integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = () => {
    setOpen(false);
    router.push(`/dashboard/${workspaceId}/settings/github`);
  };

  const handleExportClick = () => {
    setShowConfirmExport(true);
  };

  const handleExport = async () => {
    if (!integration) {
      toast.error('Please configure GitHub integration first');
      return;
    }

    setShowConfirmExport(false);
    setExporting(true);
    setOperationResult(null);
    setProgress(0);

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
        toast.error(data.error || 'Failed to export to GitHub');
        setOperationResult({
          success: false,
          files: [],
          errors: [data.error || 'Failed to export to GitHub'],
        });
        return;
      }

      setProgress(100);
      setOperationResult(data);
      toast.success(`Successfully exported ${data.totalExported || 0} documents to GitHub`);
      router.refresh();
    } catch (error) {
      console.error('Error exporting to GitHub:', error);
      toast.error('Failed to export to GitHub');
      setOperationResult({
        success: false,
        files: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!integration) {
      toast.error('Please configure GitHub integration first');
      return;
    }

    setImporting(true);
    setOperationResult(null);
    setProgress(0);

    try {
      const response = await fetch('/api/github/import/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          githubRepository: integration.repository,
          githubBranch: integration.branch,
          includeSubdirectories: true,
          linkToGitHub: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to import from GitHub');
        setOperationResult({
          success: false,
          files: [],
          errors: [data.error || 'Failed to import from GitHub'],
        });
        return;
      }

      setProgress(100);
      const imported = data.imported?.length || 0;
      const skipped = data.skipped?.length || 0;

      // Transform batch import result to match OperationResult format
      const files: FileResult[] = [
        ...(data.imported || []).map((item: { id: string; title: string; path: string }) => ({
          fileName: item.path || item.title,
          documentPath: item.path,
          githubPath: item.path,
          status: 'imported' as const,
        })),
        ...(data.errors || []).map((item: { path: string; error: string }) => ({
          fileName: item.path,
          documentPath: '',
          githubPath: item.path,
          status: 'error' as const,
          reason: item.error,
        })),
      ];

      setOperationResult({
        success: true,
        totalImported: imported,
        totalSkipped: skipped,
        files,
        errors: data.errors || [],
      });

      toast.success(`Imported ${imported} documents${skipped > 0 ? `, skipped ${skipped}` : ''}`);
      router.refresh();
    } catch (error) {
      console.error('Error importing from GitHub:', error);
      toast.error('Failed to import from GitHub');
      setOperationResult({
        success: false,
        files: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleViewOnGitHub = () => {
    if (integration) {
      const url = `https://github.com/${integration.repository}/tree/${integration.branch}/docs`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <Github className="mr-2 h-4 w-4" />
              GitHub Sync
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <Github className="mr-2 h-5 w-5" />
              GitHub Sync
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Sync documents between this workspace and GitHub repository
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
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Repository</span>
                  <span className="text-sm font-medium text-white">{integration.repository}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Branch</span>
                  <span className="text-sm font-medium text-white">{integration.branch}</span>
                </div>
                <div className="mt-3 rounded border border-blue-500/20 bg-blue-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📌</span>
                    <div className="text-sm">
                      <p className="font-medium text-blue-200">Workspace documents folder:</p>
                      <p className="mt-1 font-mono text-blue-300">docs/</p>
                      <p className="mt-2 text-xs text-blue-200/80">
                        Root files like README.md stay at repository root
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {(exporting || importing) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">
                      {exporting ? 'Exporting documents...' : 'Importing documents...'}
                    </span>
                    <span className="text-slate-400">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Operation Results */}
              {operationResult && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      {operationResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <h3 className="font-semibold">
                        {operationResult.success ? 'Operation Completed' : 'Operation Failed'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {operationResult.totalExported !== undefined && (
                        <div>
                          <div className="text-slate-400">Exported</div>
                          <div className="text-xl font-bold text-green-400">
                            {operationResult.totalExported}
                          </div>
                        </div>
                      )}
                      {operationResult.totalImported !== undefined && (
                        <div>
                          <div className="text-slate-400">Imported</div>
                          <div className="text-xl font-bold text-blue-400">
                            {operationResult.totalImported}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-slate-400">Skipped</div>
                        <div className="text-xl font-bold text-yellow-400">
                          {operationResult.totalSkipped || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File List */}
                  {operationResult.files.length > 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/5">
                      <div className="border-b border-white/10 p-3">
                        <h4 className="text-sm font-medium">
                          Files ({operationResult.files.length})
                        </h4>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 p-3">
                          {operationResult.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 rounded border border-white/5 bg-white/5 p-2 text-xs"
                            >
                              {file.status === 'created' || file.status === 'updated' ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                              ) : file.status === 'imported' ? (
                                <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                              ) : file.status === 'skipped' ? (
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                              ) : (
                                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-slate-400" />
                                  <span className="truncate font-mono text-slate-200">
                                    {file.fileName || file.githubPath}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span
                                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      file.status === 'created' || file.status === 'updated'
                                        ? 'bg-green-500/20 text-green-300'
                                        : file.status === 'imported'
                                          ? 'bg-blue-500/20 text-blue-300'
                                          : file.status === 'skipped'
                                            ? 'bg-yellow-500/20 text-yellow-300'
                                            : 'bg-red-500/20 text-red-300'
                                    }`}
                                  >
                                    {file.status}
                                  </span>
                                  {file.reason && (
                                    <span className="truncate text-slate-400">{file.reason}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Errors */}
                  {operationResult.errors.length > 0 && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                      <div className="mb-2 flex items-center gap-2 text-red-300">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Errors</span>
                      </div>
                      <div className="space-y-1">
                        {operationResult.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-200">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!operationResult && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleExportClick}
                      disabled={exporting || importing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Export to GitHub
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleImport}
                      disabled={exporting || importing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Import from GitHub
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleViewOnGitHub}
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on GitHub
                    </Button>

                    <Button
                      onClick={handleConfigure}
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>

                  {/* Help Text */}
                  <div className="space-y-1 pt-2 text-xs text-slate-400">
                    <p>
                      <strong>Export:</strong> Push all workspace documents to GitHub as markdown
                      files
                    </p>
                    <p>
                      <strong>Import:</strong> Pull markdown files from GitHub into workspace
                    </p>
                  </div>
                </>
              )}

              {/* Close Button after operation */}
              {operationResult && (
                <Button
                  onClick={() => {
                    setOperationResult(null);
                    setProgress(0);
                  }}
                  className="w-full"
                >
                  Close Results
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={showConfirmExport} onOpenChange={setShowConfirmExport}>
        <AlertDialogContent className="border border-white/10 bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Export to GitHub</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This will push all workspace documents to GitHub. Existing files will be updated.
              <br />
              <br />
              <strong className="text-yellow-300">Warning:</strong> This action will overwrite files
              in your GitHub repository at:
              <br />
              <span className="font-mono text-sm text-blue-300">
                {integration?.repository} ({integration?.branch})
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExport}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Continue Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
