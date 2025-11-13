export interface CoinPrice {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high: string;
  low: string;
}

export interface MarketData {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  volume24h: number;
}
