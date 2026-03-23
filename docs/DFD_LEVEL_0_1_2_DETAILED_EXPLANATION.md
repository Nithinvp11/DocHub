# DocHub DFD Detailed Explanation (Level 0, Level 1, Level 2)

## Purpose of This Document

This file explains the Data Flow Diagrams used in this project and how each level increases detail.

- Level 0 gives the system context view
- Level 1 gives major internal process decomposition
- Level 2 gives role-specific deep process flows (Admin and User)

Reference diagrams:

- [dfd-level-0.drawio](dfd-level-0.drawio)
- [dfd-level-1.drawio](dfd-level-1.drawio)
- [dfd-level-2-admin.drawio](dfd-level-2-admin.drawio)
- [dfd-level-2-user.drawio](dfd-level-2-user.drawio)

---

## 1. DFD Fundamentals Used in This Project

A DFD shows how data moves through a system.

Main elements:

- External Entity: actor outside the system boundary (for example: end user, admin, GitHub)
- Process: transformation of input data into output data
- Data Store: persistent storage (database tables, queues, logs)
- Data Flow: directional movement of data between entities, processes, and stores

In DocHub, DFDs are used to model:

- Authentication and access control
- Workspace and document operations
- Versioning and collaboration
- GitHub synchronization and webhook events
- Feedback and admin review operations

---

## 2. Level 0 DFD (System Context)

## 2.1 What Level 0 Represents

Level 0 is the highest abstraction. It treats DocHub as one single process and focuses on who exchanges data with the platform.

At this level, internal modules are hidden. The goal is to answer:

- Who sends data into the platform?
- What data comes back out?

## 2.2 External Entities in DocHub Context

Typical external entities represented for this project:

- User: signs in, creates documents, comments, reads notifications
- Admin: manages feedback, moderation, and platform operations
- GitHub: sends webhook events and receives pushed document updates
- Browser or client app: sends API requests and receives rendered responses

## 2.3 Main Context Flows

Common high-level flows at Level 0:

1. User to DocHub: credentials, document content, comments, workspace actions
2. DocHub to User: auth result, document lists, content responses, notifications
3. Admin to DocHub: review actions, resolution states, management commands
4. DocHub to Admin: feedback queue, analytics summaries, status updates
5. GitHub to DocHub: webhook payloads (push, pull request, issue)
6. DocHub to GitHub: synced markdown content, repository operations

## 2.4 Why Level 0 Matters

- Defines clear system boundary
- Clarifies integration points before implementation detail
- Helps non-technical and technical stakeholders align on scope

---

## 3. Level 1 DFD (Major Internal Modules)

## 3.1 What Level 1 Represents

Level 1 breaks the single Level 0 system process into core internal processes and key data stores.

In DocHub, this usually includes these major processes:

1. Authentication and session management
2. Workspace and membership management
3. Document management and editing
4. Version management
5. Collaboration and notification handling
6. GitHub integration and sync orchestration
7. Feedback collection and admin triage

## 3.2 Typical Data Stores at Level 1

These map to project database structures and service stores:

- User and session data store
- Workspace and membership data store
- Document and version data store
- Comment and notification data store
- GitHub integration and sync metadata store
- Feedback data store
- Queue or sync event store for async processing

## 3.3 Core Level 1 Flows in DocHub

### Authentication and Access

1. Client submits sign-in or OAuth callback data
2. Auth process validates credentials or provider response
3. Session data is created or refreshed
4. Access token or session state is returned

### Workspace and Membership

1. User sends create or join workspace request
2. Permission process validates capability rules
3. Membership and permission records are updated
4. Workspace state is returned to client

### Document Lifecycle

1. User sends document create or update payload
2. Document process validates path, ownership, and permissions
3. Content and metadata are saved
4. Response returns updated document state

### Versioning

1. Save operation triggers version snapshot creation
2. Version process computes metadata and version index
3. Version record is stored
4. History timeline is returned when requested

### Collaboration

1. Comment or mention is submitted
2. Collaboration process writes interaction records
3. Notification process generates recipient notifications
4. UI receives updated thread or alert data

### GitHub Sync

1. Document changes enqueue sync job
2. Sync process prepares content and target path
3. GitHub API call pushes or pulls data
4. Sync result and status are persisted

### Feedback Workflow

1. User submits feedback ticket
2. Feedback process stores details and priority
3. Admin reviews and updates status
4. Resolution notification is sent to submitter

## 3.4 Why Level 1 Matters

- Shows clear ownership of functional modules
- Helps map APIs and services to business capabilities
- Makes testing strategy easier by module

