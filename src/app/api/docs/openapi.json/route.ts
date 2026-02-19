import { NextResponse } from 'next/server';
import { getOpenAPIJSON } from '@/lib/api-docs';

/**
 * GET /api/docs/openapi.json
 * Returns the OpenAPI 3.0 specification in JSON format
 */
export async function GET() {
  try {
    const spec = getOpenAPIJSON();

    return new NextResponse(spec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);

    return NextResponse.json({ error: 'Failed to generate API documentation' }, { status: 500 });
  }
}
