'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface InviteDetails {
  id: string;
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
  message: string | null;
  createdAt: string;
  expiresAt: string | null;
  status: string;
}

interface InviteDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteId: string;
  onSuccess?: () => void;
}

export function InviteDetailsModal({
  open,
  onOpenChange,
  inviteId,
  onSuccess,
}: InviteDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  // Fetch invite details when modal opens
  React.useEffect(() => {
    if (open && inviteId) {
      fetchInviteDetails();
    }
  }, [open, inviteId]);

  const fetchInviteDetails = async () => {
    setDetailsLoading(true);
    try {
      // Fetch from the user's invites list
      const res = await fetch('/api/workspaces/invites');
      if (res.ok) {
        const data = await res.json();
        const invites = Array.isArray(data) ? data : data.invites || [];
        const invite = invites.find((inv: InviteDetails) => inv.id === inviteId);
        if (invite) {
          setInviteDetails(invite);
        } else {
          toast.error('Invitation not found');
          onOpenChange(false);
        }
      } else {
        toast.error('Failed to load invitation details');
      }
    } catch (error) {
      console.error('Error fetching invite details:', error);
      toast.error('Error loading invitation details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    setActionType('accept');
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/accept`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Invitation accepted!');
        onOpenChange(false);
        onSuccess?.();

        // Redirect to workspace after short delay
        setTimeout(() => {
          window.location.href = `/dashboard/${data.workspaceId}`;
        }, 1000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      toast.error('Error accepting invitation');
      console.error(error);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setActionType('reject');
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/reject`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Invitation declined');
        onOpenChange(false);
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to decline invitation');
      }
    } catch (error) {
      toast.error('Error declining invitation');
      console.error(error);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (detailsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!inviteDetails) {
    return null;
  }

  const expired = isExpired(inviteDetails.expiresAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Workspace Invitation</DialogTitle>
          <DialogDescription>Review the invitation details below</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Workspace Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{inviteDetails.workspace.name}</h3>
                {inviteDetails.workspace.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {inviteDetails.workspace.description}
                  </p>
                )}
              </div>
              {expired ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                  Invite
                </Badge>
              )}
            </div>

            {inviteDetails.workspace._count && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>
                  {inviteDetails.workspace._count.members}{' '}
                  {inviteDetails.workspace._count.members === 1 ? 'member' : 'members'}
                </span>
              </div>
            )}
          </div>

          {/* Inviter Info */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Invited By
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={inviteDetails.invitedBy.image || undefined} />
                <AvatarFallback className="bg-linear-to-br from-purple-600 to-fuchsia-600 text-white">
                  {getInitials(inviteDetails.invitedBy.name, inviteDetails.invitedBy.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white">
                  {inviteDetails.invitedBy.name || 'Unknown'}
                </p>
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Mail className="h-3 w-3" />
                  <span>{inviteDetails.invitedBy.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          {inviteDetails.message && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Personal Message
              </p>
              <p className="text-sm text-slate-300">&ldquo;{inviteDetails.message}&rdquo;</p>
            </div>
          )}

          {/* Timing Info */}
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>Invited {formatDistanceToNow(new Date(inviteDetails.createdAt))} ago</span>
            </div>
            {inviteDetails.expiresAt && (
              <>
                <span>•</span>
                <span>
                  {expired
                    ? `Expired ${formatDistanceToNow(new Date(inviteDetails.expiresAt))} ago`
                    : `Expires in ${formatDistanceToNow(new Date(inviteDetails.expiresAt))}`}
                </span>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!expired && (
            <>
              <Button variant="outline" onClick={handleReject} disabled={loading} className="gap-2">
                {loading && actionType === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
                {!loading && <XCircle className="h-4 w-4" />}
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                disabled={loading}
                className="gap-2 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              >
                {loading && actionType === 'accept' && <Loader2 className="h-4 w-4 animate-spin" />}
                {!loading && <CheckCircle2 className="h-4 w-4" />}
                Accept Invitation
              </Button>
            </>
          )}
          {expired && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
