# Critical Questions & Architectural Decisions

**Date:** February 13, 2026  
**Document Type:** Critical Architecture & Business Decisions  
**Purpose:** Answer make-or-break questions about data ownership, security, and system design

---

## 1) THE MOST IMPORTANT QUESTION: Data Ownership

### Q1. Who owns the content?

**Current Implementation:**

ownerId String // Workspace owner id String @id @default(cuid())model Workspace {```prisma

documents Document[]

owner User @relation(fields: [ownerId], references: [id])
}

model Document {
workspaceId String
authorId String // Document creator

workspace Workspace @relation(fields: [workspaceId])
author User @relation(fields: [authorId])
}

````

**Answer:** **Workspace Owner owns all content**

**What this means:**

- Content belongs to the **workspace**, not individual users
- Document `authorId` tracks who created it, but workspace owner controls it
- Similar to GitHub repos: repo owner controls, contributors create

### User Leaves Workspace - What Happens?

**Current Behavior:**

```typescript
// When user leaves workspace
await prisma.workspaceMember.delete({
  where: { id: memberId }
});

// Documents remain in workspace
// User loses access immediately
// Documents authored by leaving user stay in workspace
````

**Answer:** ✅ **User LOSES access, but documents REMAIN in workspace**

**Implications:**

- **Good for business:** Companies retain knowledge when employees leave
- **Bad for solo users:** If kicked from workspace, lose access to own work
- **Recommendation:** Add "export my documents" option before leaving

### Workspace Deletion - Cascade or Soft Delete?

**Current Implementation:** ⚠️ **Hard delete (DANGEROUS!)**

```prisma
model Workspace {
  id        String @id @default(cuid())
  documents Document[] // No onDelete cascade specified
}

// Default Prisma behavior: RESTRICT (prevents deletion if documents exist)
// But if manually implemented, could be hard delete
```

**Recommended Implementation:**

```prisma
model Workspace {
  id          String    @id @default(cuid())
  deletedAt   DateTime? // Soft delete
  deletedBy   String?

  documents   Document[] // Keep relation
}

model Document {
  workspaceId String
  deletedAt   DateTime? // Soft delete

  workspace   Workspace @relation(fields: [workspaceId], onDelete: Restrict)
}
```

**Soft Delete Strategy:**

1. **Immediate:** Mark workspace as `deletedAt = now()`
2. **Grace Period:** 30 days to restore
3. **Final Delete:** Nightly job purges after 30 days
4. **User Notice:** Email warning before permanent deletion

**Answer:** 🚨 **CRITICAL FIX NEEDED - Implement soft deletes**

### Export/Backup for Legal Trust

**Current Status:** ❌ **No export functionality**

**Must-Have Features (Legal Compliance):**

1. **Export All Data (GDPR Right to Data Portability)**

   ```typescript
   async function exportWorkspaceData(workspaceId: string) {
     const workspace = await prisma.workspace.findUnique({
       include: {
         documents: {
           include: {
             versions: true,
             comments: true,
           },
         },
         members: true,
       },
     });

     return {
       format: 'JSON',
       workspace: workspace,
       exportedAt: new Date(),
       exportedBy: userId,
     };
   }
   ```

2. **Backup Options:**
   - **JSON archive** (complete data)
   - **Markdown folder** (readable format)
   - **Git repository** (with version history)

3. **Automated Backups (Enterprise):**
   - Daily workspace snapshots
   - 90-day retention
   - Downloadable anytime

**Recommendation:** ✅ **Add export before MVP launch** (trust builder)

**Timeline:** 2-3 weeks implementation

---

## 2) GitHub Sync: Truth Check (MVP Killer Risk)

### Q2. What exactly is synced with GitHub?

**Current Implementation:**

```prisma
model Document {
  id               String  @id @default(cuid())
  githubRepository String? // e.g., "user/repo"
  githubBranch     String? // e.g., "main"
  githubPath       String? // e.g., "docs/api/users.md"
  syncStatus       String? // "synced", "pending", "error"
  lastSyncedAt     DateTime?
  autoSync         Boolean @default(false)
}
```

**Answer:** **Per-document sync** (NOT workspace-level)

**How it works:**

1. User connects GitHub account (OAuth)
2. User selects **individual document** to sync
3. User specifies:
   - Repository: `owner/repo`
   - Branch: `main` or `develop`
   - Path: `docs/getting-started.md`
4. On save, document syncs to that specific file

**Sync Direction:**

```
┌──────────────┐         Push          ┌──────────────┐
│   Document   │ ──────────────────>   │  GitHub .md  │
│   (App DB)   │                       │    File      │
│              │ <──────────────────   │              │
└──────────────┘         Pull          └──────────────┘
```

**What syncs:**

- ✅ Document content (converted to Markdown)
- ✅ Commit message (from version save)
- ❌ Comments (not synced)
- ❌ Metadata (not synced)
- ❌ Version history (GitHub has its own)

**What's NOT possible currently:**

- ❌ Bulk sync entire workspace
- ❌ Auto-detect folder structure
- ❌ Sync multiple docs at once
- ❌ Bidirectional auto-sync (only manual)

### Q3. What happens if 2 docs share same githubPath accidentally?

**Current Schema:**

```prisma
model Document {
  githubPath String? // NO UNIQUE CONSTRAINT!
}
```

**Scenario:**

```typescript
// Document A
{
  id: "doc1",
  title: "Users API",
  githubPath: "docs/api/users.md"
}

