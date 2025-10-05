// Updated route.ts

import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from 'some-module'; // Update with actual import

export async function POST(request: Request) {
    const data = await request.json();

    // Added await for validateTelegramWebAppData
    const validatedData = await validateTelegramWebAppData(data);

    // Removed referral_code and referral_count from the response
    const { referral_code, referral_count, ...responseData } = validatedData;

    return NextResponse.json(responseData);
}