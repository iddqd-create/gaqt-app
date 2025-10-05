import { NextRequest, NextResponse } from 'next/server';
import { getActiveQuests, getUserQuests, startQuest, completeQuest } from '@/lib/db';
import { z } from 'zod';

// GET - Get all active quests for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return all active quests
      const quests = await getActiveQuests();
      return NextResponse.json({ success: true, quests });
    }

    // Return user-specific quest progress
    const userQuests = await getUserQuests(userId);
    return NextResponse.json({ success: true, quests: userQuests });
  } catch (error) {
    console.error('Get quests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const startQuestSchema = z.object({
  userId: z.string().uuid(),
  questId: z.string().uuid()
});

// POST - Start a quest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questId } = startQuestSchema.parse(body);

    const userQuest = await startQuest(userId, questId);

    return NextResponse.json({
      success: true,
      userQuest
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Start quest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const completeQuestSchema = z.object({
  userId: z.string().uuid(),
  questId: z.string().uuid()
});

// PUT - Complete a quest
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questId } = completeQuestSchema.parse(body);

    const result = await completeQuest(userId, questId);

    return NextResponse.json({
      success: true,
      user: result.user,
      userQuest: result.userQuest
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Complete quest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';


