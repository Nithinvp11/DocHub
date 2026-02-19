import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores',
    }),
});

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = usernameSchema.parse(body);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { usernameChangedAt: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if username was changed in the last 30 days
    if (user.usernameChangedAt) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (user.usernameChangedAt > thirtyDaysAgo) {
        const nextAllowedDate = new Date(user.usernameChangedAt);
        nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);

        return NextResponse.json(
          {
            error: `You can only change your username once every 30 days. Next change available on ${nextAllowedDate.toLocaleDateString()}`,
          },
          { status: 400 }
        );
      }
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUser && existingUser.id !== currentUser.id) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Update username
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        username: validatedData.username,
        usernameChangedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Username updated successfully',
      username: validatedData.username,
    });
  } catch (error) {
    console.error('Update username error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}
