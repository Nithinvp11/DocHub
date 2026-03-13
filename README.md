# DocHub – Collaborative Documentation Platform

DocHub is a professional collaborative documentation platform with document versioning, GitHub integration, real-time collaboration features, and a built-in user feedback and admin review workflow.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Collaboration Features

- 🚀 **Rich Text Editor** - TipTap-based editor with full formatting support
- 📝 **Document Versioning** - Structured version history and restore for all documents
- 👥 **Workspace Management** - Organize teams with permission-based access control
- 🔗**Document Linking** - [[Wiki-style]] links with automatic backlinks
- @ **Mentions** - Tag users with notifications and autocomplete
- 💬 **Inline Comments** - Select text and add threaded comments
- 📊 **Recent Documents** - Access history tracking
- 🏷️ **Tags & Templates** - Organize and reuse document structures
- 📝 **Feedback System** - Users can submit bug reports, feature requests, and improvement feedback
- 🛠️ **Admin Feedback Dashboard** - Admins can triage, prioritize, and resolve user feedback
- 🔔 **Notifications** - Real-time updates for mentions, comments, and feedback events
- 🔍 **Search & Discovery** - Full-text search across workspaces

### GitHub Integration (✅ ALL ENHANCEMENTS COMPLETE!)

- 🔄 **Two-way Sync** - Automatic bidirectional synchronization with GitHub
- 🤖 **Background Sync Service** - Queue-based automatic sync every 60 seconds
- 🔀 **Conflict Resolution** - Multiple strategies (Manual, Last Write Wins, Platform Wins, GitHub Wins)
- 📦 **Batch Import** - Import 100+ markdown files at once
- 📋 **Issue Sync** - Bidirectional GitHub issue synchronization
- 🔀 **Pull Request Tracking** - Complete PR lifecycle management
- ⚡ **Real-time Webhooks** - Instant updates on GitHub push, PR, and issue events
- 🔀 **Visual Merge Conflicts** - Side-by-side conflict resolution UI
- ⏰ **Scheduled Sync** - Automated periodic synchronization with priority queue
- 📜 **Commit History** - Timeline visualization with restore capability
- 🌿 **Multi-Branch Support** - Switch branches and manage branch-specific sync
- 🎛️ **Auto-Sync UI** - Comprehensive dashboard for sync management
- 🔐 **Token Management** - Secure OAuth token storage and refresh
- 📊 **Sync Status Tracking** - Real-time monitoring of sync operations

### Professional Infrastructure

- 🔐 **Authentication** - Email/password + GitHub OAuth
- 🛡️ **Authorization** - Permission-based access control for workspace actions
- 📈 **Activity Logging** - Comprehensive audit trail
- 🏥 **Health Checks** - Monitoring endpoint for status
- ⚡ **Rate Limiting** - API protection
- 📝 **Structured Logging** - Development and production modes
- 🎯 **Error Handling** - Custom error classes and responses

## 📚 Documentation

