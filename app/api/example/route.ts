import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrSet, getCache, setCache, deleteCache } from '@/lib/cache';

/**
 * Example API route demonstrating Redis caching
 *
 * GET /api/example - Get cached data or fetch fresh data
 * POST /api/example - Update cached data
 * DELETE /api/example - Clear cache
 */

// Simulate a slow database query or API call
async function fetchExpensiveData(): Promise<{ message: string; timestamp: number }> {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    message: 'This is expensive data that took 2 seconds to fetch',
    timestamp: Date.now(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const CACHE_KEY = 'example:expensive-data';

    // Get data from cache or fetch it (with 5 minute TTL)
    const data = await getCacheOrSet(
      CACHE_KEY,
      fetchExpensiveData,
      { ttl: 300 } // 5 minutes
    );

    return NextResponse.json({
      success: true,
      data,
      cached: await getCache(CACHE_KEY) !== null,
      message: 'Data retrieved successfully',
    });
  } catch (error) {
    console.error('Error in GET /api/example:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const CACHE_KEY = 'example:custom-data';

    // Store custom data in cache
    await setCache(CACHE_KEY, body, { ttl: 600 }); // 10 minutes

    return NextResponse.json({
      success: true,
      message: 'Data cached successfully',
      data: body,
    });
  } catch (error) {
    console.error('Error in POST /api/example:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || 'example:expensive-data';

    await deleteCache(key);

    return NextResponse.json({
      success: true,
      message: `Cache cleared for key: ${key}`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/example:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
