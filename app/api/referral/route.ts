import { NextRequest, NextResponse } from 'next/server';
import { createReferral, getUserReferrals } from '@/lib/db';
import { z } from 'zod';

const createReferralSchema = z.object({
  referralCode: z.string().min(1),
  userId: z.string().uuid()
});

// POST - Create a referral relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, userId } = createReferralSchema.parse(body);

    const referral = await createReferral(referralCode, userId);

    if (!referral) {
      return NextResponse.json(
        { error: 'Invalid referral code or referral already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      referral,
      message: 'Referral bonus awarded! You and your friend received 1000 points and 100 energy.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create referral error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get user's referrals
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

    const referrals = await getUserReferrals(userId);

    return NextResponse.json({
      success: true,
      referrals,
      count: referrals.length
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';