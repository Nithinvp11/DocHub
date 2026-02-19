-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DocumentPhase" AS ENUM ('PLANNING', 'DEVELOPMENT', 'REVIEW', 'COMPLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('GENERAL', 'SPECIFICATION', 'MEETING_NOTES', 'API_DOCS', 'GUIDE', 'RFC', 'TEMPLATE', 'FOLDER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED', 'VERSION_CREATED', 'COMMENT_ADDED', 'COMMENT_RESOLVED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'GITHUB_PR_OPENED', 'GITHUB_PR_UPDATED', 'GITHUB_PR_MERGED', 'GITHUB_PR_CLOSED', 'GITHUB_ISSUE_OPENED', 'GITHUB_ISSUE_UPDATED', 'GITHUB_ISSUE_CLOSED', 'GITHUB_REPO_SYNCED', 'DOCUMENT_LINKED', 'DOCUMENT_MENTIONED', 'DOCUMENT_STATUS_CHANGED', 'TAG_ADDED', 'TAG_REMOVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT_MENTION', 'DOCUMENT_SHARED', 'GITHUB_PR_REVIEW', 'GITHUB_ISSUE_ASSIGNED', 'VERSION_CONFLICT', 'WORKSPACE_INVITE', 'CONNECTION_REQUEST', 'CONNECTION_ACCEPTED');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('TO_GITHUB', 'FROM_GITHUB', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "ConflictStrategy" AS ENUM ('MANUAL', 'LAST_WRITE_WINS', 'PLATFORM_WINS', 'GITHUB_WINS');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING', 'SYNCING', 'CONFLICT', 'ERROR', 'PAUSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "usernameChangedAt" TIMESTAMP(3),
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "githubLinked" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "phase" "DocumentPhase" NOT NULL DEFAULT 'PLANNING',
    "type" "DocumentType" NOT NULL DEFAULT 'GENERAL',
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "emoji" TEXT,
    "coverImage" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "properties" JSONB,
    "diagrams" JSONB,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Version" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "diff" TEXT,
    "message" TEXT NOT NULL,
    "sha" TEXT,
    "label" TEXT,
    "authorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isAutoSave" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionTag" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepo" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "installationId" INTEGER,
    "accessToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubPullRequest" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "state" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "mergedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubPullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubIssue" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "state" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "labels" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubAuth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "expiresAt" TIMESTAMP(3),
    "installationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocSyncInfo" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "githubRepository" TEXT NOT NULL,
    "githubBranch" TEXT NOT NULL DEFAULT 'main',
    "githubPath" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "externalVersion" INTEGER NOT NULL DEFAULT 0,
    "derivedVersion" INTEGER NOT NULL DEFAULT 0,
    "lastExternalHash" TEXT,
    "lastDerivedHash" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "conflictResolution" "ConflictStrategy" NOT NULL DEFAULT 'MANUAL',
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SYNCED',
    "lastError" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "needSyncToGitHub" BOOLEAN NOT NULL DEFAULT false,
    "needSyncFromGitHub" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocSyncInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEvent" (
    "id" TEXT NOT NULL,
    "syncInfoId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTag" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "emoji" TEXT,
    "coverImage" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT,
    "authorId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "linkedDocumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InlineComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "highlightedText" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InlineComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InlineCommentReply" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InlineCommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "workspaceId" TEXT,
    "socketId" TEXT NOT NULL,
    "cursor" JSONB,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncSchedule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunSummary" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLock" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastPingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentMention" BOOLEAN NOT NULL DEFAULT true,
    "documentShared" BOOLEAN NOT NULL DEFAULT true,
    "githubPrReview" BOOLEAN NOT NULL DEFAULT true,
    "githubIssueAssigned" BOOLEAN NOT NULL DEFAULT true,
    "versionConflict" BOOLEAN NOT NULL DEFAULT true,
    "workspaceInvite" BOOLEAN NOT NULL DEFAULT true,
    "emailCommentMention" BOOLEAN NOT NULL DEFAULT false,
    "emailDocumentShared" BOOLEAN NOT NULL DEFAULT false,
    "emailGithubPrReview" BOOLEAN NOT NULL DEFAULT false,
    "emailGithubIssueAssigned" BOOLEAN NOT NULL DEFAULT false,
    "emailVersionConflict" BOOLEAN NOT NULL DEFAULT true,
    "emailWorkspaceInvite" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Workspace_updatedAt_idx" ON "Workspace"("updatedAt");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Document_workspaceId_idx" ON "Document"("workspaceId");

