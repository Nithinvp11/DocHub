import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import * as CryptoJS from 'crypto-js';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeText, sanitizeMarkdown } from '@/lib/sanitize';
import { PAGINATION_LIMITS } from '@/lib/constants';
import { ActivityTracker } from '@/lib/activity';
import { generateUniqueGitHubPath } from '@/lib/github-path-utils';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const documentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  path: z.string().min(1),
  phase: z.enum(['PLANNING', 'DEVELOPMENT', 'REVIEW', 'COMPLETE', 'ARCHIVED']).optional(),
  type: z
    .enum(['GENERAL', 'SPECIFICATION', 'MEETING_NOTES', 'API_DOCS', 'GUIDE', 'RFC'])
    .optional(),
  workspaceId: z.string(),
});

// GET all documents in a workspace
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(
      searchParams.get('limit') || String(PAGINATION_LIMITS.DOCUMENTS_PER_PAGE)
    );

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: {
          workspaceId,
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
          _count: {
            select: {
              versions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.document.count({
        where: {
          workspaceId,
        },
      }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + documents.length < total,
      },
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new document
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = getClientIdentifier(req) + ':' + user.id;
    const { success, remaining } = await rateLimit(identifier, 10, 60000); // 10 requests per minute

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      );
    }

    const body = await req.json();
    const { title, content, path, phase, type, workspaceId } = documentSchema.parse(body);

    // Sanitize inputs
    const sanitizedTitle = sanitizeText(title);
    const sanitizedContent = sanitizeMarkdown(content);
    const sanitizedPath = sanitizeText(path);

    // CRITICAL: Ensure initial version has content
    // If content is empty, use a default placeholder to prevent empty version 1
    const initialContent = sanitizedContent.trim() || '# New Document\n\nStart writing here...';

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);

    // Check if document with same path exists
    const existingDoc = await prisma.document.findFirst({
      where: {
        workspaceId,
        path,
      },
    });

    if (existingDoc) {
      return NextResponse.json(
        { error: 'Document with this path already exists' },
        { status: 400 }
      );
    }

    // Generate unique GitHub path
    const githubPath = await generateUniqueGitHubPath({
      phase: phase || 'PLANNING',
      type: type || 'GENERAL',
      title: sanitizedTitle,
      workspaceId,
    });

    const document = await prisma.document.create({
      data: {
        title: sanitizedTitle,
        content: initialContent, // Use initialContent instead of sanitizedContent
        path: sanitizedPath,
        phase,
        type,
        workspaceId,
        authorId: user.id,
        githubPath,
        githubAutoGenerated: true,
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
    });

    // Create initial version with SHA hash
    // CRITICAL: Use initialContent to ensure version 1 always has content
    const sha = CryptoJS.SHA256(initialContent).toString().substring(0, 7);

    // CONTENT FORMAT LOGGING
    // TipTap editor outputs HTML format (via getHTML()), which is expected and intentional
    const contentIsHtml = /<[a-z][\s\S]*>/i.test(initialContent);
    console.log(
      `[Initial Version Creation] Document ${document.id} - Format: ${contentIsHtml ? 'HTML' : 'Markdown'}, ` +
        `Size: ${initialContent.length} chars`
    );

    await prisma.version.create({
      data: {
        documentId: document.id,
        content: initialContent, // Use initialContent instead of content
        message: 'Initial version',
        sha,
        authorId: user.id,
        version: 1,
      },
    });

    // Track activity
    await ActivityTracker.trackDocumentCreated(document.id, user.id, workspaceId, sanitizedTitle);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
