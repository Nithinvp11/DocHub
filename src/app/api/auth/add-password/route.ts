import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const passwordSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = passwordSchema.parse(body);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user already has a password, they should use change password instead
    if (currentUser.password) {
      return NextResponse.json(
        { error: 'Password already set. Use change password instead.' },
        { status: 400 }
      );
    }

    // Check if email is already in use (if trying to add different email)
    if (validatedData.email !== currentUser.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingEmail) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Update user with email and password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: validatedData.email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: 'Email and password added successfully',
    });
  } catch (error) {
    console.error('Add password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to add password' }, { status: 500 });
  }
}
