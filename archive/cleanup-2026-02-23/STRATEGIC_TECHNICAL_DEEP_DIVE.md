# DocHub – Collaborative Documentation Platform - Strategic & Technical Deep Dive

**Date:** February 13, 2026  
**Document Type:** Strategic Planning & Technical Architecture Analysis  
**Purpose:** Answer critical product, business, and technical architecture questions

---

## A) Product & Business Direction (Most Important)

### Primary Purpose

**Answer:** **Portfolio Project transitioning to Startup SaaS Product**

**Current Stage:**

- Built as a demonstration of full-stack capabilities
- Architecture designed for production at scale
- Ready to pivot to commercial SaaS offering

### Business Model

**Recommended Strategy:** **Freemium with Team Plans**

**Tier Structure:**

1. **Free Tier** (Individual)
   - 1 workspace
   - 3 collaborators max
   - 100 documents limit
   - 10 versions per document
   - Community support

2. **Pro Tier** ($12/user/month)
   - Unlimited workspaces
   - 10 collaborators per workspace
   - Unlimited documents
   - Unlimited versions
   - GitHub sync
   - Priority support

3. **Team Tier** ($20/user/month)
   - Everything in Pro
   - Unlimited collaborators
   - Advanced permissions
   - Activity analytics
   - SSO integration (future)
   - Dedicated support

4. **Enterprise Tier** (Custom pricing)
   - Self-hosted option
   - Custom integrations
   - SLA guarantees
   - Advanced security
   - Dedicated account manager

### Target User Segments

**Primary Target: Small to Medium Development Teams (5-50 people)**

- Startups building technical products
- Open-source project maintainers
- Engineering teams at scale-ups
- DevOps teams managing runbooks

**Secondary Target: Technical Solo Users**

- Developers documenting personal projects
- Technical writers
- Students learning software development

**Future Target: Enterprises**

- Large organizations (100+ users)
- Requires SSO, audit logs, compliance features

### Competitive Positioning

**Primary Competitors:**

1. **GitBook** (Closest competitor)
   - Strength: GitHub integration, clean UI
   - Weakness: Expensive, less collaborative features
   - **Our Advantage:** Better version control, more affordable

2. **Notion** (Inspiration, indirect competitor)
   - Strength: Beautiful UI, flexible blocks
   - Weakness: Poor version control, no GitHub sync
   - **Our Advantage:** Git-like versioning, GitHub sync

3. **Confluence** (Enterprise market)
   - Strength: Enterprise features, Atlassian ecosystem
   - Weakness: Clunky UI, expensive, complex
   - **Our Advantage:** Modern UI, simpler, developer-focused

4. **Outline** (Similar vision)
   - Strength: Open-source, markdown-based
   - Weakness: Limited features, smaller community
   - **Our Advantage:** Richer editor, better GitHub integration

5. **Slab** (Team knowledge)
   - Strength: Clean search, good collaboration
   - Weakness: No GitHub sync, limited versioning
   - **Our Advantage:** Superior version control

### Killer Feature (USP)

**🎯 "Git for Documents" - Developer-Native Version Control**

**What Makes Us Unique:**

- **SHA-based versioning** like Git commits
- **Diff visualization** showing exact changes
- **GitHub bidirectional sync** (not just import)
- **Version restoration** with full history
- **Developer-friendly** commit messages and branching (future)

**Tagline Options:**

- "Document like you code - with version control that makes sense"
- "The documentation tool developers actually want to use"
- "Notion meets GitHub - for technical teams"

**Marketing Position:**

> "Tired of losing work in Notion? Frustrated with Confluence's complexity? Want GitHub integration that actually works? DocHub gives you Git-like version control with Notion's beautiful editing experience."

---

## B) Real Usage Constraints

### Expected User Scale

**Phase 1 (Current - Launch):** 10-100 users

- Beta testers, early adopters
- Infrastructure: Vercel + Vercel Postgres
- Cost: ~$20-50/month

**Phase 2 (6 months):** 100-1,000 users

- Paying customers, product-market fit
- Infrastructure: Upgraded database, Redis caching
- Cost: ~$200-500/month

**Phase 3 (12 months):** 1,000-10,000 users

- Scale-up phase
- Infrastructure: Dedicated database, CDN, monitoring
- Cost: ~$1,000-2,000/month

### Workspace Usage Patterns

**Average User:**

- **Personal Projects:** 2-3 workspaces
- **Team Usage:** 1-2 workspaces (shared with team)
- **Power Users:** 5-10 workspaces

**Estimated Distribution:**

- 60% of users: 1-2 workspaces
- 30% of users: 3-5 workspaces
- 10% of users: 6+ workspaces (power users)

### Document Size Constraints

**Current Implementation:**

- **No explicit limit** (PostgreSQL TEXT field)
- **Recommended:** Soft limit at 5MB per document
- **Technical Limit:** PostgreSQL row size ~1GB (unrealistic)

**Realistic Size Targets:**

| Document Type       | Typical Size | Max Recommended |
| ------------------- | ------------ | --------------- |
| Quick Notes         | 5-50 KB      | 500 KB          |
| Standard Docs       | 50-500 KB    | 2 MB            |
| Heavy Docs (images) | 500 KB-2 MB  | 5 MB            |
| Very Large          | 2-5 MB       | 10 MB           |

**Recommended Limits by Tier:**

- **Free:** 2 MB per document
- **Pro:** 5 MB per document
- **Team/Enterprise:** 10 MB per document

### Version History Limits

**Current Implementation:** Unlimited versions (not sustainable)

**Recommended Strategy:**

| Tier       | Version Retention | Storage |
| ---------- | ----------------- | ------- |
| Free       | Last 10 versions  | 30 days |
| Pro        | Last 50 versions  | 90 days |
| Team       | Last 100 versions | 1 year  |
| Enterprise | Unlimited         | Forever |

**Version Cleanup Policy:**

- Archive old versions to cold storage (S3 Glacier)
- Keep labeled versions forever
- Compress old diffs

### File Storage Strategy

**Current Implementation:** Base64 in database (❌ Not scalable)

**Recommended Migration:**

1. **Phase 1:** Continue base64 for avatars only
2. **Phase 2:** Migrate to **Cloudinary** or **Vercel Blob**
   - Document images → Cloudinary
   - Profile pictures → Vercel Blob
   - File attachments → S3-compatible storage

