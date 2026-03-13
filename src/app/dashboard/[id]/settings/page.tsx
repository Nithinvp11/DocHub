'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Settings } from 'lucide-react';

export default function WorkspaceSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page with workspaces tab
    // After a brief delay to show the redirect message
    const timer = setTimeout(() => {
      router.push('/settings?tab=workspaces');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-900 to-purple-900/20">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-4 shadow-2xl">
            <Settings className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">Redirecting to Settings</h2>
        <p className="mb-6 text-slate-400">
          Workspace settings have been moved to the main Settings page
        </p>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
      </div>
    </div>
  );
}
