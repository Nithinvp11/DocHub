import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// GET /api/feedback/stats - Get feedback statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const adminCookie = request.cookies.get('admin-token')?.value;

    // Allow NextAuth session OR admin-token JWT
    if (!currentUser && !adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine admin status from session (if present) or admin-token
    let userIsAdmin = false;
    if (currentUser) {
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true },
      });
      userIsAdmin = user?.role === 'ADMIN';
    }

    if (!userIsAdmin && adminCookie) {
      try {
        const decoded = verify(adminCookie, JWT_SECRET) as { isAdmin?: boolean };
        if (decoded?.isAdmin) {
          userIsAdmin = true;
          console.debug('[GET /api/feedback/stats] admin access granted via admin-token');
        }
      } catch {
        // ignore invalid admin token
      }
    }

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get counts by status
    const byStatus = await prisma.feedback.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get counts by type
    const byType = await prisma.feedback.groupBy({
      by: ['type'],
      _count: true,
    });

    // Get counts by priority
    const byPriority = await prisma.feedback.groupBy({
      by: ['priority'],
      _count: true,
    });

    // Get average rating
    const avgRating = await prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        rating: {
          not: null,
        },
      },
    });

    // Get total counts
    const total = await prisma.feedback.count();
    const newCount = await prisma.feedback.count({ where: { status: 'NEW' } });
    const resolvedCount = await prisma.feedback.count({
      where: { status: { in: ['RESOLVED', 'CLOSED'] } },
    });

    // Get recent feedback (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await prisma.feedback.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return NextResponse.json({
      total,
      new: newCount,
      resolved: resolvedCount,
      recentCount,
      averageRating: avgRating._avg.rating || 0,
      byStatus: byStatus.map((item: { status: string; _count: number }) => ({
        status: item.status,
        count: item._count,
      })),
      byType: byType.map((item: { type: string; _count: number }) => ({
        type: item.type,
        count: item._count,
      })),
      byPriority: byPriority.map((item: { priority: string; _count: number }) => ({
        priority: item.priority,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch feedback stats:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback stats' }, { status: 500 });
  }
}