3. **Phase 3:** Full CDN integration
   - Image optimization
   - Automatic WebP conversion
   - Global CDN delivery

**Storage Structure:**

```
/uploads
  /workspaces
    /{workspaceId}
      /documents
        /{documentId}
          /images
            /{imageId}.{ext}
          /attachments
            /{fileId}.{ext}
  /users
    /{userId}
      /avatars
        /avatar.{ext}
```

---

## C) Authentication & Security Deep Check

### NextAuth Strategy

**Current Implementation:** **JWT Strategy** (token-based)

**Why JWT:**

- ✅ Serverless-friendly (no session DB queries)
- ✅ Faster authentication checks
- ✅ Better for API routes
- ✅ Scales horizontally

**Configuration:**

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**Consideration:** Could add database sessions for enterprise audit logging

### GitHub Token Storage

**Current Implementation:** **Plain text in database** (⚠️ Security Risk)

**Recommended Fix:** **Encrypt tokens at rest**

```typescript
// Add to schema
model User {
  githubAccessToken  String? // Should be encrypted
  githubRefreshToken String? // Not implemented yet
}
```

**Solution:**

1. Use `crypto` module to encrypt/decrypt
2. Store encryption key in environment variable
3. Encrypt before saving, decrypt when using

```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
```

### Refresh Token Strategy

**Current Implementation:** ❌ **Not implemented** (Access tokens only)

**Risk:** Tokens expire, users must re-authenticate

**Recommendation:** **Implement refresh token flow**

1. Store refresh tokens (encrypted) in database
2. When access token expires, use refresh token to get new one
3. GitHub OAuth supports refresh tokens

### Authentication Event Logging

**Current Implementation:** ❌ **Not implemented**

**Recommended:** **Add audit log table**

```prisma
model AuthLog {
  id        String   @id @default(cuid())
  userId    String?
  email     String?
  event     String   // LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.
  ipAddress String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}
```

**Events to track:**

- Login attempts (success/failure)
- Password changes
- Email changes
- GitHub link/unlink
- Suspicious activity (multiple failed attempts)

### Organization Support

**Current Implementation:** ❌ **Not planned in current schema**

**Future Consideration:** **Add Organization layer**

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  ownerId     String
  plan        Plan     @default(FREE)
  createdAt   DateTime @default(now())

  owner       User     @relation(fields: [ownerId], references: [id])
  members     OrganizationMember[]
  workspaces  Workspace[]
}

model OrganizationMember {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           OrgRole  @default(MEMBER)

  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])
}
```

**Benefits:**

- Billing at org level
- Multiple workspaces under one account
- Centralized member management
- Better for teams

### SSO Integration Plans

**Current Support:** ❌ **Not implemented**

**Future Roadmap (Priority Order):**

1. **Phase 1:** Current (Email + GitHub OAuth) ✅
2. **Phase 2 (6-12 months):** Google Workspace SSO
3. **Phase 3 (12-18 months):** Microsoft Azure AD / Entra ID
4. **Phase 4 (18+ months):** SAML 2.0 for generic SSO

**Implementation:**

- NextAuth supports all these providers
- Requires enterprise tier
- Additional security configuration

---

## D) Version Control System (Critical Architecture)

### Current Version Storage Strategy

**Implementation Analysis:**

```typescript
// From schema.prisma
model DocumentVersion {
  id         String   @id @default(cuid())
  version    Int      // Sequential number
  content    String   // Full snapshot
  diff       String?  // Diff from previous
  sha        String?  // SHA hash
}
```

**Answer:** **Hybrid Strategy - Full Snapshot + Diff**

**How it works:**

1. **Every version stores:** Full content snapshot
2. **Additionally stores:** Diff from previous version
3. **SHA generation:** Hash of content (not yet Git-like)

**Pros:**

- ✅ Fast restoration (just copy snapshot)
- ✅ Diff available for visualization
- ✅ No reconstruction needed

**Cons:**

- ❌ More storage (full content each time)
- ❌ Not space-efficient for large documents

### SHA Generation Strategy

**Current Implementation:** Basic content hash (not true Git SHA)

**Recommended Improvement:** **Git-like SHA-1 hashing**

```typescript
import crypto from 'crypto';

function generateGitLikeSHA(content: string, metadata: object): string {
  // Git format: "blob {size}\0{content}"
  const size = Buffer.byteLength(content, 'utf8');
  const header = `blob ${size}\0`;
  const store = header + content;

  return crypto.createHash('sha1').update(store).digest('hex');
}
```

**Benefits:**

- Compatible with Git concepts
- Collision resistant
- Developer-friendly
- Can verify integrity

### Version Restoration Process

**Current Implementation:** **Direct snapshot copy** (no diff reconstruction)

```typescript
// Pseudo-code
async function restoreVersion(versionId: string) {
  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
  });

  // Simple copy - no diff reconstruction needed
  await prisma.document.update({
    data: { content: version.content },
  });
}
```

**Pros:**

- ✅ Simple, fast, reliable
- ✅ No complex diff parsing

**Cons:**

- ❌ Uses more storage

**Alternative (Future Optimization):**

- Store only diffs (like Git objects)
- Reconstruct content by replaying diffs
- Keep snapshots every N versions (checkpoints)

### Branch Support

**Current Implementation:** ❌ **Linear history only** (no branches)

**Future Consideration:** **Add branching support**

```prisma
model DocumentVersion {
  // ... existing fields
  branch      String   @default("main")
  parentId    String?  // Parent version
  mergedFrom  String?  // If this is a merge

  parent      DocumentVersion? @relation("VersionHistory")
}
```

**Branching Use Cases:**

- Experimental edits without affecting main
- Multiple people exploring different directions
- Review workflow (edit branch → review → merge)

**Complexity:** High - requires merge UI and conflict resolution

**Recommendation:** **Not a priority for MVP**, add later if users request

### Version Immutability

**Current Implementation:** ✅ **Versions are immutable**

**Proof:**

- No edit endpoints for versions
- Only create and read operations
- Version numbers are sequential

**Why immutable:**

- Maintains integrity of history
- Audit compliance
- Prevents tampering
- Git-like behavior

**Exception:** Admins can delete versions (cleanup)

---

## E) Editor Storage Format (Super Important)

### Content Storage Format

**Current Implementation:** **HTML String** (TipTap's default export)

**Evidence:**

```typescript
// document-editor.tsx
const content = editor.getHTML(); // Exports as HTML
```

**Pros:**

- ✅ Easy to render
- ✅ Works with React dangerouslySetInnerHTML
- ✅ Human-readable in database

**Cons:**

- ❌ Not portable
- ❌ Hard to parse programmatically
- ❌ Version control shows HTML diffs (noisy)

### Recommended Migration

**Future Strategy:** **Store as ProseMirror JSON**

```typescript
// Better approach
const content = JSON.stringify(editor.getJSON()); // ProseMirror JSON

