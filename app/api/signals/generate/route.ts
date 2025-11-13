import { NextRequest, NextResponse } from 'next/server';
import { calculateAllIndicators } from '@/lib/technical-indicators';
import { generateAdvancedSignal } from '@/lib/signal-generator';
import { saveSignal } from '@/lib/signal-manager';

export async function POST(request: NextRequest) {
  try {
    const { coin, capital } = await request.json();

    if (!coin) {
      return NextResponse.json(
        { success: false, error: 'Coin symbol is required' },
        { status: 400 }
      );
    }

    const capitalUSD = capital || 1000;

    console.log(`\n🚀 Generating trading signal for ${coin}...`);
    console.log(`💰 Capital: $${capitalUSD}`);

    // 1. Calculate technical indicators
    console.log('📊 Step 1: Calculating technical indicators...');
    const marketData = await calculateAllIndicators(`${coin}USDT`);

    // 2. Generate advanced signal with TP/SL levels
    console.log('🤖 Step 2: Generating signal with AI...');
    const signal = await generateAdvancedSignal(coin, marketData, capitalUSD);

    // 3. Save signal to database
    console.log('💾 Step 3: Saving signal...');
    const signalId = await saveSignal(signal);

    console.log('✅ Signal generated successfully!\n');

    // Calculate potential profits for each TP
    const entryPrice = signal.entryPrice;
    const positionSize = signal.positionSize;
    
    const tp1Profit = Math.abs(signal.takeProfit1 - entryPrice) * positionSize;
    const tp2Profit = Math.abs(signal.takeProfit2 - entryPrice) * positionSize;
    const tp3Profit = Math.abs(signal.takeProfit3 - entryPrice) * positionSize;
    const slLoss = Math.abs(signal.stopLoss - entryPrice) * positionSize;

    return NextResponse.json({
      success: true,
      signal: {
        id: signalId,
        ...signal,
        potentialProfits: {
          tp1: parseFloat(tp1Profit.toFixed(2)),
          tp2: parseFloat(tp2Profit.toFixed(2)),
          tp3: parseFloat(tp3Profit.toFixed(2)),
          sl: parseFloat(slLoss.toFixed(2))
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Generate signal error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate signal',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
