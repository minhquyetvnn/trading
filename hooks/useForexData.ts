import { useEffect, useState } from 'react';
import axios from 'axios';

interface ForexPrice {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high: string;
  low: string;
}

export const useForexData = () => {
  const [goldPrice, setGoldPrice] = useState<ForexPrice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoldPrice = async () => {
    try {
      // Sử dụng API miễn phí từ Metals API hoặc tương tự
      // Lưu ý: API này có giới hạn requests
      const response = await axios.get(
        'https://api.metals.live/v1/spot/gold'
      );
      
      const data = response.data[0];
      const currentPrice = data.price;
      const previousPrice = data.open || currentPrice;
      const change = currentPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;
      
      setGoldPrice({
        symbol: 'XAUUSD',
        price: currentPrice.toFixed(2),
        priceChange: change.toFixed(2),
        priceChangePercent: changePercent.toFixed(2),
        high: data.high?.toFixed(2) || currentPrice.toFixed(2),
        low: data.low?.toFixed(2) || currentPrice.toFixed(2),
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gold price:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoldPrice();
    // Cập nhật mỗi 60 giây (API miễn phí thường có rate limit)
    const interval = setInterval(fetchGoldPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  return { goldPrice, loading };
};
