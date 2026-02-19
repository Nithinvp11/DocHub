# Permission SystemDeveloper Guide

## Quick Reference

### Import Permissions System

```typescript
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';
```

### Standard Authorization Pattern

```typescript
export async function POST(req: NextRequest, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = body;

    // Check permissions - single line
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);

    // ... rest of handler

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Available Permissions

### Workspace

- `WORKSPACE_PERMISSION.WORKSPACE_VIEW` - Read workspace properties
- `WORKSPACE_PERMISSION.WORKSPACE_EDIT` - Modify workspace settings

### Members

- `WORKSPACE_PERMISSION.MEMBERS_VIEW` - List members
- `WORKSPACE_PERMISSION.MEMBERS_INVITE` - Send invitations
- `WORKSPACE_PERMISSION.MEMBERS_REMOVE` - Remove members
- `WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS` - Change member permissions
- `WORKSPACE_PERMISSION.MEMBERS_RESEND_INVITE` - Resend pending invites
- `WORKSPACE_PERMISSION.MEMBERS_CANCEL_INVITE` - Cancel pending invites

### Documents

- `WORKSPACE_PERMISSION.DOCUMENTS_VIEW` - Read documents
- `WORKSPACE_PERMISSION.DOCUMENTS_CREATE` - Create documents
- `WORKSPACE_PERMISSION.DOCUMENTS_EDIT` - Modify documents
- `WORKSPACE_PERMISSION.DOCUMENTS_DELETE` - Delete documents

### Versions

- `WORKSPACE_PERMISSION.VERSIONS_VIEW` - View version history
- `WORKSPACE_PERMISSION.VERSIONS_CREATE` - Create versions
- `WORKSPACE_PERMISSION.VERSIONS_RESTORE` - Restore old versions
- `WORKSPACE_PERMISSION.VERSIONS_DELETE` - Delete versions

### Comments

- `WORKSPACE_PERMISSION.COMMENTS_VIEW` - Read comments
- `WORKSPACE_PERMISSION.COMMENTS_CREATE` - Create comments
- `WORKSPACE_PERMISSION.COMMENTS_DELETE` - Manage comments (resolve/delete)

### Activity

- `WORKSPACE_PERMISSION.ACTIVITY_VIEW` - View activity log

### GitHub Integration

- `WORKSPACE_PERMISSION.GITHUB_VIEW` - View GitHub integration status
- `WORKSPACE_PERMISSION.GITHUB_IMPORT` - Import from GitHub
- `WORKSPACE_PERMISSION.GITHUB_EXPORT` - Export to GitHub
- `WORKSPACE_PERMISSION.GITHUB_CONFIGURE` - Configure GitHub integration

## Helper Functions

### assertPermission() - For Enforcement

```typescript
// Throws WorkspacePermissionError if user lacks permission
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);
```

**Returns:** void (throws on failure)  
**Use Case:** API route permission enforcement

### hasPermission() - For Conditional Logic

```typescript
// Returns boolean, never throws
const canEdit = await hasPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

if (canEdit) {
  // Show edit button
}
```

**Returns:** boolean  
**Use Case:** Conditional UI rendering, logic branching

### getWorkspaceAccess() - For Full Inspection

```typescript
const access = await getWorkspaceAccess(user.id, workspaceId);
if (access.isOwner) {
  // Owner gets all permissions
}
// access.permissions contains normalized array of permission strings
```

**Returns:** `{ isOwner: boolean, permissions: string[] }`  
**Use Case:** Batch permission checking, detailed access analysis

### normalizePermissions() - For Permission Arrays

```typescript
const normalized = normalizePermissions(['documents:edit']);
// Returns: ['documents:edit', 'documents:view', 'workspace:view']
```

**Dependency Injection:**

- Any permission automatically adds `workspace:view`
- Document permissions add `documents:view`
- Member permissions add `members:view`
- Comment permissions add `comments:view`
- GitHub permissions add `github:view`
- Etc.

## Common Patterns

### Checking Single Permission

```typescript
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);
```

### Getting Current User's Permissions

```typescript
const access = await getWorkspaceAccess(user.id, workspaceId);
console.log(access.permissions); // Array of all permissions
```

### Permissioning Member Operations

```typescript
// When updating member permissions
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS);

