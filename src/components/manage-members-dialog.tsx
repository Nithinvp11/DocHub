'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { Users, X, Mail } from 'lucide-react';

interface Member {
  id: string;
  permissions: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function ManageMembersDialog({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentifier || !canManage) return;

    setLoading(true);
    try {
      // Support both email and user ID
      const payload = userIdentifier.includes('@')
        ? { email: userIdentifier, permissions: selectedPermissions }
        : { userId: userIdentifier, permissions: selectedPermissions };

      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setUserIdentifier('');
        setSelectedPermissions([WORKSPACE_PERMISSION.DOCUMENTS_VIEW]);
        loadMembers();
        alert('Invitation sent successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (memberId: string, newPermissions: string[]) => {
    if (!canManage) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions }),
      });

      if (res.ok) {
        loadMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!canManage || !confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-9 border border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
        >
          <Users className="mr-2 h-4 w-4" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Workspace Members</DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage who has access to this workspace and their roles.
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <form onSubmit={handleAddMember} className="space-y-4 border-b border-white/10 pb-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userIdentifier" className="text-white">
                  Email or User ID
                </Label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="userIdentifier"
                    type="text"
                    placeholder="user@example.com or user ID"
                    value={userIdentifier}
                    onChange={(e) => setUserIdentifier(e.target.value)}
                    className="border-white/20 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">💡 Add connected users using their user ID</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Select Permissions</Label>
                <div className="grid gap-2">
                  {[
                    { id: WORKSPACE_PERMISSION.DOCUMENTS_VIEW, label: 'View Documents' },
                    { id: WORKSPACE_PERMISSION.DOCUMENTS_EDIT, label: 'Edit Documents' },
                    { id: WORKSPACE_PERMISSION.DOCUMENTS_DELETE, label: 'Delete Documents' },
                    { id: WORKSPACE_PERMISSION.VERSIONS_CREATE, label: 'Manage Versions' },
                    {
                      id: WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS,
                      label: 'Manage Members',
                    },
                  ].map((perm) => (
                    <label key={perm.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id]);
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((p) => p !== perm.id)
                            );
                          }
                        }}
                        className="h-4 w-4 accent-purple-600"
                      />
                      <span className="text-sm text-white">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Current Members ({members.length})</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={member.user.image || undefined}
                      alt={member.user.name || member.user.email}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-sm font-semibold text-white">
                      {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-xs text-slate-400">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {member.permissions.slice(0, 3).map((perm) => (
                      <span
                        key={perm}
                        className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300"
                      >
                        {perm.replace(/[:_]/g, ' ')}
                      </span>
                    ))}
                    {member.permissions.length > 3 && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                        +{member.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="bg-white/5 text-white hover:bg-red-500/20 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
