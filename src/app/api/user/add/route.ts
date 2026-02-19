import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  role: z.enum(['USER', 'ADMIN']).default('USER').optional(),
});

/**
 * POST /api/user/add
 * Add a new user (admin only)
 *
 * This endpoint allows administrators to create new user accounts
 * Users are identified by email and username (both must be unique)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
    }

    // Check if username already exists (case-insensitive)
    if (validatedData.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: {
            equals: validatedData.username,
            mode: 'insensitive',
          },
        },
      });

      if (existingUsername) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 10);
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        name: validatedData.name || validatedData.username,
        password: hashedPassword,
        role: validatedData.role || 'USER',
        emailVerified: new Date(), // Auto-verify admin-created accounts
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`[Add User] Admin ${user.id} created user: ${newUser.email}`);

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('[Add User] Error creating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/add
 * List all users (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          image: true,
          role: true,
          githubLinked: true,
          createdAt: true,
          _count: {
            select: {
              ownedWorkspaces: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[List Users] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
