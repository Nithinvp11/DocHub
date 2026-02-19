import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { validateEmail, validatePassword, sanitizeText } from '@/lib/sanitize';

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores',
    }),
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - stricter for registration
    const identifier = getClientIdentifier(req);

    // Development convenience: skip registration rate limit locally so testers can
    // create accounts without waiting for the 1 hour window.
    // Production still enforces the limit. You can override defaults with env vars:
    // - REGISTER_RATE_LIMIT (number)
    // - REGISTER_RATE_WINDOW_MS (milliseconds)
    const isDev = process.env.NODE_ENV === 'development';
    const registerLimit = Number(process.env.REGISTER_RATE_LIMIT ?? 3);
    const registerWindow = Number(process.env.REGISTER_RATE_WINDOW_MS ?? 3600000);

    if (!isDev) {
      const { success, remaining } = await rateLimit(identifier, registerLimit, registerWindow); // default 3 registrations per hour

      if (!success) {
        return NextResponse.json(
          { error: 'Too many registration attempts. Please try again later.' },
          { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
        );
      }
    }

    const body = await req.json();
    const { username, email, password, name } = registerSchema.parse(body);

    // Additional validation
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.errors.join(', ') }, { status: 400 });
    }

    // Sanitize name
    const sanitizedName = name ? sanitizeText(name) : '';

    // Check if user already exists (email or username)
    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingUserByEmail) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    if (existingUserByUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
