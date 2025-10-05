import { NextRequest, NextResponse } from 'next/server';
import { getDailyQuests } from '@/lib/db';
import { getCachedDailyQuests, cacheDailyQuests, isRedisEnabled } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    if (isRedisEnabled()) {
      const cachedData = await getCachedDailyQuests();
      if (cachedData) {
        return NextResponse.json({
          success: true,
          dailyQuests: cachedData,
          cached: true
        });
      }
    }

    // Fetch from database
    const dailyQuests = await getDailyQuests();

    // Cache the result
    if (isRedisEnabled()) {
      await cacheDailyQuests(dailyQuests);
    }

    return NextResponse.json({
      success: true,
      dailyQuests,
      cached: false
    });
  } catch (error) {
    console.error('Get daily quests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