// Document B (accidentally same path!)
{
  id: "doc2",
  title: "Users Guide",
  githubPath: "docs/api/users.md"
}
```

**What Happens:** 🚨 **LAST WRITE WINS** (Data loss risk!)

```typescript
// User saves Doc A → Commits to docs/api/users.md
// User saves Doc B → Overwrites docs/api/users.md
// Doc A content is lost on GitHub!
```

**Why This Happens:**

- No validation preventing duplicate paths
- Each document syncs independently
- No conflict detection

**CRITICAL FIX NEEDED:**

```prisma
model Document {
  githubRepository String?
  githubBranch     String?
  githubPath       String?

  // Add unique constraint per workspace
  @@unique([workspaceId, githubRepository, githubBranch, githubPath],
           name: "unique_github_path_per_workspace")
}
```

**Validation on Save:**

```typescript
async function validateGitHubPath(doc: Document) {
  const conflict = await prisma.document.findFirst({
    where: {
      workspaceId: doc.workspaceId,
      githubRepository: doc.githubRepository,
      githubBranch: doc.githubBranch,
      githubPath: doc.githubPath,
      id: { not: doc.id }, // Exclude current doc
    },
  });

  if (conflict) {
    throw new Error(
      `Path ${doc.githubPath} already synced by "${conflict.title}". ` +
        `Choose a different path or unlink the other document.`
    );
  }
}
```

**Answer:** 🚨 **HIGH PRIORITY BUG - Add unique constraint NOW**

### Q4. Do you sync images to GitHub too?

**Current Implementation:** ❌ **Images NOT synced to GitHub**

**How Images Work:**

1. **In App:** Images stored as base64 in HTML content

   ```html
   <img src="data:image/png;base64,iVBORw0KG..." />
   ```

2. **When Syncing to GitHub:**

   ```typescript
   // Conversion: HTML → Markdown
   const turndown = new TurndownService();
   const markdown = turndown.turndown(htmlContent);

   // Result for images:
   ![Image](data:image/png;base64,iVBORw0KG...) // BROKEN!
   ```

3. **GitHub Displays:** ❌ Broken images (base64 URLs don't work in GitHub markdown)

**Recommended Solution:**

```typescript
async function syncDocumentToGitHub(document: Document) {
  // 1. Extract images from content
  const images = extractBase64Images(document.content);

  // 2. Upload each image to GitHub
  const imageMapping = {};
  for (const img of images) {
    const imagePath = `docs/assets/${document.id}/${img.filename}`;

    // Upload to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: `Add image for ${document.title}`,
      content: img.base64Data,
    });

    // Map old base64 URL to new GitHub URL
    imageMapping[img.base64Url] = `./assets/${document.id}/${img.filename}`;
  }

  // 3. Replace image URLs in markdown
  let markdown = convertToMarkdown(document.content);
  for (const [oldUrl, newUrl] of Object.entries(imageMapping)) {
    markdown = markdown.replace(oldUrl, newUrl);
  }

  // 4. Commit markdown file
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: document.githubPath,
    message: document.commitMessage,
    content: Buffer.from(markdown).toString('base64'),
  });
}
```

**Folder Structure on GitHub:**

```
docs/
├── api/
│   └── users.md
├── guides/
│   └── setup.md
└── assets/
    ├── doc-abc123/
    │   ├── screenshot1.png
    │   └── diagram.png
    └── doc-xyz789/
        └── logo.png
```

**Challenges:**

- Image deduplication (same image in multiple docs)
- Large images (GitHub file size limits)
- Image updates (need versioning)
- Cleanup (orphaned images when doc deleted)

**Answer:** ⚠️ **Images currently NOT synced** (GitHub will show broken images)

**Priority:** Medium (needed for full GitHub integration)

**Timeline:** 3-4 weeks implementation

---

## 3) Editor Format Decision (This will affect everything)

### Q5. Are you willing to migrate soon?

**Current Implementation:**

```typescript
// document-editor.tsx
const handleSave = async () => {
  const htmlContent = editor.getHTML(); // HTML string

  await updateDocument({
    content: htmlContent, // Stored as HTML
  });
};
```

**Storage in Database:**

```sql
-- Document.content column
<p>This is a paragraph with <strong>bold</strong> text and a <a href="...">link</a>.</p>
<h2>Heading</h2>
<ul><li>List item</li></ul>
```

### Migration Decision Matrix

| Factor            | Keep HTML             | Switch to JSON Now   | Switch to JSON Later    |
| ----------------- | --------------------- | -------------------- | ----------------------- |
| **Effort**        | ✅ Zero               | ⚠️ 2-3 weeks         | 🔴 1-2 months (painful) |
| **Version Diffs** | 🔴 Noisy HTML         | ✅ Clean JSON        | ✅ Clean JSON           |
| **Portability**   | 🔴 TipTap-specific    | ✅ Editor-agnostic   | ✅ Editor-agnostic      |
| **GitHub Sync**   | ⚠️ Complex conversion | ✅ Easier            | ✅ Easier               |
| **Risk**          | ✅ None (works now)   | ⚠️ Migration bugs    | 🔴 Breaking changes     |
| **Search**        | 🔴 Hard to parse      | ✅ Structured search | ✅ Structured search    |

### Recommendation: **Hybrid Approach** (Best of Both Worlds)

**Phase 1 (Immediate - Next 2 weeks):**

```prisma
model Document {
  id          String  @id @default(cuid())
  content     String  // Keep HTML (backward compat)
  contentJson String? // Add new JSON field
  // ...
}
```

**Phase 2 (Migration - Weeks 3-4):**

```typescript
// Save both formats
const handleSave = async () => {
  const htmlContent = editor.getHTML();
  const jsonContent = JSON.stringify(editor.getJSON());

  await updateDocument({
    content: htmlContent, // For rendering (fallback)
    contentJson: jsonContent, // For processing (primary)
  });
};
```

**Phase 3 (Gradual Switchover - Month 2-3):**

1. **Weeks 1-2:** Save both HTML + JSON on every edit
2. **Weeks 3-4:** Update all reads to prefer JSON
3. **Weeks 5-6:** Update diff generation to use JSON
4. **Weeks 7-8:** Update search to use JSON
5. **Month 3:** Mark `content` (HTML) as deprecated

**Phase 4 (Later - Month 4+):**

- Drop HTML column entirely
- Use `contentJson` as sole source of truth

### Answer: **Start JSON migration in 1 month** (after MVP launch stability)

**Rationale:**

1. **MVP First:** Don't risk delays with migration bugs
2. **Parallel Storage:** Store both formats to de-risk migration
3. **Gradual Rollout:** Switch features one-by-one
4. **Rollback Safety:** Keep HTML as fallback during migration

**Timeline:**

```
Now (Week 0): Current HTML-only ✅
Week 2-4:      Add JSON field + parallel saves
Week 5-8:      Switch reads to JSON
Week 9-12:     Update diffs, search, GitHub sync to JSON
Month 4+:      Remove HTML field (optional)
```

---

## 4) Version Control Storage Explosion

### Q6. Are you tracking document size growth?

**Current Implementation:** ❌ **No tracking at all**

```prisma
model Document {
  content String // TEXT field (no size tracking)
}

