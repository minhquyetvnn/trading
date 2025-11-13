import axios from 'axios';

export interface MarketData {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  volume24h: number;
}

// Get global market data (BTC dominance, market cap, etc.)
export async function fetchMarketData(): Promise<MarketData> {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/global',
      { timeout: 10000 }
    );
    
    const data = response.data.data;
    
    return {
      btcDominance: data.market_cap_percentage.btc || 59.3,
      ethDominance: data.market_cap_percentage.eth || 12.1,
      totalMarketCap: data.total_market_cap.usd || 3530000000000,
      volume24h: data.total_volume.usd || 181460000000,
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Return default values if API fails
    return {
      btcDominance: 59.3,
      ethDominance: 12.1,
      totalMarketCap: 3530000000000,
      volume24h: 181460000000,
    };
  }
}

// Get current price for single symbol
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

// Get current prices for multiple symbols (optimized batch request)
export async function getCurrentPrices(symbols: string[]): Promise<Map<string, number>> {
  try {
    const prices = new Map<string, number>();
    
    // Get all Binance tickers at once
    const response = await axios.get(
      'https://api.binance.com/api/v3/ticker/price'
    );
    
    // Filter only symbols we need
    response.data.forEach((item: any) => {
      if (symbols.includes(item.symbol)) {
        prices.set(item.symbol, parseFloat(item.price));
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}
