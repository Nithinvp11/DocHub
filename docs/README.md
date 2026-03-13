# Documentation Hub

This folder is the main entry point for project documentation.

## Start Here

1. Read [Project Overview](./PROJECT_OVERVIEW.md)
2. Read [Production Quick Start](./QUICK_START_PRODUCTION.md)
3. Review [Project Completion Status](./PROJECT_COMPLETION_STATUS.md)

## Core Documents

- [Professional Documentation](./PROFESSIONAL_DOCUMENTATION.md) - Abstract, Background, Problem Definition, Methodology, Objectives, Modules, Scope, and Constraints
- [Project Overview](./PROJECT_OVERVIEW.md) - Scope, architecture, and key modules
- [Complete Feature Summary](./COMPLETE_FEATURE_SUMMARY.md) - Implemented platform capabilities
- [Complete Learning Guide](./COMPLETE_LEARNING_GUIDE.md) - End-to-end learning and onboarding
- [Manual Testing Guide](./MANUAL_TESTING_GUIDE.md) - Verification scenarios
- [Project Completion Status](./PROJECT_COMPLETION_STATUS.md) - Current delivery status
- [Production Quick Start](./QUICK_START_PRODUCTION.md) - Production deployment checklist

## Architecture Artifacts

- [DFD Level 0](./dfd-level-0.drawio)
- [DFD Level 1](./dfd-level-1.drawio)
- [DFD Level 2 (Admin)](./dfd-level-2-admin.drawio)
- [DFD Level 2 (User)](./dfd-level-2-user.drawio)
- [ER Diagram](./er-diagram.drawio)
- [ER Diagram (Traditional)](./er-diagram-traditional.drawio)
- [Use Case Diagram](./use-case-diagram.drawio)

## Writing New Documentation

Use the templates in [`docs/templates`](./templates):

- `FEATURE_TEMPLATE.md` for feature-level docs
- `API_TEMPLATE.md` for endpoint/module docs
- `RUNBOOK_TEMPLATE.md` for operational procedures

## Recommended Documentation Workflow

1. Start with `PROJECT_OVERVIEW.md` updates for architecture or module changes.
2. Add/modify feature docs using `templates/FEATURE_TEMPLATE.md`.
3. If external interfaces changed, add API docs with `templates/API_TEMPLATE.md`.
4. If deployment/operations changed, update runbooks with `templates/RUNBOOK_TEMPLATE.md`.
5. Add links to any new documents from this index.
