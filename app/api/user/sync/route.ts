import { NextRequest, NextResponse } from 'next/server';
import { updateUserProgress } from '@/lib/db';
import { z } from 'zod';

const syncSchema = z.object({
  userId: z.string().uuid(),
  energy: z.number().int().min(0).max(1000).optional(),
  points: z.number().int().min(0).optional(),
  level: z.number().int().min(1).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = syncSchema.parse(body);

    // Update user progress
    const user = await updateUserProgress(validatedData.userId, {
      energy: validatedData.energy,
      points: validatedData.points,
      level: validatedData.level
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        energy: user.energy,
        points: user.points,
        level: user.level,
        last_sync: user.last_sync
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
