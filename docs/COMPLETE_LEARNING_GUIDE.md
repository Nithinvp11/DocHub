# 📚 Complete Learning Guide - DocHub – Collaborative Documentation Platform

**Last Updated**: January 21, 2026  
**Version**: 1.0.0  
**Project Type**: Full-Stack Collaborative Documentation Platform

---

## 📑 Table of Contents

1. [Technology Stack Overview](#1-technology-stack-overview)
2. [Project Architecture](#2-project-architecture)
3. [Directory Structure Explained](#3-directory-structure-explained)
4. [Learning Path (Beginner to Advanced)](#4-learning-path-beginner-to-advanced)
5. [Core Concepts & Technologies](#5-core-concepts--technologies)
6. [File-by-File Guide](#6-file-by-file-guide)
7. [Common Patterns & Conventions](#7-common-patterns--conventions)
8. [Testing Knowledge](#8-testing-knowledge)
9. [Troubleshooting & Known Issues](#9-troubleshooting--known-issues)
10. [Resources & References](#10-resources--references)

---

## 1. Technology Stack Overview

### 🎯 Core Stack (Essential)

| Technology       | Version | Purpose                      | Learning Priority   |
| ---------------- | ------- | ---------------------------- | ------------------- |
| **TypeScript**   | 5.x     | Type-safe JavaScript         | ⭐⭐⭐⭐⭐ Critical |
| **Next.js**      | 16.0.3  | React framework (App Router) | ⭐⭐⭐⭐⭐ Critical |
| **React**        | 19.2.0  | UI library                   | ⭐⭐⭐⭐⭐ Critical |
| **PostgreSQL**   | Any     | Database                     | ⭐⭐⭐⭐⭐ Critical |
| **Prisma**       | 6.19.0  | ORM & database toolkit       | ⭐⭐⭐⭐⭐ Critical |
| **NextAuth.js**  | 4.24.13 | Authentication               | ⭐⭐⭐⭐ Important  |
| **Tailwind CSS** | 4.x     | Styling framework            | ⭐⭐⭐⭐ Important  |

### 🔧 Frontend Libraries

| Library                       | Purpose                 | When Used                   |
| ----------------------------- | ----------------------- | --------------------------- |
| **TipTap**                    | Rich text editor        | Document editing            |
| **Radix UI**                  | Headless UI components  | Dialogs, dropdowns, selects |
| **Lucide React**              | Icon library            | All icons in UI             |
| **Sonner**                    | Toast notifications     | Success/error messages      |
| **React Markdown**            | Markdown rendering      | Display formatted text      |
| **Socket.IO Client**          | Real-time communication | Live updates, presence      |
| **date-fns**                  | Date formatting         | Date display & manipulation |
| **clsx** / **tailwind-merge** | CSS class management    | Conditional styling         |

### 🛠️ Backend Libraries

| Library                     | Purpose              | When Used           |
| --------------------------- | -------------------- | ------------------- |
| **bcryptjs**                | Password hashing     | User authentication |
| **jsonwebtoken**            | JWT token generation | API authentication  |
| **zod**                     | Schema validation    | Input validation    |
| **octokit**                 | GitHub API client    | GitHub integration  |
| **Socket.IO**               | WebSocket server     | Real-time features  |
| **cron**                    | Task scheduling      | Automated sync      |
| **winston** (via logger.ts) | Logging              | Error tracking      |

### 🧪 Testing & Development

| Tool                | Purpose                  | Usage                  |
| ------------------- | ------------------------ | ---------------------- |
| **Jest**            | Unit/integration testing | `npm test`             |
| **Playwright**      | E2E testing              | `npm run test:e2e`     |
| **Testing Library** | React component testing  | With Jest              |
| **ESLint**          | Code linting             | `npm run lint`         |
| **Prettier**        | Code formatting          | `npm run format`       |
| **tsx**             | TypeScript executor      | Run .ts files directly |

### 📦 Additional Tools

| Tool                 | Purpose                             |
| -------------------- | ----------------------------------- |
| **diff-match-patch** | Text diffing for version comparison |
| **turndown**         | HTML to Markdown conversion         |
| **lowlight**         | Syntax highlighting in editor       |
| **mermaid**          | Diagram rendering                   |
| **crypto-js**        | Encryption utilities                |

---

## 2. Project Architecture

### 🏗️ Architectural Pattern: **Next.js Full-Stack Application**

```text
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React 19   │─▶│  Next.js 16  │◀─│  TypeScript  │     │
│  │  Components  │  │  App Router  │  │     Types    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│  ┌──────────────────────────────────────────────────┐     │
│  │         TipTap Editor + Radix UI + Tailwind      │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                  HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Next.js API │─▶│  NextAuth.js │◀─│   Middleware │     │
│  │    Routes    │  │     Auth     │  │ Rate Limiting│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│  ┌──────────────────────────────────────────────────┐     │
│  │              Business Logic Layer                │     │
│  │  (services, queries, validations, caching)       │     │
│  └──────────────────────────────────────────────────┘     │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────┐     │
│  │           Prisma ORM + PostgreSQL                │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                     External APIs
                            │
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  GitHub API  │  │   Webhooks   │  │    Cron      │     │
│  │   (Octokit)  │  │   (Socket)   │  │  Scheduler   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow

1. **Client Request** → Browser sends HTTP/WebSocket request
2. **Next.js Routing** → App Router handles request
3. **Middleware** → Authentication, rate limiting, logging
4. **API Route** → Business logic, validation (Zod)
5. **Service Layer** → Complex operations, caching
6. **Prisma ORM** → Database queries
7. **PostgreSQL** → Data persistence
8. **Response** → JSON/HTML back to client

### 🎨 Rendering Strategy

- **SSR (Server-Side Rendering)**: Initial page loads
- **CSR (Client-Side Rendering)**: Interactive features, editor
- **API Routes**: Backend endpoints (`/api/*`)
- **WebSocket**: Real-time updates (document locks, presence)

---

## 3. Directory Structure Explained

### 📁 Root Directory

```
repo-aware-knowledge-hub/
├── 📁 .github/              # GitHub Actions CI/CD workflows
│   ├── copilot-instructions.md  # AI assistant context
│   └── workflows/
│       └── ci.yml           # Automated testing pipeline
│
├── 📁 .vscode/              # VS Code workspace settings
│   ├── launch.json          # Debug configurations
│   └── settings.json        # Editor preferences
│
├── 📁 docs/                 # Project documentation
│   ├── IMPROVEMENTS_IMPLEMENTED.md
│   ├── TESTING_EXAMPLES.md
│   └── IMPLEMENTATION_SUMMARY.md
│
├── 📁 e2e/                  # End-to-end tests (Playwright)
│   ├── auth.spec.ts         # Authentication flows
│   ├── documents.spec.ts    # Document operations
│   ├── navigation.spec.ts   # Navigation tests
│   └── workspaces.spec.ts   # Workspace management
│
├── 📁 prisma/               # Database schema & migrations
│   ├── schema.prisma        # Main database schema
│   ├── schema-github-sync.prisma  # GitHub sync schema
│   └── seed.ts              # Database seeding script
│
├── 📁 public/               # Static assets (served as-is)
│   ├── images/              # Images, logos
│   └── favicon.ico          # Browser icon
│
├── 📁 scripts/              # Utility scripts
│   └── create-admin.ts      # Create admin user CLI
│
├── 📁 src/                  # Source code (main application)
│   ├── 📁 app/              # Next.js 16 App Router pages
│   ├── 📁 components/       # React components
│   ├── 📁 hooks/            # Custom React hooks
│   ├── 📁 lib/              # Utility functions & services
│   ├── 📁 types/            # TypeScript type definitions
│   └── 📁 __tests__/        # Integration tests
│
├── .env                     # Environment variables (DO NOT COMMIT)
├── .env.example             # Example environment file
├── .gitignore               # Git ignore rules
├── components.json          # Shadcn UI configuration
├── eslint.config.mjs        # ESLint configuration
├── jest.config.js           # Jest test configuration
├── jest.setup.js            # Jest test setup
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies & scripts
├── playwright.config.ts     # Playwright E2E config
├── postcss.config.mjs       # PostCSS (Tailwind) config
├── README.md                # Project overview
├── server.ts                # Custom server with WebSocket
├── tsconfig.json            # TypeScript configuration
└── vercel.json              # Vercel deployment config
```

---

### 📁 `/src/app/` - Next.js App Router (Pages)

**Purpose**: Define routes, pages, and layouts using Next.js 16 App Router convention.

```
src/app/
├── layout.tsx               # Root layout (wraps all pages)
├── page.tsx                 # Home page (/)
├── globals.css              # Global styles
│
├── 📁 auth/                 # Authentication pages
│   ├── signin/
│   │   └── page.tsx         # Login page (/auth/signin)
│   ├── signup/
│   │   └── page.tsx         # Registration (/auth/signup)
│   └── error/
│       └── page.tsx         # Auth error page
│
├── 📁 dashboard/            # Main application dashboard
│   ├── page.tsx             # Dashboard home (/dashboard)
│   └── [id]/                # Dynamic workspace route
│       ├── page.tsx         # Workspace view (/dashboard/{workspaceId})
│       ├── settings/
│       │   └── page.tsx     # Workspace settings
│       └── documents/
│           └── [documentId]/
│               └── page.tsx # Document editor (/dashboard/{id}/documents/{docId})
│
├── 📁 connections/          # GitHub connections
│   └── page.tsx             # Manage GitHub repos
│
├── 📁 search/               # Search interface
│   └── page.tsx             # Search results (/search)
│
├── 📁 settings/             # User settings
│   └── page.tsx             # Account settings
│
├── 📁 admin/                # Admin panel
│   └── page.tsx             # Admin dashboard (restricted)
│
└── 📁 api/                  # Backend API routes
    ├── 📁 auth/             # NextAuth.js routes
    │   └── [...nextauth]/
    │       └── route.ts     # Auth handler
    │
    ├── 📁 documents/        # Document operations
    │   ├── route.ts         # List/create documents
    │   └── [id]/
    │       ├── route.ts     # Get/update/delete document
    │       ├── lock/        # Document locking
    │       ├── versions/    # Version history
    │       └── comments/    # Comments API
    │
    ├── 📁 workspaces/       # Workspace operations
    │   ├── route.ts         # List/create workspaces
    │   └── [id]/
    │       ├── route.ts     # Get/update/delete workspace
    │       ├── members/     # Member management
    │       └── documents/   # Workspace documents
    │
    ├── 📁 github/           # GitHub integration
    │   ├── repos/           # Repository operations
    │   ├── sync/            # Sync operations
    │   ├── webhooks/        # Webhook receiver
    │   └── export/          # Export to GitHub
    │
    ├── 📁 search/           # Search API
    │   └── route.ts         # Full-text search
    │
    ├── 📁 notifications/    # Notification system
    │   └── route.ts         # Get/mark notifications
    │
    ├── 📁 user/             # User operations
    │   └── route.ts         # User profile
    │
    ├── 📁 health/           # Health check
    │   └── route.ts         # System status
    │
    └── 📁 webhooks/         # External webhooks
        └── github/
            └── route.ts     # GitHub webhook handler
```

**Key Concepts**:

- `layout.tsx` = Shared UI wrapper for pages
- `page.tsx` = Route endpoint (becomes URL)
- `[id]` = Dynamic route parameter
- `route.ts` = API endpoint (GET, POST, PUT, DELETE)

---

### 📁 `/src/components/` - React Components

**Purpose**: Reusable UI components organized by feature.

```
src/components/
│
├── 📝 DOCUMENT COMPONENTS
│   ├── document-editor.tsx          # Main TipTap rich text editor
│   ├── document-list.tsx            # List of documents in workspace
│   ├── DocumentActions.tsx          # Document dropdown menu (delete, export, etc.)
│   ├── DocumentBreadcrumb.tsx       # Navigation breadcrumb
│   ├── DocumentStatistics.tsx       # Word count, read time stats
│   ├── diff-viewer.tsx              # Visual diff for versions
│   ├── VersionHistory.tsx           # Version timeline & restore
│   ├── create-document-dialog.tsx   # "New Document" modal
│   ├── document-filters.tsx         # Filter by tags, status
│   ├── RichTextEditor.tsx           # Alternative editor component
│   └── TipTapExtensions.tsx         # Custom TipTap extensions
│
├── 🏢 WORKSPACE COMPONENTS
│   ├── create-workspace-dialog.tsx  # "New Workspace" modal
│   ├── workspace-settings-dialog.tsx # Workspace settings modal
│   ├── manage-members-dialog.tsx    # Invite/manage members
│   ├── WorkspaceActions.tsx         # Workspace dropdown menu
│   └── DashboardClient.tsx          # Dashboard container
│
├── 💬 COLLABORATION COMPONENTS
│   ├── comments-dialog.tsx          # Comments sidebar
│   ├── InlineComments.tsx           # Text selection comments
│   ├── MentionList.tsx              # @mention autocomplete
│   ├── NotificationBell.tsx         # Notification icon + dropdown
│   ├── NotificationsPanel.tsx       # Notifications list
│   └── ActivityFeed.tsx             # Activity timeline
│
├── 🐙 GITHUB INTEGRATION
│   ├── github-sync-dialog.tsx       # Sync configuration
│   ├── GitHubSyncButton.tsx         # Manual sync trigger
│   ├── GitHubDashboard.tsx          # GitHub overview
│   ├── GitHubBranchSwitcher.tsx     # Switch branches
│   ├── GitHubCommitHistory.tsx      # Commit timeline
│   ├── GitHubConflictResolver.tsx   # Merge conflict UI
│   └── BacklinksPanel.tsx           # Document backlinks
│
├── 🎨 UI BUILDING BLOCKS (Radix UI wrappers)
│   └── ui/
│       ├── button.tsx               # Button component
│       ├── dialog.tsx               # Modal dialog
│       ├── dropdown-menu.tsx        # Dropdown menu
│       ├── input.tsx                # Text input
│       ├── label.tsx                # Form label
│       ├── select.tsx               # Select dropdown
│       ├── separator.tsx            # Horizontal line
│       ├── tabs.tsx                 # Tab navigation
│       ├── toast.tsx                # Toast notification
│       ├── progress.tsx             # Progress bar
│       ├── avatar.tsx               # User avatar
│       ├── checkbox.tsx             # Checkbox input
│       └── popover.tsx              # Popover component
│
├── 🎯 UTILITY COMPONENTS
│   ├── ErrorBoundary.tsx            # Error recovery boundary
│   ├── LoadingStates.tsx            # Skeleton loaders
│   ├── LoadingButton.tsx            # Button with spinner
│   ├── EmptyStates.tsx              # "No data" placeholders
│   ├── AutoSaveIndicator.tsx        # "Saving..." indicator
│   ├── DocumentLockIndicator.tsx    # Lock status badge
│   ├── LockStatusBanner.tsx         # Document locked banner
│   ├── SearchComponent.tsx          # Search input + results
│   ├── RecentDocuments.tsx          # Recent docs widget
│   ├── StatusSelector.tsx           # Document status picker
│   ├── TagSelector.tsx              # Tag multi-select
│   ├── EditorToolbar.tsx            # Editor formatting toolbar
│   ├── TemplateGallery.tsx          # Document templates
│   ├── CoverImagePicker.tsx         # Document cover image
│   ├── CustomPropertiesEditor.tsx   # Custom metadata fields
│   ├── FileUploadProgress.tsx       # Upload progress bar
│   └── EnhancedMarkdown.tsx         # Markdown renderer with extensions
│
└── 📁 __tests__/                    # Component tests
    ├── ui.test.tsx                  # UI component tests
    ├── EmptyStates.test.tsx         # Empty state tests
    └── advanced-interactions.test.tsx # Complex interaction tests
```

**Component Categories**:

1. **Page Components**: Full-page containers
2. **Feature Components**: Domain-specific (documents, workspaces)
3. **UI Components**: Generic, reusable building blocks
4. **Layout Components**: Headers, sidebars, navigation

---

### 📁 `/src/lib/` - Library & Utilities

**Purpose**: Business logic, utilities, services, and shared code.

```
src/lib/
│
├── 🗄️ DATABASE & ORM
│   ├── prisma.ts                # Prisma client singleton
│   ├── queries.ts               # Optimized database queries
│   ├── cache.ts                 # LRU cache with TTL
│   └── constants.ts             # App-wide constants
│
├── 🔐 AUTHENTICATION & SECURITY
│   ├── auth.ts                  # NextAuth.js configuration
│   ├── session.ts               # Session utilities
│   ├── api-middleware.ts        # API authentication middleware
│   ├── rate-limit.ts            # Rate limiting logic
│   └── admin.ts                 # Admin authorization checks
│
├── ✅ VALIDATION & SANITIZATION
│   ├── validations.ts           # Zod schemas for input validation
│   ├── sanitize.ts              # XSS protection, HTML sanitization
│   └── env.ts                   # Environment variable validation
│
├── 🐙 GITHUB INTEGRATION
│   ├── github.ts                # GitHub API client (Octokit)
│   ├── github-sync-service.ts   # Bidirectional sync logic
│   ├── github-sync-scheduler.ts # Cron job scheduler
│   └── github-rate-limit.ts     # GitHub API rate limit handling
│
├── 🔔 REAL-TIME & NOTIFICATIONS
│   ├── websocket.ts             # Socket.IO server setup
│   ├── notifications.ts         # Notification creation & delivery
│   └── document-lock.ts         # Document locking mechanism
│
├── 📝 DOCUMENT PROCESSING
│   ├── converters.ts            # HTML ↔ Markdown conversion
│   ├── document-stats.ts        # Word count, read time calculation
│   └── tiptap/                  # TipTap editor extensions
│       ├── mention-extension.ts
│       ├── link-extension.ts
│       └── image-extension.ts
│
├── 🛠️ UTILITIES
│   ├── utils.ts                 # General utilities (cn, formatDate, etc.)
│   ├── logger.ts                # Winston logging setup
│   ├── errors.ts                # Custom error classes
│   ├── error-handler.ts         # Centralized error handling
│   ├── toast.ts                 # Toast notification helpers
│   ├── avatar.ts                # Avatar URL generation
│   ├── imageUpload.ts           # Image upload handling
│   └── activity.ts              # Activity logging
│
├── 🎨 DESIGN SYSTEM
│   ├── design-system.ts         # Design tokens (colors, spacing, etc.)
│   ├── typography.ts            # Typography utilities
│   └── animations.ts            # Animation utilities
│
├── 📁 __mocks__/                # Jest mocks for testing
│   └── prisma.ts                # Mocked Prisma client
│
└── 📁 __tests__/                # Library tests
    ├── activity.test.ts         # Activity logging tests
    ├── converters.test.ts       # Conversion tests
    ├── logger.test.ts           # Logger tests
    ├── sanitize.test.ts         # Sanitization tests
    ├── toast.test.ts            # Toast tests
    ├── utils.test.ts            # Utility function tests
    └── validations.test.ts      # Validation tests
```

**Key Files to Understand**:

- **prisma.ts**: Database connection singleton
- **auth.ts**: Authentication configuration
- **validations.ts**: All input validation schemas
- **github-sync-service.ts**: Core GitHub sync logic
- **error-handler.ts**: Centralized error handling

---

### 📁 `/src/hooks/` - Custom React Hooks

**Purpose**: Reusable React state logic and side effects.

```
src/hooks/
├── use-toast.ts             # Toast notification hook (Sonner)
├── useDocumentLock.ts       # Document locking hook
├── useOptimisticUpdate.ts   # Optimistic UI updates
└── useWebSocket.ts          # WebSocket connection hook
```

**Example Usage**:

```typescript
import { useDocumentLock } from '@/hooks/useDocumentLock';

const { lockDocument, unlockDocument, isLocked } = useDocumentLock(documentId);
```

---

### 📁 `/src/types/` - TypeScript Types

**Purpose**: Custom type definitions for external libraries.

```
src/types/
├── next-auth.d.ts           # Extend NextAuth types
└── turndown-plugin-gfm.d.ts # Types for turndown plugin
```

---

### 📁 `/src/__tests__/integration/` - Integration Tests

**Purpose**: Test multiple components/services working together.

```
src/__tests__/integration/
├── document-workflow.test.ts      # Create → Edit → Save flow
└── workspace-collaboration.test.ts # Multi-user scenarios
```

---

### 📁 `/prisma/` - Database Schema

**Purpose**: Define database models, relations, and migrations.

```
prisma/
├── schema.prisma              # Main database schema (20+ models)
├── schema-github-sync.prisma  # GitHub integration models
└── seed.ts                    # Database seeding script
```

**Key Models** (see [schema.prisma](../prisma/schema.prisma)):

- **User**: Authentication & profile
- **Workspace**: Team/project container
- **Document**: Content with versioning
- **Version**: Document snapshots
- **Comment**: Inline & thread comments
- **Activity**: Audit log
- **Notification**: User notifications
- **GitHubRepo**: Connected repositories

---

## 4. Learning Path (Beginner to Advanced)

### 🟢 Level 1: Fundamentals (Week 1-2)

**Goal**: Understand basic web development concepts and tools.

#### Prerequisites

- [ ] HTML/CSS basics
- [ ] JavaScript ES6+ features
- [ ] Git & GitHub basics
- [ ] Command line/terminal usage

#### Learn These First

1. **TypeScript Basics** (2-3 days)
   - Types, interfaces, generics
   - Type inference and annotations
   - **Resource**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

2. **React Fundamentals** (3-4 days)
   - Components, props, state
   - Hooks (useState, useEffect, useCallback)
   - Event handling
   - **Resource**: [React Docs](https://react.dev/learn)

3. **Next.js App Router** (2-3 days)
   - File-based routing
   - Server vs Client Components
   - Layouts and pages
   - **Resource**: [Next.js Learn](https://nextjs.org/learn)

4. **Tailwind CSS** (1-2 days)
   - Utility-first CSS
   - Responsive design
   - **Resource**: [Tailwind Docs](https://tailwindcss.com/docs)

#### Practice Tasks

- [ ] Create a simple Next.js page with TypeScript
- [ ] Build a React component with props and state
- [ ] Style a component with Tailwind CSS
- [ ] Understand the difference between Server and Client Components

#### Project Files to Study

1. [src/app/page.tsx](../src/app/page.tsx) - Simple home page
2. [src/components/EmptyStates.tsx](../src/components/EmptyStates.tsx) - Basic React component
3. [src/app/layout.tsx](../src/app/layout.tsx) - Root layout structure

---

### 🟡 Level 2: Core Application (Week 3-4)

**Goal**: Understand the application structure and data flow.

#### Learn These Next

1. **Database with Prisma** (3-4 days)
   - ORM concepts
   - Schema definition
   - CRUD operations
   - Relations
   - **Resource**: [Prisma Docs](https://www.prisma.io/docs)

2. **Authentication with NextAuth** (2-3 days)
   - Sessions and JWT
   - OAuth providers
   - Protected routes
   - **Resource**: [NextAuth.js Docs](https://next-auth.js.org/)

3. **API Routes in Next.js** (2 days)
   - RESTful API design
   - Request/response handling
   - Middleware
   - **Resource**: [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

4. **Form Validation with Zod** (1 day)
   - Schema definition
   - Type inference
   - Error handling
   - **Resource**: [Zod GitHub](https://github.com/colinhacks/zod)

#### Practice Tasks

- [ ] Run Prisma Studio and explore the database
- [ ] Create a simple API route (GET, POST)
- [ ] Add authentication to a page
- [ ] Validate form input with Zod

#### Project Files to Study

1. [prisma/schema.prisma](../prisma/schema.prisma) - Database schema
2. [src/lib/auth.ts](../src/lib/auth.ts) - NextAuth configuration
3. [src/app/api/documents/route.ts](../src/app/api/documents/route.ts) - API route example
4. [src/lib/validations.ts](../src/lib/validations.ts) - Zod schemas
5. [src/lib/prisma.ts](../src/lib/prisma.ts) - Prisma client setup

---

### 🟠 Level 3: Advanced Features (Week 5-6)

**Goal**: Understand complex features and integrations.

#### Learn These

1. **Real-Time with WebSockets** (3 days)
   - Socket.IO basics
   - Event emitters
   - Room/namespace management
   - **Resource**: [Socket.IO Docs](https://socket.io/docs/)

2. **Rich Text Editing with TipTap** (3-4 days)
   - ProseMirror basics
   - Custom extensions
   - Collaborative editing
   - **Resource**: [TipTap Docs](https://tiptap.dev/)

3. **GitHub API Integration** (4-5 days)
   - Octokit library
   - OAuth flow
   - Webhook handling
   - Rate limiting
   - **Resource**: [Octokit Docs](https://octokit.github.io/rest.js/)

4. **Testing with Jest & Playwright** (3 days)
   - Unit tests
   - Component tests
   - E2E tests
   - **Resource**: [Jest Docs](https://jestjs.io/), [Playwright Docs](https://playwright.dev/)

#### Practice Tasks

- [ ] Connect to WebSocket server and emit events
- [ ] Customize TipTap editor with an extension
- [ ] Create a GitHub API client function
- [ ] Write a unit test and an E2E test

#### Project Files to Study

1. [server.ts](../server.ts) - WebSocket server setup
2. [src/components/document-editor.tsx](../src/components/document-editor.tsx) - TipTap editor
3. [src/lib/github-sync-service.ts](../src/lib/github-sync-service.ts) - GitHub sync logic
4. [e2e/documents.spec.ts](../e2e/documents.spec.ts) - E2E test example
5. [src/lib/**tests**/utils.test.ts](../src/lib/__tests__/utils.test.ts) - Unit test example

---

### 🔴 Level 4: Architecture & Optimization (Week 7-8)

**Goal**: Master the entire system and optimization techniques.

#### Learn These

1. **Caching Strategies** (2 days)
   - LRU cache
   - TTL (Time-To-Live)
   - Cache invalidation
   - **Files**: [src/lib/cache.ts](../src/lib/cache.ts)

2. **Query Optimization** (2 days)
   - Database indexes
   - N+1 query problem
   - Prisma includes
   - **Files**: [src/lib/queries.ts](../src/lib/queries.ts)

3. **Error Handling & Logging** (2 days)
   - Centralized error handling
   - Structured logging
   - Error monitoring
   - **Files**: [src/lib/error-handler.ts](../src/lib/error-handler.ts), [src/lib/logger.ts](../src/lib/logger.ts)

4. **Security Best Practices** (2 days)
   - Input sanitization (XSS protection)
   - Rate limiting
   - CSRF protection
   - **Files**: [src/lib/sanitize.ts](../src/lib/sanitize.ts), [src/lib/rate-limit.ts](../src/lib/rate-limit.ts)

5. **CI/CD & Deployment** (2 days)
   - GitHub Actions
   - Environment variables
   - Production builds
   - **Files**: [.github/workflows/ci.yml](../.github/workflows/ci.yml)

#### Practice Tasks

- [ ] Implement a caching layer for an API route
- [ ] Optimize a slow database query
- [ ] Add error handling to a feature
- [ ] Set up a production deployment

#### Project Files to Study (Advanced)

1. [src/lib/cache.ts](../src/lib/cache.ts) - LRU cache implementation
2. [src/lib/queries.ts](../src/lib/queries.ts) - Optimized queries
3. [src/lib/error-handler.ts](../src/lib/error-handler.ts) - Error handling system
4. [src/lib/api-middleware.ts](../src/lib/api-middleware.ts) - API middleware
5. [next.config.ts](../next.config.ts) - Next.js optimization config

---

## 5. Core Concepts & Technologies

### 🎯 Concept 1: Next.js App Router

**What is it?**  
Next.js 16's file-system based routing using the `/app` directory.

**Key Principles**:

1. **File-based routing**: `app/dashboard/page.tsx` → `/dashboard`
2. **Layouts**: Shared UI that persists across routes
3. **Server Components**: Default (faster, SEO-friendly)
4. **Client Components**: Use `'use client'` directive for interactivity

**Example**:

```tsx
// app/dashboard/page.tsx (Server Component by default)
export default async function DashboardPage() {
  const data = await fetchData(); // Can do server-side fetching
  return <Dashboard data={data} />;
}

// components/InteractiveButton.tsx (Client Component)
('use client'); // Required for useState, useEffect, etc.
import { useState } from 'react';
export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**In This Project**:

- Server Components: Page layouts, data fetching
- Client Components: Editor, forms, interactive UI

---

### 🎯 Concept 2: Prisma ORM

**What is it?**  
Type-safe database toolkit with auto-generated client.

**Key Features**:

1. **Schema-first**: Define models in `schema.prisma`
2. **Type safety**: Auto-generated TypeScript types
3. **Migrations**: Version-controlled database changes
4. **Relations**: Easy model relationships

**Example**:

```typescript
// prisma/schema.prisma
model Document {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

// Usage in code (types are auto-generated!)
import { prisma } from '@/lib/prisma';

const document = await prisma.document.create({
  data: {
    title: 'My Document',
    content: 'Hello world',
    authorId: user.id,
  },
  include: {
    author: true, // Include related author data
  },
});
// document.author.name is now type-safe! ✅
```

**In This Project**:

- 20+ models (User, Workspace, Document, Version, etc.)
- Relations: One-to-many, many-to-many
- Indexes for performance
- Migrations tracked in `prisma/migrations/`

---

### 🎯 Concept 3: NextAuth.js

**What is it?**  
Authentication library for Next.js with multiple providers.

**Key Features**:

1. **Multiple providers**: Email/password, GitHub OAuth
2. **Session management**: JWT or database sessions
3. **Callbacks**: Customize authentication flow
4. **Middleware**: Protect routes

**Example**:

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      async authorize(credentials) {
        // Verify email/password
        const user = await verifyCredentials(credentials);
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
  },
});

// Protect a page
import { auth } from '@/lib/auth';
export default async function ProtectedPage() {
  const session = await auth();
  if (!session) redirect('/auth/signin');
  return <div>Welcome, {session.user.name}!</div>;
}
```

**In This Project**:

- Email/password authentication with bcrypt
- GitHub OAuth integration
- Session stored in database (Prisma adapter)
- Permission-based access control (capability checks)

---

### 🎯 Concept 4: TipTap Rich Text Editor

**What is it?**  
Headless rich text editor built on ProseMirror.

**Key Features**:

1. **Extensible**: Add custom nodes, marks, extensions
2. **Collaborative**: Real-time editing support
3. **Markdown support**: Import/export Markdown
4. **Format toolbar**: Bold, italic, lists, etc.

**Example**:

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

const MyEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      // Custom extensions
    ],
    content: '<p>Initial content</p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Content updated:', html);
    },
  });

  return (
    <div>
      <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
      <EditorContent editor={editor} />
    </div>
  );
};
```

**In This Project**:

- Extensions: Link, Image, Table, CodeBlock, Mention
- Custom extensions: InlineComments, CustomProperties
- Auto-save functionality
- Version diffing

---

### 🎯 Concept 5: WebSockets with Socket.IO

**What is it?**  
Real-time bidirectional communication between client and server.

**Key Features**:

1. **Events**: Emit and listen to custom events
2. **Rooms**: Group connections (e.g., per document)
3. **Broadcasting**: Send to all clients in a room
4. **Reconnection**: Automatic reconnection on disconnect

**Example**:

```typescript
// Server (server.ts)
import { Server } from 'socket.io';
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join-document', (documentId) => {
    socket.join(`document:${documentId}`);
  });

  socket.on('document-update', ({ documentId, content }) => {
    // Broadcast to all clients in this document room
    socket.to(`document:${documentId}`).emit('content-changed', content);
  });
});

