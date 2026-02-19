export const WORKSPACE_PERMISSION = {
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_EDIT: 'workspace:edit',

  MEMBERS_VIEW: 'members:view',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_REMOVE: 'members:remove',
  MEMBERS_UPDATE_PERMISSIONS: 'members:update_permissions',
  MEMBERS_RESEND_INVITE: 'members:resend_invite',
  MEMBERS_CANCEL_INVITE: 'members:cancel_invite',

  DOCUMENTS_VIEW: 'documents:view',
  DOCUMENTS_CREATE: 'documents:create',
  DOCUMENTS_EDIT: 'documents:edit',
  DOCUMENTS_DELETE: 'documents:delete',

  VERSIONS_VIEW: 'versions:view',
  VERSIONS_CREATE: 'versions:create',
  VERSIONS_RESTORE: 'versions:restore',
  VERSIONS_DELETE: 'versions:delete',

  COMMENTS_VIEW: 'comments:view',
  COMMENTS_CREATE: 'comments:create',
  COMMENTS_DELETE: 'comments:delete',

  ACTIVITY_VIEW: 'activity:view',

  GITHUB_VIEW: 'github:view',
  GITHUB_IMPORT: 'github:import',
  GITHUB_EXPORT: 'github:export',
  GITHUB_CONFIGURE: 'github:configure',
} as const;

export type WorkspacePermission = (typeof WORKSPACE_PERMISSION)[keyof typeof WORKSPACE_PERMISSION];

export const ALL_WORKSPACE_PERMISSIONS: WorkspacePermission[] = [
  WORKSPACE_PERMISSION.WORKSPACE_VIEW,
  WORKSPACE_PERMISSION.WORKSPACE_EDIT,

  WORKSPACE_PERMISSION.MEMBERS_VIEW,
  WORKSPACE_PERMISSION.MEMBERS_INVITE,
  WORKSPACE_PERMISSION.MEMBERS_REMOVE,
  WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS,
  WORKSPACE_PERMISSION.MEMBERS_RESEND_INVITE,
  WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE,

  WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
  WORKSPACE_PERMISSION.DOCUMENTS_CREATE,
  WORKSPACE_PERMISSION.DOCUMENTS_EDIT,
  WORKSPACE_PERMISSION.DOCUMENTS_DELETE,

  WORKSPACE_PERMISSION.VERSIONS_VIEW,
  WORKSPACE_PERMISSION.VERSIONS_CREATE,
  WORKSPACE_PERMISSION.VERSIONS_RESTORE,
  WORKSPACE_PERMISSION.VERSIONS_DELETE,

  WORKSPACE_PERMISSION.COMMENTS_VIEW,
  WORKSPACE_PERMISSION.COMMENTS_CREATE,
  WORKSPACE_PERMISSION.COMMENTS_DELETE,

  WORKSPACE_PERMISSION.ACTIVITY_VIEW,

  WORKSPACE_PERMISSION.GITHUB_VIEW,
  WORKSPACE_PERMISSION.GITHUB_IMPORT,
  WORKSPACE_PERMISSION.GITHUB_EXPORT,
  WORKSPACE_PERMISSION.GITHUB_CONFIGURE,
];

export type PermissionOption = {
  id: WorkspacePermission;
  label: string;
  description: string;
  category: 'Workspace' | 'Members' | 'Documents' | 'Versions' | 'Comments' | 'Activity' | 'GitHub';
};

