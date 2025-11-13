// Tính RSI (Relative Strength Index)
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Default neutral

  let gains = 0;
  let losses = 0;

  // Tính gains và losses trung bình
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return parseFloat(rsi.toFixed(2));
}

// Tính MACD (Moving Average Convergence Divergence)
export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // EMA 12
  const ema12 = calculateEMA(prices, 12);
  // EMA 26
  const ema26 = calculateEMA(prices, 26);
  // MACD line
  const macd = ema12 - ema26;
  
  // Signal line (EMA 9 của MACD)
  const macdValues = [macd]; // Simplified, thực tế cần nhiều giá trị hơn
  const signal = macd; // Simplified
  
  // Histogram
  const histogram = macd - signal;

  return {
    macd: parseFloat(macd.toFixed(4)),
    signal: parseFloat(signal.toFixed(4)),
    histogram: parseFloat(histogram.toFixed(4))
  };
}

// Tính EMA (Exponential Moving Average)
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Tính Bollinger Bands
export function calculateBollingerBands(prices: number[], period: number = 20): {
  upper: number;
  middle: number;
  lower: number;
} {
  if (prices.length < period) {
    const price = prices[prices.length - 1];
    return { upper: price, middle: price, lower: price };
  }

  // SMA (Simple Moving Average)
  const sma = prices.slice(-period).reduce((a, b) => a + b) / period;

  // Standard Deviation
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: parseFloat((sma + stdDev * 2).toFixed(2)),
    middle: parseFloat(sma.toFixed(2)),
    lower: parseFloat((sma - stdDev * 2).toFixed(2))
  };
}

// Phát hiện Support và Resistance levels
export function findSupportResistance(prices: number[], window: number = 20): {
  support: number;
  resistance: number;
} {
  if (prices.length < window) {
    const currentPrice = prices[prices.length - 1];
    return { support: currentPrice * 0.95, resistance: currentPrice * 1.05 };
  }

  const recentPrices = prices.slice(-window);
  const localMins: number[] = [];
  const localMaxs: number[] = [];

  for (let i = 1; i < recentPrices.length - 1; i++) {
    if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
      localMins.push(recentPrices[i]);
    }
    if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
      localMaxs.push(recentPrices[i]);
    }
  }

  const support = localMins.length > 0 
    ? Math.min(...localMins) 
    : Math.min(...recentPrices);
    
  const resistance = localMaxs.length > 0 
    ? Math.max(...localMaxs) 
    : Math.max(...recentPrices);

  return {
    support: parseFloat(support.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(2))
  };
}

// Tính Volume Profile
export function analyzeVolume(volumes: number[], prices: number[]): {
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  avgVolume: number;
  currentVolume: number;
  volumeRatio: number;
} {
  if (volumes.length === 0) {
    return {
      trend: 'STABLE',
      avgVolume: 0,
      currentVolume: 0,
      volumeRatio: 1
    };
  }

  const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;

  let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
  
  if (volumes.length >= 3) {
    const recentAvg = volumes.slice(-3).reduce((a, b) => a + b) / 3;
    const olderAvg = volumes.slice(-6, -3).reduce((a, b) => a + b) / 3;
    
    if (recentAvg > olderAvg * 1.2) trend = 'INCREASING';
    else if (recentAvg < olderAvg * 0.8) trend = 'DECREASING';
  }

  return {
    trend,
    avgVolume: parseFloat(avgVolume.toFixed(2)),
    currentVolume: parseFloat(currentVolume.toFixed(2)),
    volumeRatio: parseFloat(volumeRatio.toFixed(2))
  };
}

// Fetch historical data từ Binance
export async function fetchHistoricalData(
  symbol: string,
  interval: string = '1h',
  limit: number = 100
): Promise<{ prices: number[]; volumes: number[]; timestamps: number[] }> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    const data = await response.json();
    
    const prices = data.map((candle: any) => parseFloat(candle[4])); // Close price
    const volumes = data.map((candle: any) => parseFloat(candle[5])); // Volume
    const timestamps = data.map((candle: any) => candle[0]); // Timestamp

    return { prices, volumes, timestamps };
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return { prices: [], volumes: [], timestamps: [] };
  }
}

// Tính toán tất cả indicators
export async function calculateAllIndicators(symbol: string) {
  const { prices, volumes } = await fetchHistoricalData(symbol, '1h', 100);

  if (prices.length === 0) {
    throw new Error('No historical data available');
  }

  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const { support, resistance } = findSupportResistance(prices);
  const volumeAnalysis = analyzeVolume(volumes, prices);

  // Tính price change 24h
  const price24hAgo = prices[prices.length - 24] || prices[0];
  const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;

  return {
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    priceChange24h: parseFloat(priceChange24h.toFixed(2)),
    rsi,
    macd: macd.macd,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    bollingerUpper: bollingerBands.upper,
    bollingerMiddle: bollingerBands.middle,
    bollingerLower: bollingerBands.lower,
    support,
    resistance,
    volume: volumeAnalysis.currentVolume,
    volumeTrend: volumeAnalysis.trend,
    volumeRatio: volumeAnalysis.volumeRatio
  };
}
