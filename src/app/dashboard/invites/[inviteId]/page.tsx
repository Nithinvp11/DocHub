'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Loader2, Users } from 'lucide-react';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';

interface WorkspaceInviteDetail {
  id: string;
  workspaceId: string;
  invitedEmail: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  message: string | null;
  permissions: string[];
  workspace: {
    id: string;
    name: string;
    description: string | null;
    _count?: {
      members: number;
    };
  };
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function InviteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.inviteId as string;

  const [invite, setInvite] = useState<WorkspaceInviteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    void fetchInviteDetails();
  }, [inviteId]);

  const fetchInviteDetails = async () => {
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Invitation not found');
        } else {
          toast.error('Failed to load invitation details');
        }
        setTimeout(() => router.push('/dashboard/invites'), 2000);
        return;
      }
      const data = await res.json();
      setInvite(data);
    } catch (error) {
      console.error('Error fetching invite details:', error);
      toast.error('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invite) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/accept`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to accept invitation');
        return;
      }

      toast.success('You have successfully joined the workspace!');
      setTimeout(() => {
        router.push(`/dashboard/${invite.workspaceId}`);
      }, 1500);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!invite) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/reject`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to reject invitation');
        return;
      }

      toast.success('Invitation declined');
      setTimeout(() => {
        router.push('/dashboard/invites');
      }, 1500);
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-400">Invitation Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-slate-300">
              We couldn&apos;t find this invitation. It may have expired or been removed.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const isPending = invite.status === 'PENDING';
  const isExpired =
    invite.status === 'EXPIRED' ||
    (invite.status === 'PENDING' && Boolean(invite.expiresAt && new Date(invite.expiresAt) < now));
  const isCancelled = invite.status === 'CANCELLED';
  const isAccepted = invite.status === 'ACCEPTED';
  const isRejected = invite.status === 'REJECTED';

  const permissionLabels: Record<string, string> = {
    [WORKSPACE_PERMISSION.DOCUMENTS_VIEW]: 'View Documents',
    [WORKSPACE_PERMISSION.DOCUMENTS_EDIT]: 'Edit Documents',
    [WORKSPACE_PERMISSION.DOCUMENTS_DELETE]: 'Delete Documents',
    [WORKSPACE_PERMISSION.VERSIONS_CREATE]: 'Manage Versions',
    [WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS]: 'Manage Members',
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-purple-900/20 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-flex">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-white/10 bg-slate-900/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{invite.workspace.name}</CardTitle>
                <CardDescription className="mt-1 text-slate-400">
                  {invite.workspace.description || 'No description provided'}
                </CardDescription>
              </div>
              <div className="text-right">
                {!isPending && (
                  <Badge
                    variant="outline"
                    className={`border-white/20 ${
                      isAccepted
                        ? 'bg-green-500/10 text-green-400'
                        : isRejected || isCancelled
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {invite.status.charAt(0) + invite.status.slice(1).toLowerCase()}
                  </Badge>
                )}
                {isPending && isExpired && (
                  <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-400">
                    Expired
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {isExpired && invite.expiresAt && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">Invitation Expired</p>
                  <p className="text-sm text-red-300/80">
                    This invitation expired{' '}
                    {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}.
                  </p>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">Invitation Cancelled</p>
                  <p className="text-sm text-red-300/80">
                    This invitation was cancelled by the workspace owner.
                  </p>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">Invitation Rejected</p>
                  <p className="text-sm text-red-300/80">You declined this invitation.</p>
                </div>
              </div>
            )}

            {isAccepted && (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">Invitation Accepted</p>
                  <p className="text-sm text-green-300/80">
                    You are already a member of this workspace.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-sm font-medium text-slate-400">Invited by</p>
              <div className="flex items-center gap-3">
                <Avatar>
                  {invite.invitedBy.image && <AvatarImage src={invite.invitedBy.image} />}
                  <AvatarFallback className="bg-linear-to-br from-purple-600 to-fuchsia-600 text-white">
                    {invite.invitedBy.name
                      ?.split(' ')
                      .map((name) => name[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{invite.invitedBy.name || 'Unknown'}</p>
                  <p className="text-sm text-slate-400">{invite.invitedBy.email}</p>
                </div>
              </div>
              {invite.message && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-sm text-slate-300 italic">"{invite.message}"</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Users className="h-4 w-4" />
                  <p className="text-sm font-medium">Members</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {invite.workspace._count?.members || 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Clock className="h-4 w-4" />
                  <p className="text-sm font-medium">Invited</p>
                </div>
                <p className="text-sm text-white">
                  {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-sm font-medium text-slate-400">You will have access to:</p>
              <div className="flex flex-wrap gap-2">
                {invite.permissions.length > 0 ? (
                  invite.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant="secondary"
                      className="border-purple-500/30 bg-purple-500/20 text-purple-300"
                    >
                      {permissionLabels[perm] || perm}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">View Only</p>
                )}
              </div>
            </div>

            {invite.expiresAt && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-500">
                  This invitation expires{' '}
                  {formatDistance(new Date(invite.expiresAt), new Date(), { addSuffix: true })}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {isPending ? (
                <>
                  <Button
                    onClick={handleAccept}
                    disabled={processing || isExpired}
                    className="flex-1 bg-linear-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Accept Invitation
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={processing || isExpired}
                    variant="outline"
                    className="flex-1 border-white/20 text-slate-300 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Declining...
                      </>
                    ) : (
                      'Decline'
                    )}
                  </Button>
                </>
              ) : isAccepted ? (
                <Button
                  onClick={() => router.push(`/dashboard/${invite.workspaceId}`)}
                  className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 text-white"
                >
                  Open Workspace
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
                >
                  Back to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