export const WORKSPACE_PERMISSION_OPTIONS: PermissionOption[] = [
  {
    id: WORKSPACE_PERMISSION.WORKSPACE_VIEW,
    label: 'Workspace View',
    description: 'View workspace details and access its content.',
    category: 'Workspace',
  },
  {
    id: WORKSPACE_PERMISSION.WORKSPACE_EDIT,
    label: 'Workspace Edit',
    description: 'Update workspace name and description settings.',
    category: 'Workspace',
  },

  {
    id: WORKSPACE_PERMISSION.MEMBERS_VIEW,
    label: 'Members View',
    description: 'View members and invitation lists.',
    category: 'Members',
  },
  {
    id: WORKSPACE_PERMISSION.MEMBERS_INVITE,
    label: 'Members Invite',
    description: 'Invite new users to the workspace.',
    category: 'Members',
  },
  {
    id: WORKSPACE_PERMISSION.MEMBERS_REMOVE,
    label: 'Members Remove',
    description: 'Remove existing members from the workspace.',
    category: 'Members',
  },
  {
    id: WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS,
    label: 'Members Update Permissions',
    description: 'Update permissions for existing workspace members.',
    category: 'Members',
  },
  {
    id: WORKSPACE_PERMISSION.MEMBERS_RESEND_INVITE,
    label: 'Members Resend Invite',
    description: 'Resend pending workspace invitations.',
    category: 'Members',
  },
  {
    id: WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE,
    label: 'Members Cancel Invite',
    description: 'Cancel pending workspace invitations.',
    category: 'Members',
  },

  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
    label: 'Documents View',
    description: 'View workspace documents.',
    category: 'Documents',
  },
  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_CREATE,
    label: 'Documents Create',
    description: 'Create new workspace documents.',
    category: 'Documents',
  },
  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_EDIT,
    label: 'Documents Edit',
    description: 'Edit existing workspace documents.',
    category: 'Documents',
  },
  {
    id: WORKSPACE_PERMISSION.DOCUMENTS_DELETE,
    label: 'Documents Delete',
    description: 'Delete workspace documents.',
    category: 'Documents',
  },

  {
    id: WORKSPACE_PERMISSION.VERSIONS_VIEW,
    label: 'Versions View',
    description: 'View document version history.',
    category: 'Versions',
  },
  {
    id: WORKSPACE_PERMISSION.VERSIONS_CREATE,
    label: 'Versions Create',
    description: 'Create document versions.',
    category: 'Versions',
  },
  {
    id: WORKSPACE_PERMISSION.VERSIONS_RESTORE,
    label: 'Versions Restore',
    description: 'Restore previous document versions.',
    category: 'Versions',
  },
  {
    id: WORKSPACE_PERMISSION.VERSIONS_DELETE,
    label: 'Versions Delete',
    description: 'Delete document versions.',
    category: 'Versions',
  },

  {
    id: WORKSPACE_PERMISSION.COMMENTS_VIEW,
    label: 'Comments View',
    description: 'View comments and discussion threads.',
    category: 'Comments',
  },
  {
    id: WORKSPACE_PERMISSION.COMMENTS_CREATE,
    label: 'Comments Create',
    description: 'Create and reply to comments.',
    category: 'Comments',
  },
  {
    id: WORKSPACE_PERMISSION.COMMENTS_DELETE,
    label: 'Comments Delete',
    description: 'Delete comments and inline comments.',
    category: 'Comments',
  },

  {
    id: WORKSPACE_PERMISSION.ACTIVITY_VIEW,
    label: 'Activity View',
    description: 'View workspace activity feed.',
    category: 'Activity',
  },

  {
    id: WORKSPACE_PERMISSION.GITHUB_VIEW,
    label: 'GitHub View',
    description: 'View GitHub integration and sync status.',
    category: 'GitHub',
  },
  {
    id: WORKSPACE_PERMISSION.GITHUB_IMPORT,
    label: 'GitHub Import',
    description: 'Import content from GitHub into workspace.',
    category: 'GitHub',
  },
  {
    id: WORKSPACE_PERMISSION.GITHUB_EXPORT,
    label: 'GitHub Export',
    description: 'Export workspace content to GitHub.',
    category: 'GitHub',
  },
  {
    id: WORKSPACE_PERMISSION.GITHUB_CONFIGURE,
    label: 'GitHub Configure',
    description: 'Configure GitHub integration settings.',
    category: 'GitHub',
  },
];

const VALID_PERMISSION_SET = new Set<string>(ALL_WORKSPACE_PERMISSIONS);