model DocumentVersion {
  content String // Full snapshot (no size tracking)
  diff    String? // Diff (no size tracking)
}
```

**Realistic Scenario:**

```typescript
// Document: 500KB content
// User makes 200 versions over 6 months

// Storage calculation:
500KB × 200 versions = 100MB per document! 🔥

// For 1000 active documents:
100MB × 1000 = 100GB just for versions!

// PostgreSQL costs (Neon):
// Free tier: 512MB (only 5 docs with 200 versions!)
// Pro tier: 10GB = $20/month (100 documents)
// At 100GB: $200-300/month JUST FOR STORAGE
```

**CRITICAL: This is a COST BOMB** 💣

### Storage Tracking Implementation

**Add Size Tracking:**

```prisma
model Document {
  content     String
  contentSize Int? // Bytes
  totalSize   Int? // Including all versions
}

model DocumentVersion {
  content      String
  contentSize  Int?      // Snapshot size
  diff         String?
  diffSize     Int?      // Diff size
  compressed   Boolean   @default(false)
}
```

**Track on Save:**

```typescript
async function createVersion(document: Document, newContent: string) {
  const contentSize = Buffer.byteLength(newContent, 'utf8');
  const diff = generateDiff(document.content, newContent);
  const diffSize = Buffer.byteLength(diff, 'utf8');

  // Alert if document is getting too large
  if (contentSize > 5 * 1024 * 1024) {
    // 5MB
    throw new Error('Document exceeds maximum size (5MB)');
  }

  await prisma.documentVersion.create({
    data: {
      content: newContent,
      contentSize,
      diff,
      diffSize,
      // ...
    },
  });
}
```

### Compression Strategy

**Q6b. Do you plan to compress snapshots too (gzip)? Or only compress diffs?**

**Answer:** **Both, with different strategies**

#### Strategy 1: Compress OLD Versions (Archive)

```typescript
import zlib from 'zlib';

// After version is saved, compress old versions
async function compressOldVersions(documentId: string) {
  const oldVersions = await prisma.documentVersion.findMany({
    where: {
      documentId,
      createdAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
      },
      compressed: false,
    },
  });

  for (const version of oldVersions) {
    // Compress snapshot
    const compressedContent = zlib.gzipSync(version.content).toString('base64');

    // Compress diff
    const compressedDiff = version.diff ? zlib.gzipSync(version.diff).toString('base64') : null;

    await prisma.documentVersion.update({
      where: { id: version.id },
      data: {
        content: compressedContent,
        diff: compressedDiff,
        compressed: true,
        contentSize: Buffer.byteLength(compressedContent, 'base64'),
        diffSize: compressedDiff ? Buffer.byteLength(compressedDiff, 'base64') : null,
      },
    });
  }
}
```

**Compression Rates (Typical):**

```
Plain Text:  100KB → 15-20KB  (80-85% reduction)
HTML:        100KB → 20-25KB  (75-80% reduction)
JSON:        100KB → 25-30KB  (70-75% reduction)
Diff:        10KB  → 2-3KB    (70-80% reduction)
```

**Storage Comparison:**

```
WITHOUT Compression:
500KB doc × 200 versions = 100MB

WITH Compression (80% reduction):
500KB × 1 (current) + 100KB × 199 (compressed old) = 20MB

Savings: 80MB per document! 🎉
```

#### Strategy 2: Tiered Compression

```typescript
// Compression tiers
const COMPRESSION_TIERS = {
  HOT: {
    age: 0, // Current version
    compress: false,
    storage: 'primary-db',
  },
  WARM: {
    age: 7, // 7 days old
    compress: true, // gzip
    storage: 'primary-db',
  },
  COLD: {
    age: 90, // 90 days old
    compress: true, // gzip
    storage: 's3-glacier', // Move to cheap storage
  },
  FROZEN: {
    age: 365, // 1 year old
    compress: true,
    storage: 's3-glacier-deep-archive', // $1 per TB/month!
  },
};
```

**Answer:** ✅ **Compress BOTH snapshots and diffs** (tiered strategy)

**Implementation Priority:** 🔥 **HIGH - Do before MVP launch**

**Cost Impact:**

```
Without compression: $300/month DB storage at 100GB
With compression:    $60/month DB + $5/month S3
Savings: $235/month (78% reduction!)
```

---

## 5) Security: The Real SaaS Essentials

### Q7. Are you storing IP address/user agent anywhere right now?

**Current Implementation:** ❌ **Not stored at all**

**What's Missing:**

```prisma
// No audit logging
// No IP tracking
// No device tracking
// No login history
```

**Why This Matters:**

1. **Security Incidents:**
   - "Someone accessed my account from Russia" → No way to verify
   - "I was hacked" → No logs to investigate
2. **Compliance (GDPR/SOC2):**
   - Need to show "who accessed what, when, from where"
   - Required for enterprise sales
3. **User Trust:**
   - "Active Sessions" page (like GitHub)
   - "Unusual activity" alerts

### Implementation: Auth Events Logging

```prisma
model AuthEvent {
  id          String   @id @default(cuid())
  userId      String?
  email       String?
  event       AuthEventType
  success     Boolean
  ipAddress   String?
  userAgent   String?
  location    String?  // Parsed from IP (country/city)
  metadata    Json?    // Additional context
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([ipAddress])
  @@index([success, createdAt])
}

enum AuthEventType {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  PASSWORD_CHANGED
  EMAIL_CHANGED
  GITHUB_LINKED
  GITHUB_UNLINKED
  SESSION_EXPIRED
  SUSPICIOUS_ACTIVITY
}
```

**Capture on Login:**

```typescript
import { headers } from 'next/headers';

