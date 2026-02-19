import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
});

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        githubLinked: true,
        password: true, // Include to check if password auth is active
        githubUsername: true,
        githubAvatarUrl: true,
        // SECURITY: Never expose password hash to client (but we can check if it exists)
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data with password existence flag (not the hash)
    const { password, ...userData } = profile;
    return NextResponse.json({
      ...userData,
      hasPassword: !!password, // Boolean flag instead of hash
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
