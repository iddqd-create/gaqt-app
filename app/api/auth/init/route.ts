import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/lib/telegram-auth';
import { getUserByTelegramId, createUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, startParam } = body;

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing initData' },
        { status: 400 }
      );
    }

    // Validate Telegram data
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const telegramUser = await validateTelegramWebAppData(initData, botToken);
    
    if (!telegramUser) {
      return NextResponse.json(
        { error: 'Invalid Telegram data' },
        { status: 401 }
      );
    }

    // Get or create user
    let user = await getUserByTelegramId(telegramUser.id);
    const isNewUser = !user;
    
    if (!user) {
      user = await createUser({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name
      });
    }

    // Handle referral if this is a new user with a referral code
    let referralBonus = false;
    if (isNewUser && startParam) {
      try {
        const referralResponse = await fetch(`${request.nextUrl.origin}/api/referral`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: startParam,
            userId: user.id
          })
        });
        
        if (referralResponse.ok) {
          referralBonus = true;
          // Refresh user data to get updated points
          user = await getUserByTelegramId(telegramUser.id) || user;
        }
      } catch (error) {
        console.error('Referral processing error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        ton_wallet: user.ton_wallet,
        energy: user.energy,
        points: user.points,
        level: user.level
      },
      referralBonus
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