async function logAuthEvent(event: AuthEventType, userId: string | null, success: boolean) {
  const headersList = headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  // Optional: Lookup location from IP
  const location = await getLocationFromIP(ipAddress);

  await prisma.authEvent.create({
    data: {
      userId,
      event,
      success,
      ipAddress,
      userAgent,
      location,
    },
  });
}

// In login handler
async function handleLogin(email: string, password: string) {
  const user = await authenticate(email, password);

  if (user) {
    await logAuthEvent('LOGIN_SUCCESS', user.id, true);
    return user;
  } else {
    await logAuthEvent('LOGIN_FAILED', null, false);
    throw new Error('Invalid credentials');
  }
}
```

**Answer:** ❌ **Not currently tracked** → ✅ **Add before Team plan launch**

### Q8. Do you want a "workspace audit log" visible in UI?

**Answer:** ✅ **YES** - Essential for Team/Enterprise plans

**What to Track:**

```prisma
model WorkspaceAuditLog {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  action      AuditAction
  resourceType String  // "document", "member", "settings"
  resourceId   String?
  details     Json?    // Action-specific data
  ipAddress   String?
  createdAt   DateTime @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  user        User      @relation(fields: [userId], references: [id])

  @@index([workspaceId, createdAt])
  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
}

enum AuditAction {
  // Documents
  DOCUMENT_CREATED
  DOCUMENT_EDITED
  DOCUMENT_DELETED
  DOCUMENT_RESTORED
  DOCUMENT_EXPORTED
  VERSION_CREATED
  VERSION_RESTORED

  // Members
  MEMBER_INVITED
  MEMBER_JOINED
  MEMBER_REMOVED
  MEMBER_ROLE_CHANGED
  PERMISSIONS_UPDATED

  // GitHub
  GITHUB_SYNC_STARTED
  GITHUB_SYNC_COMPLETED
  GITHUB_SYNC_FAILED

  // Settings
  WORKSPACE_RENAMED
  WORKSPACE_SETTINGS_CHANGED
  WORKSPACE_DELETED
}
```

**Capture Example:**

```typescript
async function deleteDocument(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  // Delete document
  await prisma.document.delete({
    where: { id: documentId },
  });

  // Log audit event
  await prisma.workspaceAuditLog.create({
    data: {
      workspaceId: document.workspaceId,
      userId,
      action: 'DOCUMENT_DELETED',
      resourceType: 'document',
      resourceId: documentId,
      details: {
        documentTitle: document.title,
        documentPath: document.path,
      },
    },
  });
}
```

**UI Component:**

```tsx
function AuditLogPage({ workspaceId }: { workspaceId: string }) {
  const logs = useAuditLogs(workspaceId);

  return (
    <div className="audit-log">
      <h2>Workspace Activity</h2>
      {logs.map((log) => (
        <div key={log.id} className="audit-entry">
          <Avatar user={log.user} />
          <div>
            <strong>{log.user.name}</strong> {formatAction(log.action)}
            {log.resourceType && (
              <span>
                {' '}
                on <code>{log.resourceId}</code>
              </span>
            )}
          </div>
          <time>{formatTime(log.createdAt)}</time>
        </div>
      ))}
    </div>
  );
}

// Example output:
// 👤 John Doe deleted document "API Documentation" • 2 hours ago
// 👤 Jane Smith invited member "bob@example.com" • Yesterday
// 🔄 GitHub sync completed for "README.md" • 3 days ago
```

**Answer:** ✅ **Implement workspace audit logs** (Team plan feature)

**Timeline:** 2-3 weeks

**Business Value:**

- **Compliance:** Required for SOC2, ISO 27001
- **Trust:** Transparency builds confidence
- **Debugging:** Helps investigate issues
- **Pricing:** Justify Team/Enterprise pricing

---

## 6) Multi-Tenancy & Billing Reality

### Q9. Do you want billing at: workspace level? organization level? user subscription level?

**Options Comparison:**

#### Option 1: User-Level Subscription (Simpler)

```prisma
model User {
  id              String   @id @default(cuid())
  subscriptionId  String?  // Stripe subscription ID
  plan            Plan     @default(FREE)
  planExpiry      DateTime?

  // User owns workspaces
  workspaces      Workspace[] // As owner
}

enum Plan {
  FREE       // 1 workspace, 3 collaborators
  PRO        // Unlimited workspaces, 10 collabs each
  TEAM       // Everything + advanced features
}
```

**How it works:**

- User subscribes to Pro ($12/month)
- User can create unlimited workspaces
- Each workspace inherits user's plan
- Collaborators are "free riders" (use workspace, don't pay)

**Pros:**

- ✅ Simple implementation
- ✅ Easy to understand for users
- ✅ Good for solo users / small teams

**Cons:**

- ❌ Unfair: 1 Pro user, 50 free riders
- ❌ Hard to scale revenue
- ❌ Workspace ownership tied to person (what if they leave company?)

#### Option 2: Workspace-Level Subscription (Recommended)

```prisma
model Workspace {
  id              String   @id @default(cuid())
  ownerId         String
  subscriptionId  String?  // Stripe subscription ID
  plan            Plan     @default(FREE)
  seatCount       Int      @default(1)
  seatPrice       Int      @default(12) // $12 per seat
  billingEmail    String?

  owner           User     @relation(fields: [ownerId])
  members         WorkspaceMember[]
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  isPaidSeat  Boolean  @default(false) // Counts toward billing
}
```

**How it works:**

- Workspace owner subscribes
- Plans based on # of members:
  - Free: 1-3 members ($0)
  - Pro: 4-10 members ($12/member/month)
  - Team: 11+ members ($20/member/month)
- Owner pays monthly invoice
- Members don't need subscriptions

**Pros:**

- ✅ Fair pricing (pay per user)
- ✅ Scalable revenue
- ✅ Workspace owned by entity, not person
- ✅ Industry standard (like GitHub Teams, Notion)

**Cons:**

- ⚠️ More complex implementation
- ⚠️ Need seat management UI

#### Option 3: Organization-Level (Enterprise)

```prisma
model Organization {
  id             String   @id @default(cuid())
  name           String
  subscriptionId String?
  plan           Plan     @default(ENTERPRISE)
  seatCount      Int

  workspaces     Workspace[]  // Multiple workspaces per org
  members        OrganizationMember[]
}

