import { useBinanceWebSocket } from './useBinanceWebSocket';
import { useTwelveDataWebSocket } from './useTwelveDataWebSocket';

export const useCombinedMarketData = (
  cryptoSymbols: string[],
  forexSymbols: string[]
) => {
  const { 
    prices: cryptoPrices, 
    isConnected: cryptoConnected 
  } = useBinanceWebSocket(cryptoSymbols);
  
  const { 
    prices: forexPrices, 
    isConnected: forexConnected 
  } = useTwelveDataWebSocket(forexSymbols);

  // Kết hợp cả hai nguồn dữ liệu
  const allPrices = {
    ...cryptoPrices,
    ...forexPrices
  };

  // Cả hai phải connected
  const isConnected = cryptoConnected && (forexSymbols.length === 0 || forexConnected);

  return { prices: allPrices, isConnected };
};