- **[Professional Documentation](./docs/PROFESSIONAL_DOCUMENTATION.md)** - Formal abstract, background, problem definition, methodology, objectives, modules, scope, and constraints
- **[Documentation Hub](./docs/README.md)** - Start here for project docs, architecture artifacts, and writing workflow
- **[Project Overview](./docs/PROJECT_OVERVIEW.md)** - Product scope, architecture, modules, and local development flow
- **[Project Completion Status](./docs/PROJECT_COMPLETION_STATUS.md)** - Current implementation status and remaining gaps
- **[Manual Testing Guide](./docs/MANUAL_TESTING_GUIDE.md)** - Validation scenarios for major workflows
- **[Production Quick Start](./docs/QUICK_START_PRODUCTION.md)** - Deployment-focused setup instructions
- **[Documentation Templates](./docs/templates/FEATURE_TEMPLATE.md)** - Reusable templates for feature/API/runbook documentation

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** database (local or remote)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd repo-aware-knowledge-hub
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_hub"

   # Auth (generate with: openssl rand -base64 32)
   NEXTAUTH_SECRET="your-super-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # GitHub OAuth (optional, get from https://github.com/settings/developers)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"

   # GitHub Webhook (generate with: openssl rand -hex 32)
   GITHUB_WEBHOOK_SECRET="your-webhook-secret-here"

   # Encryption Key for GitHub tokens (generate with: openssl rand -hex 32)
   # ⚠️ REQUIRED for GitHub integration - secures stored access tokens
   ENCRYPTION_KEY="your-encryption-key-here"

   # Cron Secret (generate with: openssl rand -hex 20)
   CRON_SECRET="your-cron-secret-here"

   # Background Sync (set to "true" in production)
   ENABLE_BACKGROUND_SYNC="true"

   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # (Optional) Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # Check TypeScript types
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run validate     # Run type-check + lint + format-check

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create and apply migration
npm run db:reset     # Reset database (caution!)
npm run db:seed      # Seed database with sample data
```

### Sample Credentials (after seeding)

- **Alice Johnson** (Admin): `alice@example.com` / `password123`
- **Bob Smith** (Editor): `bob@example.com` / `password123`
- **Charlie Davis** (Viewer): `charlie@example.com` / `password123`

## ⚠️ Migration Notes

### For Existing Deployments

If you're upgrading from an earlier version that didn't have encrypted GitHub token storage:

1. **Generate Encryption Key**

   ```bash
   openssl rand -hex 32
   ```

2. **Add to Environment Variables**

   ```env
   ENCRYPTION_KEY=<generated-key>
   ```

3. **Database Schema**
   - Database migrations have already been applied
   - `GitHubAuth` table now uses encrypted token storage with AES-256-CBC encryption

4. **User Impact**
   - **Existing users must re-link their GitHub accounts**
   - Old tokens cannot be decrypted without the original encryption key
   - Users will see "GitHub Not Connected" and need to reconnect via Settings → GitHub Integration

5. **Security Benefits**
   - GitHub access tokens are now encrypted at rest
   - Tokens are only decrypted when needed for API calls
   - Enhanced security compliance for production deployments

## 🏗️ Technology Stack

### Frontend

- **Next.js 16.0.3** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.x** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn UI** - Component library
- **TipTap** - Rich text editor
- **Lucide React** - Icons

### Backend

- **Next.js API Routes** - Server-side API
- **Prisma 6.19.0** - ORM and database toolkit
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication
- **Zod** - Schema validation
- **Bcrypt** - Password hashing

### Integrations

- **Octokit** - GitHub API client
- **GitHub OAuth** - Social authentication
- **GitHub Webhooks** - Real-time updates

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Turbopack** - Fast build tool

## 📁 Project Structure

```
repo-aware-knowledge-hub/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data seeder
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── auth/          # Auth pages
│   │   ├── dashboard/     # Main application
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configs
│   │   ├── api-middleware.ts  # API wrapper
│   │   ├── auth.ts        # NextAuth config
│   │   ├── env.ts         # Environment validation
│   │   ├── errors.ts      # Custom errors
│   │   ├── logger.ts      # Structured logging
│   │   ├── prisma.ts      # Database client
│   │   └── tiptap/        # Editor extensions
│   ├── types/             # TypeScript types
│   └── middleware.ts      # Next.js middleware
├── public/                # Static assets
├── .env.example           # Environment template
├── ARCHITECTURE.md        # Architecture documentation
├── CONTRIBUTING.md        # Contribution guidelines
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔐 Authentication

### Email/Password

Users can register with email and password. Passwords are hashed with bcrypt.

### GitHub OAuth

Enable GitHub OAuth by setting up a GitHub App:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`
5. **Required Scopes**: `repo`, `read:org`, `read:user`, `user:email`, `workflow`, `write:discussion`

## 🔄 GitHub Integration Setup

The platform includes comprehensive GitHub integration with automated sync, conflict resolution, and PR tracking.

### 1. Configure OAuth Application

Create a GitHub OAuth app with full repository access:

```bash
# Required scopes for full functionality:
- repo                 # Full repository access
- read:org            # Organization membership
- read:user           # User profile
- user:email          # Email access
- workflow            # GitHub Actions
- write:discussion    # Discussions
```

### 2. Setup GitHub Webhooks

Configure webhooks for real-time updates:

1. Go to your repository **Settings → Webhooks → Add webhook**
2. **Payload URL**: `https://yourdomain.com/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Use value from `GITHUB_WEBHOOK_SECRET` in `.env`
5. **Events**: Select:
   - Push events
   - Pull requests
   - Issues

### 3. Configure Background Sync Worker

**Option A: Vercel Cron (Recommended for Vercel deployments)**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-worker",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

**Option B: Manual Cron Job**

```bash
# Add to crontab (runs every minute)
* * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/sync-worker
```