model OrganizationMember {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
}
```

**How it works:**

- Company creates organization
- Purchases X seats (e.g., 50 seats for $800/month)
- Members can create unlimited workspaces
- Billing at org level

**Pros:**

- ✅ Best for enterprises
- ✅ Centralized billing
- ✅ Highest revenue potential

**Cons:**

- ❌ Overkill for MVP
- ❌ Complex implementation
- ❌ Not needed until Enterprise sales

### RECOMMENDATION: **Hybrid Approach**

```
Phase 1 (MVP): User-level subscription
├─ Simple to implement
├─ Good for solo users
└─ Launch fast

Phase 2 (6 months): Add workspace-level billing
├─ Migrate Pro users to workspace model
├─ Introduce seat-based pricing
└─ Scale revenue

Phase 3 (12 months): Add organization tier
├─ Target enterprises
├─ Custom pricing
└─ Advanced features
```

**Answer:** Start with **Workspace-level billing** (skip user-level to avoid migration pain later)

### Q10. Are you planning to integrate Stripe soon?

**Answer:** ✅ **Yes, before public launch** (required for paid plans)

**Timeline:**

- **Week 1-2:** Set up Stripe account, test mode
- **Week 3-4:** Implement subscription flow
- **Week 5:** Add billing portal
- **Week 6:** Test with beta users

**What to Implement:**

1. **Subscription Creation**

   ```typescript
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

   async function createSubscription(workspaceId: string, plan: Plan) {
     const subscription = await stripe.subscriptions.create({
       customer: workspace.stripeCustomerId,
       items: [
         {
           price: PRICE_IDS[plan], // Pro: price_xxx
         },
       ],
       metadata: {
         workspaceId,
       },
     });

     await prisma.workspace.update({
       where: { id: workspaceId },
       data: {
         subscriptionId: subscription.id,
         plan,
       },
     });
   }
   ```

2. **Webhook Handler** (CRITICAL)

   ```typescript
   // POST /api/webhooks/stripe
   export async function POST(req: Request) {
     const sig = req.headers.get('stripe-signature');
     const event = stripe.webhooks.constructEvent(
       await req.text(),
       sig,
       process.env.STRIPE_WEBHOOK_SECRET
     );

     switch (event.type) {
       case 'customer.subscription.created':
         await handleSubscriptionCreated(event.data.object);
         break;
       case 'customer.subscription.deleted':
         await handleSubscriptionCanceled(event.data.object);
         break;
       case 'invoice.payment_failed':
         await handlePaymentFailed(event.data.object);
         break;
     }

     return Response.json({ received: true });
   }
   ```

3. **Billing Portal**
   ```typescript
   async function openBillingPortal(workspaceId: string) {
     const workspace = await prisma.workspace.findUnique({
       where: { id: workspaceId },
     });

     const session = await stripe.billingPortal.sessions.create({
       customer: workspace.stripeCustomerId,
       return_url: `${process.env.NEXTAUTH_URL}/dashboard/${workspaceId}/settings/billing`,
     });

     redirect(session.url);
   }
   ```

**Pricing Structure (Recommended):**

```typescript
const PRICING = {
  FREE: {
    price: 0,
    workspaces: 1,
    membersPerWorkspace: 3,
    documents: 100,
    versionsPerDoc: 10,
  },
  PRO: {
    price: 12, // per member per month
    workspaces: 'unlimited',
    membersPerWorkspace: 10,
    documents: 'unlimited',
    versionsPerDoc: 50,
    githubSync: true,
  },
  TEAM: {
    price: 20, // per member per month
    everything: 'PRO',
    membersPerWorkspace: 'unlimited',
    versionsPerDoc: 'unlimited',
    advancedPermissions: true,
    auditLogs: true,
    prioritySupport: true,
  },
  ENTERPRISE: {
    price: 'custom',
    everything: 'TEAM',
    selfHosted: 'optional',
    sso: true,
    sla: true,
    dedicatedSupport: true,
  },
};
```

---

## 7) Permissions Model: Potential Bug Source

### Q11. Which one is the source of truth? Role generates permissions automatically? OR permissions array is final authority?

**Current Implementation:**

```prisma
model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        MemberRole @default(MEMBER)
  permissions String[]   // Custom permissions array

  @@index([workspaceId, userId])
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

**This is CONFUSING and BUG-PRONE! 🐛**

**Scenario 1: Role says VIEWER, but permissions includes 'delete_documents'**

```typescript
{
  role: 'VIEWER',
  permissions: ['view_documents', 'delete_documents'] // Wait, what??
}
```

**Which wins?** → UNCLEAR!

**Scenario 2: Role upgraded to ADMIN, but permissions not updated**

```typescript
// Update role
await prisma.workspaceMember.update({
  where: { id: memberId },
  data: { role: 'ADMIN' },
  // Forgot to update permissions! 🐛
});
```

### RECOMMENDED FIX: **Role is Source of Truth** (with overrides)

**New Schema:**

```prisma
model WorkspaceMember {
  id                String    @id @default(cuid())
  workspaceId       String
  userId            String
  role              MemberRole @default(MEMBER)
  customPermissions String[]  // Overrides ONLY (rare)

  @@index([workspaceId, userId])
}
```

**Permission Resolution Logic:**

