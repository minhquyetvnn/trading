'use client';

import { useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp, Mail } from 'lucide-react';
import { useCombinedMarketData } from '@/hooks/useCombinedMarketData';
import { useMarketData } from '@/hooks/useMarketData';
import { CoinCard } from '@/components/CoinCard';
import { MarketDominance } from '@/components/MarketDominance';
import { MarketAlert } from '@/components/MarketAlert';
import { SearchBar } from '@/components/SearchBar';
import { Sidebar } from '@/components/Sidebar';

// Crypto từ Binance
const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

// Forex từ Twelve Data (chỉ vàng)
const FOREX_SYMBOLS = ['XAU/USD'];

const ASSET_NAMES: Record<string, string> = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'BNBUSDT': 'BNB',
  'SOLUSDT': 'Solana',
  'XAU/USD': 'Gold Spot',
};

export default function Home() {
  const { prices, isConnected } = useCombinedMarketData(CRYPTO_SYMBOLS, FOREX_SYMBOLS);
  const { marketData, loading, refetch } = useMarketData();
  const [searchTerm, setSearchTerm] = useState('');

  // Kiểm tra điều kiện market fear
  const btcPrice = prices['BTCUSDT'];
  const isBtcDown = btcPrice && parseFloat(btcPrice.priceChangePercent) < 0;
  const isDominanceUp = marketData.btcDominance > 59;
  const showAlert = isBtcDown && isDominanceUp;

  // Filter assets theo search
  const filteredAssets = Object.entries(prices).filter(([symbol]) => {
    const assetName = ASSET_NAMES[symbol] || symbol;
    return assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           symbol.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Format display symbol
  const getDisplaySymbol = (symbol: string) => {
    if (symbol === 'XAU/USD') return 'XAU';
    return symbol.replace('USDT', '');
  };

  // Tổng số assets
  const totalAssets = CRYPTO_SYMBOLS.length + FOREX_SYMBOLS.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                MARKET OVERVIEW
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{totalAssets} assets</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'Real-time data' : 'Connecting...'}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>

          {/* Search Bar */}
          <SearchBar value={searchTerm} onChange={setSearchTerm} />

          {/* Market Dominance */}
          <MarketDominance 
            data={marketData} 
            loading={loading}
            onRefresh={refetch}
          />

          {/* Market Alert */}
          <MarketAlert show={showAlert} />

          {/* BTC Trend Indicators */}
          {btcPrice && (
            <div className="flex flex-wrap gap-6 items-center mb-6 text-sm bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">BTC Trend:</span>
                <span className={`flex items-center gap-1 font-semibold ${
                  isBtcDown ? 'text-red-600' : 'text-green-600'
                }`}>
                  {isBtcDown ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  {isBtcDown ? 'DOWN' : 'UP'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Dominance:</span>
                <span className={`flex items-center gap-1 font-semibold ${
                  isDominanceUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isDominanceUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isDominanceUp ? 'UP' : 'DOWN'}
                </span>
              </div>
            </div>
          )}

          {/* Assets Grid */}
          {filteredAssets.length === 0 && Object.keys(prices).length > 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No assets found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map(([symbol, data]) => (
                <CoinCard
                  key={symbol}
                  symbol={getDisplaySymbol(symbol)}
                  name={ASSET_NAMES[symbol] || symbol}
                  price={data.price}
                  change={data.priceChangePercent}
                  high={data.high}
                  low={data.low}
                />
              ))}
            </div>
          )}

          {/* Loading state */}
          {Object.keys(prices).length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto mb-4 text-[#ff6726]" size={32} />
              <p className="text-gray-500">Loading market data...</p>
              <p className="text-xs text-gray-400 mt-2">
                Connecting to Binance & Twelve Data...
              </p>
            </div>
          )}

          {/* Footer Support */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail size={16} className="text-[#ff6726]" />
              <span>Support:</span>
              <a 
                href="mailto:support@minhquyet.com" 
                className="text-[#ff6726] hover:underline font-medium"
              >
                support@minhquyet.com
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