// Client (useWebSocket.ts)
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');

socket.emit('join-document', documentId);
socket.on('content-changed', (content) => {
  console.log('Document updated:', content);
});
```

**In This Project**:

- Document locking (prevent concurrent edits)
- User presence (who's viewing a document)
- Real-time notifications
- Collaborative cursor positions (future feature)

---

### 🎯 Concept 6: GitHub Integration with Octokit

**What is it?**  
Official GitHub API client for JavaScript/TypeScript.

**Key Features**:

1. **REST API**: Full GitHub API access
2. **Authentication**: OAuth & personal tokens
3. **Webhooks**: Receive GitHub events
4. **Rate limiting**: Automatic retry and backoff

**Example**:

```typescript
import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Get repository files
const { data: files } = await octokit.rest.repos.getContent({
  owner: 'username',
  repo: 'repo-name',
  path: 'README.md',
});

// Create a file
await octokit.rest.repos.createOrUpdateFileContents({
  owner: 'username',
  repo: 'repo-name',
  path: 'docs/new-doc.md',
  message: 'Add new document',
  content: Buffer.from('# New Document').toString('base64'),
});

// Listen to webhooks
app.post('/api/webhooks/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  if (event === 'push') {
    // Handle push event
    const { commits } = req.body;
    console.log(`${commits.length} new commits`);
  }
  res.status(200).send('OK');
});
```

**In This Project**:

- Bidirectional sync (app ↔ GitHub)
- Import markdown files from repos
- Export documents to GitHub
- Webhook handling for real-time updates
- Conflict resolution UI

---

### 🎯 Concept 7: Zod Validation

**What is it?**  
TypeScript-first schema validation library.

**Key Features**:

1. **Type inference**: Schemas generate TypeScript types
2. **Composable**: Combine schemas
3. **Error messages**: Detailed validation errors
4. **Transformations**: Parse and transform data

**Example**:

```typescript
import { z } from 'zod';

