/**
 * Environment Status API
 *
 * GET /api/admin/env-check
 * Check environment variable configuration status (admin only)
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { validateEnvironment } from '@/lib/env-validation';

export async function GET() {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check (optional - add role check if you have admin roles)
    // For now, any authenticated user can check env status in development
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to restrict this to admin users only
      // Uncomment and implement if you have role-based access:
      // const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      // if (user.role !== 'ADMIN') {
      //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      // }
    }

    const result = validateEnvironment();

    return NextResponse.json({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Env Check API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check environment' },
      { status: 500 }
    );
  }
}
