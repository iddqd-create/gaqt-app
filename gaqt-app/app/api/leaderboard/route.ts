import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db';
import { getCachedLeaderboard, cacheLeaderboard, isRedisEnabled } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Try to get from cache first
    if (isRedisEnabled()) {
      const cachedData = await getCachedLeaderboard();
      if (cachedData) {
        return NextResponse.json({
          success: true,
          leaderboard: cachedData.slice(0, limit),
          cached: true
        });
      }
    }

    // Fetch from database
    const leaderboard = await getLeaderboard(limit);

    // Cache the result
    if (isRedisEnabled()) {
      await cacheLeaderboard(leaderboard);
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      cached: false
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cache for 1 hour to reduce database load
export const revalidate = 3600;
export const runtime = 'edge';
