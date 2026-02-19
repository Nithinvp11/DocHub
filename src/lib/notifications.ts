import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  static async create(params: CreateNotificationParams) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  }

  static async getUserNotifications(userId: string, limit = 50, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  static async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  // Helper methods for specific notification types
  static async notifyCommentMention(
    userId: string,
    documentTitle: string,
    documentId: string,
    mentionedBy: string
  ) {
    return this.create({
      userId,
      type: 'COMMENT_MENTION',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in "${documentTitle}"`,
      link: `/documents/${documentId}`,
    });
  }

  static async notifyDocumentShared(
    userId: string,
    documentTitle: string,
    documentId: string,
    sharedBy: string
  ) {
    return this.create({
      userId,
      type: 'DOCUMENT_SHARED',
      title: 'Document shared with you',
      message: `${sharedBy} shared "${documentTitle}" with you`,
      link: `/documents/${documentId}`,
    });
  }

  static async notifyGitHubPRReview(
    userId: string,
    prTitle: string,
    prUrl: string,
    reviewer: string
  ) {
    return this.create({
      userId,
      type: 'GITHUB_PR_REVIEW',
      title: 'PR Review Request',
      message: `${reviewer} requested your review on "${prTitle}"`,
      link: prUrl,
    });
  }

  static async notifyWorkspaceInvite(
    userId: string,
    workspaceName: string,
    workspaceId: string,
    invitedBy: string
  ) {
    return this.create({
      userId,
      type: 'WORKSPACE_INVITE',
      title: 'Workspace Invitation',
      message: `${invitedBy} invited you to join "${workspaceName}"`,
      link: `/dashboard/invites`,
    });
  }

  static async notifyFeedbackReceived(
    userId: string,
    feedbackTitle: string,
    feedbackId: string,
    submittedBy: string
  ) {
    return this.create({
      userId,
      type: 'FEEDBACK_RECEIVED',
      title: 'New feedback submitted',
      message: `${submittedBy} submitted feedback: "${feedbackTitle}"`,
      link: `/admin/feedback/${feedbackId}`,
    });
  }
}
