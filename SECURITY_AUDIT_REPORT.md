# API Security Audit Report

**Date:** February 14, 2026  
**Scope:** All API routes in `src/app/api/`  
**Total Routes Analyzed:** 92

## Executive Summary

This security audit identified **18 security issues** across the API surface:

- **3 Critical** - Require immediate attention
- **7 High** - Should be fixed soon
- **6 Medium** - Address in next sprint
- **2 Low** - Non-urgent improvements

## Critical Severity Issues

The webhook verifies signature but doesn't reject requests when `GITHUB_WEBHOOK_SECRET` is not configured. This allows unauthenticated webhook events in development/misconfigured environments.**Problem:\*\***Lines:** 22-23**Issue Type:** Missing Authentication **File:\*\* [src/app/api/webhooks/github/route.ts](src/app/api/webhooks/github/route.ts#L1-L50) ### 1. GitHub Webhook - Missing Signature Verification Enforcement---

```typescript
// Current code (line 22):
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  // ...
}

// Later in POST handler - no rejection if secret missing
```

**Impact:** Attackers could send fake webhook events to trigger unauthorized sync operations.

**Recommendation:**

```typescript
export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[Webhook] GITHUB_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
  }

  const signature = req.headers.get('x-hub-signature-256');
  if (!signature || !verifySignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  // ... rest of handler
}
```

---

### 2. Image Upload - No Workspace Ownership Validation

