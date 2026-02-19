import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredLocks } from '@/lib/document-lock';

/**
 * Cron endpoint for cleaning up expired locks
 *
 * This endpoint should be called periodically (e.g., every 5-10 minutes)
 * by a cron job service like Vercel Cron or GitHub Actions
 *
 * Security: Verify the cron secret to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for production)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up expired locks
    const count = await cleanupExpiredLocks();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${count} expired locks`,
      removedCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lock cleanup cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clean up expired locks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for manual cleanup (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await cleanupExpiredLocks();

    return NextResponse.json({
      success: true,
      message: 'Manual cleanup completed',
      removedCount: count,
    });
  } catch (error) {
    console.error('Manual lock cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
