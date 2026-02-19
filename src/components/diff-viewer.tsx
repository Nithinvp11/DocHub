'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitCompare } from 'lucide-react';
import { DocumentDiffView } from '@/components/DocumentDiffView';
import { htmlToProseMirrorJSON } from '@/lib/html-to-prosemirror';

interface Version {
  id: string;
  version: number;
  message: string;
  content: string;
  createdAt: Date | string;
  author: {
    name: string | null;
    email: string;
  };
}

interface DiffViewerProps {
  versions: Version[];
  documentId: string;
}

export function DiffViewer({ versions }: DiffViewerProps) {
  const [open, setOpen] = useState(false);
  const [fromVersion, setFromVersion] = useState<string>('');
  const [toVersion, setToVersion] = useState<string>('');

  const getVersions = () => {
    if (!fromVersion || !toVersion) return null;

    const fromV = versions.find((v) => v.version.toString() === fromVersion);
    const toV = versions.find((v) => v.version.toString() === toVersion);

    if (!fromV || !toV) return null;

    return { fromV, toV };
  };

  const versionData = getVersions();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCompare className="mr-2 h-4 w-4" />
          Compare Versions
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b bg-white p-4">
          <DialogHeader className="mb-4">
            <DialogTitle>Compare Versions</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">From Version (Old)</label>
              <Select value={fromVersion} onValueChange={setFromVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.version.toString()}>
                      v{v.version} - {v.message}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">To Version (New)</label>
              <Select value={toVersion} onValueChange={setToVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.version.toString()}>
                      v{v.version} - {v.message}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {versionData && (
          <div className="flex-1 overflow-hidden">
            <DocumentDiffView
              oldVersion={htmlToProseMirrorJSON(versionData.fromV.content)}
              newVersion={htmlToProseMirrorJSON(versionData.toV.content)}
              oldVersionLabel={`Version ${fromVersion} - ${versionData.fromV.message}`}
              newVersionLabel={`Version ${toVersion} - ${versionData.toV.message}`}
              onClose={() => setOpen(false)}
            />
          </div>
        )}

        {!versionData && fromVersion && toVersion && (
          <div className="py-12 text-center text-neutral-500">Unable to load versions</div>
        )}

        {(!fromVersion || !toVersion) && (
          <div className="py-12 text-center text-neutral-500">Select two versions to compare</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
