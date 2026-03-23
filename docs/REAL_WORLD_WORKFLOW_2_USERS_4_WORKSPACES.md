# DocHub Real-World Workflow Example

## Overview

This document explains a realistic end-to-end workflow for DocHub using a concrete example with:

- 2 regular users
- 1 admin reviewer for feedback
- 4 workspaces
- 6 documents
- document versions
- mentions, comments, document locking, and feedback replies

The workflow is based on the implemented application flow in this repository, including actual form fields, document setup options, feedback handling, and version behavior.

## Example Actors

### User 1: Sarah Johnson

- Role: Regular user
- Username: `sarah_j`
- Full name: `Sarah Johnson`
- Email: `sarah.johnson@acme.local`
- Main responsibility: Product and documentation owner

### User 2: Daniel Reyes

- Role: Regular user
- Username: `daniel_reyes`
- Full name: `Daniel Reyes`
- Email: `daniel.reyes@acme.local`
- Main responsibility: Engineering contributor and API reviewer

### Admin Reviewer: Priya Nair

- Role: Admin
- Email: `admin.priya@acme.local`
- Main responsibility: Review platform feedback and respond to users

## Workspace Plan

The two users collaborate across four workspaces.

| Workspace            | Owner  | Description                                 | Member Limit | Main Use                              |
| -------------------- | ------ | ------------------------------------------- | ------------ | ------------------------------------- |
| Product Docs Hub     | Sarah  | Core product specs and release notes        | 10           | Shared internal product documentation |
| Engineering Runbooks | Daniel | Operational procedures and deployment notes | 15           | Engineering operations                |
| Customer Help Drafts | Sarah  | Draft user guides and FAQs                  | Unlimited    | End-user help content                 |
| API Standards Lab    | Daniel | API conventions and technical policies      | 8            | Engineering standards                 |

## Document Plan

The six documents below are distributed across the four workspaces.

| #   | Workspace            | Document Title              | Phase       | Type          | Path                                             |
| --- | -------------------- | --------------------------- | ----------- | ------------- | ------------------------------------------------ |
| 1   | Product Docs Hub     | Checkout Redesign Spec      | PLANNING    | SPECIFICATION | `/planning/specification/checkout-redesign-spec` |
| 2   | Product Docs Hub     | Release Notes May 2026      | COMPLETE    | GENERAL       | `/complete/general/release-notes-may-2026`       |
| 3   | Engineering Runbooks | Production Incident Runbook | DEVELOPMENT | GUIDE         | `/development/guide/production-incident-runbook` |
| 4   | Customer Help Drafts | Account Recovery Guide      | REVIEW      | GUIDE         | `/review/guide/account-recovery-guide`           |
| 5   | API Standards Lab    | REST Naming Standard        | COMPLETE    | RFC           | `/complete/rfc/rest-naming-standard`             |
| 6   | API Standards Lab    | Auth API Reference          | DEVELOPMENT | API_DOCS      | `/development/api-docs/auth-api-reference`       |

## End-to-End Workflow

## 1. Sarah Creates Her Account

Sarah opens the authentication page at `/auth` and switches to the sign-up tab.

She fills the sign-up form with these values:

| Field            | Value                      |
| ---------------- | -------------------------- |
| Username         | `sarah_j`                  |
| Full Name        | `Sarah Johnson`            |
| Email address    | `sarah.johnson@acme.local` |
| Password         | `AcmeDocs2026`             |
| Confirm Password | `AcmeDocs2026`             |

Password rules enforced by the app:

- at least 8 characters
- at least 1 uppercase letter
- at least 1 lowercase letter
- at least 1 number

After successful registration:

- Sarah is automatically signed in
- she is redirected to `/dashboard`
- her account becomes the owner of workspaces she creates later

## 2. Daniel Creates His Account

Daniel repeats the same process.

| Field            | Value                     |
| ---------------- | ------------------------- |
| Username         | `daniel_reyes`            |
| Full Name        | `Daniel Reyes`            |
| Email address    | `daniel.reyes@acme.local` |
| Password         | `DocsFlow2026`            |
| Confirm Password | `DocsFlow2026`            |

Daniel can also sign in later using the sign-in form:

| Field         | Value                     |
| ------------- | ------------------------- |
| Email address | `daniel.reyes@acme.local` |
| Password      | `DocsFlow2026`            |

## 3. Sarah Creates Two Workspaces