```typescript
// lib/permissions.ts

const ROLE_PERMISSIONS = {
  OWNER: [
    'view_documents',
    'edit_documents',
    'delete_documents',
    'manage_members',
    'manage_settings',
    'manage_billing',
    'delete_workspace',
  ],
  ADMIN: [
    'view_documents',
    'edit_documents',
    'delete_documents',
    'manage_members',
    'manage_settings',
  ],
  MEMBER: ['view_documents', 'edit_documents'],
  VIEWER: ['view_documents'],
} as const;

function getUserPermissions(member: WorkspaceMember): string[] {
  // Start with role-based permissions
  const basePermissions = ROLE_PERMISSIONS[member.role];

  // Apply custom overrides (if any)
  if (member.customPermissions.length > 0) {
    // Custom permissions can ADD or REMOVE
    const addPermissions = member.customPermissions.filter((p) => !p.startsWith('!'));
    const removePermissions = member.customPermissions
      .filter((p) => p.startsWith('!'))
      .map((p) => p.slice(1)); // Remove '!' prefix

    return [...basePermissions.filter((p) => !removePermissions.includes(p)), ...addPermissions];
  }

  return basePermissions;
}

// Check permission
function hasPermission(member: WorkspaceMember, permission: string): boolean {
  const permissions = getUserPermissions(member);
  return permissions.includes(permission);
}
```

**Usage:**

```typescript
// Example 1: Standard role (no overrides)
{
  role: 'ADMIN',
  customPermissions: []
}
// Result: ['view_documents', 'edit_documents', 'delete_documents', 'manage_members', 'manage_settings']

// Example 2: MEMBER with extra permission
{
  role: 'MEMBER',
  customPermissions: ['manage_settings'] // Grant extra permission
}
// Result: ['view_documents', 'edit_documents', 'manage_settings']

// Example 3: ADMIN with removed permission
{
  role: 'ADMIN',
  customPermissions: ['!delete_documents'] // Remove permission (! prefix)
}
// Result: ['view_documents', 'edit_documents', 'manage_members', 'manage_settings']
```

**Answer:** ✅ **Role is source of truth, permissions array is OVERRIDES only**

**Migration Needed:**

```typescript
// Migrate existing data
async function migratePermissions() {
  const members = await prisma.workspaceMember.findMany();

  for (const member of members) {
    const expectedPermissions = ROLE_PERMISSIONS[member.role];
    const actualPermissions = member.permissions;

    // Find differences
    const extras = actualPermissions.filter((p) => !expectedPermissions.includes(p));
    const missing = expectedPermissions.filter((p) => !actualPermissions.includes(p));

    const customPermissions = [
      ...extras, // Add custom grants
      ...missing.map((p) => `!${p}`), // Add custom denials
    ];

    await prisma.workspaceMember.update({
      where: { id: member.id },
      data: { customPermissions },
    });
  }
}
```

---

## 8) Document Tree / Notion Sidebar

### Q12. Do you want the hierarchy based on: parentId relation (recommended) OR path string like /api/users (GitBook style)?

**Option 1: ParentId Relation** (Recommended)

```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  workspaceId String
  parentId    String?  // Points to parent document
  order       Int      @default(0) // For sorting siblings

  workspace   Workspace @relation(fields: [workspaceId])
  parent      Document? @relation("DocumentTree", fields: [parentId])
  children    Document[] @relation("DocumentTree")

  @@index([workspaceId, parentId, order])
}
```

**Pros:**

- ✅ True hierarchy (database-enforced)
- ✅ Easy to query descendants
- ✅ Can move documents by changing parentId
- ✅ Easy to reorder (change order field)

**Cons:**

- ⚠️ More complex queries
- ⚠️ Need recursive queries for full tree

**Usage:**

```typescript
// Get document with children
const doc = await prisma.document.findUnique({
  where: { id: docId },
  include: {
    children: {
      orderBy: { order: 'asc' },
    },
  },
});

// Get full tree (recursive)
async function getDocumentTree(workspaceId: string) {
  const rootDocs = await prisma.document.findMany({
    where: {
      workspaceId,
      parentId: null,
    },
    orderBy: { order: 'asc' },
  });

  // Recursively load children
  for (const doc of rootDocs) {
    doc.children = await getChildren(doc.id);
  }

  return rootDocs;
}
```

**Option 2: Path String** (GitBook style)

```prisma
model Document {
  id          String  @id @default(cuid())
  title       String
  path        String  // "/api/users", "/guides/setup"
  workspaceId String

  @@unique([workspaceId, path])
  @@index([workspaceId, path])
}
```

**Pros:**

- ✅ Simple schema
- ✅ Easy to understand
- ✅ Good for GitHub sync (maps to file paths)

**Cons:**

- ❌ No true hierarchy (just string matching)
- ❌ Moving docs requires updating all children paths
- ❌ Renaming folder = update all descendants
- ❌ Hard to validate uniqueness

**Example:**

```typescript
// Get children of "/api"
const children = await prisma.document.findMany({
  where: {
    workspaceId,
    path: {
      startsWith: '/api/', // Match children
      not: {
        contains: '/', // Exclude grandchildren
      },
    },
  },
});

// Problem: Moving /api to /v1/api requires:
await prisma.document.updateMany({
  where: {
    path: { startsWith: '/api' },
  },
  data: {
    path: prisma.sql`REPLACE(path, '/api', '/v1/api')`, // Complex!
  },
});
```

### RECOMMENDATION: **Hybrid Approach** (Best of Both)

```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  workspaceId String

  // Hierarchy (for UI tree)
  parentId    String?
  order       Int      @default(0)

  // Path (for GitHub sync + URLs)
  path        String   // Auto-generated from hierarchy

  workspace   Workspace @relation(fields: [workspaceId])
  parent      Document? @relation("DocumentTree", fields: [parentId])
  children    Document[] @relation("DocumentTree")

  @@unique([workspaceId, path])
  @@index([workspaceId, parentId, order])
}
```

**How it works:**

1. **ParentId** is source of truth for hierarchy
2. **Path** is auto-generated from parentId chain
3. **Path** used for URLs and GitHub sync

```typescript
async function generatePath(document: Document): Promise<string> {
  if (!document.parentId) {
    // Root document
    return `/${slugify(document.title)}`;
  }

  // Get parent path
  const parent = await prisma.document.findUnique({
    where: { id: document.parentId },
  });

  return `${parent.path}/${slugify(document.title)}`;
}

// On save/move, regenerate path
async function updateDocument(id: string, data: any) {
  const updated = await prisma.document.update({
    where: { id },
    data,
  });

  // Regenerate path
  const newPath = await generatePath(updated);

  if (newPath !== updated.path) {
    await prisma.document.update({
      where: { id },
      data: { path: newPath },
    });

    // Update all children paths recursively
    await updateChildrenPaths(id);
  }
}
```

