# Mermaid ER Database Diagram Detailed Explanation

## Diagram Reference

This document explains the database model represented in:

- [../mermaid-er-diagram.drawio](../mermaid-er-diagram.drawio)

This is a table-style ER diagram that shows entities, field types, key constraints, and cardinality connections.

---

## 1. What This Diagram Represents

The diagram models the core relational data architecture for a collaborative documentation platform with:

- User authentication and profile data
- Workspace and membership management
- Document authoring and version history
- Comments and activity tracking
- GitHub repository integration and sync metadata
- User feedback lifecycle

At a high level, USER is the central actor entity, and most business tables reference USER directly or indirectly.

---

## 2. Entities and Their Meaning

## 2.1 USER

Purpose:

Stores identity, login, account profile, and role data.

Important fields shown:

- user_id (PK)
- username (unique, nullable)
- name (nullable)
- email (unique, not null)
- image
- password
- githubLinked
- githubUserId
- githubUsername
- githubProfileUrl
- githubEmail
- role
- updatedAt

Why it matters:

- Anchors ownership and authorship across the system
- Supports credentials and GitHub-linked identity modes
- Provides role basis for privileged operations

## 2.2 WORKSPACE

Purpose:

Represents a team or project boundary where documents and collaboration happen.

Important fields shown:

- workspace_id (PK)
- name
- description
- user_id (FK) (owner reference)
- createdAt
- updatedAt

Why it matters:

- Defines content isolation boundaries
- Supports ownership and permission control

## 2.3 WORKSPACEMEMBER

Purpose:

Join entity that models many-to-many membership between users and workspaces.

Important fields shown:

- workspacemember_id (PK)
- user_id (FK)
- workspace_id (FK)
- permissions
- grantedById
- createdAt

Why it matters:

- Captures who can access which workspace
- Stores capability details and delegation hints

## 2.4 DOCUMENT

Purpose:

Stores the current state of authored content.

Important fields shown:

- document_id (PK)
- title
- content
- path
- phase (enum)
- type (enum)
- workspace_id (FK)
- author_id (FK)
- githubPath
- createdAt
- updatedAt

Why it matters:

- Core business object for knowledge creation
- Binds content to workspace scope and author identity

## 2.5 VERSION

Purpose:

Stores historical snapshots of document changes.

Important fields shown:

- version_id (PK)
- document_id (FK)
- content
- message
- label
- author_id (FK)
- version (integer)
- createdAt

Why it matters:

- Enables auditability and restore workflows
- Tracks document evolution over time

## 2.6 COMMENT

Purpose:

Stores discussion data attached to documents.

Important fields shown:

- comment_id (PK)
- document_id (FK)
- author_id (FK)
- content
- resolved (boolean)
- createdAt
- updatedAt

Why it matters:

- Supports review, discussion, and issue resolution around content

## 2.7 GITHUBREPO

Purpose:

Stores integration data linking platform workspaces with GitHub repositories.

Important fields shown:

- githubrepo_id (PK)
- workspace_id (FK)
- repoOwner
- repoName
- accessToken
- lastSyncedAt
- defaultCommitMessage
- webhookId
- webhookSecret

Why it matters:

- Provides synchronization target metadata
- Supports webhook-driven and scheduled sync patterns

## 2.8 FEEDBACK

Purpose:

Stores product feedback submissions and response lifecycle data.

Important fields shown:

- feedback_id (PK)
- user_id (FK)
- type (enum)
- title
- description
- rating
- priority (enum)
- createdAt
- resolvedAt
- adminReply
- repliedAt

Why it matters:

- Implements user-to-admin feedback pipeline
- Captures resolution history and response timing

---

## 3. Core Relationships and Cardinalities

The diagram edges use crow-foot style markers (one-to-many and one-to-one semantics).

## 3.1 USER to WORKSPACE (Owner Relationship)

Interpretation:

- One USER can own multiple WORKSPACE records
- Each WORKSPACE has one owner user_id

Impact:

- Enables ownership-based administration and lifecycle control

## 3.2 USER to WORKSPACEMEMBER

Interpretation:

- One USER can have many membership rows
- Each membership row maps to one USER

Impact:

- Supports participation in many workspaces with specific permissions

## 3.3 WORKSPACE to WORKSPACEMEMBER

Interpretation:

- One WORKSPACE can contain many membership rows
- Each membership row belongs to one WORKSPACE

Impact:

- Models many members per workspace using a join table

## 3.4 WORKSPACE to DOCUMENT

Interpretation:

- One WORKSPACE contains many DOCUMENT records
- Each DOCUMENT belongs to one WORKSPACE

Impact:

- Content is always scoped to workspace boundaries

## 3.5 USER to DOCUMENT (Author)

Interpretation:

- One USER can author many DOCUMENT records
- Each DOCUMENT has one author_id

Impact:

