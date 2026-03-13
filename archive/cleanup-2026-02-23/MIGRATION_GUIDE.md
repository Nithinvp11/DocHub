# Permission System Migration Guide

Step-by-step instructions for updating API routes to use the canonical permission system.

---

## Prerequisites

Ensure you understand:

- WORKSPACE_PERMISSION constants (see `PERMISSION_SYSTEM_GUIDE.md`)
- Authorization pattern: `await assertPermission(userId, workspaceId, permission)`
- Error handling with `WorkspacePermissionError`
- Database field: `WorkspaceMember.permissions` is string array

---

## Route Migration Steps

### Step 1: Identify Route to Migrate

Find the route file:

```
src/app/api/[resource]/route.ts
```

Check current authentication method:

- `validateApiAuth()` - Legacy auth method ❌
- `getServerSession()` - NextAuth method ✅ (but should use getCurrentUser)
- Custom permission arrays - Legacy pattern ❌
- No auth check at all - Missing auth ❌

### Step 2: Add Imports

**Before:**

```typescript
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
```

**After:**

```typescript
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
```

**Imports Added:**

- `WORKSPACE_PERMISSION` - Permission constants
- `assertPermission` - Authorization function
- `WorkspacePermissionError` - Error class
- `getCurrentUser` - Better than getServerSession

### Step 3: Get Current User

**Before:**

```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
```

**After:**

```typescript
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
```

### Step 4: Extract Workspace ID

**Option A: From URL params**

```typescript
const { params } = context;
const { id: workspaceId } = params;
```

**Option B: From request body**

```typescript
const body = await req.json();
const { workspaceId } = body;
```

**Option C: From query string**

```typescript
const searchParams = req.nextUrl.searchParams;
const workspaceId = searchParams.get('workspaceId');
```

### Step 5: Determine Required Permission

Match HTTP method to action:

| Action                 | Permission                   | Examples                                   |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| **View/List**          | `DOCUMENTS_VIEW`             | GET documents, GET versions, GET comments  |
| **Create**             | `DOCUMENTS_CREATE`           | POST document, POST template, POST version |
| **Edit**               | `DOCUMENTS_EDIT`             | PATCH document, PATCH settings             |
| **Delete**             | `DOCUMENTS_DELETE`           | DELETE document                            |
| **List Members**       | `MEMBERS_VIEW`               | GET /members                               |
| **Add Member**         | `MEMBERS_INVITE`             | POST /members (invite)                     |
| **Remove Member**      | `MEMBERS_REMOVE`             | DELETE /members/[id]                       |
| **Update Permissions** | `MEMBERS_UPDATE_PERMISSIONS` | PATCH /members/[id] (permissions)          |
| **View Activity**      | `ACTIVITY_VIEW`              | GET /activity                              |
| **GitHub View**        | `GITHUB_VIEW`                | GET /github/status                         |
| **GitHub Configure**   | `GITHUB_CONFIGURE`           | POST /github/configure                     |
| **GitHub Import**      | `GITHUB_IMPORT`              | POST /github/import                        |
| **GitHub Export**      | `GITHUB_EXPORT`              | POST /github/export                        |

### Step 6: Replace Permission Checks

**Before (Validateauth pattern):**

