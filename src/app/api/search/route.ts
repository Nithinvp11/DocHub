import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/search - Search documents, workspaces, and more
export async function GET(req: NextRequest) {
  try {
    await req;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 requests per minute
    const identifier = user.id;
    const rateLimitResult = await rateLimit(identifier, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type') || 'all'; // all, documents, workspaces
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({
        documents: [],
        workspaces: [],
        total: 0,
      });
    }

    const searchTerm = query.toLowerCase();

    // Get user's workspace IDs for filtering (owned + member)
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    const memberWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    const workspaceIds = [
      ...ownedWorkspaces.map((w) => w.id),
      ...memberWorkspaces.map((w) => w.workspaceId),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let documents: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let workspaces: any[] = [];

    // Search documents
    if (type === 'all' || type === 'documents') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentWhere: any = {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { path: { contains: searchTerm, mode: 'insensitive' } },
        ],
        workspaceId: workspaceId ? workspaceId : { in: workspaceIds },
      };

      documents = await prisma.document.findMany({
        where: documentWhere,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          path: true,
          emoji: true,
          status: true,
          type: true,
          phase: true,
          workspaceId: true,
          updatedAt: true,
          createdAt: true,
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
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Add search highlights and relevance
      documents = documents.map((doc) => {
        const titleMatch = doc.title.toLowerCase().includes(searchTerm);
        const contentMatch = doc.content.toLowerCase().includes(searchTerm);
        const pathMatch = doc.path.toLowerCase().includes(searchTerm);

        // Calculate relevance score
        let relevance = 0;
        if (titleMatch) relevance += 3;
        if (pathMatch) relevance += 2;
        if (contentMatch) relevance += 1;

        // Extract snippet
        const contentLower = doc.content.toLowerCase();
        const index = contentLower.indexOf(searchTerm);
        let snippet = '';

        if (index !== -1) {
          const start = Math.max(0, index - 60);
          const end = Math.min(doc.content.length, index + searchTerm.length + 60);
          snippet = doc.content.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < doc.content.length) snippet = snippet + '...';
        } else {
          snippet = doc.content.substring(0, 150) + (doc.content.length > 150 ? '...' : '');
        }

        return {
          ...doc,
          snippet,
          relevance,
          matches: {
            title: titleMatch,
            content: contentMatch,
            path: pathMatch,
          },
        };
      });

      // Sort by relevance
      documents.sort((a, b) => b.relevance - a.relevance);
    }

    // Search workspaces
    if (type === 'all' || type === 'workspaces') {
      workspaces = await prisma.workspace.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            { id: { in: workspaceIds } },
          ],
        },
        take: Math.min(limit, 10),
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              documents: true,
              members: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      documents,
      workspaces,
      total: documents.length + workspaces.length,
      query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