- Preserves authorship accountability

## 3.6 DOCUMENT to VERSION

Interpretation:

- One DOCUMENT has many VERSION records
- Each VERSION points to one DOCUMENT

Impact:

- Implements historical change tracking and rollback support

## 3.7 USER to VERSION (Version Author)

Interpretation:

- One USER can create many VERSION entries
- Each VERSION has one author_id

Impact:

- Keeps editor attribution for every saved version

## 3.8 DOCUMENT to COMMENT

Interpretation:

- One DOCUMENT can have many COMMENT records
- Each COMMENT belongs to one DOCUMENT

Impact:

- Threaded discussion can be anchored to content objects

## 3.9 USER to COMMENT

Interpretation:

- One USER can create many comments
- Each COMMENT has one author_id

Impact:

- Enables moderation and user-level activity accountability

## 3.10 WORKSPACE to GITHUBREPO

Interpretation:

- One WORKSPACE links to one GITHUBREPO in this model

Impact:

- Keeps repository sync ownership explicit and simple

## 3.11 USER to FEEDBACK

Interpretation:

- One USER can submit many FEEDBACK entries
- Each FEEDBACK entry belongs to one USER

Impact:

- Maintains origin traceability for product issues and requests

---

## 4. Key Design Patterns Visible in the Diagram

## 4.1 Join Table Pattern

WORKSPACEMEMBER is a classic join table with extra business attributes (permissions, grantedById). This is stronger than a plain many-to-many relation because it stores policy data, not just linkage.

## 4.2 Snapshot Versioning Pattern

DOCUMENT stores current state, while VERSION stores immutable snapshots. This avoids overwriting history and enables timeline reconstruction.

## 4.3 Integration Metadata Pattern

GITHUBREPO stores connector metadata (repo identity, webhook references, sync hints). This separates business content from integration-specific concerns.

## 4.4 Feedback Lifecycle Pattern

FEEDBACK includes both submission fields and resolution fields (resolvedAt, adminReply, repliedAt), allowing one table to represent status progression.

---

## 5. Data Integrity Expectations

The diagram implies the following integrity rules:

1. Primary keys are unique and immutable identifiers.
2. Foreign keys must reference existing parent records.
3. Workspace-scoped entities should not exist without valid workspace references.
4. Author-linked entities should not exist without valid user references.
5. Version and comment records should cascade or be controlled consistently when document lifecycle events occur.

Recommended constraints in implementation:

- Unique index on USER.email
- Unique index on USER.username where present
- Composite uniqueness for workspace membership (workspace_id, user_id)
- Indexes on all FK fields for query performance

---

## 6. End-to-End Data Flow Stories Backed by This Schema

## Story A: User Creates a Workspace and Documents

1. USER row exists.
2. WORKSPACE row is inserted with owner user_id.
3. WORKSPACEMEMBER row may be created for owner permissions.
4. DOCUMENT rows are inserted under workspace_id.
5. VERSION rows are generated for saves.

## Story B: Collaborative Editing and Discussion

1. Multiple WORKSPACEMEMBER rows grant access.
2. Users update DOCUMENT content.
3. Each meaningful save creates VERSION snapshot.
4. COMMENT rows capture review discussions and resolution state.

## Story C: GitHub Synchronization

1. WORKSPACE links to GITHUBREPO.
2. DOCUMENT githubPath fields map content to repository files.
3. Sync jobs update lastSyncedAt and related webhook-driven data paths.

## Story D: Feedback Lifecycle

1. USER submits FEEDBACK with type, title, description, rating.
2. Admin process updates priority and response fields.
3. resolvedAt and repliedAt timestamps finalize lifecycle trace.

---

## 7. How to Read This Diagram Quickly

Use this sequence for fast understanding:

1. Start at USER because it is the main parent entity.
2. Follow ownership path: USER -> WORKSPACE -> DOCUMENT.
3. Add history and collaboration: DOCUMENT -> VERSION and COMMENT.
4. Add access control layer: WORKSPACEMEMBER between USER and WORKSPACE.
5. Add external integration: WORKSPACE -> GITHUBREPO.
6. Add product ops loop: USER -> FEEDBACK.

This sequence mirrors real product behavior from account creation to operations and support.

---

## 8. Practical Review Checklist

You fully understand this Mermaid ER diagram when you can answer:

1. Which tables are tenant-scoped by workspace_id?
2. Which tables carry authorship using user_id or author_id?
3. How are current content and historical content separated?
4. Where is integration state stored versus business content?
5. Which fields capture feedback completion lifecycle?

---

## 9. Conclusion

This Mermaid ER diagram presents a strong relational backbone for a collaborative documentation platform.

It balances:

- Core content and version control
- Access and governance structures
- External repository integration
- User feedback operations

Together, these entities and relations support the full product lifecycle from authoring to collaboration, synchronization, and continuous improvement.
