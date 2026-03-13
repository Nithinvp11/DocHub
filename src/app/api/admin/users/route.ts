import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getAllUsers } from '@/lib/admin';

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required for admin authentication');
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) throw new Error('Unauthorized');

  const decoded = verify(token, JWT_SECRET!) as JWTPayload; // Safe: checked at module load
  if (!decoded.isAdmin) throw new Error('Forbidden');

  return decoded;
}

// GET all users
export async function GET(req: NextRequest) {
  try {
    verifyAdmin(req);

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin has read-only access - DELETE and PATCH operations removed
// Admin can only view users, not modify or delete them
