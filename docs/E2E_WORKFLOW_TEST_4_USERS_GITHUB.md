# End-to-End Workflow Test (4 Users + GitHub Sync)

**Version:** 1.0  
**Date:** March 14, 2026  
**Purpose:** Validate a complete real-world flow for workspace creation, member onboarding, document collaboration, and GitHub sync.

---

## 1. Test Goal

This test verifies all core business flows using four users:

- Main user links GitHub and creates workspace
- Main user adds one member
- Added member invites another member
- Team creates and updates documents with realistic content
- Documents are synced to GitHub
- Activity, membership, and permissions remain correct across actions

---

## 2. Test Users (Realistic Dataset)

Use these four accounts for repeatable testing:

1. **Aarav Mehta** (Main User / Workspace Owner)  
   Email: `aarav.mehta@acme-docs.com`  
   Role: `USER`  
   GitHub: `aarav-acme`

2. **Nisha Rao** (Editor + Delegator)  
   Email: `nisha.rao@acme-docs.com`  
   Role: `USER`  
   GitHub: `nisha-rao`

3. **Kabir Shah** (Contributor, invited by Nisha)  
   Email: `kabir.shah@acme-docs.com`  
   Role: `USER`  
   GitHub: `kabir-sh`

4. **Meera Iyer** (Reviewer)  
   Email: `meera.iyer@acme-docs.com`  
   Role: `USER`  
   GitHub: `meera-iyer`

---

## 3. GitHub Test Repository

Use one dedicated repository for this scenario:

- Repository: `acme-docs/customer-success-playbook`
- Branch: `main`
- Optional test branch: `feature/workspace-collab-e2e`

Recommended folder structure in GitHub:

- `docs/onboarding/`
- `docs/runbooks/`
- `docs/policies/`

---

## 4. Workspace Setup Flow

### Step 4.1 Main User Login + GitHub Link

**Actor:** Aarav  
**Action:**

1. Sign in to DocHub
2. Open Settings -> Integrations
3. Connect GitHub account (`aarav-acme`)

**Expected Result:**

- GitHub status shows connected
- OAuth/token data saved
- Activity entry created for GitHub connect event

---

### Step 4.2 Create Workspace

**Actor:** Aarav  
**Action:**

1. Create workspace: `Customer Success Operations`
2. Description: `Cross-functional docs for onboarding, support, and escalation`
3. Save

**Expected Result:**

- Workspace appears in dashboard
- Owner is Aarav
- Activity contains `WORKSPACE_CREATED`

---

### Step 4.3 Add First Member

**Actor:** Aarav  
**Action:**

1. Open Workspace -> Members
2. Invite Nisha (`nisha.rao@acme-docs.com`)
3. Assign permissions:
   - `documents:view`
   - `documents:create`
   - `documents:edit`
   - `members:invite`
   - `activity:view`

**Expected Result:**

- Invite status: pending -> accepted by Nisha
- Nisha becomes active member
- Activity shows `INVITE_SENT`, `INVITE_ACCEPTED`, and `MEMBER_ADDED`

---

### Step 4.4 Delegated Invite by Member

**Actor:** Nisha  
**Action:**

1. Sign in as Nisha
2. Go to same workspace
3. Invite Kabir (`kabir.shah@acme-docs.com`)
4. Assign contributor-level permissions:
   - `documents:view`
   - `documents:create`
   - `documents:edit`

**Expected Result:**

- Delegated invite succeeds (Nisha has invite permission)
- Kabir accepts invite
- Activity metadata shows invited-by chain (Aarav -> Nisha -> Kabir where applicable)

---

### Step 4.5 Add Reviewer User

**Actor:** Aarav  
**Action:**

1. Invite Meera (`meera.iyer@acme-docs.com`)
2. Assign review-focused permissions:
   - `documents:view`
   - `comments:create`
   - `activity:view`

**Expected Result:**

- Meera joins with restricted scope
- Permission boundaries are enforced (no unauthorized edit actions)

---

## 5. Document Collaboration Flow (Real-World Content)

### Step 5.1 Create Document 1 (Onboarding)

**Actor:** Aarav  
**Title:** `Customer Onboarding SOP`

**Suggested content to paste:**

```markdown
# Customer Onboarding SOP

## Objective

Provide a consistent 14-day onboarding journey for new enterprise customers.

## Day 0-2

- Confirm stakeholders and communication channel
- Schedule kickoff call
- Validate integration prerequisites

## Day 3-7

- Configure project workspace
- Enable user roles and SSO
- Share admin quick-start guide

## Day 8-14

- Track activation milestones
- Run health-check review
- Handover to support success manager

## Success Metrics

- Time to First Value <= 7 days
- Activation Rate >= 85%
- First month churn < 3%
```

