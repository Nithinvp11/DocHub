'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Mail, UserPlus, Shield, Edit, Eye, Trash2, Download, Upload } from 'lucide-react';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { toast } from 'sonner';

interface Permission {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

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

const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
    label: 'View Documents',
    description: 'Can view all documents',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_EDIT,
    label: 'Edit Documents',
    description: 'Create, modify, and save changes to documents',
    icon: <Edit className="h-4 w-4" />,
  },
  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_DELETE,
    label: 'Delete Documents',
    description: 'Permanently remove documents from workspace',
    icon: <Trash2 className="h-4 w-4" />,
  },
  {
    id: WORKSPACE_PERMISSION.VERSIONS_CREATE,
    label: 'Manage Versions',
    description: 'Create, restore, and manage document version history',
    icon: <Download className="h-4 w-4" />,
  },
  {
    id: WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS,
    label: 'Manage Members',
    description: 'Add, remove, and modify team member permissions',
    icon: <UserPlus className="h-4 w-4" />,
  },
];

export function MemberPermissionsPanel({
  workspaceId,
  userPermissions,
}: {
  workspaceId: string;
  userPermissions: string[];
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
  ]);
  const [loading, setLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const canManageMembers =
    userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS) ||
    userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_INVITE) ||
    userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_REMOVE);

  useEffect(() => {
    const fetchMembers = async () => {
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

    fetchMembers();
  }, [workspaceId]);

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
    if (!userIdentifier || !canManageMembers) return;

    setLoading(true);
    try {
      const payload = {
        [userIdentifier.includes('@') ? 'email' : 'userId']: userIdentifier,
        permissions: selectedPermissions,
      };

      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Member added successfully');
        setUserIdentifier('');
        setSelectedPermissions([WORKSPACE_PERMISSION.DOCUMENTS_VIEW]);
        loadMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (memberId: string, permissions: string[]) => {
    if (!canManageMembers) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });

      if (res.ok) {
        toast.success('Permissions updated');
        loadMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!canManageMembers || !confirm('Remove this member from the workspace?')) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Member removed');
        loadMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const toggleMemberPermission = (memberId: string, permission: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const newPermissions = member.permissions.includes(permission)
      ? member.permissions.filter((p) => p !== permission)
      : [...member.permissions, permission];

    handleUpdatePermissions(memberId, newPermissions);
  };

  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          Team Members
        </CardTitle>
        <CardDescription>Manage workspace access and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Member Form */}
        {canManageMembers && (
          <form onSubmit={handleAddMember} className="space-y-3 border-b pb-4">
            <div className="space-y-2">
              <Label htmlFor="userIdentifier" className="text-sm font-medium">
                Add New Member
              </Label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                <Input
                  id="userIdentifier"
                  type="text"
                  placeholder="user@example.com"
                  value={userIdentifier}
                  onChange={(e) => setUserIdentifier(e.target.value)}
                  className="pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Permissions</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`new-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`new-${permission.id}`}
                        className="flex cursor-pointer items-center gap-2 text-sm leading-none font-medium"
                      >
                        {permission.icon}
                        {permission.label}
                      </label>
                      <p className="mt-1 text-xs text-neutral-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </form>
        )}

        {/* Members List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Members ({members.length})
          </h3>
          <div className="max-h-[500px] space-y-2 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="space-y-2 rounded-lg border bg-white p-3 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={member.user.image || undefined}
                        alt={member.user.name || member.user.email}
                      />
                      <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                        {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedMember(expandedMember === member.id ? null : member.id)
                      }
                      className="h-8 px-2 text-xs"
                    >
                      {expandedMember === member.id ? 'Hide' : 'Edit'}
                    </Button>
                    {canManageMembers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Permissions */}
                {expandedMember === member.id && (
                  <div className="space-y-2 border-t pt-2">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Permissions:
                    </p>
                    <div className="space-y-1.5">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${member.id}-${permission.id}`}
                            checked={member.permissions.includes(permission.id)}
                            onCheckedChange={() =>
                              canManageMembers && toggleMemberPermission(member.id, permission.id)
                            }
                            disabled={!canManageMembers}
                          />
                          <label
                            htmlFor={`${member.id}-${permission.id}`}
                            className="flex cursor-pointer items-center gap-1.5 text-xs"
                          >
                            {permission.icon}
                            {permission.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