**Answer:** ✅ **Use parentId relation** (with auto-generated path for compatibility)

---

## 9) Storage: Base64 is a ticking bomb

### Q13. What images are currently stored as base64?

**Investigation:**

```typescript
// document-editor.tsx - Image upload handler
const handleImageUpload = async (file: File) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result); // Base64 data URL
    };
    reader.readAsDataURL(file);
  });
};

// Inserted into TipTap editor as:
editor
  .chain()
  .focus()
  .setImage({
    src: base64DataUrl, // data:image/png;base64,iVBORw0KG...
  })
  .run();

// Saved to database:
await prisma.document.update({
  data: {
    content: editor.getHTML(), // Includes <img src="data:image/png;base64,...">
  },
});
```

**Answer:** 🚨 **ALL images stored as base64 in document content**

**What this means:**

```
Small image:  100KB → Base64: 133KB (+33% overhead)
Medium image: 500KB → Base64: 666KB
Large image:  2MB   → Base64: 2.6MB

Document with 10 images (200KB each):
2MB of images → 2.6MB base64 → STORED IN TEXT FIELD! 💣
```

**Database Impact:**

```sql
-- PostgreSQL TEXT field
-- Practical limit: ~1GB per row
-- But each image as base64:
-- 1MB image = 1.33MB base64
-- 10 images = 13.3MB document!
-- 100 documents = 1.3GB!
```

**Profile Pictures:**

```prisma
model User {
  image String? // Also base64? or URL?
}
```

**Checking usage:** Likely also base64 (from file upload or OAuth)

### CRITICAL MIGRATION NEEDED

**Phase 1 (Immediate - 1 week):**

Stop storing new images as base64:

```typescript
// NEW: Upload to storage service
import { put } from '@vercel/blob';

async function handleImageUpload(file: File, documentId: string) {
  // Upload to Vercel Blob
  const blob = await put(`documents/${documentId}/${file.name}`, file, { access: 'public' });

  // Return public URL
  return blob.url; // https://blob.vercel-storage.com/...
}

// Insert URL into editor (not base64)
editor
  .chain()
  .focus()
  .setImage({
    src: publicUrl, // Regular URL
  })
  .run();
```

**Phase 2 (2-3 weeks):**

Migrate existing base64 images:

```typescript
async function migrateBase64Images() {
  const documents = await prisma.document.findMany({
    where: {
      content: {
        contains: 'data:image', // Has base64 images
      },
    },
  });

  for (const doc of documents) {
    let content = doc.content;

    // Extract all base64 images
    const base64Regex = /<img[^>]+src="(data:image\/[^"]+)"/g;
    const matches = content.matchAll(base64Regex);

    for (const match of matches) {
      const base64Data = match[1];

      // Convert to blob
      const buffer = Buffer.from(base64Data.split(',')[1], 'base64');

      // Upload to storage
      const blob = await put(`migrations/${doc.id}/${Date.now()}.png`, buffer, {
        access: 'public',
      });

      // Replace in content
      content = content.replace(base64Data, blob.url);
    }

    // Save updated content
    await prisma.document.update({
      where: { id: doc.id },
      data: { content },
    });

    console.log(`Migrated document ${doc.id}`);
  }
}
```

**Storage Options:**

| Service         | Free Tier            | Paid                                  | Best For           |
| --------------- | -------------------- | ------------------------------------- | ------------------ |
| **Vercel Blob** | 0 (none)             | $0.15/GB storage + $0.30/GB bandwidth | Vercel hosting     |
| **Cloudinary**  | 25GB bandwidth/month | $89/month                             | Image optimization |
| **AWS S3**      | 5GB + 20K requests   | $0.023/GB storage                     | Full control       |
| **UploadThing** | 10GB storage         | $10/month per 100GB                   | Dev-friendly       |

**Recommendation:** **Vercel Blob** (if on Vercel) or **UploadThing** (better for startups)

**Cost Estimate:**

```
1000 users × 50 documents × 5 images × 200KB = 50GB
Vercel Blob: $7.50/month storage + $15/month bandwidth = $22.50
Cloudinary: $89/month (flat fee, includes optimization)
```

**Answer:** 🔥 **HIGH PRIORITY - Stop using base64 NOW**, migrate within 2-3 weeks

---

## 15) The Most Dangerous Issue Right Now

### Q20. If I forced you to pick ONE thing that could destroy your SaaS if released today, what is it?

**Analysis of Critical Risks:**

| Issue                      | Impact                       | Likelihood | Severity Score |
| -------------------------- | ---------------------------- | ---------- | -------------- |
| **GitHub Sync Overwrites** | Data loss                    | High       | 🔴 10/10       |
| **No Soft Deletes**        | Permanent workspace deletion | Medium     | 🔴 9/10        |
| **Base64 Image Storage**   | DB explosion, high costs     | High       | 🟡 7/10        |
| **No Database Indexes**    | Slow queries at scale        | High       | 🟡 7/10        |
| **Lock System Breaking**   | Concurrent edit conflicts    | Medium     | 🟡 6/10        |
| **Token Leaks (GitHub)**   | Security breach              | Low        | 🔴 9/10        |

### THE ANSWER: **GitHub Sync Data Loss** 🔴

**Why This is the WORST:**

```typescript
// CURRENT IMPLEMENTATION (DANGEROUS!)

async function syncToGitHub(document: Document) {
  const octokit = new Octokit({ auth: user.githubAccessToken });

  // Push to GitHub (NO conflict check!)
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: document.githubPath,
    message: 'Update from DocHub',
    content: Buffer.from(document.content).toString('base64'),
    // MISSING: sha of current file (for conflict detection)
  });
}
```

**Disaster Scenario:**

