import { useEffect, useState, useRef } from 'react';

interface CoinPrice {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high: string;
  low: string;
}

export const useBinanceWebSocket = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, CoinPrice>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;

    // Tạo stream names cho multiple symbols
    const streams = symbols
      .map(s => `${s.toLowerCase()}@ticker`)
      .join('/');
    
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    console.log('🔌 Connecting to Binance WebSocket...');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Binance WebSocket connected!');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const ticker = data.data;
        
        setPrices(prev => ({
          ...prev,
          [ticker.s]: {
            symbol: ticker.s,
            price: parseFloat(ticker.c).toFixed(2),
            priceChange: ticker.p,
            priceChangePercent: parseFloat(ticker.P).toFixed(2),
            high: parseFloat(ticker.h).toFixed(2),
            low: parseFloat(ticker.l).toFixed(2),
          }
        }));
      } catch (error) {
        console.error('❌ Error parsing Binance message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Binance WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 Binance WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup khi component unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [symbols]);

  return { prices, isConnected };
};
