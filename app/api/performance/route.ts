import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPerformance, getAllPredictions } from '@/lib/performance-tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coin = searchParams.get('coin');
    const days = parseInt(searchParams.get('days') || '30');
    const timeframe = searchParams.get('timeframe') || '24h';

    if (!coin) {
      return NextResponse.json(
        { success: false, error: 'Coin parameter is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching performance for ${coin}...`);

    // Get performance metrics
    const performance = await getHistoricalPerformance(coin, days, timeframe);

    // Get recent predictions
    const recentPredictions = await getAllPredictions(coin, 10);

    // Format predictions for frontend
    const formattedPredictions = recentPredictions.map(p => ({
      id: p.id,
      timestamp: p.created_at,
      action: p.action,
      confidence: p.confidence,
      entryPrice: p.entry_price,
      targetPrice: p.target_price,
      stopLoss: p.stop_loss,
      actualPrice: p[`actual_price_${timeframe}`],
      profitLoss: p[`profit_loss_${timeframe}`],
      isCorrect: p[`is_correct_${timeframe}`],
      reasoning: p.reasoning
    }));

    return NextResponse.json({
      success: true,
      performance,
      recentPredictions: formattedPredictions,
      coin,
      timeframe,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Get performance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance' },
      { status: 500 }
    );
  }
}
