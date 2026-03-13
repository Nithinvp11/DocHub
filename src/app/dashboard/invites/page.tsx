'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Users, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
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

interface WorkspaceInvite {
  id: string;
  invitedEmail: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  message: string | null;
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

type ActionType = 'accept' | 'reject' | null;

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    inviteId: string;
    workspaceName: string;
    action: ActionType;
  } | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/workspaces/invites');
      if (res.ok) {
        const data = await res.json();
        const inviteList = Array.isArray(data)
          ? data
          : Array.isArray(data?.invites)
            ? data.invites
            : [];
        setInvites(inviteList);
      } else {
        toast.error('Failed to load invitations');
      }
    } catch (error) {
      toast.error('Error loading invitations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/accept`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Invitation accepted!');

        // Remove the accepted invite from the list
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));

        // Redirect to the workspace after a short delay
        setTimeout(() => {
          router.push(`/dashboard/${data.workspaceId}`);
        }, 1000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      toast.error('Error accepting invitation');
      console.error(error);
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/reject`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Invitation declined');
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to decline invitation');
      }
    } catch (error) {
      toast.error('Error declining invitation');
      console.error(error);
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <AuroraBackground />
        <div className="relative z-10">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AuroraBackground />
      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Workspace Invitations</h1>
            <p className="text-muted-foreground text-sm">
              {invites.length > 0
                ? `You have ${invites.length} pending ${invites.length === 1 ? 'invitation' : 'invitations'}`
                : 'No pending invitations'}
            </p>
          </div>
        </div>

        {invites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Inbox className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No pending invitations</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                You haven&apos;t received any workspace invitations yet.
              </p>
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => {
              const expired = isExpired(invite.expiresAt);
              return (
                <Card
                  key={invite.id}
                  className={`transition-all hover:shadow-md ${expired ? 'opacity-60' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          {invite.invitedBy.image && <AvatarImage src={invite.invitedBy.image} />}
                          <AvatarFallback>{getInitials(invite.invitedBy.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">{invite.workspace.name}</CardTitle>
                          <CardDescription>
                            Invited by {invite.invitedBy.name || invite.invitedBy.email}
                          </CardDescription>
                        </div>
                      </div>
                      {expired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {invite.workspace.description && (
                      <p className="text-muted-foreground text-sm">
                        {invite.workspace.description}
                      </p>
                    )}

                    {invite.workspace._count && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        <span>
                          {invite.workspace._count.members}{' '}
                          {invite.workspace._count.members === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    )}

                    {invite.message && (
                      <div className="bg-muted rounded-md p-3">
                        <p className="text-sm font-medium">Personal message:</p>
                        <p className="text-muted-foreground text-sm">{invite.message}</p>
                      </div>
                    )}

                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Invited {formatDistanceToNow(new Date(invite.createdAt))} ago
                      </span>
                      {invite.expiresAt && (
                        <>
                          <span>•</span>
                          <span>
                            {expired
                              ? `Expired ${formatDistanceToNow(new Date(invite.expiresAt))} ago`
                              : `Expires in ${formatDistanceToNow(new Date(invite.expiresAt))}`}
                          </span>
                        </>
                      )}
                    </div>

                    {!expired && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            setConfirmAction({
                              inviteId: invite.id,
                              workspaceName: invite.workspace.name,
                              action: 'accept',
                            })
                          }
                          disabled={processingId === invite.id}
                          className="flex-1"
                        >
                          {processingId === invite.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setConfirmAction({
                              inviteId: invite.id,
                              workspaceName: invite.workspace.name,
                              action: 'reject',
                            })
                          }
                          disabled={processingId === invite.id}
                          className="flex-1"
                        >
                          {processingId === invite.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'accept' ? 'Accept' : 'Decline'} Invitation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'accept'
                ? `You will be added as a member of "${confirmAction.workspaceName}". You can leave at any time from the workspace settings.`
                : `You will decline the invitation to join "${confirmAction?.workspaceName}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  if (confirmAction.action === 'accept') {
                    handleAccept(confirmAction.inviteId);
                  } else {
                    handleReject(confirmAction.inviteId);
                  }
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
