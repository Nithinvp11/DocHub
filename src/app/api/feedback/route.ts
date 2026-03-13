import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { NotificationService } from '@/lib/notifications';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// GET /api/feedback - Get all feedback (admin only) or user's own feedback
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const adminCookie = request.cookies.get('admin-token')?.value;

    // Allow requests authenticated via NextAuth _or_ the admin-token JWT cookie
    if (!currentUser && !adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const isAdmin = searchParams.get('admin') === 'true';

    // Determine admin status from session (if present) or admin-token
    let userIsAdmin = false;
    if (currentUser) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true },
      });
      userIsAdmin = dbUser?.role === 'ADMIN';
    }

    if (!userIsAdmin && adminCookie) {
      try {
        const decoded = verify(adminCookie, JWT_SECRET) as { isAdmin?: boolean };
        if (decoded?.isAdmin) {
          userIsAdmin = true;
          console.debug('[GET /api/feedback] admin access granted via admin-token');
        }
      } catch {
        // ignore invalid admin token
      }
    }

    // If the caller requested admin view but is not an admin, block it
    if (isAdmin && !userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // DEBUG: help developers see why admin requests may be filtered
    console.debug(
      '[GET /api/feedback] currentUserId=',
      currentUser?.id ?? 'none',
      'userIsAdmin=',
      userIsAdmin,
      'adminParam=',
      isAdmin
    );

    // Build query
    const where: Prisma.FeedbackWhereInput = {};

    // Only return all feedback when explicitly requested as admin view.
    // Without ?admin=true, always scope to the current user's own feedback
    // (even if their account has the ADMIN role — e.g. on the settings page).
    if (!isAdmin) {
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      where.userId = currentUser.id;
    }

    if (type) where.type = type as Prisma.EnumFeedbackTypeFilter;
    if (status) where.status = status as Prisma.EnumFeedbackStatusFilter;
    if (priority) where.priority = priority as Prisma.EnumFeedbackPriorityFilter;

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json({
      feedback,
      count: feedback.length,
      isAdmin: userIsAdmin,
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    // Allow anonymous feedback: user may be null
    const user = await getCurrentUser();

    // Rate limiting: 3 feedback submissions per hour (prevent spam)
    // - If user is logged in, rate-limit by user id
    // - Otherwise rate-limit by client identifier (IP / user-agent hash)
    const identifier = user ? user.id : getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 3, 3600000); // 1 hour
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many feedback submissions. Please try again in an hour.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const body = await request.json();

    const { type = 'GENERAL', category, title, description, rating, url, screenshot } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Validate rating if provided (null means no rating selected — that's valid)
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Get user agent from headers
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        // allow anonymous submissions (userId nullable in schema)
        userId: user?.id ?? null,
        type,
        category,
        title,
        description,
        rating,
        url,
        userAgent,
        screenshot,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Notify all admin users about new feedback (non-blocking)
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
      });
      await Promise.all(
        admins.map((admin) =>
          NotificationService.notifyFeedbackReceived(
            admin.id,
            feedback.title,
            feedback.id,
            user?.name || user?.email || 'Anonymous'
          )
        )
      );
    } catch (err) {
      // Log but do not fail the request
      console.error('Failed to notify admins about new feedback:', err);
    }

    return NextResponse.json({
      feedback,
      message: 'Feedback submitted successfully. Thank you!',
    });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