// Benefits:
// 1. Structured data
// 2. Easy to parse and transform
// 3. Editor-agnostic (can switch from TipTap)
// 4. Better diffs (JSON diffs are cleaner)
```

**Migration Plan:**

1. Add `contentJson` field to Document model
2. Store both HTML (backward compat) and JSON
3. Gradually migrate to JSON-only
4. Update diff generation to use JSON

### GitHub Sync Format

**Current Implementation:** Likely **Markdown** (should verify)

**Recommended:** **Markdown (.md) for GitHub**

```typescript
// Conversion pipeline
TipTap Editor → ProseMirror JSON → HTML → Markdown → GitHub

// On sync:
1. editor.getJSON() → ProseMirror JSON
2. convertToHTML(json) → HTML
3. turndownService.turndown(html) → Markdown
4. Push markdown to GitHub

// On pull:
1. Fetch markdown from GitHub
2. marked(markdown) → HTML
3. editor.commands.setContent(html)
```

**Why Markdown for GitHub:**

- ✅ Native format for README.md, docs
- ✅ Readable in GitHub UI
- ✅ Compatible with Jekyll, Hugo, MkDocs
- ✅ Version control friendly (clean diffs)

### Code Block Support

**Current Implementation:** ✅ **Yes, with syntax highlighting**

**Evidence:**

```typescript
// TipTap extensions include CodeBlockLowlight
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
```

**Supported:**

- Syntax highlighting (Lowlight)
- Language selection
- Common languages (JS, Python, Java, etc.)

**Enhancement Needed:**

- Line numbers
- Copy button
- Language indicator badge

### Database Pages (Notion-like Tables)

**Current Implementation:** ❌ **Not implemented**

**Current Support:**

- ✅ Basic tables (TipTap table extension)
- ❌ No database views (table, board, calendar)
- ❌ No properties/metadata per row
- ❌ No filtering/sorting

**Future Implementation (Complex):**

```prisma
model DatabasePage {
  id           String   @id @default(cuid())
  documentId   String
  schema       Json     // Column definitions
  data         Json     // Row data
  views        Json     // Table, board, calendar views

  document     Document @relation(fields: [documentId], references: [id])
}
```

**Recommendation:** **Not a priority** - focus on docs first, add later if needed

---

## F) GitHub Integration Reality Check

### Commit Identity

**Current Implementation:** **User identity** (GitHub OAuth token)

**How it works:**

```typescript
// Uses user's GitHub token
const octokit = new Octokit({ auth: user.githubAccessToken });

// Creates commits as the authenticated user
await octokit.rest.repos.createOrUpdateFileContents({
  owner,
  repo,
  path: document.githubPath,
  message: commitMessage,
  content: base64Content,
  // Commit author is the token owner (user)
});
```

**Pros:**

- ✅ Authentic attribution
- ✅ Appears in user's GitHub profile
- ✅ Proper commit history

**Cons:**

- ⚠️ Requires user GitHub connection
- ⚠️ Token management complexity

### Commit Creation

**Answer:** ✅ **Real Git commits** (not just raw file pulls)

**Evidence:**

- Uses GitHub Contents API (createOrUpdateFileContents)
- Creates actual commits with messages
- Updates Git history
- Appears in GitHub commit log

**Bidirectional Sync:**

- **Push:** App → GitHub (creates commits)
- **Pull:** GitHub → App (fetches file content)

### Merge Conflict Handling

**Current Implementation:** ❌ **Not handled** (overwrites)

**Risk Scenario:**

1. User edits in app
2. Meanwhile, someone edits on GitHub
3. User syncs → **Overwrites GitHub changes** (data loss!)

**Recommended Solution:**

```typescript
async function safePush(document, newContent) {
  try {
    // Get current file SHA from GitHub
    const currentFile = await octokit.repos.getContent({...});

    // Check if file changed since last sync
    if (currentFile.sha !== document.lastGitHubSHA) {
      // Conflict detected!
      return {
        status: 'conflict',
        githubContent: currentFile.content,
        localContent: newContent,
        // Offer merge UI to user
      };
    }

    // Safe to push
    await octokit.repos.createOrUpdateFileContents({
      sha: currentFile.sha, // Required for update
      ...
    });

  } catch (error) {
    // Handle conflict
  }
}
```

**Conflict Resolution UI:**

- Show side-by-side diff
- Let user choose: Keep GitHub / Keep App / Merge manually
- Create merge commit

### Private Repository Support

**Current Implementation:** ✅ **Yes, automatically supported**

**Why:**

- GitHub OAuth token has user's repo permissions
- If user can access private repo, app can too
- No special handling needed

**Limitation:**

- User must have GitHub Pro/Team for private repos
- App doesn't create repos (user must pre-create)

### Monorepo Support

**Current Implementation:** ✅ **Yes, via path mapping**

**How it works:**

```typescript
// Document schema
model Document {
  githubPath String? // e.g., "docs/api/users.md"
}
```

**Supports:**

- `/docs/api/users.md`
- `/wiki/guides/setup.md`
- `/engineering/runbooks/deploy.md`

**Multiple docs in one repo:** Each document has its own githubPath

**Enhancement Needed:**

- Bulk sync for all docs in workspace
- Directory structure sync
- Automatic path detection

### GitHub Webhooks

**Current Implementation:** ❌ **Not implemented**

**Future Implementation (High Priority):**

```typescript
// Webhook receiver
// POST /api/webhooks/github

