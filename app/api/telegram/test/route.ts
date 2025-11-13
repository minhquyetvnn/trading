import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram-service';

export async function POST(request: NextRequest) {
  try {
    const success = await telegramService.sendMessage(
      '✅ <b>Test Message</b>\n\nYour Telegram bot is working correctly!\n\n🤖 Minh Quyet Trading Bot'
    );

    return NextResponse.json({
      success,
      message: success ? 'Test message sent' : 'Failed to send message'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
