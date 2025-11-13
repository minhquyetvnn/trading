import { useEffect, useState } from 'react';
import axios from 'axios';
import { MarketData } from '@/types/crypto';

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData>({
    btcDominance: 0,
    ethDominance: 0,
    totalMarketCap: 0,
    volume24h: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/global'
      );
      
      const data = response.data.data;
      setMarketData({
        btcDominance: data.market_cap_percentage.btc || 0,
        ethDominance: data.market_cap_percentage.eth || 0,
        totalMarketCap: data.total_market_cap.usd || 0,
        volume24h: data.total_volume.usd || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);

    return () => clearInterval(interval);
  }, []);

  return { marketData, loading, refetch: fetchMarketData };
};