app.post('/api/webhooks/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  if (event === 'push') {
    // Files changed in push
    const changedFiles = payload.commits.flatMap((c) => c.modified);

    // Find documents with matching githubPath
    const docs = await prisma.document.findMany({
      where: { githubPath: { in: changedFiles } },
    });

    // Auto-pull updated content
    for (const doc of docs) {
      await pullFromGitHub(doc);
    }
  }

  res.json({ received: true });
});
```

**Benefits:**

- ✅ Real-time updates from GitHub
- ✅ No manual sync needed
- ✅ Team members can edit on GitHub

**Security:**

- Verify webhook signature (HMAC)
- Validate payload
- Rate limiting

---

## G) Real-Time Collaboration Plans

### Desired Real-Time Experience

**Recommendation:** **Hybrid Approach** (staged implementation)

### Phase 1 (Current): Notion-Style Locks ✅

- Document locks prevent concurrent edits
- Save → Manual refresh → See changes
- Good enough for MVP

### Phase 2 (6-12 months): Soft Real-Time

- **WebSocket presence:** See who's viewing
- **Live updates:** Auto-refresh when someone saves
- **Live comments:** New comments appear instantly
- **No live editing:** Still uses locks

**Implementation:**

```typescript
// Socket.io server
io.on('connection', (socket) => {
  socket.on('join-document', (docId) => {
    socket.join(`doc:${docId}`);
    io.to(`doc:${docId}`).emit('user-joined', socket.user);
  });

  socket.on('document-saved', (docId) => {
    io.to(`doc:${docId}`).emit('document-updated');
  });
});
```

### Phase 3 (12-18 months): True Collaborative Editing

- **Yjs integration:** OT (Operational Transformation)
- **Live cursors:** See where others are typing
- **Character-by-character updates**
- **Conflict resolution:** Automatic merge

**Why Yjs:**

- ✅ Battle-tested (used by many editors)
- ✅ CRDT-based (conflict-free)
- ✅ TipTap has Yjs extension
- ✅ Works with WebSocket, WebRTC, or provider

**Yjs Setup:**

```typescript
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';

const ydoc = new Doc();
const provider = new WebsocketProvider('ws://localhost:1234', 'document-' + docId, ydoc);