From the dashboard, Sarah clicks `New Workspace` and completes the `Create Workspace` dialog twice.

### Workspace A: Product Docs Hub

| Field        | Value                                                                                   |
| ------------ | --------------------------------------------------------------------------------------- |
| Name         | `Product Docs Hub`                                                                      |
| Description  | `Shared workspace for product specifications, release notes, and launch documentation.` |
| Member Limit | `10`                                                                                    |

### Workspace B: Customer Help Drafts

| Field        | Value                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ |
| Name         | `Customer Help Drafts`                                                                     |
| Description  | `Draft knowledge-base content for customer onboarding, troubleshooting, and account help.` |
| Member Limit | empty, which means unlimited                                                               |

## 4. Daniel Creates Two Workspaces

Daniel also clicks `New Workspace` and creates two more.

### Workspace C: Engineering Runbooks

| Field        | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Name         | `Engineering Runbooks`                                                      |
| Description  | `Procedures for incidents, deployments, maintenance, and service recovery.` |
| Member Limit | `15`                                                                        |

### Workspace D: API Standards Lab

| Field        | Value                                                                             |
| ------------ | --------------------------------------------------------------------------------- |
| Name         | `API Standards Lab`                                                               |
| Description  | `Architecture standards, API conventions, and review-ready technical references.` |
| Member Limit | `8`                                                                               |

## 5. Workspace Invitations and Permissions

Sarah invites Daniel to `Product Docs Hub` so he can review specifications and help with technical details.

The invitation flow uses either an email or user selection plus a permission array. In this example Sarah invites Daniel by email:

| Invitation Input | Value                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email            | `daniel.reyes@acme.local`                                                                                                                                                             |
| Permissions      | `workspace:view`, `documents:view`, `documents:create`, `documents:edit`, `versions:view`, `versions:create`, `versions:restore`, `comments:view`, `comments:create`, `activity:view` |

Daniel receives an invite notification and opens the invite page.

He clicks `Accept`, and the system creates a workspace member record with those permissions.

Daniel then invites Sarah into `API Standards Lab` with these permissions:

| Invitation Input | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Email            | `sarah.johnson@acme.local`                                           |
| Permissions      | `workspace:view`, `documents:view`, `comments:view`, `activity:view` |

This gives Sarah read-only visibility plus comment access, but not document editing rights.

## 6. Sarah Creates the First Document

Inside `Product Docs Hub`, Sarah clicks `New Document`.

The `Create New Document` dialog uses these fields:

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Document Title | `Checkout Redesign Spec`                                                                     |
| Phase          | `PLANNING`                                                                                   |
| Type           | `SPECIFICATION`                                                                              |
| Document Path  | auto-generated first, then manually kept as `/planning/specification/checkout-redesign-spec` |

Behavior at creation time:

- the editor opens immediately after creation
- initial content is blank in the form, but the backend ensures a valid initial document version
- version 1 is created automatically with message `Initial version`
- the document is associated with the workspace and author

## 7. Remaining Five Documents Are Created

The team creates the remaining documents using the same `Create New Document` dialog.

### Product Docs Hub

#### Document 2

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Document Title | `Release Notes May 2026`                   |
| Phase          | `COMPLETE`                                 |
| Type           | `GENERAL`                                  |
| Document Path  | `/complete/general/release-notes-may-2026` |

### Engineering Runbooks

#### Document 3

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Document Title | `Production Incident Runbook`                    |
| Phase          | `DEVELOPMENT`                                    |
| Type           | `GUIDE`                                          |
| Document Path  | `/development/guide/production-incident-runbook` |

### Customer Help Drafts

#### Document 4

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Document Title | `Account Recovery Guide`               |
| Phase          | `REVIEW`                               |
| Type           | `GUIDE`                                |
| Document Path  | `/review/guide/account-recovery-guide` |

### API Standards Lab

#### Document 5

| Field          | Value                                |
| -------------- | ------------------------------------ |
| Document Title | `REST Naming Standard`               |
| Phase          | `COMPLETE`                           |
| Type           | `RFC`                                |
| Document Path  | `/complete/rfc/rest-naming-standard` |

#### Document 6

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Document Title | `Auth API Reference`                       |
| Phase          | `DEVELOPMENT`                              |
| Type           | `API_DOCS`                                 |
| Document Path  | `/development/api-docs/auth-api-reference` |

## 8. Detailed Editing Workflow for One Full Document

