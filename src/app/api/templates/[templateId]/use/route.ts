import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// POST /api/templates/[templateId]/use - Create document from template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = await params;
    const body = await req.json();
    const { workspaceId, title, path } = body;

    if (!workspaceId || !title || !path) {
      return NextResponse.json(
        { error: 'workspaceId, title, and path are required' },
        { status: 400 }
      );
    }

    // Check workspace permissions for creating documents
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_CREATE);

    // Get template
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check template access (must be public or in same workspace)
    if (!template.isPublic && template.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Access denied to template' }, { status: 403 });
    }

    // Create document from template
    const document = await prisma.document.create({
      data: {
        title,
        path,
        content: template.content,
        emoji: template.emoji,
        coverImage: template.coverImage,
        workspaceId,
        authorId: user.id,
      },
    });

    // Increment template usage count
    await prisma.documentTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_CREATED',
        actorId: user.id,
        workspaceId,
        entityType: 'Document',
        entityId: document.id,
        metadata: {
          templateId: template.id,
          templateTitle: template.title,
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating document from template:', error);
    return NextResponse.json({ error: 'Failed to create document from template' }, { status: 500 });
  }
}