editor = new Editor({
  extensions: [
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({ provider }),
  ],
});
```

### Cursor Tracking & Selection

**Planned:** ✅ **Yes, with Phase 3**

**Features:**

- Colored cursors (per user)
- User name labels
- Selection highlights
- Cursor position sync

**UI Design:**

- Small avatar next to cursor
- Smooth animation
- Different color per user
- Non-intrusive

### Live Comments

**Planned:** ✅ **Yes, with Phase 2**

**Implementation:**

- WebSocket emits new comment events
- Comments appear without refresh
- Notification bell updates live
- Comment count updates

---

## H) Workspace & Permission System Details

### Document-Workspace Relationship

**Current:** ❌ **One document → One workspace** (1:1 relationship)

```prisma
model Document {
  workspaceId String // Single workspace, not array
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

**Pros:**

- ✅ Simple permissions (inherit from workspace)
- ✅ Clear ownership
- ✅ No complex relations

**Cons:**

- ❌ Can't share doc across workspaces
- ❌ Must duplicate if needed elsewhere

**Future Consideration:** **Document Collections** (like Google Drive folders shared to multiple teams)

### Nested Documents / Folders

**Current Implementation:** ❌ **Flat structure** (no folders)

**Evidence:**

- Documents have `path` field (string)
- No `parentId` or folder model
- No hierarchy in UI

**Path Field:**

```typescript
path: String; // e.g., "/api/users" or "/guides/setup"
```

**Current Approach:**

- Path is just metadata (not enforced)
- Can be used for organization (slash-separated)
- No actual folder structure

**Future Implementation:**

```prisma
model Document {
  // ... existing fields
  parentId   String?

  parent     Document?  @relation("ChildDocuments")
  children   Document[] @relation("ChildDocuments")
}
```

**UI Enhancement:**

- Notion-like sidebar tree
- Drag & drop to reorder
- Collapse/expand sections

### Path Uniqueness

**Current Implementation:** ⚠️ **Not unique** (can have duplicates)

**Schema:**

```prisma
path String // No @unique constraint
```

**Risk:**

- Multiple docs with same path
- Confusing for users
- GitHub sync conflicts

**Recommended Fix:**

```prisma
model Document {
  path        String
  workspaceId String

  @@unique([workspaceId, path]) // Unique per workspace
}
```

### Public Workspace Concept

**Current Implementation:** ❌ **All workspaces are private**

**Future Feature:** **Public Workspaces**

```prisma
model Workspace {
  // ... existing fields
  visibility    Visibility @default(PRIVATE) // PRIVATE, PUBLIC, UNLISTED
  publicSlug    String?    @unique
  allowComments Boolean    @default(false)
}

enum Visibility {
  PRIVATE  // Only members can access
  PUBLIC   // Anyone can view (SEO indexed)
  UNLISTED // Anyone with link can view (not indexed)
}
```

**Use Cases:**

- Documentation sites (like GitBook)
- Open-source project wikis
- Public knowledge bases
- Portfolio showcases

### Guest Link Sharing

**Current Implementation:** ❌ **Not implemented**

**Planned Feature:** **Shareable Links**

```prisma
model ShareLink {
  id          String   @id @default(cuid())
  documentId  String
  token       String   @unique // Random secure token
  permission  SharePermission @default(VIEW)
  expiresAt   DateTime?
  createdBy   String
  createdAt   DateTime @default(now())
  accessCount Int      @default(0)

  document    Document @relation(fields: [documentId], references: [id])
  creator     User     @relation(fields: [createdBy], references: [id])
}

enum SharePermission {
  VIEW         // Read-only
  COMMENT      // Can comment
  EDIT         // Can edit (temporary access)
}
```

**Features:**

- Expiration dates
- Password protection (optional)
- View/comment/edit permissions
- Access tracking
- Revocable links

**URL Structure:**

```
https://app.com/share/{token}
```

---

## I) Current Bugs & Pain Points (Your Reality)

### Top 3 Most Annoying Bugs (Fixed Recently)

#### 1. ✅ **FIXED - Toast Object Rendering Error**

- **Problem:** App crashed when passing objects to toast
- **Symptom:** "Objects are not valid as a React child"
- **Root Cause:** Toast expected strings, received validation error objects
- **Fix:** Added `toString()` helper to safely convert any value
- **Impact:** Critical - was breaking entire app

#### 2. ✅ **FIXED - Table Headers Not Visible**

- **Problem:** Table headers invisible in dark editor
- **Symptom:** Users couldn't see table structure
- **Root Cause:** Light theme prose styles on dark background
- **Fix:** Added comprehensive `.prose-invert` CSS styling
- **Impact:** Major - affected document readability

#### 3. ✅ **FIXED - Blur Effects on Hover**

- **Problem:** Visual blur/distortion when hovering over elements
- **Symptom:** UI felt laggy or glitchy
- **Root Cause:** `backdrop-blur` CSS causing performance issues
- **Fix:** Removed all backdrop-blur, used solid backgrounds with opacity
- **Impact:** Major - affected user perception of quality

### Current Unstable Features

#### 1. **GitHub Sync** (Most Unstable)

- **Issues:**
  - No conflict detection (overwrites changes)
  - No error recovery if sync fails
  - Manual sync only (no webhooks)
  - Token expiration not handled
  - No bulk sync for multiple documents
- **Frequency:** Occasional
- **Impact:** Medium - can cause data loss

#### 2. **Document Locking** (Minor Issues)

- **Issues:**
  - Locks don't auto-release on browser close
  - No force-unlock for admins
  - Lock polling delay (10 seconds)
  - Expired locks show stale data
- **Frequency:** Occasional
- **Impact:** Low - workaround exists (wait 30 min)

#### 3. **Version History** (Performance)

- **Issues:**
  - Slow for documents with 50+ versions
  - No pagination (loads all versions)
  - Diff generation can be slow
  - Large diffs crash browser
- **Frequency:** Rare (only heavy users)
- **Impact:** Low - affects power users only

### Features That Feel Slow/Laggy

#### 1. **Rich Text Editor Load Time** (2-3 seconds)

- **Cause:** TipTap bundle size (~500KB)
- **Solution:** Code splitting, lazy loading
- **Priority:** High

#### 2. **Version Diff Visualization** (3-5 seconds for large docs)

- **Cause:** Client-side diff generation
- **Solution:** Pre-compute diffs on server
- **Priority:** Medium

#### 3. **Document Search** (No debounce)

- **Cause:** Queries on every keystroke
- **Solution:** Add 300ms debounce
- **Priority:** Medium

#### 4. **Workspace Switching** (1-2 second delay)

- **Cause:** Full page reload
- **Solution:** Client-side navigation, prefetch
- **Priority:** Low

### UI Dissatisfaction Areas

#### 1. **Sidebar Navigation** (Needs Improvement)

- **Issues:**
  - No nested documents (flat list)
  - No drag & drop reordering
  - No keyboard shortcuts
  - No quick switcher (Cmd+K)
- **Want:** Notion-like tree sidebar

#### 2. **Editor Toolbar** (Functional but Basic)

- **Issues:**
  - No slash commands (/table, /heading)
  - No floating toolbar on selection
  - Too many buttons (cluttered)
  - No customization
- **Want:** Cleaner, context-aware toolbar

#### 3. **Version History UI** (Confusing)

- **Issues:**
  - Hard to understand what changed
  - Diff view is technical (not user-friendly)
  - No version comparison (2 versions side-by-side)
  - No version labels
- **Want:** GitHub-like PR diff experience

#### 4. **Mobile Experience** (Barely Usable)

- **Issues:**
  - Editor toolbar buttons too small
  - Sidebar navigation awkward
  - No mobile-optimized editor
  - Gestures not implemented
- **Want:** Dedicated mobile UI or native app

---

## J) Database Performance & Scaling

### Current Index Status

**Checking schema.prisma for indexes:**

```prisma
// Current indexes (implicit from @unique and @id):
✅ User.id (primary key)
✅ User.email (@unique)
✅ Workspace.id (primary key)
✅ Document.id (primary key)
❌ Document.workspaceId (NO INDEX - CRITICAL!)
❌ Document.updatedAt (NO INDEX - SLOW QUERIES!)
❌ DocumentVersion.documentId (NO INDEX - SLOW HISTORY!)
❌ WorkspaceMember.workspaceId (NO INDEX)
❌ WorkspaceMember.userId (NO INDEX)
```

### Required Index Additions (URGENT)

```prisma
model Document {
  // ... existing fields

  @@index([workspaceId]) // List all docs in workspace
  @@index([authorId]) // Find docs by author
  @@index([updatedAt]) // Sort by recent
  @@index([workspaceId, updatedAt]) // Compound for common query
  @@index([path]) // Search by path
}

model DocumentVersion {
  @@index([documentId]) // Get all versions for doc
  @@index([documentId, createdAt]) // Ordered history
  @@index([authorId]) // Find versions by author
}

model WorkspaceMember {
  @@index([workspaceId]) // List workspace members
  @@index([userId]) // Find user's workspaces
  @@index([workspaceId, userId]) // Check membership
}

model Comment {
  @@index([documentId]) // Comments per document
  @@index([authorId]) // Comments by user
}

model Favorite {
  @@index([userId]) // User's favorites
  @@index([documentId]) // Who favorited doc
}

model Notification {
  @@index([userId, read]) // Unread notifications
  @@index([createdAt]) // Recent notifications
}

model RecentDocument {
  @@index([userId, accessedAt]) // Recent docs per user
}
```

### Slow Query Analysis

**Common Queries & Performance:**

#### 1. List Documents in Workspace (SLOW without index)

```typescript
// Current query (table scan!)
const docs = await prisma.document.findMany({
  where: { workspaceId: 'xxx' }, // NO INDEX!
  orderBy: { updatedAt: 'desc' },
});

// Fix: Add @@index([workspaceId, updatedAt])
```

#### 2. Version History (VERY SLOW)

```typescript
// Current query
const versions = await prisma.documentVersion.findMany({
  where: { documentId: 'xxx' }, // NO INDEX!
  orderBy: { version: 'desc' },
});

// Without index: Scans entire table
// With 1000 docs × 50 versions = 50K rows scanned!

// Fix: Add @@index([documentId, version])
```

#### 3. User's Workspaces (SLOW)

```typescript
const workspaces = await prisma.workspaceMember.findMany({
  where: { userId: 'xxx' }, // NO INDEX!
  include: { workspace: true },
});

// Fix: Add @@index([userId])
```

### Diff Compression

**Current:** ❌ **Diffs stored as plain text**

**Recommendation:** **Compress diffs for storage efficiency**

```typescript
import zlib from 'zlib';

// Save version
const diff = generateDiff(oldContent, newContent);
const compressedDiff = zlib.gzipSync(diff).toString('base64');

await prisma.documentVersion.create({
  data: {
    content: newContent,
    diff: compressedDiff, // Compressed!
    // ...
  }
});

// Read version
const version = await prisma.documentVersion.findUnique({...});
const decompressed = zlib.gunzipSync(
  Buffer.from(version.diff, 'base64')
).toString();
```

**Savings:**

- Text diffs compress ~70-80%
- 10KB diff → 2-3KB stored
- Major savings for large documents

### Transaction Usage

**Current Implementation:** ⚠️ **Limited transaction usage**

**Critical Operations Needing Transactions:**

#### 1. Create Version + Update Document (SHOULD BE ATOMIC)

```typescript
// Current: Separate operations (RACE CONDITION!)
const version = await prisma.documentVersion.create({...});
await prisma.document.update({...});

// If crash between these, inconsistent state!

// Fix: Use transaction
await prisma.$transaction([
  prisma.documentVersion.create({...}),
  prisma.document.update({...}),
  prisma.notification.create({...}) // Notify watchers
]);
```

#### 2. Delete Workspace + Cascade

```typescript
// Must delete in order: versions → documents → members → workspace
await prisma.$transaction([
  prisma.documentVersion.deleteMany({ where: { document: { workspaceId } } }),
  prisma.comment.deleteMany({ where: { document: { workspaceId } } }),
  prisma.document.deleteMany({ where: { workspaceId } }),
  prisma.workspaceMember.deleteMany({ where: { workspaceId } }),
  prisma.workspace.delete({ where: { id: workspaceId } }),
]);
```

#### 3. Transfer Ownership

```typescript
await prisma.$transaction([
  prisma.workspace.update({ data: { ownerId: newOwnerId } }),
  prisma.workspaceMember.update({ data: { role: 'OWNER' } }),
  prisma.workspaceMember.update({ data: { role: 'ADMIN' } }), // Old owner
]);
```

---

## K) Deployment & Production Readiness

### Current Deployment Status

**Answer:** ⚠️ **Not currently deployed** (development only)

**Evidence:**

- Using `npm run dev` (development server)
- No production build artifacts
- No deployment configuration files
- NEXTAUTH_URL set to localhost

### Recommended Hosting Setup

**Best Choice for MVP:** **Vercel** (Optimized for Next.js)

**Infrastructure Stack:**

#### Option 1: Vercel Complete (Recommended)

```yaml
Frontend & API: Vercel Edge Network
Database: Vercel Postgres (Neon under hood)
File Storage: Vercel Blob
Monitoring: Vercel Analytics
Cost: $20-30/month (Hobby) → $200-300/month (Pro at scale)
```

**Pros:**

- ✅ Zero-config deployment (git push)
- ✅ Automatic HTTPS, CDN, scaling
- ✅ Serverless functions (API routes)
- ✅ Built-in preview deployments
- ✅ Edge caching

**Cons:**

- ❌ Vendor lock-in
- ❌ Can get expensive at scale
- ❌ Serverless cold starts

#### Option 2: Vercel + External DB (More Control)

```yaml
Frontend & API: Vercel
Database: Neon (Postgres)
File Storage: Cloudinary
Monitoring: Sentry + Vercel Analytics
Cost: $30-50/month → $300-500/month
```

**Pros:**

- ✅ Better database control
- ✅ More storage options
- ✅ Easier to migrate later

#### Option 3: Self-Hosted (Future Consideration)

```yaml
Server: Railway / Render / Fly.io
Database: Managed Postgres (Railway)
File Storage: S3-compatible
Cost: $20-40/month → $150-250/month
```

### Database Provider Comparison

| Provider            | Type       | Free Tier | Paid Start | Best For               |
| ------------------- | ---------- | --------- | ---------- | ---------------------- |
| **Vercel Postgres** | Serverless | 256MB     | $20/mo     | Vercel apps, MVP       |
| **Neon**            | Serverless | 512MB     | $19/mo     | Modern apps, branching |
| **Supabase**        | Dedicated  | 500MB     | $25/mo     | Backend-as-service     |
| **Railway**         | Dedicated  | $5 credit | $10/mo     | Self-hosted feel       |
| **PlanetScale**     | Serverless | 5GB       | $29/mo     | MySQL, scaling         |

**Recommendation:** **Neon** (PostgreSQL with branching, great DX)

### Connection Pooling

**Current Status:** ⚠️ **Not explicitly configured**

**Critical for Serverless:** Must use connection pooling!

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
  // Enable connection pooling
}
```

**Neon Setup:**

```env
# Connection pooling (use in production)
DATABASE_URL="postgres://user:pass@host/db?pgbouncer=true"

