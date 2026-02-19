import { prisma } from './prisma';
import { ActivityType, Prisma } from '@prisma/client';

export interface CreateActivityParams {
  type: ActivityType;
  actorId: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.JsonValue;
}

export class ActivityTracker {
  static async create(params: CreateActivityParams) {
    return prisma.activity.create({
      data: {
        type: params.type,
        actorId: params.actorId,
        workspaceId: params.workspaceId,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || {},
      },
    });
  }

  static async getWorkspaceActivity(
    workspaceId: string,
    limit = 50,
    cursor?: string,
    skip?: number
  ) {
    return prisma.activity.findMany({
      where: { workspaceId },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : skip !== undefined
          ? { skip }
          : {}),
    });
  }

  static async getUserActivity(userId: string, limit = 50) {
    return prisma.activity.findMany({
      where: { actorId: userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Track document activities
  static async trackDocumentCreated(
    documentId: string,
    actorId: string,
    workspaceId: string,
    title: string
  ) {
    return this.create({
      type: 'DOCUMENT_CREATED',
      actorId,
      workspaceId,
      entityType: 'Document',
      entityId: documentId,
      metadata: { title },
    });
  }

  static async trackDocumentUpdated(
    documentId: string,
    actorId: string,
    workspaceId: string,
    title: string
  ) {
    return this.create({
      type: 'DOCUMENT_UPDATED',
      actorId,
      workspaceId,
      entityType: 'Document',
      entityId: documentId,
      metadata: { title },
    });
  }

  static async trackDocumentDeleted(
    documentId: string,
    actorId: string,
    workspaceId: string,
    title: string
  ) {
    return this.create({
      type: 'DOCUMENT_DELETED',
      actorId,
      workspaceId,
      entityType: 'Document',
      entityId: documentId,
      metadata: { title },
    });
  }

  static async trackVersionCreated(
    versionId: string,
    documentId: string,
    actorId: string,
    workspaceId: string,
    message: string
  ) {
    return this.create({
      type: 'VERSION_CREATED',
      actorId,
      workspaceId,
      entityType: 'Version',
      entityId: versionId,
      metadata: { documentId, message },
    });
  }

  static async trackCommentAdded(
    commentId: string,
    documentId: string,
    actorId: string,
    workspaceId: string
  ) {
    return this.create({
      type: 'COMMENT_ADDED',
      actorId,
      workspaceId,
      entityType: 'Comment',
      entityId: commentId,
      metadata: { documentId },
    });
  }

  // Track GitHub activities
  static async trackGitHubPROpened(
    prNumber: number,
    actorId: string,
    workspaceId: string,
    repoName: string,
    title: string
  ) {
    return this.create({
      type: 'GITHUB_PR_OPENED',
      actorId,
      workspaceId,
      entityType: 'GitHubPR',
      entityId: prNumber.toString(),
      metadata: { repoName, title, prNumber },
    });
  }

  static async trackGitHubPRMerged(
    prNumber: number,
    actorId: string,
    workspaceId: string,
    repoName: string,
    title: string
  ) {
    return this.create({
      type: 'GITHUB_PR_MERGED',
      actorId,
      workspaceId,
      entityType: 'GitHubPR',
      entityId: prNumber.toString(),
      metadata: { repoName, title, prNumber },
    });
  }

  static async trackGitHubIssueOpened(
    issueNumber: number,
    actorId: string,
    workspaceId: string,
    repoName: string,
    title: string
  ) {
    return this.create({
      type: 'GITHUB_ISSUE_OPENED',
      actorId,
      workspaceId,
      entityType: 'GitHubIssue',
      entityId: issueNumber.toString(),
      metadata: { repoName, title, issueNumber },
    });
  }

  static async trackGitHubImport(
    actorId: string,
    workspaceId: string,
    repoName: string,
    filesImported: number
  ) {
    return this.create({
      type: 'GITHUB_IMPORT',
      actorId,
      workspaceId,
      entityType: 'GitHubRepo',
      entityId: repoName,
      metadata: { repoName, filesImported },
    });
  }

  static async trackGitHubExport(
    actorId: string,
    workspaceId: string,
    repoName: string,
    filesExported: number
  ) {
    return this.create({
      type: 'GITHUB_EXPORT',
      actorId,
      workspaceId,
      entityType: 'GitHubRepo',
      entityId: repoName,
      metadata: { repoName, filesExported },
    });
  }
}
