import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram-service';

export async function POST(request: NextRequest) {
  try {
    const success = await telegramService.sendMessage(
      '✅ <b>Test Message</b>\n\nYour Telegram bot is working correctly!\n\n🤖 Titan Bros Trading Bot'
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
Tạo file src/app/api/telegram/status/route.ts:

Copyimport { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const connected = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  return NextResponse.json({
    connected,
    configured: {
      botToken: !!process.env.TELEGRAM_BOT_TOKEN,
      chatId: !!process.env.TELEGRAM_CHAT_ID
    }
  });
}