const addDependency = (set: Set<WorkspacePermission>, permission: WorkspacePermission) => {
  set.add(permission);

  if (permission !== WORKSPACE_PERMISSION.WORKSPACE_VIEW) {
    set.add(WORKSPACE_PERMISSION.WORKSPACE_VIEW);
  }

  if (permission.startsWith('members:') && permission !== WORKSPACE_PERMISSION.MEMBERS_VIEW) {
    set.add(WORKSPACE_PERMISSION.MEMBERS_VIEW);
  }

  if (permission.startsWith('documents:') && permission !== WORKSPACE_PERMISSION.DOCUMENTS_VIEW) {
    set.add(WORKSPACE_PERMISSION.DOCUMENTS_VIEW);
  }

  if (permission.startsWith('versions:') && permission !== WORKSPACE_PERMISSION.VERSIONS_VIEW) {
    set.add(WORKSPACE_PERMISSION.VERSIONS_VIEW);
  }

  if (permission.startsWith('comments:') && permission !== WORKSPACE_PERMISSION.COMMENTS_VIEW) {
    set.add(WORKSPACE_PERMISSION.COMMENTS_VIEW);
  }

  if (permission.startsWith('activity:') && permission !== WORKSPACE_PERMISSION.ACTIVITY_VIEW) {
    set.add(WORKSPACE_PERMISSION.ACTIVITY_VIEW);
  }

  if (permission.startsWith('github:') && permission !== WORKSPACE_PERMISSION.GITHUB_VIEW) {
    set.add(WORKSPACE_PERMISSION.GITHUB_VIEW);
  }
};

/**
 * Permission Packs - Professional grouping of permissions for cleaner UI
 * Still stores individual permissions in DB, but UI shows bundles
 */
export const PERMISSION_PACK = {
  VIEW: 'pack:view',
  WORKSPACE_EDIT: 'pack:workspace_edit',
  MEMBER_MANAGEMENT: 'pack:member_management',
  CONTENT_MANAGEMENT: 'pack:content_management',
  EDITOR: 'pack:editor',
  GITHUB_INTEGRATION: 'pack:github_integration',
} as const;

export type PermissionPack = (typeof PERMISSION_PACK)[keyof typeof PERMISSION_PACK];

export interface PermissionPackDefinition {
  id: PermissionPack;
  name: string;
  description: string;
  icon: string;
  permissions: WorkspacePermission[];
  color: string;
}

export const PERMISSION_PACK_DEFINITIONS: PermissionPackDefinition[] = [
  {
    id: PERMISSION_PACK.VIEW,
    name: 'View Access',
    description: 'Read-only access to workspace content, members, and activity',
    icon: '👁️',
    color: 'blue',
    permissions: [
      WORKSPACE_PERMISSION.WORKSPACE_VIEW,
      WORKSPACE_PERMISSION.MEMBERS_VIEW,
      WORKSPACE_PERMISSION.DOCUMENTS_VIEW,
      WORKSPACE_PERMISSION.VERSIONS_VIEW,
      WORKSPACE_PERMISSION.COMMENTS_VIEW,
      WORKSPACE_PERMISSION.ACTIVITY_VIEW,
    ],
  },
  {
    id: PERMISSION_PACK.WORKSPACE_EDIT,
    name: 'Workspace Edit',
    description: 'Edit workspace name, description, and settings',
    icon: '🏢',
    color: 'purple',
    permissions: [WORKSPACE_PERMISSION.WORKSPACE_EDIT],
  },
  {
    id: PERMISSION_PACK.MEMBER_MANAGEMENT,
    name: 'Member Management',
    description: 'Invite, remove, and manage member permissions (with delegation limits)',
    icon: '👥',
    color: 'green',
    permissions: [
      WORKSPACE_PERMISSION.MEMBERS_INVITE,
      WORKSPACE_PERMISSION.MEMBERS_REMOVE,
      WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS,
      WORKSPACE_PERMISSION.MEMBERS_RESEND_INVITE,
      WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE,
    ],
  },
  {
    id: PERMISSION_PACK.CONTENT_MANAGEMENT,
    name: 'Content Management',
    description: 'Create and delete documents, versions, and comments',
    icon: '📝',
    color: 'orange',
    permissions: [
      WORKSPACE_PERMISSION.DOCUMENTS_CREATE,
      WORKSPACE_PERMISSION.DOCUMENTS_DELETE,
      WORKSPACE_PERMISSION.VERSIONS_CREATE,
      WORKSPACE_PERMISSION.VERSIONS_RESTORE,
      WORKSPACE_PERMISSION.VERSIONS_DELETE,
      WORKSPACE_PERMISSION.COMMENTS_CREATE,
      WORKSPACE_PERMISSION.COMMENTS_DELETE,
    ],
  },
  {
    id: PERMISSION_PACK.EDITOR,
    name: 'Editor',
    description: 'Edit documents and manage versions and comments',
    icon: '✍️',
    color: 'amber',
    permissions: [
      WORKSPACE_PERMISSION.DOCUMENTS_EDIT,
      WORKSPACE_PERMISSION.VERSIONS_CREATE,
      WORKSPACE_PERMISSION.VERSIONS_RESTORE,
      WORKSPACE_PERMISSION.VERSIONS_DELETE,
      WORKSPACE_PERMISSION.COMMENTS_CREATE,
      WORKSPACE_PERMISSION.COMMENTS_DELETE,
    ],
  },
  {
    id: PERMISSION_PACK.GITHUB_INTEGRATION,
    name: 'GitHub Integration',
    description: 'Connect repositories, import/export content, manage GitHub sync',
    icon: '🔗',
    color: 'slate',
    permissions: [
      WORKSPACE_PERMISSION.GITHUB_VIEW,
      WORKSPACE_PERMISSION.GITHUB_IMPORT,
      WORKSPACE_PERMISSION.GITHUB_EXPORT,
      WORKSPACE_PERMISSION.GITHUB_CONFIGURE,
    ],
  },
];