// Define schema
const DocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});

// Infer TypeScript type from schema
type Document = z.infer<typeof DocumentSchema>;

// Validate data
const result = DocumentSchema.safeParse({
  title: 'My Document',
  content: 'Hello world',
});

if (!result.success) {
  console.log(result.error.errors);
  // [{ path: ['title'], message: 'Title is required' }]
} else {
  console.log(result.data); // Validated data
}
```

**In This Project** (see [src/lib/validations.ts](../src/lib/validations.ts)):

- All API input validation
- Form validation
- Environment variable validation
- Schema exports:
  - `DocumentSchema`
  - `WorkspaceSchema`
  - `CommentSchema`
  - `UserSchema`
  - etc.

---

### 🎯 Concept 8: Caching with LRU

**What is it?**  
Least Recently Used cache to store frequently accessed data in memory.

**Key Features**:

1. **Size limit**: Evicts oldest items when full
2. **TTL**: Automatic expiration
3. **Performance**: Fast in-memory lookups

**Example**:

```typescript
// src/lib/cache.ts
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  set(key: string, value: T, ttl: number) {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }
}

// Usage
import { documentCache, getCached } from '@/lib/cache';

const document = await getCached(
  `document:${id}`,
  () => prisma.document.findUnique({ where: { id } }),
  documentCache,
  5 * 60 // 5 minutes TTL
);
```

**In This Project**:

- **workspaceCache**: 200 items, 10min TTL
- **documentCache**: 500 items, 5min TTL
- **userCache**: 100 items, 30min TTL

---

## 6. File-by-File Guide

### 🔑 Critical Files (Must Understand)

#### 1. `src/lib/prisma.ts` - Database Client

**Purpose**: Singleton Prisma client with connection pooling.

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Why it's important**:

- Only one Prisma instance (prevents connection exhaustion)
- Development hot-reload friendly
- Production-ready with graceful shutdown

---

#### 2. `src/lib/auth.ts` - Authentication Configuration

**Purpose**: NextAuth.js setup with email/password and GitHub OAuth.

**Key parts**:

```typescript
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      /* ... */
    }),
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

