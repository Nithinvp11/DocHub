'use client';

import { useRouter } from 'next/navigation';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ConflictResolutionClientProps {
  workspaceId: string;
  documentId: string;
  documentTitle: string;
  conflict: {
    id: string;
    platformContent: string;
    githubContent: string;
    platformVersion: number;
    githubCommitSha: string;
    lastSyncedAt: Date;
  };
}

export function ConflictResolutionClient({
  workspaceId,
  documentId,
  documentTitle,
}: ConflictResolutionClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/dashboard/${workspaceId}/documents/${documentId}`);
  };

  return (
    <AuroraBackground showGrids showGlowOrbs>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${workspaceId}/documents/${documentId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Document
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Resolve Conflict</h1>
          <p className="mt-2 text-slate-400">Document: {documentTitle}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <p className="text-sm text-slate-300">
            GitHub auto-sync and conflict resolution are disabled. This page is kept for backward
            compatibility, but conflicts can no longer be resolved here.
          </p>
          <div className="mt-4">
            <Button onClick={handleBack} variant="secondary" size="sm">
              Back to Document
            </Button>
          </div>
        </div>
      </main>
    </AuroraBackground>
  );
}
