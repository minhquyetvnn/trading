import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioStats } from '@/lib/signal-manager';
import { telegramService } from '@/lib/telegram-service';

export async function GET(request: NextRequest) {
  try {
    console.log('\n📊 Generating daily summary...');

    // Get portfolio stats from API
    const portfolioResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/signals/portfolio`
    );
    const portfolioData = await portfolioResponse.json();

    if (!portfolioData.success) {
      throw new Error('Failed to fetch portfolio data');
    }

    const portfolio = portfolioData.portfolio;

    // Send Telegram notification
    await telegramService.notifyDailySummary(portfolio);

    console.log('✅ Daily summary sent');

    return NextResponse.json({
      success: true,
      summary: portfolio,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Daily summary error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}