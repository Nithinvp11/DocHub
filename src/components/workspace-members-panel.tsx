'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  UserPlus,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  Activity,
  Github,
  X,
  Mail,
  Settings,
  Users,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  WORKSPACE_PERMISSION,
  WORKSPACE_PERMISSION_OPTIONS,
  type WorkspacePermission,
} from '@/lib/workspace-permission-definitions';
import { PermissionPackPicker } from '@/components/permission-pack-picker';

interface Member {
  id: string;
  permissions: string[];
  grantedById?: string | null;
  grantRootId?: string | null;
  grantDepth?: number;
  canManage?: boolean;
  grantedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  grantRoot?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username?: string | null;
}

interface WorkspaceInvite {
  id: string;
  invitedEmail: string | null;
  invitedUserId?: string | null;
  invitedById?: string;
  grantRootId?: string | null;
  canManage?: boolean;
  invitedUser: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  grantRoot?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  message: string | null;
  permissions: string[];
}

const PERMISSION_ICON_MAP: Partial<Record<WorkspacePermission, React.ReactNode>> = {
  [WORKSPACE_PERMISSION.WORKSPACE_VIEW]: <Eye className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.WORKSPACE_EDIT]: <Settings className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.MEMBERS_VIEW]: <Users className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.MEMBERS_INVITE]: <UserPlus className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.MEMBERS_REMOVE]: <Trash2 className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS]: <Edit className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.MEMBERS_RESEND_INVITE]: <Mail className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE]: <X className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.DOCUMENTS_VIEW]: <Eye className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.DOCUMENTS_CREATE]: <Edit className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.DOCUMENTS_EDIT]: <Edit className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.DOCUMENTS_DELETE]: <Trash2 className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.VERSIONS_VIEW]: <Download className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.VERSIONS_CREATE]: <Download className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.VERSIONS_RESTORE]: <Upload className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.VERSIONS_DELETE]: <Trash2 className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.COMMENTS_VIEW]: <Eye className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.COMMENTS_CREATE]: <Edit className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.COMMENTS_DELETE]: <Trash2 className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.ACTIVITY_VIEW]: <Activity className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.GITHUB_VIEW]: <Github className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.GITHUB_IMPORT]: <Download className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.GITHUB_EXPORT]: <Upload className="h-4 w-4" />,
  [WORKSPACE_PERMISSION.GITHUB_CONFIGURE]: <Settings className="h-4 w-4" />,
};

const PERMISSION_LABEL_MAP = new Map<string, string>(
  WORKSPACE_PERMISSION_OPTIONS.map((permission) => [permission.id, permission.label])
);