**Option C: PM2 Process Manager**

```bash
# Install PM2
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sync-worker',
    script: 'node',
    args: '-e "setInterval(() => fetch(\'http://localhost:3000/api/cron/sync-worker\', { headers: { \'Authorization\': \'Bearer YOUR_CRON_SECRET\' } }), 60000)"',
    instances: 1
  }]
};
EOF

# Start worker
pm2 start ecosystem.config.js
```

### 4. GitHub Integration Features

**Automated Path Mapping**

- Documents automatically mapped to GitHub paths
- Type-based folder organization (specs/, meetings/, etc.)
- Zero manual configuration required

**Conflict Resolution**

- SHA-based conflict detection
- Three resolution strategies: local, remote, manual
- Visual diff interface for manual merging

**PR Tracking**

- Automatic PR-document linking via file paths
- Lifecycle event tracking (opened, updated, merged, closed)
- Impact analysis showing affected documents

**Sync Queue**

- Priority-based background processing
- Exponential backoff retry logic
- Status tracking (pending, processing, completed, failed)

## 📖 API Documentation

### Health Check

```
GET /api/health
```

Returns server status, database health, and uptime.

### Documents

```
GET    /api/documents              # List documents
POST   /api/documents              # Create document
GET    /api/documents/[id]         # Get document
PATCH  /api/documents/[id]         # Update document
DELETE /api/documents/[id]         # Delete document
```

### Collaboration

```
GET    /api/documents/[id]/comments        # Get comments
POST   /api/documents/[id]/comments        # Add comment
GET    /api/documents/[id]/inline-comments # Get inline comments
POST   /api/documents/[id]/inline-comments # Add inline comment
GET    /api/documents/[id]/links           # Get document links
GET    /api/documents/[id]/mentions        # Get mentions
POST   /api/documents/[id]/mentions        # Create mention
```

### Workspaces

```
GET    /api/workspaces              # List workspaces
POST   /api/workspaces              # Create workspace
GET    /api/workspaces/[id]         # Get workspace
PATCH  /api/workspaces/[id]         # Update workspace
DELETE /api/workspaces/[id]         # Delete workspace
GET    /api/workspaces/[id]/members # Get members
POST   /api/workspaces/[id]/members # Add member
```

### Other

```
GET    /api/recent-documents        # Get recent documents
POST   /api/recent-documents        # Track document view
GET    /api/notifications           # Get notifications
GET    /api/activity                # Get activity feed
GET    /api/tags                    # Get tags

# Feedback
GET    /api/feedback                # Get feedback (admin: all, user: own)
POST   /api/feedback                # Submit feedback
GET    /api/feedback/[id]           # Get feedback detail
PATCH  /api/feedback/[id]           # Update feedback
DELETE /api/feedback/[id]           # Delete feedback (admin)
GET    /api/feedback/stats          # Feedback dashboard stats (admin)
```

Full API documentation: See [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🧪 Testing

Run the validation suite:

```bash
npm run validate
```

This runs:

- TypeScript type checking
- ESLint linting
- Prettier format checking

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables

Ensure all required environment variables are set:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for JWT signing (32+ characters)
- `NEXTAUTH_URL` - Your production URL
- `NEXT_PUBLIC_APP_URL` - Public-facing URL
- `ENCRYPTION_KEY` - **⚠️ REQUIRED for GitHub integration** (generate with: `openssl rand -hex 32`)
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- `GITHUB_WEBHOOK_SECRET` - Secret for validating GitHub webhooks

### Database Migration

For production databases, use migrations instead of `db:push`:

```bash
npm run db:migrate
```

### Recommended Platforms

- **Vercel** - Optimal for Next.js (zero-config)
- **Railway** - Easy PostgreSQL hosting
- **Neon** - Serverless PostgreSQL
- **Supabase** - PostgreSQL with additional features

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation (`npm run validate`)
5. Commit with conventional commits (`git commit -m 'feat: add feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- TypeScript strict mode - no `any` without good reason
- Functional components with hooks
- Server components by default, client only when needed
- Proper error handling with custom error classes
- JSDoc comments for public APIs
- Follow existing patterns and conventions

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [TipTap](https://tiptap.dev/) - Headless editor framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautifully designed components
- [Huly Platform](https://github.com/hcengineering/platform) - Inspiration for professional patterns

## 📞 Support

- 📖 [Documentation](./ARCHITECTURE.md)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