# Direct connection (use for migrations)
DIRECT_URL="postgres://user:pass@host/db"
```

**Why Critical:**

- Serverless functions spawn many connections
- PostgreSQL has connection limits (100-500)
- Without pooling → "too many connections" error
- PgBouncer pools connections efficiently

### Backup Strategy

**Current Status:** ❌ **No backups configured**

**Recommended Setup:**

#### Neon (Built-in)

- ✅ Automatic daily backups (7-30 days retention)
- ✅ Point-in-time recovery
- ✅ Branch for testing (copy DB instantly)

#### Manual Backup Script

```bash
# Daily backup cron job
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-*.sql.gz s3://backups/knowledge-hub/
```

**Backup Frequency:**

- **Production:** Hourly incrementals, daily full
- **Staging:** Daily
- **Development:** Manual before major changes

---

## L) Testing + Codebase Maintainability

### Folder Structure Analysis

**Current Structure:**

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── auth/           # Auth pages
│   ├── dashboard/      # Dashboard pages
│   └── page.tsx        # Homepage
├── components/         # React components
│   ├── ui/            # Base UI components (shadcn)
│   └── [feature]/     # Feature components
├── lib/               # Utilities
│   ├── auth.ts        # NextAuth config
│   ├── prisma.ts      # Prisma client
│   └── utils.ts       # Helpers
├── hooks/             # React hooks
└── types/             # TypeScript types
```

