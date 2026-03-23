# Traditional ER Diagram Detailed Explanation

## Diagram Reference

This explanation is based on the traditional ER model in:

- [../er-diagram-traditional.drawio](../er-diagram-traditional.drawio)

The diagram uses classic ER notation:

- Rectangle: Entity
- Ellipse: Attribute
- Rhombus: Relationship
- 1 and N labels: Cardinality
- PK and FK marks: Keys

---

## 1. ER Model Scope

This model captures the core data domain for a collaborative documentation platform:

- Identity and access foundation through User and workspace membership
- Content lifecycle through Document and Version
- Integration through GitHub repository linkage
- Observability through Activity logs
- Product feedback loop through Feedback submissions

The model is intentionally business-focused and understandable for both technical and non-technical stakeholders.

---

## 2. Entity-by-Entity Explanation

## 2.1 USER

Purpose:

Represents each platform account that can authenticate and perform actions.

Attributes shown:

- User Id (PK): Unique user identifier
- Email: Login and communication identifier
- Name: Display name
- Password: Credential hash source field in conceptual model

Role in the system:

- Originator of most actions
- Owner/creator of content
- Actor in audit trails
- Submitter of feedback

Design notes:

- Email should be unique
- Password should never be stored in plain text
- Additional auth fields may exist in implementation, but this diagram keeps a simplified conceptual set

## 2.2 WORKSPACE

Purpose:

Defines an isolated collaboration boundary for teams and documents.

Attributes shown:

- Workspace Id (PK)
- Name
- createdAt
- Description is also represented near workspace in the diagram

Role in the system:

- Organizes content and member access
- Acts as a parent scope for documents
- Can be linked to one repository in this traditional model

Design notes:

- A workspace is a tenancy boundary for permissions
- Naming and created timestamp support administration and discovery

## 2.3 DOCUMENT

Purpose:

Stores current working content for knowledge artifacts.

Attributes shown:

- document Id (PK)
- Title
- Content
- CreatedAt

Role in the system:

- Primary object users create and update
- Belongs to exactly one workspace in this model
- Has version history through relationship with Version

Design notes:

- Content may be markdown or rich text payload
- Title plus workspace context usually forms user-facing identity

## 2.4 VERSION

Purpose:

Represents immutable snapshots of document evolution.

Attributes shown:

- version Id (PK)
- versionNumber
- Message
- createdAt

Role in the system:

- Preserves auditability and rollback capability
- Tracks meaningful checkpoints in editing lifecycle

Design notes:

- versionNumber should increase monotonically per document
- Message communicates why a version was created

## 2.5 GITHUB_REPO

Purpose:

Represents external repository integration metadata.

Attributes shown:

- repo Id (PK)
- repoOwner
- repoName

Role in the system:

- Synchronization target/source for workspace content
- Provides repository identity for Git-based operations

Design notes:

- Owner and name together define repository uniqueness
- In implementation, additional sync and credential metadata is usually required

## 2.6 ACTIVITY

Purpose:

Records user actions for timeline, auditing, and troubleshooting.

Attributes shown:

- activity Id (PK)
- entityType
- entityId
- userId (FK)

Role in the system:

- Captures who did what and on which entity
- Supports history views and operational diagnostics

Design notes:

- entityType plus entityId is a polymorphic reference pattern
- userId links every action to an actor

## 2.7 FEEDBACK

Purpose:

Stores user-submitted product feedback items.

Attributes shown:

- feedback Id (PK)
- type
- Content

Role in the system:

- Enables direct user-to-product communication
- Feeds admin triage and improvement cycle

Design notes:

- type helps classify feedback category
- Content carries issue details or suggestions

---

## 3. Relationship-by-Relationship Explanation

## 3.1 USER MEMBER_OF WORKSPACE (1:N as drawn)

Interpretation:

- The diagram marks USER side as 1 and WORKSPACE side as N through MEMBER_OF
- This indicates one user can be associated with multiple workspace memberships

Operational meaning:

- A user can participate in multiple workspaces
- Workspace membership is a key access-control concept

Important modeling comment:

- In physical schema design, this is typically implemented with a join table such as WorkspaceMember

## 3.2 WORKSPACE CONTAINS DOCUMENT (1:N)

Interpretation:

- One workspace contains many documents
- Each document belongs to one workspace

Operational meaning:

