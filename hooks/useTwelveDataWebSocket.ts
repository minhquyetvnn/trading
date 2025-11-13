import { useEffect, useState, useRef } from 'react';

interface AssetPrice {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high: string;
  low: string;
}

export const useTwelveDataWebSocket = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const previousPricesRef = useRef<Record<string, number>>({});
  const dailyHighRef = useRef<Record<string, number>>({});
  const dailyLowRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Twelve Data API key not found in .env.local');
      return;
    }

    const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`;
    
    console.log('🔌 Connecting to Twelve Data WebSocket...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Twelve Data WebSocket connected!');
      setIsConnected(true);

      // Subscribe to all symbols
      symbols.forEach(symbol => {
        ws.send(JSON.stringify({
          action: 'subscribe',
          params: {
            symbols: symbol
          }
        }));
        console.log(`📊 Subscribed to ${symbol}`);
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Bỏ qua system messages
        if (data.event === 'subscribe-status') {
          console.log(`✓ ${data.symbol} subscription confirmed`);
          return;
        }
        
        if (data.event === 'heartbeat') {
          return;
        }

        // Xử lý dữ liệu giá
        if (data.event === 'price' && data.symbol && data.price) {
          const symbol = data.symbol;
          const currentPrice = parseFloat(data.price);
          
          // Khởi tạo giá trước đó nếu chưa có
          if (!previousPricesRef.current[symbol]) {
            previousPricesRef.current[symbol] = currentPrice;
            dailyHighRef.current[symbol] = currentPrice;
            dailyLowRef.current[symbol] = currentPrice;
          }

          // Cập nhật high/low
          if (currentPrice > dailyHighRef.current[symbol]) {
            dailyHighRef.current[symbol] = currentPrice;
          }
          if (currentPrice < dailyLowRef.current[symbol]) {
            dailyLowRef.current[symbol] = currentPrice;
          }

          // Tính % thay đổi
          const previousPrice = previousPricesRef.current[symbol];
          const priceChange = currentPrice - previousPrice;
          const priceChangePercent = previousPrice !== 0 
            ? ((priceChange / previousPrice) * 100) 
            : 0;

          setPrices(prev => ({
            ...prev,
            [symbol]: {
              symbol: symbol,
              price: currentPrice.toFixed(2),
              priceChange: priceChange.toFixed(2),
              priceChangePercent: priceChangePercent.toFixed(2),
              high: dailyHighRef.current[symbol].toFixed(2),
              low: dailyLowRef.current[symbol].toFixed(2),
            }
          }));
        }
      } catch (error) {
        console.error('❌ Error parsing Twelve Data message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Twelve Data WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log('🔌 Twelve Data WebSocket disconnected', event.reason);
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        symbols.forEach(symbol => {
          ws.send(JSON.stringify({
            action: 'unsubscribe',
            params: {
              symbols: symbol
            }
          }));
        });
        ws.close();
      }
    };
  }, [symbols]);

  return { prices, isConnected };
};