```typescript
const member = await prisma.workspaceMember.findUnique({
  where: { workspaceId_userId: { workspaceId, userId } },
});
if (!member?.permissions?.includes('documents:edit')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**After (Assertpermission pattern):**

```typescript
await assertPermission(userId, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);
```

**Before (Manual ownership check):**

```typescript
const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
if (workspace.ownerId !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**After (Capability-based check):**

```typescript
await assertPermission(userId, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);
// Or for actual owner-only operations (rare):
const access = await getWorkspaceAccess(userId, workspaceId);
if (!access.isOwner) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Step 7: Add Error Handling

**After permission check, wrap handler in try/catch:**

```typescript
export async function PATCH(req: NextRequest, context) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await req.json();

    // Permission check here
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // ... rest of handler

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error in PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 8: Update All Session/User References

Find all `session.user.id` references and replace with `user.id`:

```typescript
// Before
authorId: session.user.id,
updatedBy: session.user.id

// After
authorId: user.id,
updatedBy: user.id
```

### Step 9: Verify Workspace ID

Ensure permission check uses correct workspace context:

✅ **Good:**

```typescript
// Getting workspace from URL
const { workspaceId } = params;
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);
```

❌ **Bad:**

```typescript
// Using wrong workspace
const document = await prisma.document.findUnique({ where: { id: docId } });
await assertPermission(user.id, document.workspaceId, ...);
// Why? Document might not exist - permission check happens first
```

**Best:**

```typescript
// Check permission first, then fetch from workspace
await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);
const document = await prisma.document.findUnique({ where: { id: docId, workspaceId } });
```

### Step 10: Test the Route

Run tests with different user scenarios:

```typescript
// Test case 1: Unauthorized user
const response = await POST(request); // Should be 401

// Test case 2: User without permission
const response = await POST(request); // Should be 403

// Test case 3: User with permission
const response = await POST(request); // Should be 200

// Test case 4: Workspace doesn't exist
const response = await POST(request); // Should be 404
```

---

## Common Patterns

### Pattern 1: Simple List Endpoint

```typescript
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    const documents = await prisma.document.findMany({
      where: { workspaceId },
    });

    return NextResponse.json(documents);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Pattern 2: Create Endpoint

```typescript
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, title, content } = await req.json();

    // Check permission before creating
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);

    const document = await prisma.document.create({
      data: {
        title,
        content,
        workspaceId,
        authorId: user.id,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_CREATED',
        workspaceId,
        userId: user.id,
        metadata: { documentId: document.id },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Pattern 3: Update Endpoint

```typescript
export async function PATCH(req: NextRequest, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = params;
    const { title, content } = await req.json();

    // Get document first to find workspace
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permission
    await assertPermission(
      user.id,
      existingDocument.workspaceId,
      WORKSPACE_PERMISSION.DOCUMENTS_EDIT
    );

    // Update document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { title, content, updatedAt: new Date() },
    });

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Pattern 4: Delete Endpoint

```typescript
export async function DELETE(req: NextRequest, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = params;

    // Get document first
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permission
    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_DELETE);

    // Delete document
    await prisma.document.delete({ where: { id: documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Pattern 5: Member Management (With Delegation Ceiling)

```typescript
export async function PATCH(req: NextRequest, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, memberId } = params;
    const { permissions } = await req.json();

    // Check permission to update
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS);

    // Also check delegation ceiling - can't grant what you don't have
    await assertDelegatablePermissions(user.id, workspaceId, permissions);

    // Update member
    const member = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { permissions },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'MEMBER_PERMISSIONS_UPDATED',
        workspaceId,
        userId: user.id,
        metadata: { memberId, permissions },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Checklist for Migration Complete

- [ ] Imports added (WORKSPACE_PERMISSION, assertPermission, getCurrentUser)
- [ ] getCurrentUser() replaces getServerSession()
- [ ] All validateApiAuth() calls removed
- [ ] assertPermission() called with correct permission constant
- [ ] All session.user.id replaced with user.id
- [ ] WorkspacePermissionError catch block added
- [ ] Activity logging added if needed
- [ ] No hardcoded permission literals (use WORKSPACE_PERMISSION)
- [ ] Route tested with unauthorized user (should 401)
- [ ] Route tested with unpermissioned user (should 403)
- [ ] Route tested with permissioned user (should succeed)

---

## Troubleshooting Migration Issues

### "workspaceId is undefined"

- Check URL params vs request body vs query string
- Verify workspace extraction happens before permission check
- Add console.log to debug

### "assertPermission doesn't recognize my permission"

- Check spelling against WORKSPACE_PERMISSION constants
- Verify using WORKSPACE_PERMISSION.X not string literal
- Look in workspace-permission-definitions.ts for exact constant names

### "Route still returns 401 for valid user"

- Verify getCurrentUser() is async and awaited
- Check user object has id property
- Verify authentication middleware configured in middleware.ts

### "Permission check doesn't throw error"

- assertPermission() always throws on denied
- Catch block should specifically catch WorkspacePermissionError
- Generic catch might be swallowing error

### "User is in workspace but getting 403"

- Check user has required permission (not just workspace member)
- Owner ≠ automatic all-permissions (unless in isOwner check)
- Verify normalizePermissions includes dependent permissions

---

## Related Documentation

- **Permission System Guide:** `PERMISSION_SYSTEM_GUIDE.md`
- **Refactored Routes Inventory:** `REFACTORED_ROUTES_INVENTORY.md`
- **Complete Implementation Summary:** `IMPLEMENTATION_COMPLETION_SUMMARY.md`
- **Permission Definitions Source:** `src/lib/workspace-permission-definitions.ts`
- **Permission Helpers Source:** `src/lib/workspace-permissions.ts`

---

**Last Updated:** 2026-02-17  
**Framework:** Next.js 14+  
**Complexity:** Medium (20-30 minutes per route)