- Document discovery and permissions are workspace-scoped
- Moving documents across workspaces requires explicit reassignment logic

## 3.3 USER CREATES DOCUMENT (1:N)

Interpretation:

- One user can create many documents
- Each document has one creator author in this model

Operational meaning:

- Author attribution and responsibility are preserved
- Enables creator-based filtering and reporting

## 3.4 DOCUMENT TRACKS VERSION (1:N)

Interpretation:

- One document has many versions
- Each version belongs to one document

Operational meaning:

- Time-ordered evolution is stored independently from current content
- Restore operations are possible from historical snapshots

## 3.5 WORKSPACE SYNC_WITH GITHUB_REPO (1:1)

Interpretation:

- One workspace syncs with one repository
- One repository is tied to one workspace in this traditional model

Operational meaning:

- Simple and predictable integration mapping
- Avoids ambiguity in sync ownership

## 3.6 USER PERFORMS ACTIVITY (1:N)

Interpretation:

- One user can perform many activities
- Each activity event belongs to one user

Operational meaning:

- Strong audit traceability
- Action history can be grouped per user

## 3.7 USER SUBMITS FEEDBACK (1:N)

Interpretation:

- One user can submit many feedback records
- Each feedback record has one submitter

Operational meaning:

- Feedback origin is explicit
- Enables submitter follow-up and resolution notifications

---

## 4. Keys and Integrity Rules

## Primary Keys

Each entity uses a dedicated primary key to guarantee uniqueness and stable references:

- User Id
- Workspace Id
- document Id
- version Id
- repo Id
- activity Id
- feedback Id

## Foreign Key Intent

The diagram indicates key dependencies such as:

- Activity.userId references User
- Document logically references Workspace and creator User
- Version logically references Document
- Feedback logically references User

Even where FK attributes are not exhaustively drawn for every relationship, the relationships imply these constraints should exist in implementation.

---

## 5. End-to-End Data Stories Supported by This ER Model

## Story 1: User creates documentation in a workspace

1. User exists in USER
2. User is associated with WORKSPACE through membership
3. User creates DOCUMENT in that workspace
4. Initial VERSION is created for that document
5. ACTIVITY logs the create action

## Story 2: User edits documentation over time

1. Existing DOCUMENT is updated
2. New VERSION row is added with versionNumber and message
3. ACTIVITY logs the update event
4. History can be reconstructed from VERSION rows

## Story 3: Workspace sync to GitHub

1. WORKSPACE has a SYNC_WITH relation to GITHUB_REPO
2. Document updates in workspace are candidates for repository sync
3. Sync results can be observed operationally with activity-style tracking

## Story 4: Product feedback loop

1. USER submits FEEDBACK
2. Feedback is stored with type and content
3. Admin process can consume FEEDBACK records for triage and resolution

---

## 6. Strengths of This Traditional ER Design

- Clear conceptual readability for presentations and reviews
- Correct emphasis on one-to-many patterns in collaborative systems
- Explicit separation between current content and version history
- Includes integration and audit dimensions, not only core content tables

---

## 7. Practical Limitations and Extension Notes

This traditional ER diagram is intentionally simplified. Production systems often extend it with:

- Explicit junction entity for workspace membership and permissions
- Rich auth/session provider entities
- Notification and comment entities
- Sync queue, conflict tracking, and webhook entities
- More complete FK attributes on each entity box

These additions do not invalidate the diagram. They deepen it for implementation-level completeness.

---

## 8. How to Use This Diagram During Development

Recommended usage:

1. Start with entities and relationships to understand domain boundaries
2. Derive API contracts from relationship ownership rules
3. Validate that every write path preserves referential integrity
4. Validate that every major user action can be represented by at least one entity update and one activity trace

If a feature is hard to place, ask:

1. Which entity owns the data?
2. Which relationship authorizes or scopes it?
3. Which history or audit entity records the event?

---

## 9. Quick Relationship Summary Table

- USER to WORKSPACE: membership association through MEMBER_OF, one user to many workspace links
- WORKSPACE to DOCUMENT: one to many
- USER to DOCUMENT: one to many through CREATES
- DOCUMENT to VERSION: one to many
- WORKSPACE to GITHUB_REPO: one to one in this model
- USER to ACTIVITY: one to many
- USER to FEEDBACK: one to many

This summary is the compact mental model behind the full traditional ER diagram.
