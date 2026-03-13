import Link from 'next/link';
import { ArrowLeft, Home, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface WorkspaceNavbarProps {
  workspaceName: string;
  workspaceDescription?: string | null;
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  children?: React.ReactNode;
}

export function WorkspaceNavbar({
  workspaceName,
  workspaceDescription,
  userName,
  userEmail,
  userImage,
  children,
}: WorkspaceNavbarProps) {
  const displayName = userName || userEmail || 'User';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/60 shadow-lg shadow-purple-500/5 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          <div className="hidden h-8 w-px bg-white/10 lg:block" />

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-2 shadow-lg shadow-purple-500/25">
              <LayoutGrid className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-white lg:text-lg">
                {workspaceName}
              </h1>
              {workspaceDescription && (
                <p className="truncate text-xs text-slate-400">{workspaceDescription}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
          <div className="order-2 flex items-center gap-2 lg:order-1">{children}</div>

          <Link href="/dashboard" className="order-1 lg:order-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 p-0 text-slate-200 hover:bg-white/10 hover:text-white"
              aria-label="Go to dashboard home"
            >
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div className="order-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/90 to-slate-800/90 px-3 py-2 shadow-lg shadow-purple-500/5 lg:order-2">
            <Avatar className="h-10 w-10 rounded-xl ring-2 ring-purple-500/20">
              <AvatarImage src={userImage || undefined} alt={displayName} />
              <AvatarFallback className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-purple-500/25">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              {userEmail && <p className="truncate text-xs text-slate-400">{userEmail}</p>}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
