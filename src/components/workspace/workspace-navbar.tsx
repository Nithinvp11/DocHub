import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '../ui/button';

interface WorkspaceNavbarProps {
  workspaceName: string;
  workspaceDescription?: string | null;
  userName?: string | null;
  userEmail?: string;
  children?: React.ReactNode;
}

export function WorkspaceNavbar({
  workspaceName,
  workspaceDescription,
  userName,
  userEmail,
  children,
}: WorkspaceNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-4">
        {/* Left side - Back button and workspace info */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <h1 className="text-lg font-bold text-white">{workspaceName}</h1>
            {workspaceDescription && (
              <p className="text-xs text-slate-400">{workspaceDescription}</p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {children}

          {/* User info */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{userName || userEmail}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