The best way to understand DocHub is to follow one document from blank state to collaboration, versioning, feedback, and review.

We use Document 1: `Checkout Redesign Spec`.

### 8.1 Sarah Opens the Editor

Sarah opens:

- workspace: `Product Docs Hub`
- document: `Checkout Redesign Spec`

Editor capabilities available in the current implementation include:

- rich text headings and paragraphs
- bold, italic, strikethrough, and links
- blockquotes
- ordered and unordered lists
- task lists
- code blocks
- tables
- mentions
- comments dialog and inline collaboration
- document locking
- draft autosave
- GitHub sync controls when allowed

### 8.2 Sarah Clicks Edit

When Sarah begins editing:

- the document attempts to acquire a lock
- other users can see lock state and user presence
- unsaved changes are stored locally as draft protection
- draft versions may be auto-saved to the server with `isDraft: true`

### 8.3 Sarah Writes a Document Using Multiple Editor Tools

Below is a realistic example of the document content she enters. This example is written in markdown-style for readability, but in the application the editor stores rich HTML content.

````md
# Checkout Redesign Spec

## Purpose

This document defines the redesign of the checkout experience for Q2 2026. The goal is to reduce cart abandonment and improve payment completion rate.

> Business goal: reduce checkout drop-off by 18% within one quarter after release.

## Stakeholders

- Product Owner: Sarah Johnson
- Engineering Reviewer: @danielreyes
- Support Lead: Maria Gomez

## Scope

### In Scope

- 1-page checkout redesign
- saved address selection
- coupon field validation
- payment status messaging

### Out of Scope

- subscription billing changes
- loyalty points redesign

## Delivery Checklist

- [x] Problem identified
- [x] Success metric defined
- [ ] UI approved by design
- [ ] API contract finalized
- [ ] QA checklist completed

## User Flow

1. User reviews cart
2. User enters shipping information
3. User selects payment method
4. User confirms order
5. System displays success or failure state

## API Notes

Use the payment intent endpoint:

```ts
POST / api / checkout / payment - intent;

type PaymentIntentRequest = {
  cartId: string;
  couponCode?: string;
  paymentMethodId: string;
};
```
````

## Validation Rules

| Field      | Rule                        | Error Message                      |
| ---------- | --------------------------- | ---------------------------------- |
| email      | required and valid format   | Please enter a valid email address |
| couponCode | optional, max 32 chars      | Coupon code is too long            |
| postalCode | required for physical items | Postal code is required            |

## Related Resources

