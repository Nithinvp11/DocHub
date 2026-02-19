import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/analytics/performance
 * Receives performance metrics from the client
 *
 * This endpoint is called by navigator.sendBeacon() to track Web Vitals
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Validate metric structure
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({ error: 'Invalid metric data' }, { status: 400 });
    }

    // Log metric (in production, send to analytics service)
    console.log('[Performance Metric]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      timestamp: metric.timestamp,
    });

    // In production, you would send to your analytics service:
    // await sendToAnalyticsService(metric);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to process performance metric:', error);

    return NextResponse.json({ error: 'Failed to process metric' }, { status: 500 });
  }
}

// Optional: GET endpoint to retrieve performance data
export async function GET() {
  try {
    // In production, fetch from your analytics database
    const metrics = [
      // Example data structure
      {
        name: 'LCP',
        average: 2300,
        p95: 3500,
        samples: 1000,
      },
      {
        name: 'FID',
        average: 80,
        p95: 150,
        samples: 1000,
      },
    ];

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);

    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