**Expected Result:**

- Document created and visible to all members with view permission
- Activity shows `DOCUMENT_CREATED`

---

### Step 5.2 Create Document 2 (Incident Runbook)

**Actor:** Nisha  
**Title:** `P1 Incident Response Runbook`

**Suggested content to paste:**

```markdown
# P1 Incident Response Runbook

## Severity Definition

P1 = Service unavailable for multiple customers.

## Immediate Actions (0-15 min)

1. Declare incident in #incidents
2. Assign Incident Commander
3. Start timeline logging

## Containment (15-60 min)

- Rollback last deployment if applicable
- Enable failover strategy
- Publish customer status update

## Resolution

- Validate system recovery
- Confirm customer impact ended
- Close incident channel with summary

## Postmortem

- Publish RCA within 48 hours
- Define preventive action items
```

**Expected Result:**

- Nisha can create and save document
- Kabir can edit if permissions allow
- Meera can comment but cannot perform restricted actions
- Activity includes `DOCUMENT_CREATED` and `DOCUMENT_UPDATED`

---

### Step 5.3 Collaborative Update + Comment

**Actors:** Kabir and Meera  
**Action:**

1. Kabir edits Document 2 and adds a new section: `Communication Templates`
2. Meera adds inline comment requesting escalation matrix details
3. Nisha resolves or replies to comment

**Expected Result:**

- Version history increases
- Comment thread persists
- Activity includes `VERSION_CREATED`, `COMMENT_ADDED`, and optionally `COMMENT_RESOLVED`

---

## 6. GitHub Sync Flow

### Step 6.1 Connect Workspace to Repo

**Actor:** Aarav  
**Action:**

1. Workspace -> GitHub Sync
2. Select repo: `acme-docs/customer-success-playbook`
3. Select branch: `main`
4. Confirm mapping to `/docs`

**Expected Result:**

- Integration record saved
- Sync status visible in workspace
- Activity shows repo connection/sync event

---

### Step 6.2 Export Documents to GitHub

**Actor:** Aarav  
**Action:**

1. Export `Customer Onboarding SOP`
2. Export `P1 Incident Response Runbook`

**Expected GitHub files:**

- `docs/onboarding/customer-onboarding-sop.md`
- `docs/runbooks/p1-incident-response.md`

**Expected Result:**

- Export success response with file count
- Activity includes `GITHUB_EXPORT` with `filesExported > 0`

---

### Step 6.3 Import/Resync from GitHub

**Actor:** Aarav or Nisha  
**Action:**

1. Update one file directly in GitHub (for example add section in onboarding SOP)
2. Run import/sync in DocHub

**Expected Result:**

- Content updates in DocHub document
- New version created
- Activity includes `GITHUB_IMPORT` and/or `GITHUB_REPO_SYNCED`

---

## 7. Permission Validation Matrix

Validate these expected behaviors:

1. Aarav can do all actions in workspace
2. Nisha can invite members and edit docs
3. Kabir cannot invite members (if not granted)
4. Meera cannot edit docs if only review permissions are assigned
5. Unauthorized actions return proper error status (403)

---

## 8. Activity Log Validation

Check both workspace activity and user-level activity:

1. Workspace should show member invites, joins, document changes, and GitHub sync events
2. Each user should see their own actions in personal activity stream
3. If a member is removed later, historical actions should remain visible (no history wipe)
4. GitHub import/export entries should include repository and file count metadata

---

## 9. Optional Removal and Retention Tests

Run these additional checks to validate retention behavior:

1. Remove Kabir from workspace
   - His historical actions still visible in activity
2. Delete one document
   - Document delete event remains in activity
3. Delete workspace (in a disposable test run)
   - Final `WORKSPACE_DELETED` event exists
   - Historical events are retained for audit views where supported

---

## 10. Pass Criteria

Mark this scenario as passed only if all are true:

1. All four users complete expected collaboration journey
2. Delegated member invite works as designed
3. Documents are created, edited, versioned, and commented successfully
4. GitHub export and import both work with real content
5. Activity logs remain complete and auditable across member/document/workspace lifecycle events
6. Permission enforcement blocks unauthorized actions without breaking allowed flows

---

## 11. Quick Execution Checklist

1. Create/link 4 users
2. Link GitHub for Aarav
3. Create workspace
4. Add Nisha
5. Nisha adds Kabir
6. Add Meera as reviewer
7. Create 2 real docs and edit collaboratively
8. Export to GitHub
9. Modify in GitHub and import back
10. Verify permissions + activity retention