// Also validate ceiling (non-owners can only grant what they have)
await assertDelegatablePermissions(user.id, workspaceId, newPermissions);
```

### View-Only Routes

```typescript
// Simple read-only endpoint
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);
const docs = await prisma.document.findMany({ where: { workspaceId } });
return NextResponse.json(docs);
```

### Create Operations

```typescript
// New document creation
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);
const doc = await prisma.document.create({
  data: { title: '...', workspaceId, authorId: user.id },
});
```

## Error Handling

### WorkspacePermissionError Properties

```typescript
try {
  await assertPermission(...);
} catch (error) {
  if (error instanceof WorkspacePermissionError) {
    console.log(error.message);     // User-friendly message
    console.log(error.status);      // 403 (forbidden) or 404 (notfound)
    console.log(error.permission);  // The required permission
  }
}
```

### Standard Error Response

```typescript
// Workspace permission denied - user exists but lacks permission
{ error: 'You do not have permission to perform this action', status: 403 }

// Workspace not found or user is not member
{ error: 'Workspace not found', status: 404 }
```

## Migration Checklist

When refactoring a route to use the new permission system:

- [ ] Import `WORKSPACE_PERMISSION`, `assertPermission`, `WorkspacePermissionError`
- [ ] Change `validateApiAuth()` to `getCurrentUser()`
- [ ] Replace workspace membership check with `assertPermission()`
- [ ] Remove manual `permissions.includes('...')` checks
- [ ] Add `WorkspacePermissionError` catch block
- [ ] Update test cases with new permission constants
- [ ] Verify activity logging for sensitive operations
- [ ] Check for notification triggers on permission changes

## Files to Reference

**Permission Definitions:**

- `src/lib/workspace-permission-definitions.ts` - Canonical constants
- `src/lib/workspace-permissions.ts` - Helper functions

**Example Implementations:**

- `src/app/api/documents/[id]/comments/route.ts` - Simple comment operations
- `src/app/api/workspaces/[id]/members/route.ts` - Complex member management
- `src/app/api/github/workspace-integration/route.ts` - GitHub integration

**Old vs New Comparison:**

- See individual route files in `src/app/api/` for before/after patterns

## Testing Your Permission Implementation

```typescript
describe('Document Edit Endpoint', () => {
  it('should deny access without DOCUMENTS_EDIT permission', async () => {
    const user = { id: 'user123' };
    const response = await PATCH(request, { params: { id: 'doc1' } });
    expect(response.status).toBe(403);
  });

  it('should allow owner to edit documents', async () => {
    // Owner has implicit all permissions
    const response = await PATCH(request, { params: { id: 'doc1' } });
    expect(response.status).toBe(200);
  });

  it('should allow member with DOCUMENTS_EDIT permission', async () => {
    // Member has explicit permission
    const response = await PATCH(request, { params: { id: 'doc1' } });
    expect(response.status).toBe(200);
  });
});
```

## Troubleshooting

### "WorkspacePermissionError: You do not have permission"

- Check user has required permission in workspace
- Verify workspaceId is correct
- Ensure user is at least a member of workspace

### "Permission normalization creates unwanted permissions"

- This is by design - dependencies are automatic
- Example: granting `documents:edit` automatically adds `documents:view` and `workspace:view`
- This ensures permissions are always valid

### "Non-owner cannot escalate privileges"

- `assertDelegatablePermissions()` prevents this
- Non-owners can only grant permissions they already have
- Owners can grant any permission

### Route still using old validateApiAuth

- Find all instances: `grep -r "validateApiAuth" src/app/api/`
- Replace with `getCurrentUser()` from `@/lib/session`
- Update error handling

## Performance Notes

- Permission checks require one database query to workspace membership
- Results are typically cached at the database connection level
- No N+1 queries - single join to get workspace + membership
- Normalization is one-time operation, then cached in memory
- Safe for high-concurrency scenarios (1000+ concurrent checks)

## Security Best Practices

1. **Always use assertPermission()** in route handlers
2. **Never trust user-provided permission strings**
3. **Use hasPermission() only for conditional UI** - always assertPermission() on backend
4. **Log permission changes** - activity tracking is automatic
5. **Validate permission ceiling** when delegating
6. **Never hardcode permission checks** - use WORKSPACE_PERMISSION constants

## Future Enhancements

Potential improvements to permission system:

- [ ] Time-limited permissions for temporary access
- [ ] Resource-level permissions (per-document access control)
- [ ] Permission delegation with expiration
- [ ] Audit trail with change history
- [ ] Permission templates for common scenarios
- [ ] Permission inheritance from parent resources

---

**Last Updated:** 2026-02-17  
**Framework:** Next.js 14+  
**Database:** Prisma + PostgreSQL  
**Authentication:** NextAuth.js