---

## 4. Level 2 DFD (Detailed Role-Based Flows)

DocHub has role-specific detail diagrams for Level 2:

- Admin flow detail
- User flow detail

Level 2 takes one Level 1 process and decomposes it into smaller subprocesses with explicit decisions and state transitions.

## 4.1 Level 2 Admin DFD Explanation

Reference:

- [dfd-level-2-admin.drawio](dfd-level-2-admin.drawio)

### Admin-Oriented Subprocesses

1. Authenticate admin identity
2. Authorize admin role and capabilities
3. Fetch pending operational data (feedback, reports, flagged content)
4. Review details and classify priority
5. Apply action (resolve, reassign, archive, escalate)
6. Persist audit trail and status changes
7. Trigger downstream notifications

### Data Inputs for Admin Level 2

- Admin session and role claims
- Feedback records and current statuses
- Activity logs or moderation signals
- Workspace and user context metadata

### Data Outputs for Admin Level 2

- Updated feedback state
- Resolution notes and assignee changes
- Notification events to users
- Audit records for traceability

### Key Decision Points

- Is actor authorized as admin?
- Is item valid and still actionable?
- Is escalation required?
- Should users be notified immediately or batched?

### Why Admin Level 2 Is Important

- Captures governance and operational control
- Makes compliance and audit behavior explicit
- Reduces ambiguity in role-based access implementation

## 4.2 Level 2 User DFD Explanation

Reference:

- [dfd-level-2-user.drawio](dfd-level-2-user.drawio)

### User-Oriented Subprocesses

1. Authenticate user
2. Resolve workspace membership and permissions
3. Retrieve document or workspace context
4. Perform user action (create, edit, comment, mention, submit feedback)
5. Validate and persist action
6. Create side effects (version entry, notification, sync queue job)
7. Return updated state to user

### Data Inputs for User Level 2

- Session identity and membership context
- Document content changes and metadata
- Comment or mention payloads
- Feedback submission payload

### Data Outputs for User Level 2

- Updated document data
- Version history entries
- Notification acknowledgements
- Sync status indicators
- Feedback submission confirmation

### Key Decision Points

- Does user have required permission for this action?
- Is content valid and safe to store?
- Does this update require new version creation?
- Should this action enqueue GitHub sync?

### Why User Level 2 Is Important

- Clarifies full user action lifecycle
- Connects UI actions to backend effects
- Makes it easier to debug failed requests or missing updates

---

## 5. Balancing Rules Between DFD Levels

When moving from one level to the next, balancing must hold:

- Inputs and outputs at Level 0 must be preserved when expanded into Level 1
- Inputs and outputs of a Level 1 process must be preserved in its Level 2 decomposition
- Decomposition should add detail, not change business meaning

For DocHub, this ensures:

- External integrations stay consistent
- Permissions and data ownership remain clear
- Sync and notification side effects are traceable

---

## 6. Practical Mapping to This Codebase

Use these files while reading the DFDs:

- [README.md](README.md): project features and setup
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md): architecture and modules
- [diagram.md](diagram.md): ER-focused data model context
- [prisma/schema.prisma](../prisma/schema.prisma): concrete persistent stores behind DFD data stores

Mapping examples:

- DFD Authentication process maps to auth routes and session models
- DFD Document process maps to document API routes and document/version tables
- DFD Sync process maps to GitHub integration models, webhooks, and queue workers
- DFD Feedback process maps to feedback routes and admin dashboards

---

## 7. How to Use These DFDs for Learning and Implementation

Recommended order:

1. Start with Level 0 to understand boundaries
2. Move to Level 1 to understand core modules
3. Dive into Level 2 Admin and User for operation-level behavior
4. Validate each flow against API handlers and Prisma models
5. Convert each subprocess into test cases

If a feature is unclear, ask these three questions:

1. Which level shows the missing detail?
2. Which process owns the transformation?
3. Which data store records the result?

---

## 8. Validation Checklist for Your DFD Understanding

You understand the DFD set when you can:

- Explain one end-to-end user flow from input to persistent output
- Explain one end-to-end admin moderation flow with audit impact
- Identify where GitHub webhook data enters and where sync status is stored
- Show which permissions gate each critical action
- Trace which data store changes for every major process outcome

---

## 9. Conclusion

The Level 0, Level 1, and Level 2 DFDs together provide a complete flow view of DocHub:

- Level 0 defines external scope
- Level 1 defines internal system modules
- Level 2 defines exact role-based operational behavior

Reading these levels in sequence creates a strong mental model for both development and debugging.
