import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * POST /api/auth/set-password
 * Set password for OAuth users who don't have a password yet
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = setPasswordSchema.parse(body);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow setting password if user doesn't have one (GitHub OAuth users)
    if (currentUser.password) {
      return NextResponse.json(
        { error: 'Password already set. Please use "Change Password" instead.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Update user with password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error) {
    console.error('Set password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
  }
}
