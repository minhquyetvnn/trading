import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateSignals } from '@/lib/auto-signal-generator';

const TRACKED_COINS = ['BTC', 'ETH', 'BNB', 'SOL'];

export async function POST(request: NextRequest) {
  try {
    console.log('\n🤖 Starting auto signal generation...');

    const { coins, capital } = await request.json();

    const coinsToAnalyze = coins || TRACKED_COINS;
    const capitalPerSignal = capital || 1000;

    // Generate signals
    const signals = await autoGenerateSignals(coinsToAnalyze, capitalPerSignal);

    return NextResponse.json({
      success: true,
      signals,
      count: signals.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Auto-generate error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to auto-generate signals' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for cron job
export async function GET(request: NextRequest) {
  try {
    console.log('\n🤖 [CRON] Auto signal generation triggered...');
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    const signals = await autoGenerateSignals(TRACKED_COINS, 1000);

    // Log results
    console.log(`✅ [CRON] Generated ${signals.length} quality signals`);
    signals.forEach(signal => {
      console.log(`  - ${signal.coin}: ${signal.action} (${signal.quality.rating}, ${signal.confidence}%)`);
    });

    // Send notification if any excellent signals
    const excellentCount = signals.filter(s => s.quality?.rating === 'EXCELLENT').length;
    
    return NextResponse.json({
      success: true,
      signals,
      count: signals.length,
      excellentCount,
      message: `Generated ${signals.length} quality signals (${excellentCount} EXCELLENT)`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [CRON] Auto-generate error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to auto-generate signals' 
      },
      { status: 500 }
    );
  }
}