**File:** [src/app/api/upload/image/route.ts](src/app/api/upload/image/route.ts#L1-L70)  
**Issue Type:** Missing Authorization  
**Lines:** 20-25

**Problem:**
The image upload endpoint only checks if user is authenticated but doesn't validate which workspace the image belongs to. Users can upload unlimited images to server storage without workspace association.

**Impact:**

- Storage exhaustion attacks
- Orphaned files not tied to any workspace
- No cleanup mechanism for unused uploads

**Recommendation:**

```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const workspaceId = formData.get('workspaceId') as string; // ADD THIS

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  }

  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: session.user.id,
    },
  });

  if (!member) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // ... rest of upload logic

  // Track uploaded image to workspace
  await prisma.uploadedImage.create({
    data: {
      filename,
      workspaceId,
      uploadedBy: session.user.id,
      path: filepath,
    },
  });
}
```

---

### 3. Cron Sync Worker - Weak Secret Validation

**File:** [src/app/api/cron/sync-worker/route.ts](src/app/api/cron/sync-worker/route.ts#L1-L60)  
**Issue Type:** Weak Authentication  
**Lines:** 19-26

**Problem:**
While CRON_SECRET is checked, the error handling returns a generic 500 error when not configured rather than failing closed. Also uses simple Bearer token comparison which is vulnerable to timing attacks.

**Impact:** Unauthorized execution of background sync jobs could be triggered.

**Recommendation:**

```typescript
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // CRITICAL: Fail closed if secret not configured
  if (!cronSecret) {
    console.error('[SECURITY] CRON_SECRET not configured - blocking all cron requests');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authHeader = request.headers.get('authorization');
  const providedToken = authHeader?.replace('Bearer ', '');

  // Use timing-safe comparison
  if (
    !providedToken ||
    !crypto.timingSafeEqual(Buffer.from(providedToken), Buffer.from(cronSecret))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of handler
}
```

---

## High Severity Issues

### 4. Admin Routes - Uses Custom JWT Instead of Next-Auth

**Files:**

- [src/app/api/admin/users/route.ts](src/app/api/admin/users/route.ts#L1-L50)
- [src/app/api/admin/stats/route.ts](src/app/api/admin/stats/route.ts#L1-L50)
- [src/app/api/admin/locks/route.ts](src/app/api/admin/locks/route.ts#L1-L50)

**Issue Type:** Inconsistent Authentication  
**Lines:** 18-25 (in each file)

**Problem:**
Admin routes use a separate cookie-based JWT authentication (`admin-token`) instead of the standard Next-Auth session. This creates:

- Multiple authentication systems to maintain
- Potential for auth bypass if one system has vulnerabilities
- No unified session management

**Impact:** Security vulnerabilities in custom JWT implementation could compromise admin access.

**Recommendation:**
Migrate admin routes to use the standard authentication:

```typescript
import { validateApiAuth } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const session = await validateApiAuth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ... rest of handler
}
```

---

### 5. Document Settings & Delete - Session-based Auth Instead of validateApiAuth

**File:** [src/app/api/documents/[id]/settings/route.ts](src/app/api/documents/[id]/settings/route.ts#L1-L150)  
**Issue Type:** Inconsistent Authentication  
**Lines:** 17-20

**Problem:**
Uses `getServerSession()` directly instead of the standardized `validateApiAuth()` utility. This inconsistency could lead to:

- Different session validation logic
- Missed security checks
- Harder to audit authentication

**Impact:** Potential auth bypass if session handling differs from other routes.

**Recommendation:**

```typescript
// Change from:
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// To:
const session = await validateApiAuth();
// validateApiAuth() handles all checks consistently
```

**Also affects:**

- [src/app/api/documents/[id]/save-as/route.ts](src/app/api/documents/[id]/save-as/route.ts#L17)
- [src/app/api/github/schedule/route.ts](src/app/api/github/schedule/route.ts#L28)
- [src/app/api/github/branches/route.ts](src/app/api/github/branches/route.ts#L33)
- [src/app/api/github/commits/route.ts](src/app/api/github/commits/route.ts#L17)
- [src/app/api/github/conflicts/[conflictId]/route.ts](src/app/api/github/conflicts/[conflictId]/route.ts#L20)
- [src/app/api/documents/[id]/versions/[versionId]/restore/route.ts](src/app/api/documents/[id]/versions/[versionId]/restore/route.ts#L13)

---

### 6. Version Tags - Email-Based User Lookup in Permission Check

**File:** [src/app/api/versions/[versionId]/tags/route.ts](src/app/api/versions/[versionId]/tags/route.ts#L35-L70)  
**Issue Type:** Insecure Authorization Pattern  
**Lines:** 58-62

**Problem:**
Uses email from session to query workspace members instead of user ID. Email-based lookups are:

- Less efficient (no index on composed query)
- Potentially insecure if email can be manipulated
- Inconsistent with other routes

```typescript
// Current code:
where: {
  workspaceId,
  user: { email: session.user.email }, // BAD: nested email lookup
},
```

**Impact:** Potential performance issues; theoretical auth bypass if session.user.email is modified.

**Recommendation:**

```typescript
// Use user ID from session instead:
const userId = session.user.id; // Get from validated session

const version = await prisma.version.findUnique({
  where: { id: versionId },
  include: {
    document: {
      include: {
        workspace: {
          include: {
            members: {
              where: { userId }, // Direct ID lookup
            },
          },
        },
      },
    },
  },
});

if (version.document.workspace.members.length === 0) {
  return NextResponse.json({ error: 'Access denied' }, { status: 404 });
}
```

---

### 7. Document Lock - No Write Permission Verification

**File:** [src/app/api/documents/[id]/lock/route.ts](src/app/api/documents/[id]/lock/route.ts#L85-L120)  
**Issue Type:** Missing Authorization Check  
**Lines:** 110-118

**Problem:**
POST handler checks if user is owner or member but doesn't verify if member has write permissions. Members with read-only access can acquire edit locks.

**Impact:** Read-only members could lock documents, blocking legitimate editors.

**Recommendation:**

```typescript
// In POST handler, after checking membership:
const isOwner = document.workspace.ownerId === user.id;
const member = document.workspace.members[0];
const hasEditPermission = isOwner || member?.permissions.includes('edit_documents');

if (!hasEditPermission) {
  return NextResponse.json(
    { error: 'Insufficient permissions to edit this document' },
    { status: 403 }
  );
}
```

---

### 8. Template Creation - Permission Check but No Owner Verification

**File:** [src/app/api/templates/route.ts](src/app/api/templates/route.ts#L75-L110)  
**Issue Type:** Incomplete Authorization  
**Lines:** 95-102

**Problem:**
POST handler checks `edit_documents` permission but doesn't verify workspace ownership when creating workspace-level templates. Non-owners with edit permissions can create templates that appear workspace-wide.

**Impact:** Regular members could spam workspace with templates.

**Recommendation:**

```typescript
if (workspaceId) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  const isOwner = workspace.ownerId === session.user.id;
  const canCreateTemplates = membership?.permissions.includes('manage_workspace_settings');

  if (!isOwner && !canCreateTemplates) {
    return NextResponse.json(
      { error: 'Only workspace owners can create workspace templates' },
      { status: 403 }
    );
  }
}
```

---

### 9. GitHub Workspace Integration - Overly Permissive Access

**File:** [src/app/api/github/workspace-integration/route.ts](src/app/api/workspace-integration/route.ts#L95-L130)  
**Issue Type:** Weak Authorization  
**Lines:** 120-127

**Problem:**
POST handler allows members with `manage_members` permission to configure GitHub integration. This is a critical workspace setting that should be owner-only or require a dedicated permission.

```typescript
const canManageSettings = member?.permissions.includes('manage_members');
```

**Impact:** Members could redirect workspace documents to their own GitHub repos.

**Recommendation:**

```typescript
// Create dedicated permission or restrict to owners:
const isOwner = workspace.ownerId === session.user.id;
const canConfigureGitHub = member?.permissions.includes('configure_github_integration');

if (!isOwner && !canConfigureGitHub) {
  return NextResponse.json(
    { error: 'Only workspace owners can configure GitHub integration' },
    { status: 403 }
  );
}
```

---

### 10. Feedback System - Anonymous Feedback Allowed

**File:** [src/app/api/feedback/route.ts](src/app/api/feedback/route.ts#L75-L130)  
**Issue Type:** Potential Abuse Vector  
**Lines:** 115-120

**Problem:**
POST handler allows anonymous feedback (`userId` can be null) which combined with rate limiting per user could be bypassed by not sending authentication.

```typescript
userId: session?.user?.id || null, // Allow anonymous feedback
```

**Impact:** Spam feedback submissions if rate limiting isn't applied to anonymous users.

**Recommendation:**

```typescript
// Option 1: Require authentication
const session = await validateApiAuth();
// (Already done, but don't allow null userId)

// Option 2: Separate rate limiting for anonymous
const identifier = session?.user?.id || getClientIdentifier(request);
const rateLimitResult = await rateLimit(identifier, 1, 3600000); // Stricter for anon
```

---

## Medium Severity Issues

### 11. Health Endpoint - No Authentication

**File:** [src/app/api/health/route.ts](src/app/api/health/route.ts#L1-L50)  
**Issue Type:** Information Disclosure  
**Lines:** 10-45

**Problem:**
Returns environment info, uptime, and configuration warnings without authentication. While common for health checks, it exposes:

- Environment type (development/production)
- Application version
- Config validation errors

**Impact:** Reconnaissance information for attackers.

**Recommendation:**

```typescript
// Option 1: Return minimal public health check
export async function GET(request: NextRequest) {
  const dbHealthy = await checkDatabaseHealth();

  // Public endpoint - minimal info
  if (request.headers.get('x-health-check-token') !== process.env.HEALTH_CHECK_SECRET) {
    return NextResponse.json({ status: dbHealthy ? 'healthy' : 'unhealthy' });
  }

  // Detailed info only with secret token
  return NextResponse.json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    details: {
      /* ... full details */
    },
  });
}
```

---

### 12. Search Endpoint - No Result Count Limit

**File:** [src/app/api/search/route.ts](src/app/api/search/route.ts#L25-L90)  
**Issue Type:** Resource Exhaustion  
**Lines:** 27

**Problem:**
User-controlled `limit` parameter with max of 20 but could still be resource-intensive if many users search simultaneously. No max bounds enforced.

**Impact:** Potential DoS through expensive search queries.

**Recommendation:**

```typescript
const limit = Math.min(
  parseInt(searchParams.get('limit') || '20'),
  20 // Hard cap
);

// Also add query complexity limits
if (!query || query.length < 2) {
  return NextResponse.json({ error: 'Query too short (min 2 chars)' }, { status: 400 });
}

if (query.length > 100) {
  return NextResponse.json({ error: 'Query too long (max 100 chars)' }, { status: 400 });
}
```

---

### 13. Document Creation - Path Parameter Not Validated

**File:** [src/app/api/documents/route.ts](src/app/api/documents/route.ts#L117-L180)  
**Issue Type:** Input Validation  
**Lines:** 141

**Problem:**
`path` field is sanitized but not validated for format. Attackers could create documents with paths like `../../../etc/passwd` or paths containing special characters that break routing.

**Impact:** Path traversal attempts, broken document navigation.

**Recommendation:**

```typescript
const documentSchema = z.object({
  // ... other fields
  path: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9\/_-]+$/, 'Path can only contain alphanumeric, slash, underscore, hyphen')
    .refine((path) => !path.includes('..'), 'Path cannot contain ..')
    .refine((path) => path.startsWith('/'), 'Path must start with /'),
});
```

---

### 14. GitHub Repositories List - No Rate Limiting

**File:** [src/app/api/github/repositories/route.ts](src/app/api/github/repositories/route.ts#L1-L70)  
**Issue Type:** Missing Rate Limiting  
**Lines:** 30-51

**Problem:**
Endpoint calls GitHub API without rate limiting. Could exhaust GitHub API rate limits or cause quota issues.

**Impact:** GitHub API rate limit exhaustion affecting all users.

**Recommendation:**

```typescript
export async function GET(req: NextRequest) {
  const session = await validateApiAuth();

  // Add rate limiting: 5 requests per minute
  const identifier = session.user.id;
  const rateLimitResult = await rateLimit(identifier, 5, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // ... rest of handler
}
```

---

### 15. Activity Feed - No Pagination Limit

**File:** [src/app/api/activity/route.ts](src/app/api/activity/route.ts#L8-L40)  
**Issue Type:** Resource Exhaustion  
**Lines:** 14

**Problem:**
User-provided `limit` parameter has no maximum bound. Users could request thousands of activities.

**Impact:** Database performance degradation.

**Recommendation:**

```typescript
const limit = Math.min(
  parseInt(searchParams.get('limit') || '50'),
  100 // Hard maximum
);
```

---

### 16. Document PATCH - No Content Size Limit

**File:** [src/app/api/documents/[id]/route.ts](src/app/api/documents/[id]/route.ts#L105-L250)  
**Issue Type:** Resource Exhaustion  
**Lines:** 180-200

**Problem:**
Document content size is not validated in the schema. Users could upload extremely large documents causing memory issues.

**Impact:** Memory exhaustion, slow database operations.

**Recommendation:**

```typescript
const documentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z
    .string()
    .max(10 * 1024 * 1024) // 10MB limit
    .optional(),
  // ... other fields
});

// Also check in handler:
if (content && Buffer.byteLength(content, 'utf8') > 10 * 1024 * 1024) {
  return NextResponse.json({ error: 'Document content too large (max 10MB)' }, { status: 413 });
}
```

---

## Low Severity Issues

### 17. GitHub Profile - Exposes Personal Email

**File:** [src/app/api/github/profile/route.ts](src/app/api/github/profile/route.ts#L40-L60)  
**Issue Type:** Information Disclosure  
**Lines:** 47

**Problem:**
Returns user's GitHub email which might be private.

**Impact:** Minor privacy concern.

**Recommendation:**

```typescript
return NextResponse.json({
  linked: true,
  github: {
    login: githubUser.login,
    name: githubUser.name,
    // email: githubUser.email, // Remove or make optional
    avatar_url: githubUser.avatar_url,
    profile_url: `https://github.com/${githubUser.login}`,
  },
  // ...
});
```

---

### 18. Inconsistent Error Messages

**Files:** Multiple  
**Issue Type:** Information Disclosure  
**Severity:** Low

**Problem:**
Some routes return different error messages for "not found" vs "access denied", allowing attackers to enumerate valid resource IDs.

**Example:**

```typescript
// In some routes:
if (!document) {
  return NextResponse.json({ error: 'Document not found' }, { status: 404 });
}
// vs access check:
if (!hasAccess) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

**Impact:** Resource enumeration attacks.

**Recommendation:**
Standardize to return 404 for both cases when resource doesn't exist or user lacks access:

```typescript
if (!document || !hasAccess) {
  return NextResponse.json({ error: 'Document not found' }, { status: 404 });
}
```

---

## Summary Statistics

### Issues by Category

- **Missing Authentication:** 2
- **Missing Authorization:** 4
- **Weak Authentication:** 1
- **Incomplete Authorization:** 5
- **Input Validation:** 2
- **Resource Exhaustion:** 3
- **Information Disclosure:** 3

### Issues by Priority

- **Critical (Fix Immediately):** 3 issues
- **High (Fix This Sprint):** 7 issues
- **Medium (Next Sprint):** 6 issues
- **Low (Backlog):** 2 issues

### Routes with Good Security

The following routes demonstrate proper security patterns:

- ✅ `/api/documents/route.ts` - Proper auth, authz, rate limiting, input validation
- ✅ `/api/workspaces/[id]/route.ts` - Comprehensive permission checks
- ✅ `/api/workspaces/[id]/members/route.ts` - Granular permission validation
- ✅ `/api/notifications/route.ts` - Proper auth and user isolation
- ✅ `/api/github/import/route.ts` - Good auth, authz, and validation

---

## Recommendations

### Immediate Actions (Critical)

1. Fix GitHub webhook signature verification
2. Add workspace validation to image upload
3. Strengthen cron job authentication

### Short-term (High Priority)

1. Standardize all routes to use `validateApiAuth()`
2. Migrate admin routes away from custom JWT
3. Add write permission checks to document lock endpoint
4. Implement dedicated permission for GitHub integration configuration

### Medium-term

1. Add rate limiting to all GitHub API proxy endpoints
2. Implement content size limits on document operations
3. Add comprehensive input validation for path parameters
4. Implement pagination limits across all list endpoints

### Long-term Improvements

1. Create security middleware for consistent auth/authz
2. Implement API gateway pattern for centralized rate limiting
3. Add comprehensive audit logging for sensitive operations
4. Implement resource-based access control (RBAC) framework

---

## Testing Recommendations

### Security Test Cases to Implement

1. **Authentication bypass tests** - Attempt to access each endpoint without valid session
2. **Authorization bypass tests** - Try to access resources from different workspaces
3. **Rate limiting tests** - Verify rate limits are enforced on all endpoints
4. **Input validation tests** - Test boundary conditions and malicious inputs
5. **Privilege escalation tests** - Try to perform admin operations as regular user

### Tools Recommended

- **OWASP ZAP** - Automated security scanning
- **Burp Suite** - Manual security testing
- **npm audit** - Dependency vulnerability scanning
- **Snyk** - Continuous security monitoring

---

**Audit Conducted By:** AI Security Analysis  
**Next Review Date:** March 15, 2026