-- CreateIndex
CREATE INDEX "Document_authorId_idx" ON "Document"("authorId");

-- CreateIndex
CREATE INDEX "Document_updatedAt_idx" ON "Document"("updatedAt");

-- CreateIndex
CREATE INDEX "Document_parentId_idx" ON "Document"("parentId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_lastViewedAt_idx" ON "Document"("lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_workspaceId_path_key" ON "Document"("workspaceId", "path");

-- CreateIndex
CREATE INDEX "Version_documentId_idx" ON "Version"("documentId");

-- CreateIndex
CREATE INDEX "Version_sha_idx" ON "Version"("sha");

-- CreateIndex
CREATE INDEX "Version_createdAt_idx" ON "Version"("createdAt");

-- CreateIndex
CREATE INDEX "Version_authorId_idx" ON "Version"("authorId");

-- CreateIndex
CREATE INDEX "Version_isAutoSave_idx" ON "Version"("isAutoSave");

-- CreateIndex
CREATE INDEX "Version_isDraft_idx" ON "Version"("isDraft");

-- CreateIndex
CREATE UNIQUE INDEX "Version_documentId_version_key" ON "Version"("documentId", "version");

-- CreateIndex
CREATE INDEX "VersionTag_versionId_idx" ON "VersionTag"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "VersionTag_versionId_name_key" ON "VersionTag"("versionId", "name");

-- CreateIndex
CREATE INDEX "Comment_documentId_idx" ON "Comment"("documentId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepo_workspaceId_repoOwner_repoName_key" ON "GitHubRepo"("workspaceId", "repoOwner", "repoName");

-- CreateIndex
CREATE INDEX "GitHubPullRequest_repoId_state_idx" ON "GitHubPullRequest"("repoId", "state");

-- CreateIndex
CREATE INDEX "GitHubPullRequest_updatedAt_idx" ON "GitHubPullRequest"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubPullRequest_repoId_number_key" ON "GitHubPullRequest"("repoId", "number");

-- CreateIndex
CREATE INDEX "GitHubIssue_repoId_state_idx" ON "GitHubIssue"("repoId", "state");

-- CreateIndex
CREATE INDEX "GitHubIssue_updatedAt_idx" ON "GitHubIssue"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubIssue_repoId_number_key" ON "GitHubIssue"("repoId", "number");

-- CreateIndex
CREATE INDEX "Activity_workspaceId_createdAt_idx" ON "Activity"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_actorId_idx" ON "Activity"("actorId");

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "GitHubAuth_userId_idx" ON "GitHubAuth"("userId");

-- CreateIndex
CREATE INDEX "GitHubAuth_workspaceId_idx" ON "GitHubAuth"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAuth_userId_workspaceId_key" ON "GitHubAuth"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "DocSyncInfo_documentId_key" ON "DocSyncInfo"("documentId");

-- CreateIndex
CREATE INDEX "DocSyncInfo_workspaceId_idx" ON "DocSyncInfo"("workspaceId");

-- CreateIndex
CREATE INDEX "DocSyncInfo_githubRepository_githubBranch_idx" ON "DocSyncInfo"("githubRepository", "githubBranch");

-- CreateIndex
CREATE INDEX "DocSyncInfo_syncStatus_idx" ON "DocSyncInfo"("syncStatus");

-- CreateIndex
CREATE INDEX "DocSyncInfo_needSyncToGitHub_idx" ON "DocSyncInfo"("needSyncToGitHub");

-- CreateIndex
CREATE INDEX "DocSyncInfo_needSyncFromGitHub_idx" ON "DocSyncInfo"("needSyncFromGitHub");

-- CreateIndex
CREATE INDEX "DocSyncInfo_lastSyncedAt_idx" ON "DocSyncInfo"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "SyncEvent_syncInfoId_createdAt_idx" ON "SyncEvent"("syncInfoId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncEvent_eventType_idx" ON "SyncEvent"("eventType");

-- CreateIndex
CREATE INDEX "SyncEvent_createdAt_idx" ON "SyncEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_workspaceId_name_key" ON "Tag"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "DocumentTag_documentId_idx" ON "DocumentTag"("documentId");

-- CreateIndex
CREATE INDEX "DocumentTag_tagId_idx" ON "DocumentTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTag_documentId_tagId_key" ON "DocumentTag"("documentId", "tagId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_workspaceId_idx" ON "DocumentTemplate"("workspaceId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");

-- CreateIndex
CREATE INDEX "DocumentTemplate_isPublic_idx" ON "DocumentTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "DocumentLink_sourceDocumentId_idx" ON "DocumentLink"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "DocumentLink_linkedDocumentId_idx" ON "DocumentLink"("linkedDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLink_sourceDocumentId_linkedDocumentId_key" ON "DocumentLink"("sourceDocumentId", "linkedDocumentId");

-- CreateIndex
CREATE INDEX "Mention_documentId_idx" ON "Mention"("documentId");

-- CreateIndex
CREATE INDEX "Mention_userId_idx" ON "Mention"("userId");

-- CreateIndex
CREATE INDEX "InlineComment_documentId_idx" ON "InlineComment"("documentId");

-- CreateIndex
CREATE INDEX "InlineComment_authorId_idx" ON "InlineComment"("authorId");

-- CreateIndex
CREATE INDEX "InlineComment_resolved_idx" ON "InlineComment"("resolved");

-- CreateIndex
CREATE INDEX "InlineCommentReply_commentId_idx" ON "InlineCommentReply"("commentId");

-- CreateIndex
CREATE INDEX "InlineCommentReply_authorId_idx" ON "InlineCommentReply"("authorId");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_documentId_idx" ON "UserFavorite"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_documentId_key" ON "UserFavorite"("userId", "documentId");

-- CreateIndex
CREATE INDEX "RecentDocument_userId_accessedAt_idx" ON "RecentDocument"("userId", "accessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecentDocument_userId_documentId_key" ON "RecentDocument"("userId", "documentId");

-- CreateIndex
CREATE INDEX "Presence_documentId_idx" ON "Presence"("documentId");

-- CreateIndex
CREATE INDEX "Presence_workspaceId_idx" ON "Presence"("workspaceId");

-- CreateIndex
CREATE INDEX "Presence_lastSeen_idx" ON "Presence"("lastSeen");

-- CreateIndex
CREATE INDEX "Presence_userId_idx" ON "Presence"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_userId_socketId_key" ON "Presence"("userId", "socketId");

-- CreateIndex
CREATE INDEX "SyncSchedule_workspaceId_idx" ON "SyncSchedule"("workspaceId");

-- CreateIndex
CREATE INDEX "SyncSchedule_enabled_idx" ON "SyncSchedule"("enabled");

-- CreateIndex
CREATE INDEX "SyncSchedule_lastRunAt_idx" ON "SyncSchedule"("lastRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLock_documentId_key" ON "DocumentLock"("documentId");

-- CreateIndex
CREATE INDEX "DocumentLock_documentId_idx" ON "DocumentLock"("documentId");

-- CreateIndex
CREATE INDEX "DocumentLock_userId_idx" ON "DocumentLock"("userId");

-- CreateIndex
CREATE INDEX "DocumentLock_expiresAt_idx" ON "DocumentLock"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionTag" ADD CONSTRAINT "VersionTag_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepo" ADD CONSTRAINT "GitHubRepo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubPullRequest" ADD CONSTRAINT "GitHubPullRequest_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "GitHubRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubIssue" ADD CONSTRAINT "GitHubIssue_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "GitHubRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubAuth" ADD CONSTRAINT "GitHubAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocSyncInfo" ADD CONSTRAINT "DocSyncInfo_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncEvent" ADD CONSTRAINT "SyncEvent_syncInfoId_fkey" FOREIGN KEY ("syncInfoId") REFERENCES "DocSyncInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTag" ADD CONSTRAINT "DocumentTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTag" ADD CONSTRAINT "DocumentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_linkedDocumentId_fkey" FOREIGN KEY ("linkedDocumentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineComment" ADD CONSTRAINT "InlineComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineComment" ADD CONSTRAINT "InlineComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineComment" ADD CONSTRAINT "InlineComment_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineCommentReply" ADD CONSTRAINT "InlineCommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "InlineComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineCommentReply" ADD CONSTRAINT "InlineCommentReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentDocument" ADD CONSTRAINT "RecentDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentDocument" ADD CONSTRAINT "RecentDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLock" ADD CONSTRAINT "DocumentLock_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLock" ADD CONSTRAINT "DocumentLock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
