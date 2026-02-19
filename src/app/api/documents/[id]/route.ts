import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import DiffMatchPatch from 'diff-match-patch';
import * as CryptoJS from 'crypto-js';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeText, sanitizeMarkdown } from '@/lib/sanitize';
import { PAGINATION_LIMITS } from '@/lib/constants';
import { ActivityTracker } from '@/lib/activity';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const documentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  message: z.string().optional(), // Commit message for version (optional)
  createVersion: z.boolean().optional().default(true), // Whether to create a version
  isAutoSave: z.boolean().optional().default(false), // Auto-save vs manual save
  isDraft: z.boolean().optional().default(false), // Draft version
  githubPath: z.string().optional(), // GitHub file path
  githubSha: z.string().optional(), // GitHub commit SHA
});

const dmp = new DiffMatchPatch();

// GET document by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            members: {
              where: { userId: user.id },
            },
          },
        },
        versions: {
          take: PAGINATION_LIMITS.VERSION_HISTORY_SIDEBAR,
          orderBy: {
            version: 'desc',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        comments: {
          where: {
            resolved: false,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update document
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user has access to the document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            id: true,
            ownerId: true,
            members: {
              where: { userId: user.id },
            },
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        lock: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // Check if document is locked by another user
    if (document.lock) {
      const now = new Date();
      // Lock is valid and not expired
      if (now <= document.lock.expiresAt) {
        // If locked by another user, deny edit
        if (document.lock.userId !== user.id) {
          return NextResponse.json(
            {
              error: 'Document is locked for editing by another user',
              lockedBy: document.lock.user,
              expiresAt: document.lock.expiresAt,
            },
            { status: 423 } // 423 Locked
          );
        }
      } else {
        // Lock expired - clean it up
        await prisma.documentLock.delete({
          where: { id: document.lock.id },
        });
      }
    }

    const body = await req.json();
    const { title, content, message, createVersion, isAutoSave, isDraft, githubPath, githubSha } =
      documentUpdateSchema.parse(body);

    // CRITICAL: Validate version content before any updates
    // Prevent empty versions from being created
    if (createVersion && content !== undefined) {
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent.length === 0) {
        return NextResponse.json(
          { error: 'Cannot create version with empty content' },
          { status: 400 }
        );
      }
    }

    // CRITICAL: Protect initial version integrity
    // Before updating document, verify initial version (version=1) exists and has content
    if (content !== undefined && content !== document.content) {
      const initialVersion = await prisma.version.findFirst({
        where: {
          documentId: id,
          version: 1,
        },
        select: {
          id: true,
          content: true,
        },
      });

      // If initial version exists but is empty, restore it from current document content
      if (
        initialVersion &&
        (!initialVersion.content || initialVersion.content.trim().length === 0)
      ) {
        console.warn(
          `⚠️  Detected empty initial version for document ${id}, restoring from current content`
        );

        if (document.content && document.content.trim().length > 0) {
          await prisma.version.update({
            where: { id: initialVersion.id },
            data: { content: document.content },
          });
          console.log(`✅ Restored initial version content for document ${id}`);
        }
      }
    }

    const updateData: {
      title?: string;
      content?: string;
      githubPath?: string | null;
      githubSha?: string | null;
    } = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (githubPath !== undefined) updateData.githubPath = githubPath || null;
    if (githubSha !== undefined) updateData.githubSha = githubSha || null;

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create new version if content changed AND createVersion is true
    if (content && content !== document.content && createVersion) {
      // For auto-saves, use generic message; for manual saves, require message
      const versionMessage = isAutoSave ? 'Auto-save' : message || 'Update document';

      if (!isAutoSave && !isDraft && !message) {
        return NextResponse.json(
          { error: 'Commit message is required for manual saves' },
          { status: 400 }
        );
      }
      const lastVersion = document.versions[0]?.version || 0;

      // CONTENT FORMAT VALIDATION & LOGGING
      // TipTap editor outputs HTML format (via getHTML()), which is expected and intentional
      const contentIsHtml = /<[a-z][\s\S]*>/i.test(content);
      console.log(
        `[Version Creation] Document ${id} - Format: ${contentIsHtml ? 'HTML' : 'Markdown'}, ` +
          `Version: ${lastVersion + 1}, Size: ${content.length} chars`
      );

      // Calculate diff
      const diff = dmp.diff_main(document.content, content);
      dmp.diff_cleanupSemantic(diff);
      const diffText = dmp.diff_prettyHtml(diff);

      // Generate SHA-256 hash (like Git)
      const sha = CryptoJS.SHA256(content).toString().substring(0, 7);

      const newVersion = await prisma.version.create({
        data: {
          documentId: id,
          content,
          diff: diffText,
          message: versionMessage,
          sha,
          authorId: user.id,
          version: lastVersion + 1,
          isAutoSave: isAutoSave || false,
          isDraft: isDraft || false,
        },
      });

      // Track version creation activity (only for manual saves)
      if (!isAutoSave) {
        await ActivityTracker.trackVersionCreated(
          newVersion.id,
          id,
          user.id,
          document.workspaceId,
          versionMessage
        );
      }
    }

    // Track document update activity
    await ActivityTracker.trackDocumentUpdated(
      id,
      user.id,
      document.workspaceId,
      updatedDocument.title
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE document
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // SECURITY: Check if user is document author or workspace admin
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            ownerId: true,
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await assertPermission(user.id, document.workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_DELETE);

    // Track activity before deletion (document still exists)
    await ActivityTracker.trackDocumentDeleted(id, user.id, document.workspaceId, document.title);

    // Hard delete: Permanently delete the document
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
