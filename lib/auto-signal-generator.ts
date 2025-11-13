import { calculateAllIndicators } from './technical-indicators';
import { generateAdvancedSignal } from './signal-generator';
import { saveSignal, getActiveSignals } from './signal-manager';

export interface SignalQuality {
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  score: number;
  reasons: string[];
}

export async function autoGenerateSignals(
  coins: string[],
  capitalPerSignal: number = 1000
): Promise<any[]> {
  console.log(`\n🤖 Auto-generating signals for ${coins.length} coins...`);
  
  const generatedSignals: any[] = [];

  for (const coin of coins) {
    try {
      console.log(`\n📊 Analyzing ${coin}...`);

      // 1. Check if already have active signal for this coin
      const activeSignals = await getActiveSignals(coin);
      if (activeSignals.length > 0) {
        console.log(`⚠️ ${coin} already has ${activeSignals.length} active signal(s), skipping...`);
        continue;
      }

      // 2. Calculate technical indicators
      const marketData = await calculateAllIndicators(`${coin}USDT`);

      // 3. Generate signal
      const signal = await generateAdvancedSignal(coin, marketData, capitalPerSignal);

      // 4. Evaluate signal quality
      const quality = evaluateSignalQuality(signal, marketData);

      // 5. Only save if quality is GOOD or EXCELLENT
      if (quality.rating === 'EXCELLENT' || quality.rating === 'GOOD') {
        const signalId = await saveSignal(signal);
        
        generatedSignals.push({
          id: signalId,
          ...signal,
          quality,
          marketData: {
            price: marketData.currentPrice,
            rsi: marketData.rsi,
            volume: marketData.volume
          }
        });

        console.log(`✅ ${coin} signal generated: ${quality.rating} (Score: ${quality.score}/100)`);
      } else {
        console.log(`❌ ${coin} signal rejected: ${quality.rating} (Score: ${quality.score}/100)`);
      }

    } catch (error) {
      console.error(`❌ Error generating signal for ${coin}:`, error);
    }
  }

  console.log(`\n✅ Auto-generation completed: ${generatedSignals.length}/${coins.length} signals created\n`);

  return generatedSignals;
}

export function evaluateSignalQuality(signal: any, marketData: any): SignalQuality {
  let score = 0;
  const reasons: string[] = [];

  // 1. Confidence score (max 30 points)
  if (signal.confidence >= 80) {
    score += 30;
    reasons.push('Very high confidence (≥80%)');
  } else if (signal.confidence >= 70) {
    score += 20;
    reasons.push('High confidence (≥70%)');
  } else if (signal.confidence >= 60) {
    score += 10;
    reasons.push('Moderate confidence (≥60%)');
  } else {
    reasons.push('Low confidence (<60%)');
  }

  // 2. Risk/Reward ratio (max 30 points)
  if (signal.riskRewardRatio >= 4) {
    score += 30;
    reasons.push('Excellent R:R (≥4:1)');
  } else if (signal.riskRewardRatio >= 3) {
    score += 25;
    reasons.push('Great R:R (≥3:1)');
  } else if (signal.riskRewardRatio >= 2) {
    score += 15;
    reasons.push('Good R:R (≥2:1)');
  } else {
    reasons.push('Poor R:R (<2:1)');
  }

  // 3. RSI position (max 20 points)
  const rsi = marketData.rsi;
  if (signal.action === 'BUY') {
    if (rsi < 35) {
      score += 20;
      reasons.push('RSI oversold (<35)');
    } else if (rsi < 50) {
      score += 10;
      reasons.push('RSI neutral (<50)');
    }
  } else {
    if (rsi > 65) {
      score += 20;
      reasons.push('RSI overbought (>65)');
    } else if (rsi > 50) {
      score += 10;
      reasons.push('RSI neutral (>50)');
    }
  }

  // 4. Volume (max 20 points)
  if (marketData.volumeRatio >= 1.5) {
    score += 20;
    reasons.push('High volume (1.5x+ avg)');
  } else if (marketData.volumeRatio >= 1.0) {
    score += 10;
    reasons.push('Normal volume');
  } else {
    reasons.push('Low volume');
  }

  // Determine rating based on score
  let rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  if (score >= 80) {
    rating = 'EXCELLENT';
  } else if (score >= 65) {
    rating = 'GOOD';
  } else if (score >= 50) {
    rating = 'FAIR';
  } else {
    rating = 'POOR';
  }

  return { rating, score, reasons };
}
