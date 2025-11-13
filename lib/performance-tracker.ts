import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface PredictionRecord {
  id: string;
  coin: string;
  timestamp: Date;
  price: number;
  action: string;
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  riskLevel: string;
}

// Lưu prediction mới vào database
export async function savePrediction(
  coin: string,
  marketData: any,
  signal: any
): Promise<string> {
  try {
    console.log(`💾 Saving prediction for ${coin}...`);

    const { data, error } = await supabase
      .from('predictions')
      .insert({
        coin,
        price: marketData.currentPrice,
        volume: marketData.volume,
        rsi: marketData.rsi,
        macd: marketData.macd,
        btc_dominance: marketData.btcDominance || null,
        price_change_24h: marketData.priceChange24h,
        
        action: signal.action,
        confidence: signal.confidence,
        entry_price: signal.entryPrice,
        target_price: signal.targetPrice,
        stop_loss: signal.stopLoss,
        reasoning: signal.reasoning,
        risk_level: signal.riskLevel,
        
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving prediction:', error);
      throw error;
    }

    console.log(`✅ Prediction saved with ID: ${data.id}`);
    return data.id;

  } catch (error) {
    console.error('❌ Save prediction error:', error);
    throw error;
  }
}

// Update kết quả của prediction sau một khoảng thời gian
export async function updatePredictionResult(
  predictionId: string,
  timeframe: '1h' | '4h' | '24h' | '48h' | '7d',
  actualPrice: number
): Promise<void> {
  try {
    console.log(`📊 Updating result for prediction ${predictionId} (${timeframe})...`);

    // Lấy prediction gốc
    const { data: prediction, error: fetchError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (fetchError || !prediction) {
      console.error('❌ Prediction not found:', predictionId);
      return;
    }

    const entryPrice = prediction.entry_price;
    const action = prediction.action;

    // Tính profit/loss %
    let profitLoss = 0;
    if (action === 'BUY') {
      profitLoss = ((actualPrice - entryPrice) / entryPrice) * 100;
    } else if (action === 'SELL') {
      profitLoss = ((entryPrice - actualPrice) / entryPrice) * 100;
    }

    // Kiểm tra đúng/sai
    let isCorrect = false;
    if (action === 'BUY') {
      isCorrect = actualPrice > entryPrice;
    } else if (action === 'SELL') {
      isCorrect = actualPrice < entryPrice;
    } else if (action === 'HOLD') {
      // HOLD được coi là đúng nếu giá không thay đổi quá 2%
      isCorrect = Math.abs(profitLoss) < 2;
    }

    // Prepare update data
    const updateData: any = {};
    updateData[`actual_price_${timeframe}`] = actualPrice;
    updateData[`profit_loss_${timeframe}`] = profitLoss;
    updateData[`is_correct_${timeframe}`] = isCorrect;

    // Update vào database
    const { error: updateError } = await supabase
      .from('predictions')
      .update(updateData)
      .eq('id', predictionId);

    if (updateError) {
      console.error('❌ Error updating prediction:', updateError);
      throw updateError;
    }

    console.log(`✅ Updated: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}, P/L: ${profitLoss.toFixed(2)}%`);

    // Update performance metrics
    await updatePerformanceMetrics(prediction.coin, timeframe);

  } catch (error) {
    console.error('❌ Update result error:', error);
    throw error;
  }
}

// Lấy historical performance của AI
export async function getHistoricalPerformance(
  coin: string,
  days: number = 30,
  timeframe: string = '24h'
): Promise<any> {
  try {
    console.log(`📈 Fetching historical performance for ${coin} (${days} days)...`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('coin', coin)
      .gte('created_at', startDate.toISOString())
      .not(`is_correct_${timeframe}`, 'is', null) // Chỉ lấy predictions đã có kết quả
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching predictions:', error);
      throw error;
    }

    if (!predictions || predictions.length === 0) {
      console.log('⚠️ No historical data found');
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        winRate: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        commonMistakes: [],
        bestConditions: [],
        recentTrend: 'STABLE'
      };
    }

    // Tính toán metrics
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(
      p => p[`is_correct_${timeframe}`]
    ).length;
    const winRate = (correctPredictions / totalPredictions) * 100;

    const profitTrades = predictions.filter(
      p => p[`profit_loss_${timeframe}`] > 0
    );
    const lossTrades = predictions.filter(
      p => p[`profit_loss_${timeframe}`] < 0
    );

    const totalProfit = profitTrades.reduce(
      (sum, p) => sum + p[`profit_loss_${timeframe}`], 0
    );
    const totalLoss = Math.abs(
      lossTrades.reduce((sum, p) => sum + p[`profit_loss_${timeframe}`], 0)
    );

    const avgProfit = profitTrades.length > 0 
      ? totalProfit / profitTrades.length 
      : 0;
    const avgLoss = lossTrades.length > 0 
      ? totalLoss / lossTrades.length 
      : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

    // Phân tích mistakes và best conditions
    const mistakes = await analyzeMistakes(predictions, timeframe);
    const bestConditions = await analyzeBestConditions(predictions, timeframe);
    const recentTrend = analyzeRecentTrend(predictions, timeframe);

    const performance = {
      totalPredictions,
      correctPredictions,
      winRate: parseFloat(winRate.toFixed(2)),
      avgProfit: parseFloat(avgProfit.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      commonMistakes: mistakes,
      bestConditions,
      recentTrend
    };

    console.log(`✅ Performance: Win Rate ${winRate.toFixed(1)}%, Profit Factor ${profitFactor.toFixed(2)}`);

    return performance;

  } catch (error) {
    console.error('❌ Get performance error:', error);
    throw error;
  }
}

// Phân tích những sai lầm thường gặp
async function analyzeMistakes(predictions: any[], timeframe: string): Promise<string[]> {
  const incorrectPredictions = predictions.filter(p => !p[`is_correct_${timeframe}`]);
  
  if (incorrectPredictions.length === 0) return [];

  const mistakes: string[] = [];

  // 1. RSI mistakes
  const highRSIBuyMistakes = incorrectPredictions.filter(p => 
    p.action === 'BUY' && p.rsi > 70
  );
  if (highRSIBuyMistakes.length >= 2) {
    mistakes.push(
      `Bought ${highRSIBuyMistakes.length} times when RSI > 70 (overbought) - resulted in losses`
    );
  }

  const lowRSISellMistakes = incorrectPredictions.filter(p => 
    p.action === 'SELL' && p.rsi < 30
  );
  if (lowRSISellMistakes.length >= 2) {
    mistakes.push(
      `Sold ${lowRSISellMistakes.length} times when RSI < 30 (oversold) - missed rebounds`
    );
  }

  // 2. Volume mistakes
  const lowVolumeMistakes = incorrectPredictions.filter(p => 
    p.volume < 1000000 && p.action !== 'HOLD'
  );
  if (lowVolumeMistakes.length >= 3) {
    mistakes.push(
      `Made ${lowVolumeMistakes.length} trades on low volume (< $1M) - low liquidity led to losses`
    );
  }

  // 3. BTC dominance mistakes (cho altcoins)
  if (predictions[0]?.coin !== 'BTC') {
    const btcDomMistakes = incorrectPredictions.filter(p => 
      p.btc_dominance > 60 && p.action === 'BUY'
    );
    if (btcDomMistakes.length >= 2) {
      mistakes.push(
        `Bought altcoins ${btcDomMistakes.length} times when BTC dominance > 60% - altcoins underperformed`
      );
    }
  }

  // 4. High confidence mistakes
  const overconfidentMistakes = incorrectPredictions.filter(p => 
    p.confidence > 80
  );
  if (overconfidentMistakes.length >= 3) {
    mistakes.push(
      `Was overconfident (>80%) ${overconfidentMistakes.length} times but still wrong - need to be more cautious`
    );
  }

  // 5. Trend reversal mistakes
  const trendReversalMistakes = incorrectPredictions.filter(p => 
    (p.action === 'BUY' && p.price_change_24h < -10) ||
    (p.action === 'SELL' && p.price_change_24h > 10)
  );
  if (trendReversalMistakes.length >= 2) {
    mistakes.push(
      `Tried to catch ${trendReversalMistakes.length} trend reversals too early - let trends establish first`
    );
  }

  return mistakes.slice(0, 5); // Top 5 mistakes
}

// Phân tích điều kiện tốt nhất
async function analyzeBestConditions(predictions: any[], timeframe: string): Promise<string[]> {
  const correctPredictions = predictions.filter(p => p[`is_correct_${timeframe}`]);
  
  if (correctPredictions.length === 0) return [];

  const conditions: string[] = [];

  // 1. RSI sweet spot
  const goodRSIPredictions = correctPredictions.filter(p => 
    p.rsi >= 35 && p.rsi <= 65
  );
  if (goodRSIPredictions.length > correctPredictions.length * 0.5) {
    const winRate = (goodRSIPredictions.length / correctPredictions.length * 100).toFixed(0);
    conditions.push(
      `RSI between 35-65 (neutral zone): ${goodRSIPredictions.length} wins (${winRate}% of correct predictions)`
    );
  }

  // 2. High volume
  const highVolumePredictions = correctPredictions.filter(p => 
    p.volume > 5000000
  );
  if (highVolumePredictions.length > correctPredictions.length * 0.4) {
    const avgProfit = highVolumePredictions.reduce((sum, p) => 
      sum + p[`profit_loss_${timeframe}`], 0
    ) / highVolumePredictions.length;
    conditions.push(
      `High volume > $5M: ${highVolumePredictions.length} wins, avg profit ${avgProfit.toFixed(2)}%`
    );
  }

  // 3. Moderate confidence
  const moderateConfidencePredictions = correctPredictions.filter(p => 
    p.confidence >= 60 && p.confidence <= 80
  );
  if (moderateConfidencePredictions.length > correctPredictions.length * 0.4) {
    conditions.push(
      `Moderate confidence (60-80%): ${moderateConfidencePredictions.length} wins - sweet spot for accuracy`
    );
  }

  // 4. Clear trends
  const clearTrendPredictions = correctPredictions.filter(p => 
    Math.abs(p.price_change_24h) > 3
  );
  if (clearTrendPredictions.length > correctPredictions.length * 0.5) {
    conditions.push(
      `Clear trends (>3% daily move): ${clearTrendPredictions.length} wins - easier to predict`
    );
  }

  // 5. BUY in dips
  const buyDipPredictions = correctPredictions.filter(p => 
    p.action === 'BUY' && p.rsi < 40 && p.price_change_24h < 0
  );
  if (buyDipPredictions.length >= 3) {
    const avgProfit = buyDipPredictions.reduce((sum, p) => 
      sum + p[`profit_loss_${timeframe}`], 0
    ) / buyDipPredictions.length;
    conditions.push(
      `Buying dips (RSI<40, negative 24h): ${buyDipPredictions.length} wins, avg profit ${avgProfit.toFixed(2)}%`
    );
  }

  return conditions.slice(0, 5); // Top 5 best conditions
}

// Phân tích xu hướng gần đây
function analyzeRecentTrend(predictions: any[], timeframe: string): string {
  if (predictions.length < 10) return 'STABLE';

  const recent10 = predictions.slice(0, 10);
  const older10 = predictions.slice(10, 20);

  if (older10.length < 5) return 'STABLE';

  const recentWinRate = recent10.filter(p => p[`is_correct_${timeframe}`]).length / recent10.length;
  const olderWinRate = older10.filter(p => p[`is_correct_${timeframe}`]).length / older10.length;

  if (recentWinRate > olderWinRate + 0.15) return 'IMPROVING';
  if (recentWinRate < olderWinRate - 0.15) return 'DECLINING';
  return 'STABLE';
}

// Update performance metrics vào bảng ai_performance
async function updatePerformanceMetrics(coin: string, timeframe: string): Promise<void> {
  try {
    const performance = await getHistoricalPerformance(coin, 30, timeframe);
    
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('ai_performance')
      .upsert({
        date: today,
        coin,
        timeframe,
        total_predictions: performance.totalPredictions,
        correct_predictions: performance.correctPredictions,
        win_rate: performance.winRate,
        total_profit: performance.totalProfit,
        total_loss: performance.totalLoss,
        avg_profit: performance.avgProfit,
        avg_loss: performance.avgLoss,
        profit_factor: performance.profitFactor,
        best_conditions: performance.bestConditions,
        common_mistakes: performance.commonMistakes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date,coin,timeframe'
      });

    if (error) {
      console.error('❌ Error updating performance metrics:', error);
    } else {
      console.log('✅ Performance metrics updated');
    }

  } catch (error) {
    console.error('❌ Update metrics error:', error);
  }
}

// Lấy tất cả predictions cho một coin
export async function getAllPredictions(
  coin: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('coin', coin)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Get predictions error:', error);
    return [];
  }
}

// Log AI learning insights
export async function logLearningInsight(
  coin: string,
  insightType: string,
  description: string,
  impactScore: number
): Promise<void> {
  try {
    await supabase
      .from('ai_learning_log')
      .insert({
        coin,
        insight_type: insightType,
        description,
        impact_score: impactScore,
        created_at: new Date().toISOString()
      });

    console.log(`📝 Learning insight logged: ${insightType}`);

  } catch (error) {
    console.error('❌ Log insight error:', error);
  }
}
