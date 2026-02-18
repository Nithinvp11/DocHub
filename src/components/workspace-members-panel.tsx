'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
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
          <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase">Owner</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
                {workspaceOwner.image ? (
                  <img
                    src={workspaceOwner.image}
                    alt={workspaceOwner.name || workspaceOwner.email}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {(workspaceOwner.name || workspaceOwner.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {workspaceOwner.name || workspaceOwner.email}
                  </p>
                  {isOwner && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
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
            <DialogContent className="max-w-md border-white/10 bg-slate-900">
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

              {/* Step 1: Search User */}
              {addStep === 'search' && (
                <form onSubmit={handleSearchUser} className="space-y-4">
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

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelAdd}
                      className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-600/20"
                      disabled={searchingUser}
                    >
                      {searchingUser ? 'Searching...' : 'Search User'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 2: Confirm User */}
              {addStep === 'confirm' && foundUser && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20">
                        {foundUser.image ? (
                          <img
                            src={foundUser.image}
                            alt={foundUser.name || foundUser.email}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">
                            {(foundUser.name || foundUser.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{foundUser.name || 'No name'}</p>
                        <p className="text-sm text-slate-400">{foundUser.email}</p>
                        {foundUser.username && (
                          <p className="text-xs text-slate-500">@{foundUser.username}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddStep('search')}
                      className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleConfirmUser}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-600/20"
                    >
                      Invite This User
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Select Permissions */}
              {addStep === 'permissions' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Select Permission Packs</Label>
                    <PermissionPackPicker
                      selectedPermissions={selectedPermissions}
                      onChange={setSelectedPermissions}
                      availablePermissions={
                        isOwner ? undefined : (userPermissions as WorkspacePermission[])
                      }
                      isOwner={isOwner}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddStep('confirm')}
                      className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-600/20"
                      disabled={loading || selectedPermissions.length === 0}
                    >
                      {loading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              )}
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
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 p-3 transition-all hover:border-purple-500/50 hover:bg-slate-900/70"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name || member.user.email}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {member.user.name || member.user.email}
                        </p>
                        {member.user.id === currentUserId && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                            You
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400">{member.user.email}</p>
                      <div className="mt-1 space-y-0.5">
                        {member.grantedBy && (
                          <p className="text-[11px] text-slate-500">
                            Invited by:{' '}
                            <span className="text-slate-400">
                              {member.grantedBy.name || member.grantedBy.email}
                            </span>
                          </p>
                        )}
                        {member.grantRoot && (
                          <p className="text-[11px] text-slate-500">
                            Managed under:{' '}
                            <span className="text-slate-400">
                              {member.grantRoot.name || member.grantRoot.email}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(member.permissions || []).slice(0, 2).map((perm) => {
                          const permissionLabel = PERMISSION_LABEL_MAP.get(perm) || perm;
                          const permissionIcon = PERMISSION_ICON_MAP[
                            perm as WorkspacePermission
                          ] ?? <Settings className="h-2.5 w-2.5" />;

                          return (
                            <span
                              key={perm}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
                            >
                              <span className="[&>svg]:h-2.5 [&>svg]:w-2.5">{permissionIcon}</span>
                              {permissionLabel}
                            </span>
                          );
                        })}
                        {(member.permissions || []).length > 2 && (
                          <span className="inline-flex items-center rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-xs text-slate-400">
                            +{member.permissions.length - 2}
                          </span>
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Pending Invitations ({invites.filter((inv) => inv.status !== 'CANCELLED').length})
              </h4>
            </div>
            <div className="space-y-2">
              {invites
                .filter((inv) => inv.status !== 'CANCELLED')
                .map((invite) => {
                  const isPending = invite.status === 'PENDING';
                  const isExpired = invite.status === 'EXPIRED';
                  const isCancelled = invite.status === 'CANCELLED';
                  const isActionLoading = inviteActionId === invite.id;
                  const statusLabel = isCancelled ? 'Cancelled' : isExpired ? 'Expired' : 'Pending';
                  return (
                    <div
                      key={invite.id}
                      className={`rounded-lg border p-3 ${
                        isExpired || isCancelled
                          ? 'border-slate-700/40 bg-slate-900/40'
                          : 'border-purple-500/20 bg-purple-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {invite.invitedUser?.name || invite.invitedEmail}
                            </p>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                isExpired || isCancelled
                                  ? 'bg-slate-700/50 text-slate-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            Invited by {invite.invitedBy.name || invite.invitedBy.email}{' '}
                            {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                          </p>
                          {invite.grantRoot && (
                            <p className="mt-1 text-xs text-slate-500">
                              Managed under {invite.grantRoot.name || invite.grantRoot.email}
                            </p>
                          )}
                          {invite.message && (
                            <p className="mt-1 text-xs text-slate-400 italic">
                              &ldquo;{invite.message}&rdquo;
                            </p>
                          )}
                          {invite.permissions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {invite.permissions.map((permission) => {
                                const label = PERMISSION_LABEL_MAP.get(permission) || permission;
                                return (
                                  <Badge
                                    key={permission}
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {label}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          {invite.expiresAt && !isExpired && (
                            <p className="mt-1 text-xs text-slate-500">
                              Expires{' '}
                              {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        {(canResendInvites || canCancelInvites) && invite.canManage !== false && (
                          <div className="flex shrink-0 flex-col gap-2">
                            {canResendInvites && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!isPending || isActionLoading}
                                onClick={() => handleResendInvite(invite.id)}
                                className="border-white/10 text-xs"
                              >
                                {isActionLoading && inviteActionType === 'resend'
                                  ? 'Resending...'
                                  : 'Resend'}
                              </Button>
                            )}
                            {canCancelInvites && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!isPending || isActionLoading}
                                onClick={() => handleCancelInvite(invite.id)}
                                className="border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
                              >
                                {isActionLoading && inviteActionType === 'cancel'
                                  ? 'Cancelling...'
                                  : 'Cancel'}
                              </Button>
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
          <DialogContent className="max-w-2xl border-white/10 bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Member Permissions</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update permission packs for {editingMember?.user.name || editingMember?.user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <PermissionPackPicker
                selectedPermissions={editPermissions}
                onChange={setEditPermissions}
                availablePermissions={
                  isOwner ? undefined : (userPermissions as WorkspacePermission[])
                }
                isOwner={isOwner}
              />

              <div className="flex gap-2">
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-600/20"
                  disabled={loading || editPermissions.length === 0}
                >
                  {loading ? 'Updating...' : 'Update Permissions'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GlassCard>
  );
}