- [Design Board](https://example.com/designs/checkout-redesign)
- [Analytics Dashboard](https://example.com/analytics/checkout)

## Embedded Asset Placeholder

![Checkout Wireframe](https://example.com/assets/checkout-wireframe.png)

## Notes for Review

@danielreyes Please verify the validation rules and API assumptions before we move this to review.

```

This single example demonstrates most of the practical tools a documentation team would use in one working document.

## 9. Collaboration on the Same Document

### 9.1 Daniel Opens the Same Spec

Daniel opens `Checkout Redesign Spec` while Sarah is still editing.

What Daniel sees:

- lock indicator showing Sarah is editing
- presence information in the editor area
- he can review content but may be prevented from editing while the lock is active

### 9.2 Sarah Adds a Comment Request

Sarah highlights the sentence about validation rules and creates an inline comment:

| Field | Value |
| --- | --- |
| Comment content | `Daniel, should postal code validation happen before payment intent creation?` |
| Selection | selected text in the validation section |

### 9.3 Daniel Replies

Daniel later replies:

`Yes. Validation should happen before payment intent creation so we fail early and avoid unnecessary payment provider calls.`

The comment thread remains attached to the related selection and can later be resolved.

### 9.4 Mention Workflow

Because Sarah mentioned Daniel using `@danielreyes`, the system can match that mention against workspace members and preview notification targets. This gives teams a direct collaboration flow without leaving the document.

## 10. Version Workflow for the Example Document

The document goes through several saves and revision states.

### Version Timeline for `Checkout Redesign Spec`

| Version | Author | Trigger | Message | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sarah | initial creation | `Initial version` | Automatically created when document is created |
| 2 | Sarah | manual save | `Added business scope and API notes` | First meaningful saved version |
| Draft autosave | Sarah | auto draft | `Auto-save draft` | Not treated as a final manual milestone |
| 3 | Sarah | manual save | `Added validation rules and review checklist` | Structured content now ready for review |
| 4 | Daniel | manual save after approved edits | `Updated API validation notes after engineering review` | Technical corrections added |
| 5 | Sarah | restore action | `Restored from version 3` style outcome | Created when an older version is restored |

Important behavior:

- manual saves can create formal versions
- autosave drafts can create draft versions
- restored versions create a new latest version, not overwrite history
- versions can be renamed and tagged

### Example Version Tagging

Sarah adds tags to highlight milestones.

| Tag Name | Color | Description |
| --- | --- | --- |
| `ready-for-review` | Purple | Content is ready for engineering review |
| `baseline-v1` | Blue | First stable product spec snapshot |

## 11. Status and Maturity Progression

Although document creation starts with a working draft flow, the broader lifecycle can move through statuses such as draft, review, published, or archived depending on the page and workflow used.

For this example, `Checkout Redesign Spec` follows this business progression:

1. Created in planning
2. Edited as draft content
3. Reviewed by Daniel
4. Updated and versioned again
5. Marked ready for wider team review

## 12. Example Workflow Across All Six Documents

Here is a practical team sequence showing how the six documents evolve over time.

### Week 1

- Sarah creates `Checkout Redesign Spec`
- Daniel creates `Production Incident Runbook`
- Sarah creates `Account Recovery Guide`

### Week 2

- Sarah creates `Release Notes May 2026`
- Daniel creates `REST Naming Standard`
- Daniel creates `Auth API Reference`

### Week 3

- Sarah and Daniel collaborate on the checkout spec
- Daniel uses `REST Naming Standard` as a shared engineering reference
- Sarah reviews `Auth API Reference` in read-only mode and adds comments where permitted

### Week 4

- `Account Recovery Guide` moves toward review completion
- `Release Notes May 2026` becomes a finalized communication artifact
- `Production Incident Runbook` gets a new version after an operational drill

## 13. Feedback Submission Workflow

Later, Sarah wants to report a platform improvement request after using the editor.

She opens the feedback dialog and fills these fields.

| Field | Value |
| --- | --- |
| Feedback Type | `IMPROVEMENT` |
| Category | `collaboration` |
| Title | `Need clearer lock handoff when another editor leaves` |
| Description | `When another editor closes the page, it would help if the remaining user saw a clearer prompt that the lock is available again.` |
| Overall Experience | `4` stars |
| URL | auto-captured from current page |

When Sarah submits feedback:

- the feedback is stored against her account
- admins receive a notification that new feedback was submitted
- Sarah can later view her feedback history from settings

## 14. Admin Review and Reply Workflow

Priya, the admin reviewer, opens the admin feedback page and reviews Sarah's item.

She updates the record as follows:

| Admin Field | Value |
| --- | --- |
| Status | `IN_PROGRESS` |
| Priority | `MEDIUM` |
| Assigned To | admin-selected team member or left empty |
| Admin Reply | `Thanks, this is valid. We will improve lock-release messaging so other editors know immediately when the document becomes editable again.` |

Possible feedback statuses in the system:

- `NEW`
- `REVIEWING`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`
- `REJECTED`

Possible priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

After Priya saves the reply:

- Sarah receives a feedback reply notification
- the notification links her back to `/settings?tab=feedback`
- Sarah can see the admin reply attached to her submitted feedback item

## 15. What the Final State Looks Like

At the end of this scenario:

- 2 users are actively collaborating in DocHub
- 4 workspaces organize documentation by business area
- 6 documents cover product, support, API, and operational needs
- at least one document contains structured rich content using multiple editor tools
- comments and mentions support review without leaving the document
- versions preserve major milestones and draft protection
- feedback creates a closed communication loop between users and admins

## 16. Why This Is a Realistic Workflow

This example matches how the current DocHub application is structured:

- users register with username, name, email, password, and confirm password
- workspaces are created with name, description, and optional member limit
- documents are created with title, phase, type, and optional custom path
- document paths are validated and also influence GitHub path behavior
- the editor supports rich content, mentions, comments, autosave drafts, and locking
- versions are created on initial creation, manual save, autosave draft, and restore actions
- feedback supports user submission and admin reply management

## 17. Suggested Use as a Demo Script

This file can be used in three practical ways:

1. As a classroom or presentation demo of the full product workflow.
2. As a QA reference for end-to-end manual testing with realistic data.
3. As project documentation showing how authentication, workspaces, documents, versions, and feedback connect in one continuous process.
```