**Usage in pages**:

```typescript
import { auth } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await auth();
  if (!session) redirect('/auth/signin');
  // ...
}
```

---

#### 3. `src/lib/validations.ts` - Input Validation Schemas

**Purpose**: Zod schemas for all user input.

**Key schemas**:

```typescript
import { z } from 'zod';

export const DocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  path: z.string().optional(),
  workspaceId: z.string().cuid(),
  emoji: z.string().optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  customProperties: z.record(z.unknown()).optional(),
});

export const WorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const CommentSchema = z.object({
  content: z.string().min(1).max(2000),
  documentId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
});

// Export inferred types
export type DocumentInput = z.infer<typeof DocumentSchema>;
export type WorkspaceInput = z.infer<typeof WorkspaceSchema>;
export type CommentInput = z.infer<typeof CommentSchema>;
```

**Usage in API routes**:

```typescript
import { DocumentSchema } from '@/lib/validations';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate input
  const result = DocumentSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.errors }, { status: 400 });
  }

  // result.data is now type-safe!
  const document = await prisma.document.create({
    data: result.data,
  });

  return Response.json(document);
}
```

---

#### 4. `server.ts` - Custom Server with WebSocket

**Purpose**: Express + Next.js + Socket.IO integration.

**Structure**:

```typescript
import express from 'express';
import next from 'next';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new SocketIOServer(server);

  // WebSocket events
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-document', (documentId) => {
      socket.join(`document:${documentId}`);
      io.to(`document:${documentId}`).emit('user-joined', {
        userId: socket.data.userId,
        documentId,
      });
    });

    socket.on('document-update', ({ documentId, content }) => {
      socket.to(`document:${documentId}`).emit('content-changed', content);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Next.js request handler
  expressApp.all('*', (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
```

**Why custom server?**  
Next.js doesn't support WebSockets out of the box. This setup combines:

- Next.js for routing and SSR
- Socket.IO for real-time features

---

#### 5. `src/lib/github-sync-service.ts` - GitHub Sync Logic

**Purpose**: Bidirectional sync between app and GitHub.

**Key functions**:

```typescript
import { Octokit } from 'octokit';
import { prisma } from './prisma';
import { convertToMarkdown, convertFromMarkdown } from './converters';

export class GitHubSyncService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  // Import documents from GitHub → App
  async importFromGitHub(repoId: string, path: string) {
    const repo = await prisma.gitHubRepo.findUnique({
      where: { id: repoId },
    });

    const { data: file } = await this.octokit.rest.repos.getContent({
      owner: repo.owner,
      repo: repo.name,
      path,
    });

    const content = Buffer.from(file.content, 'base64').toString();
    const html = convertFromMarkdown(content);

    const document = await prisma.document.create({
      data: {
        title: path.replace('.md', ''),
        content: html,
        workspaceId: repo.workspaceId,
        githubPath: path,
        githubSha: file.sha,
      },
    });

    return document;
  }

  // Export document from App → GitHub
  async exportToGitHub(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { workspace: { include: { githubRepos: true } } },
    });

    const repo = document.workspace.githubRepos[0];
    const markdown = convertToMarkdown(document.content);

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: repo.owner,
      repo: repo.name,
      path: document.githubPath || `docs/${document.title}.md`,
      message: `Update: ${document.title}`,
      content: Buffer.from(markdown).toString('base64'),
      sha: document.githubSha, // For updates
    });

    // Update document with new SHA
    await prisma.document.update({
      where: { id: documentId },
      data: { githubSha: file.sha },
    });
  }

  // Sync on webhook
  async handleWebhook(event: string, payload: any) {
    if (event === 'push') {
      const { commits, repository } = payload;

      for (const commit of commits) {
        for (const file of commit.added.concat(commit.modified)) {
          if (file.endsWith('.md')) {
            await this.importFromGitHub(repository.id, file);
          }
        }
      }
    }
  }
}
```