```
1. User A edits document in app → Saves → "Version 1"
2. User B edits SAME file on GitHub → Commits changes
3. User A clicks "Sync to GitHub" → OVERWRITES User B's work! 💀
4. User B's changes PERMANENTLY LOST (no recovery)
5. User B blames your app → Bad review → Reputation destroyed
```

**Real-World Example:**

```
Day 1: Team uses your app, loves it
Day 7: Engineer edits README.md on GitHub (urgent fix)
Day 7 (5 min later): Manager saves doc from app → Sync overwrites
Day 7 (10 min later): Engineer's fix is gone 😱
Day 8: Team migrates to Notion/GitBook
```

**Why This Kills Your SaaS:**

1. **Trust Destroyed:** Users won't trust app with important docs
2. **No Recovery:** Lost work is unrecoverable
3. **Silent Failure:** User doesn't know until it's too late
4. **Word of Mouth:** "Their GitHub sync deleted my work" spreads fast
5. **Legal Risk:** If used for production docs, could cause real damage

### IMMEDIATE FIX (DO THIS WITHIN 48 HOURS)

```typescript
async function safeSyncToGitHub(document: Document) {
  const octokit = new Octokit({ auth: user.githubAccessToken });

  try {
    // 1. Get current file from GitHub
    const currentFile = await octokit.repos.getContent({
      owner: document.githubRepository.split('/')[0],
      repo: document.githubRepository.split('/')[1],
      path: document.githubPath,
      ref: document.githubBranch || 'main',
    });

    // 2. Check if file changed since last sync
    const lastKnownSHA = document.lastGitHubSHA;
    const currentSHA = currentFile.data.sha;

    if (lastKnownSHA && lastKnownSHA !== currentSHA) {
      // CONFLICT DETECTED!
      return {
        status: 'conflict',
        error: 'File changed on GitHub since last sync',
        githubContent: Buffer.from(currentFile.data.content, 'base64').toString(),
        localContent: document.content,
        githubSHA: currentSHA,
        lastKnownSHA,
        // Show merge UI to user
      };
    }

    // 3. Safe to push (no conflicts)
    const result = await octokit.repos.createOrUpdateFileContents({
      owner: document.githubRepository.split('/')[0],
      repo: document.githubRepository.split('/')[1],
      path: document.githubPath,
      message: document.lastCommitMessage || 'Update from DocHub',
      content: Buffer.from(document.content).toString('base64'),
      sha: currentSHA, // CRITICAL: Include current SHA
      branch: document.githubBranch || 'main',
    });

    // 4. Update last known SHA
    await prisma.document.update({
      where: { id: document.id },
      data: {
        lastGitHubSHA: result.data.content.sha,
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
      },
    });

    return {
      status: 'success',
      sha: result.data.content.sha,
    };
  } catch (error) {
    // Handle GitHub API errors gracefully
    if (error.status === 409) {
      return {
        status: 'conflict',
        error: 'Merge conflict detected',
      };
    }

    throw error;
  }
}
```

**Add to Schema:**

```prisma
model Document {
  // ... existing fields
  lastGitHubSHA  String?   // Track GitHub file SHA
  conflictData   Json?     // Store conflict info if detected
}
```

**Conflict Resolution UI:**

```tsx
function GitHubConflictDialog({ conflict }: { conflict: ConflictData }) {
  return (
    <Dialog>
      <DialogTitle>⚠️ GitHub Sync Conflict Detected</DialogTitle>
      <DialogContent>
        <p>The file on GitHub has been modified since your last sync. Choose how to proceed:</p>

        <div className="conflict-view">
          <div className="column">
            <h3>Your Version (App)</h3>
            <pre>{conflict.localContent}</pre>
          </div>

          <div className="column">
            <h3>GitHub Version</h3>
            <pre>{conflict.githubContent}</pre>
          </div>
        </div>

        <div className="actions">
          <Button onClick={() => resolveKeepLocal()}>Keep My Version (Overwrite GitHub)</Button>
          <Button onClick={() => resolveKeepRemote()}>
            Use GitHub Version (Discard My Changes)
          </Button>
          <Button onClick={() => showMergeEditor()}>Merge Manually</Button>
          <Button variant="secondary" onClick={() => cancel()}>
            Cancel Sync
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### SECONDARY CRITICAL ISSUES

#### 2. No Soft Deletes (Workspace Deletion)

**Quick Fix:**

```prisma
model Workspace {
  deletedAt DateTime?

  @@index([deletedAt])
}

// Update all queries to exclude deleted
await prisma.workspace.findMany({
  where: {
    ownerId: userId,
    deletedAt: null, // Exclude soft-deleted
  }
});
```

#### 3. Plain Text GitHub Tokens

**Quick Fix:**

```typescript
import crypto from 'crypto';

function encrypt(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

// On save:
await prisma.user.update({
  data: {
    githubAccessToken: encrypt(token),
  },
});

// On use:
const token = decrypt(user.githubAccessToken);
```

---

## PRIORITY ACTION PLAN (Next 7 Days)

### 🔴 DAY 1-2: GitHub Sync Fix (CRITICAL)

- [ ] Add `lastGitHubSHA` field to Document model
- [ ] Implement conflict detection in sync function
- [ ] Add conflict resolution UI
- [ ] Test with conflicting changes
- [ ] Deploy hotfix

### 🔴 DAY 3-4: Soft Deletes (HIGH)

- [ ] Add `deletedAt` to Workspace and Document
- [ ] Update all queries to check deletedAt
- [ ] Add "Restore" functionality
- [ ] Add cleanup job (delete after 30 days)

### 🟡 DAY 5: Token Encryption (MEDIUM)

- [ ] Generate encryption key
- [ ] Implement encrypt/decrypt functions
- [ ] Migrate existing tokens
- [ ] Update all token usage

### 🟡 DAY 6-7: Database Indexes (MEDIUM)

- [ ] Add indexes from Section J recommendations
- [ ] Run migration
- [ ] Test query performance
- [ ] Monitor slow queries

---

**Last Updated:** February 13, 2026  
**Document Type:** Critical Decisions & Risk Assessment  
**Status:** Action Required Immediately