/**
 * Expand permission packs to individual permissions
 */
export function expandPermissionPacks(input: string[]): WorkspacePermission[] {
  const expanded = new Set<WorkspacePermission>();

  for (const item of input) {
    // Check if it's a pack
    if (item.startsWith('pack:')) {
      const pack = PERMISSION_PACK_DEFINITIONS.find((p) => p.id === item);
      if (pack) {
        pack.permissions.forEach((perm) => expanded.add(perm));
      }
    } else if (VALID_PERMISSION_SET.has(item)) {
      // Individual permission
      expanded.add(item as WorkspacePermission);
    }
  }

  return Array.from(expanded);
}

const hasAnyNonViewPack = (input: string[]) =>
  input.some((item) => item.startsWith('pack:') && item !== PERMISSION_PACK.VIEW);

/**
 * Get which packs are selected based on individual permissions
 */
export function getSelectedPacks(permissions: WorkspacePermission[]): PermissionPack[] {
  const permissionSet = new Set(permissions);
  const selectedPacks: PermissionPack[] = [];

  for (const pack of PERMISSION_PACK_DEFINITIONS) {
    // Check if ALL permissions in the pack are present
    const allIncluded = pack.permissions.every((perm) => permissionSet.has(perm));
    if (allIncluded) {
      selectedPacks.push(pack.id);
    }
  }

  return selectedPacks;
}

/**
 * Normalize permissions with pack expansion and dependency addition
 */
export const normalizePermissions = (permissions: string[]): WorkspacePermission[] => {
  // First expand any packs to individual permissions
  const expandedPermissions = expandPermissionPacks(permissions);

  // Then add dependencies
  const normalized = new Set<WorkspacePermission>();

  // Professional pack rule:
  // if any selected pack besides View Pack exists, always include full View Pack.
  if (hasAnyNonViewPack(permissions)) {
    const viewPack = PERMISSION_PACK_DEFINITIONS.find((pack) => pack.id === PERMISSION_PACK.VIEW);
    viewPack?.permissions.forEach((permission) => normalized.add(permission));
  }

  for (const permission of expandedPermissions) {
    if (!VALID_PERMISSION_SET.has(permission)) {
      continue;
    }

    addDependency(normalized, permission as WorkspacePermission);
  }

  return ALL_WORKSPACE_PERMISSIONS.filter((permission) => normalized.has(permission));
};
