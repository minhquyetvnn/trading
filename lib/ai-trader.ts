import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface MarketData {
  coin: string;
  currentPrice: number;
  priceChange24h: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  support: number;
  resistance: number;
  volume: number;
  volumeTrend: string;
  volumeRatio: number;
  btcDominance?: number;
}

export interface HistoricalPerformance {
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  commonMistakes: string[];
  bestConditions: string[];
  recentTrend: string; // 'IMPROVING' | 'DECLINING' | 'STABLE'
}

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  keyFactors: string[];
}

export async function generateTradingSignal(
  marketData: MarketData,
  historicalPerformance: HistoricalPerformance
): Promise<TradingSignal> {
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const prompt = buildPrompt(marketData, historicalPerformance);

  try {
    console.log('🤖 Calling DeepSeek AI for trading signal...');
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-reasoner', // DeepSeek-R1 with reasoning
        messages: [
          {
            role: 'system',
            content: `You are an expert crypto trading AI that learns from past performance.
You analyze market data using technical indicators and provide actionable trading signals.
You MUST respond with valid JSON only, no additional text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log('✅ AI Response received');

    // Parse JSON response
    let signal: TradingSignal;
    
    try {
      signal = JSON.parse(aiResponse);
    } catch (parseError) {
      // Nếu response không phải pure JSON, tìm JSON trong text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        signal = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Validate signal
    validateSignal(signal);

    return signal;

  } catch (error: any) {
    console.error('❌ DeepSeek API error:', error.response?.data || error.message);
    
    // Fallback signal nếu AI fail
    return generateFallbackSignal(marketData);
  }
}

function buildPrompt(
  marketData: MarketData,
  performance: HistoricalPerformance
): string {
  return `You are analyzing ${marketData.coin} for a trading signal.

📊 CURRENT MARKET DATA:
- Price: $${marketData.currentPrice}
- 24h Change: ${marketData.priceChange24h.toFixed(2)}%
- RSI: ${marketData.rsi} ${getRSIStatus(marketData.rsi)}
- MACD: ${marketData.macd.toFixed(4)} (Signal: ${marketData.macdSignal.toFixed(4)}, Histogram: ${marketData.macdHistogram.toFixed(4)})
- Bollinger Bands: Upper $${marketData.bollingerUpper}, Middle $${marketData.bollingerMiddle}, Lower $${marketData.bollingerLower}
- Support: $${marketData.support}
- Resistance: $${marketData.resistance}
- Volume: $${marketData.volume.toLocaleString()} (Trend: ${marketData.volumeTrend}, Ratio: ${marketData.volumeRatio}x)
${marketData.btcDominance ? `- BTC Dominance: ${marketData.btcDominance.toFixed(2)}%` : ''}

📈 YOUR HISTORICAL PERFORMANCE (Last 30 days):
- Total Predictions: ${performance.totalPredictions}
- Win Rate: ${performance.winRate.toFixed(1)}% (${performance.correctPredictions}/${performance.totalPredictions})
- Average Profit: ${performance.avgProfit.toFixed(2)}%
- Average Loss: ${performance.avgLoss.toFixed(2)}%
- Profit Factor: ${performance.profitFactor.toFixed(2)}
- Recent Trend: ${performance.recentTrend}

⚠️ YOUR COMMON MISTAKES:
${performance.commonMistakes.length > 0 ? performance.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n') : 'No significant mistakes recorded yet'}

✅ CONDITIONS WHERE YOU PERFORM BEST:
${performance.bestConditions.length > 0 ? performance.bestConditions.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'Building performance history...'}

🎯 TASK:
Analyze the current market data and your historical performance to provide a trading signal.

CRITICAL RULES:
1. If current conditions match your past mistakes, be MORE CONSERVATIVE (lower confidence, or suggest HOLD)
2. If conditions match your best performance scenarios, you can be MORE CONFIDENT
3. Consider multiple indicators, not just one
4. Factor in volume and trend strength
5. Be realistic about your win rate - if it's low, acknowledge uncertainty
6. Learn from your ${performance.recentTrend} recent trend

RESPOND IN THIS EXACT JSON FORMAT:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "entryPrice": ${marketData.currentPrice},
  "targetPrice": number (realistic target based on indicators),
  "stopLoss": number (risk management),
  "reasoning": "Step-by-step explanation of your analysis",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "timeframe": "1h" | "4h" | "24h" | "48h" | "7d",
  "keyFactors": ["factor1", "factor2", "factor3"]
}

Think carefully and provide your best analysis.`;
}

function getRSIStatus(rsi: number): string {
  if (rsi >= 70) return '(OVERBOUGHT ⚠️)';
  if (rsi <= 30) return '(OVERSOLD 📉)';
  return '(NEUTRAL)';
}

function validateSignal(signal: any): void {
  if (!signal.action || !['BUY', 'SELL', 'HOLD'].includes(signal.action)) {
    throw new Error('Invalid action in signal');
  }
  if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 100) {
    throw new Error('Invalid confidence level');
  }
  if (!signal.entryPrice || !signal.targetPrice || !signal.stopLoss) {
    throw new Error('Missing price levels in signal');
  }
}

function generateFallbackSignal(marketData: MarketData): TradingSignal {
  // Simple rule-based fallback
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 30;

  if (marketData.rsi < 30 && marketData.priceChange24h < -5) {
    action = 'BUY';
    confidence = 45;
  } else if (marketData.rsi > 70 && marketData.priceChange24h > 5) {
    action = 'SELL';
    confidence = 45;
  }

  return {
    action,
    confidence,
    entryPrice: marketData.currentPrice,
    targetPrice: action === 'BUY' 
      ? marketData.currentPrice * 1.05 
      : marketData.currentPrice * 0.95,
    stopLoss: action === 'BUY'
      ? marketData.currentPrice * 0.97
      : marketData.currentPrice * 1.03,
    reasoning: 'Fallback signal due to AI service unavailability. Based on simple RSI rules.',
    riskLevel: 'HIGH',
    timeframe: '24h',
    keyFactors: ['AI service unavailable', 'Using fallback logic']
  };
}
