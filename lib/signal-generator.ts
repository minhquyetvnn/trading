import axios from 'axios';

export interface TradingSignal {
  coin: string;
  action: 'BUY' | 'SELL';
  signalType: 'LONG' | 'SHORT';
  confidence: number;
  timeframe: string;
  
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  
  capitalAllocated: number;
  positionSize: number;
  riskRewardRatio: number;
  riskPercentage: number;
  
  reasoning: string;
  keyFactors: string[];
  
  // Technical data
  rsi: number;
  macd: number;
  volume24h: number;
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function generateAdvancedSignal(
  coin: string,
  marketData: any,
  capitalUSD: number = 1000
): Promise<TradingSignal> {
  
  // Check API key
  if (!DEEPSEEK_API_KEY) {
    console.log('⚠️ DeepSeek API key not found, using rule-based fallback');
    return generateFallbackSignal(coin, marketData, capitalUSD);
  }

  const prompt = buildAdvancedPrompt(coin, marketData, capitalUSD);

  try {
    console.log('🤖 Calling DeepSeek API...');
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat', // Use deepseek-chat instead of deepseek-reasoner for faster response
        messages: [
          {
            role: 'system',
            content: `You are an expert crypto trading signal generator. 
You provide precise entry, stop loss, and multiple take profit levels.
You calculate position sizing based on risk management principles.
Always respond with valid JSON only.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000, // Increase timeout to 60 seconds
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      }
    );

    if (response.status !== 200) {
      console.log(`⚠️ DeepSeek API returned status ${response.status}, using fallback`);
      return generateFallbackSignal(coin, marketData, capitalUSD);
    }

    const aiResponse = response.data.choices[0].message.content;
    let signalData: any;
    
    try {
      signalData = JSON.parse(aiResponse);
    } catch (parseError) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        signalData = JSON.parse(jsonMatch[0]);
      } else {
        console.log('⚠️ Failed to parse AI response, using fallback');
        return generateFallbackSignal(coin, marketData, capitalUSD);
      }
    }

    // Validate AI response has required fields
    if (!signalData.entryPrice || !signalData.stopLoss || !signalData.takeProfit1) {
      console.log('⚠️ AI response missing required fields, using fallback');
      return generateFallbackSignal(coin, marketData, capitalUSD);
    }

    // Calculate position size
    const entryPrice = signalData.entryPrice;
    const stopLoss = signalData.stopLoss;
    const riskPercentage = signalData.riskPercentage || 2;
    
    const riskAmount = capitalUSD * (riskPercentage / 100);
    const stopLossDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / stopLossDistance;

    // Calculate risk/reward ratio
    const tp3Distance = Math.abs(signalData.takeProfit3 - entryPrice);
    const riskRewardRatio = tp3Distance / stopLossDistance;

    const signal: TradingSignal = {
      coin,
      action: signalData.action,
      signalType: signalData.action === 'BUY' ? 'LONG' : 'SHORT',
      confidence: signalData.confidence,
      timeframe: signalData.timeframe || '15m',
      
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit1: parseFloat(signalData.takeProfit1.toFixed(2)),
      takeProfit2: parseFloat(signalData.takeProfit2.toFixed(2)),
      takeProfit3: parseFloat(signalData.takeProfit3.toFixed(2)),
      
      capitalAllocated: capitalUSD,
      positionSize: parseFloat(positionSize.toFixed(8)),
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      riskPercentage: riskPercentage,
      
      reasoning: signalData.reasoning,
      keyFactors: signalData.keyFactors || [],
      
      rsi: marketData.rsi,
      macd: marketData.macd,
      volume24h: marketData.volume
    };

    console.log('✅ AI signal generated successfully');
    return signal;

  } catch (error: any) {
    console.error('❌ DeepSeek API error:', error.message);
    console.log('⚠️ Using rule-based fallback signal');
    return generateFallbackSignal(coin, marketData, capitalUSD);
  }
}

// Rule-based fallback signal generator
function generateFallbackSignal(
  coin: string,
  marketData: any,
  capitalUSD: number
): TradingSignal {
  console.log('🔧 Generating rule-based signal...');

  const currentPrice = marketData.currentPrice;
  const rsi = marketData.rsi;
  const macd = marketData.macd;
  const support = marketData.support;
  const resistance = marketData.resistance;

  // Determine action based on technical indicators
  let action: 'BUY' | 'SELL' = 'BUY';
  let confidence = 50;
  let reasoning = '';
  let keyFactors: string[] = [];

  // RSI-based logic
  if (rsi < 30) {
    action = 'BUY';
    confidence += 15;
    reasoning = 'RSI indicates oversold conditions. ';
    keyFactors.push('RSI < 30 (Oversold)');
  } else if (rsi > 70) {
    action = 'SELL';
    confidence += 15;
    reasoning = 'RSI indicates overbought conditions. ';
    keyFactors.push('RSI > 70 (Overbought)');
  }

  // MACD-based logic
  if (macd > 0) {
    if (action === 'BUY') confidence += 10;
    reasoning += 'MACD is positive (bullish). ';
    keyFactors.push('Positive MACD');
  } else {
    if (action === 'SELL') confidence += 10;
    reasoning += 'MACD is negative (bearish). ';
    keyFactors.push('Negative MACD');
  }

  // Price position logic
  const priceRange = resistance - support;
  const pricePosition = (currentPrice - support) / priceRange;

  if (pricePosition < 0.3) {
    if (action === 'BUY') confidence += 10;
    reasoning += 'Price near support level. ';
    keyFactors.push('Near support');
  } else if (pricePosition > 0.7) {
    if (action === 'SELL') confidence += 10;
    reasoning += 'Price near resistance level. ';
    keyFactors.push('Near resistance');
  }

  // Calculate TP/SL levels
  let entryPrice, stopLoss, tp1, tp2, tp3;

  if (action === 'BUY') {
    entryPrice = currentPrice * 0.998; // Slightly below current for better entry
    stopLoss = Math.max(support * 0.995, entryPrice * 0.97); // 3% below or at support
    tp1 = entryPrice * 1.02; // +2%
    tp2 = entryPrice * 1.05; // +5%
    tp3 = Math.min(resistance * 0.995, entryPrice * 1.10); // +10% or at resistance
  } else {
    entryPrice = currentPrice * 1.002; // Slightly above current
    stopLoss = Math.min(resistance * 1.005, entryPrice * 1.03); // 3% above or at resistance
    tp1 = entryPrice * 0.98; // -2%
    tp2 = entryPrice * 0.95; // -5%
    tp3 = Math.max(support * 1.005, entryPrice * 0.90); // -10% or at support
  }

  // Position sizing (2% risk)
  const riskPercentage = 2;
  const riskAmount = capitalUSD * (riskPercentage / 100);
  const stopLossDistance = Math.abs(entryPrice - stopLoss);
  const positionSize = riskAmount / stopLossDistance;

  // Risk/Reward ratio
  const tp3Distance = Math.abs(tp3 - entryPrice);
  const riskRewardRatio = tp3Distance / stopLossDistance;

  reasoning += `Using rule-based analysis with ${confidence}% confidence.`;

  const signal: TradingSignal = {
    coin,
    action,
    signalType: action === 'BUY' ? 'LONG' : 'SHORT',
    confidence: Math.min(confidence, 85), // Cap at 85%
    timeframe: '15m',
    
    entryPrice: parseFloat(entryPrice.toFixed(2)),
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    takeProfit1: parseFloat(tp1.toFixed(2)),
    takeProfit2: parseFloat(tp2.toFixed(2)),
    takeProfit3: parseFloat(tp3.toFixed(2)),
    
    capitalAllocated: capitalUSD,
    positionSize: parseFloat(positionSize.toFixed(8)),
    riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
    riskPercentage,
    
    reasoning,
    keyFactors,
    
    rsi: marketData.rsi,
    macd: marketData.macd,
    volume24h: marketData.volume
  };

  console.log('✅ Fallback signal generated');
  return signal;
}

function buildAdvancedPrompt(coin: string, marketData: any, capital: number): string {
  return `Generate a trading signal for ${coin} with the following market data:

📊 CURRENT MARKET DATA:
- Price: $${marketData.currentPrice}
- 24h Change: ${marketData.priceChange24h.toFixed(2)}%
- RSI: ${marketData.rsi}
- MACD: ${marketData.macd.toFixed(4)}
- Volume 24h: $${marketData.volume.toLocaleString()}
- Support: $${marketData.support}
- Resistance: $${marketData.resistance}

💰 CAPITAL ALLOCATION:
- Available Capital: $${capital}
- Max Risk per Trade: 2% ($${(capital * 0.02).toFixed(2)})

🎯 REQUIREMENTS:
1. Determine if this is a BUY or SELL signal
2. Calculate precise entry price (can be slightly above/below current for better entry)
3. Set Stop Loss based on support/resistance and risk management
4. Set 3 Take Profit levels:
   - TP1: Conservative (quick profit, ~1-2% move)
   - TP2: Moderate (~3-5% move)
   - TP3: Aggressive (~7-10% move)
5. Calculate risk percentage (1-3%, default 2%)
6. Provide clear reasoning

RESPOND IN THIS EXACT JSON FORMAT:
{
  "action": "BUY" | "SELL",
  "confidence": 0-100,
  "timeframe": "15m",
  "entryPrice": ${marketData.currentPrice},
  "stopLoss": number,
  "takeProfit1": number,
  "takeProfit2": number,
  "takeProfit3": number,
  "riskPercentage": 2,
  "reasoning": "Brief explanation",
  "keyFactors": ["factor1", "factor2", "factor3"]
}

IMPORTANT:
- For BUY: TP levels should be ABOVE entry, SL BELOW entry
- For SELL: TP levels should be BELOW entry, SL ABOVE entry
- Keep response concise (under 200 words for reasoning)`;
}