export function WorkspaceMembersPanel({
  workspaceId,
  userPermissions,
  initialMembers,
  workspaceOwner,
  isOwner,
}: {
  workspaceId: string;
  userPermissions: string[];
  initialMembers: Member[];
  workspaceOwner?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  isOwner?: boolean;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [userIdentifier, setUserIdentifier] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [addStep, setAddStep] = useState<'search' | 'confirm' | 'permissions'>('search');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);
  const [inviteActionType, setInviteActionType] = useState<'resend' | 'cancel' | null>(null);
  const [expandedInvitePermissions, setExpandedInvitePermissions] = useState<
    Record<string, boolean>
  >({});
  const [expandedMemberPermissions, setExpandedMemberPermissions] = useState<
    Record<string, boolean>
  >({});

  const canInviteMembers =
    !!isOwner || userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_INVITE);

  const canUpdateMemberPermissions =
    !!isOwner || userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS);

  const canRemoveMembers =
    !!isOwner || userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_REMOVE);

  const canResendInvites =
    !!isOwner || userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_RESEND_INVITE);

  const canCancelInvites =
    !!isOwner || userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE);

  // Get current user ID on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const session = await res.json();
          setCurrentUserId(session?.user?.id || null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, [workspaceId]);

  const loadMembers = async () => {
    setIsInitialLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentifier || !canInviteMembers) return;

    const trimmedIdentifier = userIdentifier.trim();
    if (!trimmedIdentifier) {
      toast.error('Enter a username or email');
      return;
    }

    setSearchingUser(true);
    try {
      // Search for user via API using email or username lookup
      const queryParam = trimmedIdentifier.includes('@')
        ? `email=${encodeURIComponent(trimmedIdentifier)}`
        : `username=${encodeURIComponent(trimmedIdentifier)}`;
      const res = await fetch(`/api/users/search?${queryParam}`);

      if (res.ok) {
        const data = await res.json();
        const matchedUser = data?.users?.[0] ?? (data?.id ? data : null);
        if (!matchedUser) {
          toast.error('User not found');
          return;
        }

        setFoundUser(matchedUser);
        setAddStep('confirm');
      } else {
        const data = await res.json();
        toast.error(data.error || 'User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to search user');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleConfirmUser = () => {
    setAddStep('permissions');
  };

  const handleAddMember = async () => {
    if (!foundUser || !canInviteMembers) return;

    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: foundUser.id,
        permissions: selectedPermissions,
      };

      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Invitation sent successfully');
        setUserIdentifier('');
        setFoundUser(null);
        setSelectedPermissions([]);
        setAddStep('search');
        setIsAddDialogOpen(false);
        loadInvites();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setUserIdentifier('');
    setFoundUser(null);
    setSelectedPermissions([]);
    setAddStep('search');
    setIsAddDialogOpen(false);
  };

  const handleUpdatePermissions = async () => {
    if (!canUpdateMemberPermissions || !editingMember) return;

    if (editPermissions.length === 0) {
      toast.error('Member must have at least one permission');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPermissions }),
      });

      if (res.ok) {
        toast.success('Permissions updated successfully');
        setIsEditDialogOpen(false);
        setEditingMember(null);
        loadMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!canRemoveMembers) return;

    const member = members.find((m) => m.id === memberId);
    if (member?.user.id === currentUserId) {
      toast.error('You cannot remove yourself from the workspace');
      return;
    }

    try {
      const previewRes = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}?preview=true`,
        {
          method: 'DELETE',
        }
      );

      if (!previewRes.ok) {
        const data = await previewRes.json();
        toast.error(data.error || 'Failed to evaluate member removal impact');
        return;
      }

      const previewData = await previewRes.json();
      const totalMembersToRemove = Number(previewData?.summary?.totalMembersToRemove || 1);
      const delegatedMembersToRemove = Number(previewData?.summary?.delegatedMembersToRemove || 0);
      const pendingInvitesToCancel = Number(previewData?.summary?.pendingInvitesToCancel || 0);
      const canCascade = previewData?.canCascade !== false;

      if (!canCascade && (delegatedMembersToRemove > 0 || pendingInvitesToCancel > 0)) {
        toast.error(
          `This member still manages ${delegatedMembersToRemove} delegated member(s) and ${pendingInvitesToCancel} pending invite(s). Reassign or remove delegated entities first.`
        );
        return;
      }

      const impactLines = [
        `Remove ${memberName} from the workspace?`,
        '',
        `Members to remove: ${totalMembersToRemove}`,
        `Delegated subtree members: ${delegatedMembersToRemove}`,
        `Pending invites to cancel: ${pendingInvitesToCancel}`,
        '',
        'This action cannot be undone.',
      ];

      if (!confirm(impactLines.join('\n'))) return;
    } catch (error) {
      console.error('Error fetching removal preview:', error);
      if (!confirm(`Remove ${memberName} from the workspace? This action cannot be undone.`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Member removed successfully');
        loadMembers();
      } else {
        const data = await res.json();
        if (res.status === 409 && data?.details) {
          toast.error(
            `Cannot remove member: ${data.details.delegatedMembers || 0} delegated member(s), ${data.details.delegatedPendingInvites || 0} pending invite(s)`
          );
          return;
        }
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setInviteActionId(inviteId);
    setInviteActionType('resend');
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/resend`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend invitation');
      }

      toast.success('Invitation resent successfully');
      await loadInvites();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setInviteActionId(null);
      setInviteActionType(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setInviteActionId(inviteId);
    setInviteActionType('cancel');
    try {
      const res = await fetch(`/api/workspaces/invites/${inviteId}/cancel`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      toast.success('Invitation cancelled');
      await loadInvites();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    } finally {
      setInviteActionId(null);
      setInviteActionType(null);
    }
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setEditPermissions(member.permissions || []);
    setIsEditDialogOpen(true);
  };

  const nonOwnerMembers = members.filter((member) => member.user.id !== workspaceOwner?.id);

  const filteredMembers = nonOwnerMembers.filter(
    (member) =>
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMemberCount = nonOwnerMembers.length + (workspaceOwner ? 1 : 0);

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Team Members</h3>
        </div>
        <p className="text-sm text-slate-400">
          {totalMemberCount} member{totalMemberCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-4">
        {/* Workspace Owner Section */}
        {workspaceOwner && (
          <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 shadow-lg shadow-amber-900/10">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent" />
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                Workspace Owner
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 ring-2 ring-amber-400/30">
                  <AvatarImage
                    src={workspaceOwner.image || undefined}
                    alt={workspaceOwner.name || workspaceOwner.email}
                  />
                  <AvatarFallback className="bg-linear-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                    {(workspaceOwner.name || workspaceOwner.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-400">
                  <Crown className="h-2 w-2 text-slate-900" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {workspaceOwner.name || workspaceOwner.email}
                  </p>
                  {isOwner && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400 uppercase">
                      You
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-400">{workspaceOwner.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-white/10 bg-slate-900/50 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Add Member Button */}
        {canInviteMembers && (
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) handleCancelAdd();
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/20"
                variant="outline"
              >
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`flex max-h-[85vh] w-[95vw] ${addStep === 'permissions' ? 'max-w-6xl' : 'max-w-2xl'} flex-col border-white/10 bg-slate-900`}
            >
              <DialogHeader>
                <DialogTitle className="text-white">
                  {addStep === 'search' && 'Find User'}
                  {addStep === 'confirm' && 'Confirm User'}
                  {addStep === 'permissions' && 'Assign Permissions'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {addStep === 'search' && 'Search for a user by username or email'}
                  {addStep === 'confirm' && 'Verify user details before adding'}
                  {addStep === 'permissions' && 'Select permissions for this member'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-4">
                {/* Step 1: Search User */}
                {addStep === 'search' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userIdentifier" className="text-slate-300">
                        Username or Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="userIdentifier"
                          type="text"
                          placeholder="Search by username or email"
                          value={userIdentifier}
                          onChange={(e) => setUserIdentifier(e.target.value)}
                          className="border-white/10 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Confirm User */}
                {addStep === 'confirm' && foundUser && (
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage
                          src={foundUser.image || undefined}
                          alt={foundUser.name || foundUser.email}
                        />
                        <AvatarFallback className="bg-linear-to-br from-purple-500 to-fuchsia-600 text-lg font-bold text-white shadow-lg shadow-purple-500/20">
                          {(foundUser.name || foundUser.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{foundUser.name || 'No name'}</p>
                        <p className="text-sm text-slate-400">{foundUser.email}</p>
                        {foundUser.username && (
                          <p className="text-xs text-slate-500">@{foundUser.username}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Select Permissions */}
                {addStep === 'permissions' && (
                  <div className="flex flex-col gap-4">
                    <Label className="text-slate-300">Select Permission Packs</Label>
                    <PermissionPackPicker
                      selectedPermissions={selectedPermissions}
                      onChange={setSelectedPermissions}
                      availablePermissions={
                        isOwner ? undefined : (userPermissions as WorkspacePermission[])
                      }
                      isOwner={isOwner}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                {addStep !== 'search' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddStep(addStep === 'permissions' ? 'confirm' : 'search')}
                    className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                  >
                    Back
                  </Button>
                )}
                {addStep === 'search' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAdd}
                    className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => {
                    if (addStep === 'search') {
                      handleSearchUser(new Event('submit') as any);
                    } else if (addStep === 'confirm') {
                      handleConfirmUser();
                    } else if (addStep === 'permissions') {
                      handleAddMember();
                    }
                  }}
                  className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-600/20"
                  disabled={
                    loading || (addStep === 'permissions' && selectedPermissions.length === 0)
                  }
                >
                  {addStep === 'search' && (searchingUser ? 'Searching...' : 'Search User')}
                  {addStep === 'confirm' && 'Invite This User'}
                  {addStep === 'permissions' && (loading ? 'Sending...' : 'Send Invitation')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Members List */}
        <div className="space-y-2">
          <div className="max-h-[500px] space-y-1.5 overflow-y-auto pr-1">
            {isInitialLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-white/10 bg-slate-900/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-slate-800" />
                      <div className="h-3 w-48 rounded bg-slate-800" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredMembers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {searchQuery
                  ? 'No members found'
                  : workspaceOwner
                    ? 'No additional members yet'
                    : 'No members yet'}
              </p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/8 bg-slate-900/50 p-3.5 transition-all hover:border-purple-500/40 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-purple-900/10"
                >
                  {/* Hover accent */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 ring-2 ring-white/8 transition-all group-hover:ring-purple-500/30">
                        <AvatarImage
                          src={member.user.image || undefined}
                          alt={member.user.name || member.user.email}
                        />
                        <AvatarFallback className="bg-linear-to-br from-purple-500 to-fuchsia-600 text-sm font-bold text-white">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.user.id === currentUserId && (
                        <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {member.user.name || member.user.email}
                        </p>
                        {member.user.id === currentUserId && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-purple-400 uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                      <div className="mt-0.5 space-y-0">
                        {member.grantedBy && (
                          <p className="text-[10px] text-slate-600">
                            by{' '}
                            <span className="text-slate-500">
                              {member.grantedBy.name || member.grantedBy.email}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(expandedMemberPermissions[member.id]
                          ? member.permissions || []
                          : (member.permissions || []).slice(0, 2)
                        ).map((perm) => {
                          const permissionLabel = PERMISSION_LABEL_MAP.get(perm) || perm;
                          const permissionIcon = PERMISSION_ICON_MAP[
                            perm as WorkspacePermission
                          ] ?? <Settings className="h-2.5 w-2.5" />;

                          return (
                            <span
                              key={perm}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400"
                            >
                              <span className="[&>svg]:h-2.5 [&>svg]:w-2.5">{permissionIcon}</span>
                              {permissionLabel}
                            </span>
                          );
                        })}
                        {(member.permissions || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMemberPermissions((prev) => ({
                                ...prev,
                                [member.id]: !prev[member.id],
                              }))
                            }
                            className="inline-flex items-center gap-0.5 rounded-full border border-slate-600/30 bg-slate-700/30 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400"
                          >
                            {expandedMemberPermissions[member.id] ? (
                              <>
                                <ChevronUp className="h-2.5 w-2.5" /> Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-2.5 w-2.5" /> +
                                {(member.permissions || []).length - 2} more
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(canUpdateMemberPermissions || canRemoveMembers) &&
                      member.canManage !== false && (
                        <>
                          {canUpdateMemberPermissions && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(member)}
                              className="h-8 w-8 p-0 text-slate-400 hover:bg-purple-500/10 hover:text-purple-400"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          {canRemoveMembers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveMember(member.id, member.user.name || member.user.email)
                              }
                              disabled={member.user.id === currentUserId || loading}
                              className="h-8 w-8 p-0 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                              title={
                                member.user.id === currentUserId
                                  ? 'You cannot remove yourself'
                                  : 'Remove member'
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.filter((inv) => inv.status !== 'CANCELLED').length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
                <Mail className="h-3 w-3 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">
                  {invites.filter((inv) => inv.status !== 'CANCELLED').length} Pending
                  {invites.filter((inv) => inv.status !== 'CANCELLED').length !== 1
                    ? ' Invitations'
                    : ' Invitation'}
                </span>
              </div>
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="space-y-3">
              {invites
                .filter((inv) => inv.status !== 'CANCELLED')
                .map((invite) => {
                  const isPending = invite.status === 'PENDING';
                  const isExpired = invite.status === 'EXPIRED';
                  const isCancelled = invite.status === 'CANCELLED';
                  const isActionLoading = inviteActionId === invite.id;
                  const statusLabel = isCancelled ? 'Cancelled' : isExpired ? 'Expired' : 'Pending';
                  const isPermissionsExpanded = Boolean(expandedInvitePermissions[invite.id]);
                  const visiblePermissions = isPermissionsExpanded
                    ? invite.permissions
                    : invite.permissions.slice(0, 3);
                  const hiddenPermissionsCount = Math.max(invite.permissions.length - 3, 0);
                  const inviteDisplayName =
                    invite.invitedUser?.name || invite.invitedEmail || 'Unknown';
                  const inviteInitial = inviteDisplayName.charAt(0).toUpperCase();
                  return (
                    <div
                      key={invite.id}
                      className={`group relative overflow-hidden rounded-xl border p-4 transition-all ${
                        isExpired || isCancelled
                          ? 'border-slate-700/40 bg-slate-900/40'
                          : 'border-purple-500/25 bg-linear-to-br from-purple-500/8 to-fuchsia-500/5 shadow-lg shadow-purple-900/10 hover:border-purple-500/40 hover:shadow-purple-900/20'
                      }`}
                    >
                      {/* Subtle top accent line */}
                      {!isExpired && !isCancelled && (
                        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-400/40 to-transparent" />
                      )}

                      {/* Header: Avatar + name + status */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11 ring-2 ring-white/10">
                            <AvatarImage
                              src={invite.invitedUser?.image || undefined}
                              alt={inviteDisplayName}
                            />
                            <AvatarFallback
                              className={`text-sm font-bold text-white ${
                                isExpired || isCancelled
                                  ? 'bg-linear-to-br from-slate-600 to-slate-700'
                                  : 'bg-linear-to-br from-purple-500 to-fuchsia-600'
                              }`}
                            >
                              {inviteInitial}
                            </AvatarFallback>
                          </Avatar>
                          {/* Status dot */}
                          <span
                            className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${
                              isExpired || isCancelled ? 'bg-slate-500' : 'bg-amber-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {inviteDisplayName}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                                isExpired || isCancelled
                                  ? 'bg-slate-700/60 text-slate-400'
                                  : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 ring-inset'
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          {invite.invitedUser?.email &&
                            invite.invitedUser.email !== inviteDisplayName && (
                              <p className="truncate text-xs text-slate-400">
                                {invite.invitedUser.email}
                              </p>
                            )}
                          {!invite.invitedUser && invite.invitedEmail && (
                            <p className="truncate text-xs text-slate-400">{invite.invitedEmail}</p>
                          )}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="mt-3 space-y-1 pl-14">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="text-slate-600">Invited by</span>
                          <span className="font-medium text-slate-400">
                            {invite.invitedBy.name || invite.invitedBy.email}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">
                            {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                          </span>
                        </p>
                        {invite.grantRoot && (
                          <p className="text-xs text-slate-600">
                            Under{' '}
                            <span className="text-slate-500">
                              {invite.grantRoot.name || invite.grantRoot.email}
                            </span>
                          </p>
                        )}
                        {invite.message && (
                          <p className="text-xs text-slate-500 italic">
                            &ldquo;{invite.message}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Permissions */}
                      {invite.permissions.length > 0 && (
                        <div className="mt-3 pl-14">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {visiblePermissions.map((permission) => {
                              const label = PERMISSION_LABEL_MAP.get(permission) || permission;
                              const permIcon = PERMISSION_ICON_MAP[
                                permission as WorkspacePermission
                              ] ?? <Settings className="h-2.5 w-2.5" />;
                              return (
                                <span
                                  key={permission}
                                  className="inline-flex items-center gap-1 rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300"
                                >
                                  <span className="opacity-70 [&>svg]:h-2.5 [&>svg]:w-2.5">
                                    {permIcon}
                                  </span>
                                  {label}
                                </span>
                              );
                            })}
                            {hiddenPermissionsCount > 0 && !isPermissionsExpanded && (
                              <span className="inline-flex items-center rounded-full border border-slate-600/40 bg-slate-700/30 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                +{hiddenPermissionsCount} more
                              </span>
                            )}
                            {invite.permissions.length > 3 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedInvitePermissions((prev) => ({
                                    ...prev,
                                    [invite.id]: !prev[invite.id],
                                  }))
                                }
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                              >
                                {isPermissionsExpanded ? 'Show less' : 'Show all'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer: expiry + actions */}
                      <div className="mt-3 flex items-center justify-between pl-14">
                        <div>
                          {invite.expiresAt && !isExpired && (
                            <p className="text-[10px] text-slate-600">
                              Expires{' '}
                              {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        {(canResendInvites || canCancelInvites) && invite.canManage !== false && (
                          <div className="flex items-center gap-2">
                            {canResendInvites && (
                              <button
                                type="button"
                                disabled={!isPending || isActionLoading}
                                onClick={() => handleResendInvite(invite.id)}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-medium text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Mail className="h-3 w-3" />
                                {isActionLoading && inviteActionType === 'resend'
                                  ? 'Sending…'
                                  : 'Resend'}
                              </button>
                            )}
                            {canCancelInvites && (
                              <button
                                type="button"
                                disabled={!isPending || isActionLoading}
                                onClick={() => handleCancelInvite(invite.id)}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-3 text-xs font-medium text-red-400 backdrop-blur-sm transition-all hover:border-red-500/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <X className="h-3 w-3" />
                                {isActionLoading && inviteActionType === 'cancel'
                                  ? 'Cancelling…'
                                  : 'Cancel'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Edit Permissions Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-6xl flex-col border-white/10 bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Member Permissions</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update permission packs for {editingMember?.user.name || editingMember?.user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-4">
              <PermissionPackPicker
                selectedPermissions={editPermissions}
                onChange={setEditPermissions}
                availablePermissions={
                  isOwner ? undefined : (userPermissions as WorkspacePermission[])
                }
                isOwner={isOwner}
              />
            </div>

            {/* Sticky Footer */}
            <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdatePermissions}
                className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-600/20"
                disabled={loading || editPermissions.length === 0}
              >
                {loading ? 'Updating...' : 'Update Permissions'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GlassCard>
  );
}
