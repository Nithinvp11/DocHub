import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.isAdmin) {
      return NextResponse.json(
        { authenticated: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
