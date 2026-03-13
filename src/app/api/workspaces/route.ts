import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

const workspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  memberLimit: z.number().int().min(1).nullable().optional(),
});

// GET all workspaces for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          // User is the owner
          { ownerId: user.id },
          // User is a member
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new workspace
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = getClientIdentifier(req) + ':' + user.id;
    const { success, remaining } = await rateLimit(identifier, 5, 3600000); // 5 workspaces per hour

    if (!success) {
      return NextResponse.json(
        { error: 'Too many workspace creations. Please try again later.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      );
    }

    const body = await req.json();
    const { name, description, memberLimit } = workspaceSchema.parse(body);

    // Sanitize inputs
    const sanitizedName = sanitizeText(name);
    const sanitizedDescription = description ? sanitizeText(description) : null;

    const workspace = await prisma.workspace.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        memberLimit: memberLimit ?? null,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // If user has GitHub linked, create GitHubAuth record for this workspace
    try {
      const githubAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: 'github',
        },
        select: {
          access_token: true,
          refresh_token: true,
          expires_at: true,
          scope: true,
        },
      });

      if (githubAccount?.access_token) {
        await prisma.gitHubAuth.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            accessToken: githubAccount.access_token,
            refreshToken: githubAccount.refresh_token,
            expiresAt: githubAccount.expires_at ? new Date(githubAccount.expires_at * 1000) : null,
            scope: githubAccount.scope,
          },
        });
        console.log(`Created GitHubAuth record for workspace ${workspace.id}`);
      }
    } catch (error) {
      // Log but don't fail workspace creation if GitHub auth fails
      console.error('Error creating GitHubAuth for new workspace:', error);
    }

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
