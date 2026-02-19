import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getSystemStats } from '@/lib/admin';

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

// GET system statistics
export async function GET(req: NextRequest) {
  try {
    verifyAdmin(req);

    const stats = await getSystemStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
