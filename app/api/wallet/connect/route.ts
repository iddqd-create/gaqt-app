import { NextRequest, NextResponse } from 'next/server';
import { connectTonWallet } from '@/lib/db';
import { z } from 'zod';

const connectWalletSchema = z.object({
  userId: z.string().uuid(),
  walletAddress: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress } = connectWalletSchema.parse(body);

    const user = await connectTonWallet(userId, walletAddress);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        ton_wallet: user.ton_wallet
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Connect wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';