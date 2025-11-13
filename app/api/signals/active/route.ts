import { NextRequest, NextResponse } from 'next/server';
import { getActiveSignals } from '@/lib/signal-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coin = searchParams.get('coin');

    console.log('📊 Fetching active signals...');

    const signals = await getActiveSignals(coin || undefined);

    // Format signals for frontend
    const formattedSignals = signals.map(signal => ({
      id: signal.id,
      coin: signal.coin,
      action: signal.action,
      signalType: signal.signal_type,
      confidence: signal.confidence,
      timeframe: signal.timeframe,
      
      entryPrice: parseFloat(signal.entry_price),
      currentPrice: parseFloat(signal.current_price),
      
      stopLoss: parseFloat(signal.stop_loss),
      takeProfit1: parseFloat(signal.take_profit_1),
      takeProfit2: parseFloat(signal.take_profit_2),
      takeProfit3: parseFloat(signal.take_profit_3),
      
      capitalAllocated: parseFloat(signal.capital_allocated),
      positionSize: parseFloat(signal.position_size),
      riskRewardRatio: parseFloat(signal.risk_reward_ratio),
      
      pnlUSD: signal.pnl_usd ? parseFloat(signal.pnl_usd) : 0,
      pnlPercentage: signal.pnl_percentage ? parseFloat(signal.pnl_percentage) : 0,
      
      tp1Hit: signal.tp1_hit,
      tp2Hit: signal.tp2_hit,
      tp3Hit: signal.tp3_hit,
      
      status: signal.status,
      createdAt: signal.created_at,
      expiresAt: signal.signal_expires_at
    }));

    console.log(`✅ Found ${formattedSignals.length} active signals`);

    return NextResponse.json({
      success: true,
      signals: formattedSignals,
      count: formattedSignals.length
    });

  } catch (error: any) {
    console.error('❌ Get active signals error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active signals' },
      { status: 500 }
    );
  }
}
