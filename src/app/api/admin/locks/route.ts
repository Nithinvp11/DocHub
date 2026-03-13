import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getAllActiveLocks } from '@/lib/admin';

// TODO: unused API route — verify before deletion

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) throw new Error('Unauthorized');

  const decoded = verify(token, JWT_SECRET) as JWTPayload;
  if (!decoded.isAdmin) throw new Error('Forbidden');

  return decoded;
}

// GET all active locks
export async function GET(req: NextRequest) {
  try {
    verifyAdmin(req);

    const locks = await getAllActiveLocks();
    return NextResponse.json(locks);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.error('Error fetching locks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin has read-only access - DELETE operation removed
// Only lock owners can release their own locks
