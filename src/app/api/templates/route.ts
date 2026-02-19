import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const templateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  content: z.string(),
  emoji: z.string().optional(),
  coverImage: z.string().url().optional(),
  category: z.string().default('General'),
  isPublic: z.boolean().default(false),
});

// GET /api/templates?workspaceId=xxx&category=xxx - List templates
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Check workspace access
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    // Get workspace templates + public global templates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      OR: [
        { workspaceId, isPublic: false }, // Private workspace templates
        { workspaceId: null, isPublic: true }, // Public global templates
      ],
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const templates = await prisma.documentTemplate.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/templates - Create template
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, ...templateData } = body;

    // Validate input
    const validation = templateSchema.safeParse(templateData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid template data', details: validation.error },
        { status: 400 }
      );
    }

    // Check workspace permissions if creating workspace template
    if (workspaceId) {
      await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);
    }

    // Create template
    const template = await prisma.documentTemplate.create({
      data: {
        ...validation.data,
        workspaceId: workspaceId || null,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