**Features**:

- Import markdown files from GitHub
- Export documents to GitHub
- Webhook-triggered sync
- Conflict detection (SHA comparison)

---

#### 6. `src/components/document-editor.tsx` - TipTap Editor

**Purpose**: Main rich text editor component.

**Key parts**:

```tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';

export function DocumentEditor({ document, onUpdate }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      CodeBlockLowlight.configure({ lowlight }),
      // Custom extensions...
    ],
    content: document.content,
    immediatelyRender: false, // Fix SSR hydration
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html); // Auto-save
    },
  });

  if (!editor) return <div>Loading editor...</div>;

  return (
    <div className="prose max-w-none">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

**Custom extensions** (see `src/lib/tiptap/`):

- **Mention**: @username autocomplete
- **InlineComment**: Select text and comment
- **CustomProperties**: Document metadata

---

### 📂 Configuration Files

#### `next.config.ts` - Next.js Configuration

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true, // Enable gzip compression

  experimental: {
    optimizePackageImports: ['lucide-react', '@tiptap/react'],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;
```

---

#### `tsconfig.json` - TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Key settings**:

- `strict: true` - Enable all strict type checking
- `paths` - Alias `@/` to `src/`
- `noUncheckedIndexedAccess` - Safer array access

---

#### `jest.config.js` - Jest Test Configuration

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/', // Exclude E2E tests (run with Playwright)
    '/src/app/api/__tests__/', // Exclude API tests (NextAuth/jose issue)
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
};