**Assessment:** ✅ **Good structure** for current size

**Recommendation for Scale:** **Add feature folders**

```
src/
├── features/
│   ├── documents/
│   │   ├── components/
│   │   ├── api/
│   │   ├── hooks/
│   │   └── types/
│   ├── workspaces/
│   ├── auth/
│   └── versions/
├── shared/
│   ├── components/  # Shared UI
│   ├── hooks/
│   └── utils/
└── app/            # Routes only
```

### CI/CD Pipeline

**Current Status:** ❌ **No CI/CD configured**

**Recommended Setup: GitHub Actions**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

**Checks to Add:**

1. ✅ Linting (ESLint)
2. ✅ Type checking (TypeScript)
3. ❌ Unit tests (not yet implemented)
4. ❌ E2E tests (not yet implemented)
5. ✅ Build test
6. ❌ DB migration dry-run

### Playwright Testing

**Current Status:** ❌ **Not configured**

**Recommended Setup:**

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign up', async ({ page }) => {
  await page.goto('/auth/signup');

  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});

test('user can create document', async ({ page }) => {
  // Login first
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create document
  await page.click('text=New Document');
  await page.fill('[placeholder="Document title"]', 'Test Doc');
  await page.fill('.ProseMirror', 'This is test content');
  await page.click('text=Save');

  await expect(page.locator('text=Saved')).toBeVisible();
});
```

**Critical Tests:**

1. Auth flow (signup, login, logout)
2. Document CRUD
3. Version creation and restoration
4. Workspace management
5. GitHub sync
6. Permissions/access control

---

## M) UI/UX Improvements (For Notion-Level Feel)

### Slash Command Menu

**Current Status:** ❌ **Not implemented**

**Implementation:** Use TipTap's Commands extension

```typescript
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          return [
            {
              title: 'Heading 1',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
              },
            },
            {
              title: 'Table',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertTable().run();
              },
            },
            {
              title: 'Code Block',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setCodeBlock().run();
              },
            },
            // More commands...
          ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
        },
      },
    };
  },
});
```

**Commands to Include:**

- `/h1`, `/h2`, `/h3` - Headings
- `/table` - Insert table
- `/code` - Code block
- `/image` - Upload image
- `/bullet` - Bullet list
- `/todo` - Task list
- `/quote` - Blockquote

### Floating Bubble Menu

**Current Status:** ❌ **Not implemented**

**Implementation:** Use TipTap's BubbleMenu

```typescript
import { BubbleMenu } from '@tiptap/react';

<BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
  <div className="bubble-menu">
    <button onClick={() => editor.chain().focus().toggleBold().run()}>
      <Bold />
    </button>
    <button onClick={() => editor.chain().focus().toggleItalic().run()}>
      <Italic />
    </button>
    <button onClick={() => editor.chain().focus().toggleLink().run()}>
      <Link />
    </button>
    <button onClick={() => editor.chain().focus().toggleCode().run()}>
      <Code />
    </button>
  </div>
</BubbleMenu>
```

**When to Show:**

- On text selection
- Floating near selection
- Clean, minimal design
- Context-aware (show link button only when applicable)

### Drag & Drop Block Reordering

**Current Status:** ❌ **Not implemented**

**Implementation:** Use `dnd-kit` + TipTap

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**Complexity:** High - requires:

1. Block-level wrapping
2. Drag handles on each block
3. Sortable list container
4. TipTap content restructuring

**Recommendation:** **Phase 2 feature** (after MVP launch)

### Notion-Style Sidebar Tree

**Current Status:** ❌ **Flat list only**

**Desired Feature:**

```
📁 Workspace Name
  📄 Getting Started
  📁 API Documentation
    📄 Authentication
    📄 Users API
    📄 Documents API
  📁 Guides
    📄 Quick Start
    📄 Best Practices
```

**Implementation:**

```typescript
// Recursive sidebar component
function DocumentTree({ documents, level = 0 }) {
  return (
    <ul style={{ paddingLeft: level * 20 }}>
      {documents.map(doc => (
        <li key={doc.id}>
          <div onClick={() => navigate(doc.id)}>
            {doc.icon} {doc.title}
          </div>
          {doc.children?.length > 0 && (
            <DocumentTree documents={doc.children} level={level + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}
```

**Requirements:**

- Add `parentId` to Document model
- Add `order` field for sorting
- Implement collapse/expand state
- Add drag-drop to reorganize

### Landing Page Style

**Current Status:** ⚠️ **Basic landing page**

**Recommended Style:** **Notion-inspired marketing page**

**Elements:**

- Hero section with gradient background
- Animated demo/screenshot
- Feature grid (3 columns)
- Social proof (testimonials)
- Pricing table
- CTA buttons
- Footer with links

**UI Inspiration Priority:**

1. **Notion** - Clean, white, trustworthy
2. **Linear** - Minimal, elegant, smooth animations
3. **Vercel** - Developer-focused, modern
4. ~~Huly~~ - Too futuristic for docs tool
5. ~~GitHub~~ - Too technical/corporate

---

## N) Future Big Features

### Knowledge Graph / Backlinks

**Planned:** ✅ **Yes** (Phase 3 feature)

**Concept:**

- Automatic link detection between documents
- Show "Mentioned in" section on each doc
- Visual graph view of connections
- Bidirectional links

**Implementation:**

```prisma
model DocumentLink {
  id            String   @id @default(cuid())
  sourceDocId   String
  targetDocId   String
  linkText      String?
  context       String?  // Surrounding text
  createdAt     DateTime @default(now())

  sourceDoc     Document @relation("OutgoingLinks", fields: [sourceDocId], references: [id])
  targetDoc     Document @relation("IncomingLinks", fields: [targetDocId], references: [id])

  @@unique([sourceDocId, targetDocId])
  @@index([targetDocId]) // Find backlinks
}
```

**Parser:**

```typescript
// Extract links from content
function extractDocumentLinks(content: string, workspaceId: string) {
  const linkRegex = /\[\[([^\]]+)\]\]/g; // [[Document Name]]
  const matches = content.matchAll(linkRegex);

  for (const match of matches) {
    const linkText = match[1];
    // Find target document
    // Create DocumentLink record
  }
}
```

**UI:**

- Backlinks section at bottom of document
- Graph visualization (D3.js or vis.js)
- Clickable links jump to linked doc

**Complexity:** Medium-High  
**Timeline:** 6-12 months after MVP

### AI Assistant Integration

**Planned:** ✅ **Yes** (High demand feature)

**Features:**

#### 1. Document Summarization

```typescript
const summary = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'user',
      content: `Summarize this document in 3 bullet points:\n\n${documentContent}`,
    },
  ],
});
```

#### 2. Content Generation

- Generate doc from outline
- Expand bullet points
- Rephrase sections
- Fix grammar/spelling

#### 3. Smart Suggestions

- Suggest related documents
- Detect missing information
- Recommend tags/categories

#### 4. Q&A Over Workspace

```typescript
// RAG (Retrieval-Augmented Generation)
const context = await searchDocuments(query);
const answer = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: 'Answer based on these documents:' + context },
    { role: 'user', content: query },
  ],
});
```

**Implementation:**

- OpenAI API integration
- Token usage tracking (billing)
- Streaming responses
- Rate limiting per user

**Cost:** ~$0.002 per request (GPT-4)  
**Timeline:** 3-6 months after MVP  
**Tier:** Pro and above only

### Offline Mode (PWA)

**Planned:** ⚠️ **Maybe** (High complexity)

**Approach:** **Progressive Web App**

```javascript
// service-worker.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**Challenges:**

