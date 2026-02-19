import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const linkSchema = z.object({
  githubId: z.string().min(1),
  githubUsername: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = linkSchema.parse(body);

    // Check if GitHub account is already linked to another user
    const existingLink = await prisma.account.findFirst({
      where: {
        provider: 'github',
        providerAccountId: validatedData.githubId,
      },
    });

    if (existingLink && existingLink.userId !== user.id) {
      return NextResponse.json(
        { error: 'This GitHub account is already linked to another user' },
        { status: 400 }
      );
    }

    // Link GitHub account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'github',
          providerAccountId: validatedData.githubId,
        },
      },
      update: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'github',
        providerAccountId: validatedData.githubId,
        access_token: '', // Would be populated during OAuth flow
        token_type: 'bearer',
        scope: 'read:user',
      },
    });

    // Update user githubLinked flag
    await prisma.user.update({
      where: { id: user.id },
      data: { githubLinked: true },
    });

    return NextResponse.json({
      message: 'GitHub account linked successfully',
      githubUsername: validatedData.githubUsername,
    });
  } catch (error) {
    console.error('Link GitHub error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to link GitHub account' }, { status: 500 });
  }
}

// Unlink GitHub account
export async function DELETE(req: NextRequest) {
  try {
    await req;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has password before unlinking (prevent lockout)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!currentUser?.password) {
      return NextResponse.json(
        {
          error:
            'Cannot unlink GitHub. Please add email/password first to prevent account lockout.',
        },
        { status: 400 }
      );
    }

    // Delete GitHub account link
    await prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider: 'github',
      },
    });

    // Update user githubLinked flag
    await prisma.user.update({
      where: { id: user.id },
      data: { githubLinked: false },
    });

    return NextResponse.json({
      message: 'GitHub account unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink GitHub error:', error);
    return NextResponse.json({ error: 'Failed to unlink GitHub account' }, { status: 500 });
  }
}