module.exports = createJestConfig(customJestConfig);
```

---

#### `playwright.config.ts` - E2E Test Configuration

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 7. Common Patterns & Conventions

### 🎨 Pattern 1: API Route Structure

**Template**:

```typescript
// src/app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ResourceSchema } from '@/lib/validations';
import { handleError } from '@/lib/error-handler';

// GET /api/resource
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resources = await prisma.resource.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(resources);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/resource
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = ResourceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.errors }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        ...result.data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

**Pattern breakdown**:

1. Import dependencies
2. Check authentication
3. Validate input (Zod)
4. Database operation (Prisma)
5. Return response
6. Error handling

---

### 🎨 Pattern 2: Server Component with Data Fetching

**Template**:

```tsx
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  // 1. Check authentication
  const session = await auth();
  if (!session) redirect('/auth/signin');

  // 2. Fetch data (server-side)
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      _count: { select: { documents: true } },
    },
  });

  // 3. Render (no useState, no useEffect needed!)
  return (
    <div>
      <h1>My Workspaces</h1>
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}
```

**Advantages**:

- Faster initial load (HTML sent to client)
- SEO-friendly
- No loading states needed
- Automatic caching by Next.js

---

### 🎨 Pattern 3: Client Component with Form

**Template**:

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CreateDocumentForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    };

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const document = await res.json();
      toast.success('Document created!');
      router.push(`/dashboard/${document.workspaceId}/documents/${document.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Document'}
      </button>
    </form>
  );
}
```

---

### 🎨 Pattern 4: Custom Hook

**Template**:

```typescript
// src/hooks/useDocumentLock.ts
'use client';
import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

export function useDocumentLock(documentId: string) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket || !documentId) return;

    // Request lock
    socket.emit('request-lock', { documentId });

    // Listen for lock status
    socket.on('lock-acquired', ({ documentId: id, userId }) => {
      if (id === documentId) {
        setIsLocked(true);
        setLockedBy(userId);
      }
    });

    socket.on('lock-denied', ({ documentId: id, lockedBy: user }) => {
      if (id === documentId) {
        setIsLocked(true);
        setLockedBy(user);
      }
    });

    return () => {
      socket.off('lock-acquired');
      socket.off('lock-denied');
      socket.emit('release-lock', { documentId });
    };
  }, [socket, documentId]);

  const unlockDocument = () => {
    socket?.emit('release-lock', { documentId });
    setIsLocked(false);
    setLockedBy(null);
  };

  return { isLocked, lockedBy, unlockDocument };
}
```

**Usage**:

```tsx
const { isLocked, lockedBy } = useDocumentLock(documentId);

if (isLocked && lockedBy !== session.user.id) {
  return <div>Document is locked by {lockedBy}</div>;
}
```

---

### 🎨 Pattern 5: Error Handling

**Global error handler** (`src/lib/error-handler.ts`):

```typescript
import { Prisma } from '@prisma/client';

export function handleError(error: unknown) {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return Response.json({ error: 'Resource already exists' }, { status: 409 });
      case 'P2025': // Record not found
        return Response.json({ error: 'Resource not found' }, { status: 404 });
      default:
        return Response.json({ error: 'Database error' }, { status: 500 });
    }
  }

  // Validation errors
  if (error instanceof z.ZodError) {
    return Response.json({ errors: error.errors }, { status: 400 });
  }

  // Generic error
  console.error(error);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
```

---

### 🎨 Pattern 6: Optimistic Updates

**Using the custom hook** (`src/hooks/useOptimisticUpdate.ts`):

```typescript
import { useOptimisticDocument } from '@/hooks/useOptimisticUpdate';

function DocumentEditor({ document }) {
  const [localContent, setLocalContent] = useState(document.content);
  const { updateContent, isUpdating } = useOptimisticDocument();

  async function saveContent(newContent: string) {
    // Instant UI update
    setLocalContent(newContent);

    // Server update (auto-reverts on error)
    await updateContent(
      document.id,
      newContent,
      setLocalContent,
      document.content // Original content for rollback
    );
  }

  return (
    <>
      <AutoSaveIndicator isUpdating={isUpdating} />
      <Editor content={localContent} onChange={saveContent} />
    </>
  );
}
```

---

## 8. Testing Knowledge

### 🧪 Test Structure

**Project has 3 test layers**:

1. **Unit Tests** (Jest)
   - Location: `src/lib/__tests__/`
   - Purpose: Test individual functions
   - Example: `utils.test.ts`, `validations.test.ts`

2. **Component Tests** (Jest + Testing Library)
   - Location: `src/components/__tests__/`
   - Purpose: Test React components
   - Example: `ui.test.tsx`, `EmptyStates.test.tsx`

3. **Integration Tests** (Jest)
   - Location: `src/__tests__/integration/`
   - Purpose: Test workflows
   - Example: `document-workflow.test.ts`

4. **E2E Tests** (Playwright)
   - Location: `e2e/`
   - Purpose: Test complete user flows
   - Example: `auth.spec.ts`, `documents.spec.ts`

---

### 🧪 Example Unit Test

```typescript
// src/lib/__tests__/utils.test.ts
import { formatDate, truncateText, slugify } from '../utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('should handle invalid dates', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs truncation';
      expect(truncateText(text, 20)).toBe('This is a very lon...');
    });

    it('should not truncate short text', () => {
      expect(truncateText('Short', 20)).toBe('Short');
    });
  });

  describe('slugify', () => {
    it('should convert to slug', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Test   Spaces')).toBe('test-spaces');
    });
  });
});
```

**Run**: `npm test utils.test.ts`

---

### 🧪 Example Component Test

```typescript
// src/components/__tests__/EmptyStates.test.tsx
import { render, screen } from '@testing-library/react';
import { NoDocuments, NoWorkspaces } from '../EmptyStates';

describe('EmptyStates', () => {
  it('should render NoDocuments', () => {
    render(<NoDocuments />);
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument(); // Icon
  });

  it('should render NoWorkspaces', () => {
    render(<NoWorkspaces />);
    expect(screen.getByText(/no workspaces/i)).toBeInTheDocument();
  });
});
```

**Run**: `npm test EmptyStates.test.tsx`

---

### 🧪 Example E2E Test

```typescript
// e2e/documents.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Document Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create document', async ({ page }) => {
    await page.goto('/dashboard/workspace-id');
    await page.click('button:has-text("New Document")');
    await page.fill('[placeholder="Document title"]', 'Test Doc');
    await page.click('button:has-text("Create")');

    // Verify creation
    await expect(page.locator('h1')).toContainText('Test Doc');
  });
});
```

**Run**: `npm run test:e2e`

---

### 🧪 Known Testing Issues

#### Issue 1: API Route Tests Excluded

**Problem**: NextAuth.js uses `jose` (ES modules) incompatible with Jest  
**Files**: `src/app/api/__tests__/*` (23 tests created but excluded)  
**Solution**: Use E2E tests for API validation  
**Config**: `jest.config.js` line 15: `testPathIgnorePatterns: ['/src/app/api/__tests__/']`

#### Issue 2: Radix UI in JSDOM

**Problem**: `hasPointerCapture` not implemented in JSDOM  
**Solution**: Simplified tests to rendering only (no interactions)  
**File**: `src/components/__tests__/advanced-interactions.test.tsx`

---

## 9. Troubleshooting & Known Issues

### ⚠️ Common Issues

#### Issue 1: "Database connection refused"

**Cause**: PostgreSQL not running  
**Solution**:

```bash
# Check if PostgreSQL is running
# Windows: Services → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Start PostgreSQL
# Windows: net start postgresql-x64-14
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

---

#### Issue 2: "Prisma Client not generated"

**Error**: `@prisma/client did not initialize yet`  
**Solution**:

```bash
npm run db:generate
# Or: npx prisma generate
```

---

#### Issue 3: "NextAuth session undefined"

**Cause**: Missing `NEXTAUTH_SECRET` or `NEXTAUTH_URL`  
**Solution**:

```bash
# Generate secret
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET="generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

#### Issue 4: "WebSocket connection failed"

**Cause**: Custom server not running  
**Solution**:

```bash
# Make sure you're using the custom server
npm run dev  # Uses server.ts
# NOT: npm run dev:next (bypasses WebSocket)
```

---

#### Issue 5: "GitHub OAuth not working"

**Cause**: Missing GitHub app credentials  
**Solution**:

1. Go to https://github.com/settings/developers
2. Create OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID & Secret to `.env`:

```env
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

---

#### Issue 6: "Build fails with type errors"

**Solution**:

```bash
# Check TypeScript errors
npm run type-check

# Common fixes:
# 1. Update @types packages
npm install -D @types/node@latest @types/react@latest

# 2. Clear cache
rm -rf .next node_modules
npm install
```

---

### 🛠️ Development Tips

1. **Hot Reload Issues**

   ```bash
   # If changes don't reflect:
   # 1. Stop server (Ctrl+C)
   # 2. Clear .next folder
   rm -rf .next
   # 3. Restart
   npm run dev
   ```

2. **Database Reset**

   ```bash
   # Reset database to clean state
   npm run db:reset
   # Seed with test data
   npm run db:seed
   ```

3. **Debugging**
   - VS Code: Press F5 to attach debugger
   - Browser: Use React DevTools extension
   - Database: `npm run db:studio` (Prisma Studio GUI)

4. **Environment Variables**
   ```bash
   # Always restart server after changing .env
   # Changes don't apply without restart
   ```

---

## 10. Resources & References

### 📚 Official Documentation

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/learn
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org/
- **TipTap**: https://tiptap.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zod**: https://zod.dev/
- **Socket.IO**: https://socket.io/docs/
- **Octokit**: https://octokit.github.io/rest.js/

### 📖 Learning Resources

- **Next.js Tutorial**: https://nextjs.org/learn
- **React Patterns**: https://reactpatterns.com/
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **Prisma Tutorial**: https://www.prisma.io/learn
- **Tailwind UI**: https://tailwindui.com/ (paid but great examples)

### 🎥 Video Tutorials

- **Next.js 14 App Router**: [Vercel YouTube](https://www.youtube.com/@VercelHQ)
- **Prisma Crash Course**: [Traversy Media](https://www.youtube.com/watch?v=RebA5J-rlwg)
- **TypeScript for Beginners**: [Net Ninja](https://www.youtube.com/playlist?list=PL4cUxeGkcC9gUgr39Q_yD6v-bSyMwKPUI)

### 🔧 Tools & Extensions

**VS Code Extensions** (highly recommended):

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- GitHub Copilot (AI assistant)
- TypeScript Error Translator

**Browser Extensions**:

- React Developer Tools
- Redux DevTools (if you add Redux later)

### 📄 Project-Specific Docs

**In this repository**:

- [Complete Application Guide](../COMPLETE_APPLICATION_GUIDE.md) - Full feature documentation
- [Complete Testing Guide](../COMPLETE_TESTING_GUIDE.md) - Testing instructions
- [GitHub Integration Guide](../GITHUB_INTEGRATION_GUIDE.md) - GitHub features
- [Testing Summary](../TESTING_SUMMARY.md) - Test results
- [Improvements Implemented](../docs/IMPROVEMENTS_IMPLEMENTED.md) - Recent improvements

---

## 📝 Quick Reference

### Most Important Commands

```bash
# Development
npm run dev              # Start dev server with WebSocket
npm run db:studio        # Open Prisma Studio (DB GUI)
npm run db:push          # Sync schema to database

# Testing
npm test                 # Run all Jest tests
npm run test:watch       # Watch mode
npm run test:e2e         # Run E2E tests
npm run type-check       # Check TypeScript errors

# Building
npm run build            # Production build
npm start                # Start production server
npm run lint             # Check code style

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Create migration
npm run db:reset         # Reset database
npm run db:seed          # Seed test data

# Utilities
npm run create-admin     # Create admin user
npm run format           # Format code with Prettier
```

### Key Shortcuts (in development)

- `Ctrl + C` - Stop server
- `Ctrl + R` - Refresh browser
- `Ctrl + Shift + I` - Open DevTools
- `Ctrl + P` (VS Code) - Quick file open
- `Ctrl + Shift + P` (VS Code) - Command palette

---

## 🎯 Next Steps After Reading This Guide

### For Beginners:

1. ✅ Read "Level 1: Fundamentals" section
2. ✅ Install the project and run `npm run dev`
3. ✅ Open `src/app/page.tsx` and make a simple change
4. ✅ Study `src/components/EmptyStates.tsx` (simple component)
5. ✅ Read through `prisma/schema.prisma` to understand data models

### For Intermediate Developers:

1. ✅ Read "Level 2: Core Application" section
2. ✅ Study an API route: `src/app/api/documents/route.ts`
3. ✅ Understand authentication flow in `src/lib/auth.ts`
4. ✅ Explore the TipTap editor: `src/components/document-editor.tsx`
5. ✅ Write a simple test in `src/lib/__tests__/`

### For Advanced Developers:

1. ✅ Read "Level 3 & 4" sections
2. ✅ Study GitHub sync: `src/lib/github-sync-service.ts`
3. ✅ Understand WebSocket setup: `server.ts`
4. ✅ Explore caching: `src/lib/cache.ts`
5. ✅ Review optimization techniques in `docs/IMPROVEMENTS_IMPLEMENTED.md`

---

## 🙌 Contributing

If you find errors in this guide or want to improve it:

1. Create an issue or pull request
2. Suggest additional sections
3. Share your learning experience

---

**Happy Learning! 🚀**

This guide is a living document. Bookmark it and refer back as you progress through the codebase.
