import { NextRequest, NextResponse } from 'next/server';
import { getUserAchievements, awardAchievement } from '@/lib/db';
import { z } from 'zod';

// GET - Get user achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const achievements = await getUserAchievements(userId);

    return NextResponse.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const awardAchievementSchema = z.object({
  userId: z.string().uuid(),
  achievementType: z.string(),
  achievementName: z.string(),
  iconEmoji: z.string().optional()
});

// POST - Award achievement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, achievementType, achievementName, iconEmoji } = awardAchievementSchema.parse(body);

    const achievement = await awardAchievement(userId, achievementType, achievementName, iconEmoji);

    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement already earned or invalid data' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      achievement,
      message: 'Achievement unlocked! +500 bonus points'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues }, // <-- исправлено!
        { status: 400 }
      );
    }

    console.error('Award achievement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';