- Offline editing requires local storage
- Sync conflicts on reconnect
- Large documents exceed storage quota
- Complex sync algorithm

**Alternative:** **Save draft locally** (simpler)

- Auto-save to localStorage every 10 seconds
- Restore on reconnect
- Sync when online

**Timeline:** 12+ months (low priority)

### Export Features

**Planned:** ✅ **Yes** (Essential for trust)

#### 1. Markdown Export ✅ (High Priority)

```typescript
import TurndownService from 'turndown';

function exportToMarkdown(document: Document) {
  const turndown = new TurndownService();
  const markdown = turndown.turndown(document.content);

  // Download as .md file
  downloadFile(`${document.title}.md`, markdown);
}
```

**Timeline:** 1-2 months  
**Implementation:** Straightforward

#### 2. PDF Export ✅ (High Priority)

```typescript
import { jsPDF } from 'jspdf';

function exportToPDF(document: Document) {
  const doc = new jsPDF();
  doc.text(document.title, 10, 10);
  doc.html(document.content, {
    callback: (pdf) => {
      pdf.save(`${document.title}.pdf`);
    },
  });
}
```

**Challenges:**

- Styling preservation
- Image handling
- Page breaks
- Large documents

**Timeline:** 2-3 months  
**Alternative:** Use Puppeteer (server-side rendering)

#### 3. HTML Export ✅ (Easy)

```typescript
function exportToHTML(document: Document) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${document.title}</title>
        <style>${defaultStyles}</style>
      </head>
      <body>
        ${document.content}
      </body>
    </html>
  `;
  downloadFile(`${document.title}.html`, html);
}
```

**Timeline:** 1 month

#### 4. Git Repo Export ⚠️ (Complex)

```typescript
// Export entire workspace as Git repository
async function exportAsGitRepo(workspaceId: string) {
  // 1. Create temp directory
  // 2. Convert all docs to Markdown
  // 3. Recreate folder structure
  // 4. Initialize Git repo
  // 5. Create commits from version history
  // 6. Zip and download
}
```

**Benefits:**

- Full version history preserved
- Can host on GitHub Pages
- True backup

**Timeline:** 6+ months (complex)

### Workspace Templates

**Planned:** ✅ **Yes** (Great onboarding)

**Template Categories:**

1. **Product Documentation**
   - Overview
   - Getting Started
   - API Reference
   - Changelog

2. **Engineering Runbooks**
   - Deployment Guide
   - Incident Response
   - On-Call Procedures
   - Architecture Docs

3. **Project Management**
   - Project Charter
   - Meeting Notes
   - Decision Log
   - Roadmap

4. **Team Wiki**
   - Team Handbook
   - Onboarding Checklist
   - Code Standards
   - Tools & Resources

**Implementation:**

```prisma
model WorkspaceTemplate {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String
  icon        String
  documents   Json     // Document structure
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**Template Application:**

```typescript
async function applyTemplate(workspaceId: string, templateId: string) {
  const template = await prisma.workspaceTemplate.findUnique({
    where: { id: templateId },
  });

  // Create documents from template
  for (const docTemplate of template.documents) {
    await prisma.document.create({
      data: {
        title: docTemplate.title,
        content: docTemplate.content,
        path: docTemplate.path,
        workspaceId,
      },
    });
  }
}
```

**Timeline:** 2-3 months

---

## Summary & Prioritization

### Immediate Actions (Next 2 weeks)

1. ✅ Add database indexes (CRITICAL for performance)
2. ✅ Fix transaction usage (data integrity)
3. ✅ Configure connection pooling (deployment ready)
4. 🔳 Deploy to Vercel staging (test production)
5. 🔳 Set up Neon database (managed Postgres)

### Short-Term (1-3 months)

6. 🔳 Add email verification
7. 🔳 Add password reset
8. 🔳 Implement slash commands
9. 🔳 Add bubble menu
10. 🔳 Markdown/PDF export
11. 🔳 Improve GitHub sync (conflict detection)
12. 🔳 Add rate limiting

### Medium-Term (3-6 months)

13. 🔳 WebSocket server (presence, notifications)
14. 🔳 AI assistant integration
15. 🔳 Workspace templates
16. 🔳 Knowledge graph / backlinks
17. 🔳 Nested documents / tree sidebar
18. 🔳 GitHub webhooks
19. 🔳 Playwright E2E tests

### Long-Term (6-12 months)

20. 🔳 Real-time collaborative editing (Yjs)
21. 🔳 Organization accounts
22. 🔳 SSO integration
23. 🔳 Mobile app
24. 🔳 Advanced analytics
25. 🔳 Git repo export

---

**Last Updated:** February 13, 2026  
**Document Type:** Strategic Planning  
**Status:** Living Document (Update as decisions are made)
