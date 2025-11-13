import { NextRequest, NextResponse } from 'next/server';
import { calculateAllIndicators } from '@/lib/technical-indicators';
import { generateTradingSignal } from '@/lib/ai-trader';
import { savePrediction, getHistoricalPerformance } from '@/lib/performance-tracker';
import { fetchMarketData } from '@/lib/market-data';

export async function POST(request: NextRequest) {
  try {
    const { coin } = await request.json();

    if (!coin) {
      return NextResponse.json(
        { success: false, error: 'Coin symbol is required' },
        { status: 400 }
      );
    }

    console.log(`\n🚀 Generating trading signal for ${coin}...`);

    // 1. Calculate technical indicators
    console.log('📊 Step 1: Calculating technical indicators...');
    const marketDataRaw = await calculateAllIndicators(`${coin}USDT`);
    let marketData = { ...marketDataRaw, coin }; // ✅ tạo object mới có coin

    // 2. Get BTC dominance (nếu có)
    if (coin !== 'BTC') {
      try {
        const globalData = await fetchMarketData();
        marketData = { ...marketData, btcDominance: globalData.btcDominance };
        console.log(`📈 BTC Dominance: ${globalData.btcDominance.toFixed(2)}%`);
      } catch (error) {
        console.log('⚠️ Could not fetch BTC dominance');
        marketData = { ...marketData, btcDominance: 59.3 }; // fallback
      }
    } else {
      marketData = { ...marketData, btcDominance: 100 }; // BTC dominance = 100% cho BTC
    }

    // 3. Get historical performance
    console.log('📈 Step 2: Fetching AI historical performance...');
    const historicalPerformance = await getHistoricalPerformance(coin, 30, '24h');

    // 4. Generate AI signal
    console.log('🤖 Step 3: Calling DeepSeek AI...');
    const signal = await generateTradingSignal(marketData, historicalPerformance);

    // 5. Save prediction to database
    console.log('💾 Step 4: Saving prediction...');
    const predictionId = await savePrediction(coin, marketData, signal);

    // 6. Return response
    console.log('✅ Signal generated successfully!\n');

    return NextResponse.json({
      success: true,
      signal: {
        ...signal,
        predictionId,
        timestamp: new Date().toISOString()
      },
      marketData: {
        coin: marketData.coin,
        price: marketData.currentPrice,
        priceChange24h: marketData.priceChange24h,
        rsi: marketData.rsi,
        volume: marketData.volume,
        btcDominance: marketData.btcDominance
      },
      performance: {
        winRate: historicalPerformance.winRate,
        totalPredictions: historicalPerformance.totalPredictions,
        recentTrend: historicalPerformance.recentTrend
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

// GET endpoint để lấy signal mới nhất
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coin = searchParams.get('coin');

    if (!coin) {
      return NextResponse.json(
        { success: false, error: 'Coin parameter is required' },
        { status: 400 }
      );
    }

    // Lấy prediction mới nhất
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('coin', coin)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'No predictions found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      signal: {
        action: data.action,
        confidence: data.confidence,
        entryPrice: data.entry_price,
        targetPrice: data.target_price,
        stopLoss: data.stop_loss,
        reasoning: data.reasoning,
        riskLevel: data.risk_level,
        timestamp: data.created_at
      }
    });

  } catch (error: any) {
    console.error('❌ Get signal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signal' },
      { status: 500 }
    );
  }
}
