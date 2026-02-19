'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GitBranch, Check, Plus, GitCompare, Shield } from 'lucide-react';

interface Branch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
    url: string;
  };
}

interface GitHubBranchSwitcherProps {
  documentId: string;
  workspaceId: string;
  githubRepository: string;
  currentBranch: string;
  onBranchChanged?: (branch: string) => void;
}

export function GitHubBranchSwitcher({
  documentId,
  workspaceId,
  githubRepository,
  currentBranch,
  onBranchChanged,
}: GitHubBranchSwitcherProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState(currentBranch);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [githubRepository]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/github/branches?workspaceId=${workspaceId}&githubRepository=${encodeURIComponent(githubRepository)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const data = await response.json();
      setBranches(data.branches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBranch = async (branch: string) => {
    if (branch === currentBranch) return;

    try {
      setSwitching(true);

      const response = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch',
          documentId,
          workspaceId,
          branch,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch branch');
      }

      const data = await response.json();
      onBranchChanged?.(branch);
      
      // Show success message
      alert(data.message || 'Branch switched successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch branch');
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      setError('Branch name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          documentId,
          workspaceId,
          newBranch: newBranchName.trim(),
          fromBranch: baseBranch,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create branch');
      }

      const data = await response.json();
      
      // Refresh branches
      await fetchBranches();
      
      // Reset form
      setNewBranchName('');
      setShowCreateForm(false);
      
      // Switch to new branch
      onBranchChanged?.(data.branch);
      
      alert(data.message || 'Branch created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading branches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Branch Management
        </CardTitle>
        <CardDescription>
          Switch between branches or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Current Branch */}
        <div className="p-3 bg-primary/10 rounded-md">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="font-medium">Current Branch:</span>
            <Badge variant="default">{currentBranch}</Badge>
          </div>
        </div>

        {/* Create New Branch */}
        {showCreateForm ? (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Create New Branch</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newBranchName">Branch Name</Label>
              <Input
                id="newBranchName"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/my-branch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseBranch">Create From</Label>
              <select
                id="baseBranch"
                title="Select base branch"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleCreateBranch}
              disabled={creating || !newBranchName.trim()}
              className="w-full"
            >
              {creating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Branch
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Branch
          </Button>
        )}

        {/* Branch List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Available Branches</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  branch.name === currentBranch ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="font-medium">{branch.name}</span>
                  {branch.protected && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                  {branch.name === currentBranch && (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>

                {branch.name !== currentBranch && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchBranch(branch.name)}
                    disabled={switching}
                  >
                    {switching ? 'Switching...' : 'Switch'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
          <strong>Note:</strong> Switching branches will mark the document to pull the latest
          content from the selected branch. Remember to sync after switching.
        </div>
      </CardContent>
    </Card>
  );
}
