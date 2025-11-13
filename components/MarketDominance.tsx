import { RefreshCw } from 'lucide-react';
import { MarketData } from '@/types/crypto';

interface MarketDominanceProps {
  data: MarketData;
  loading: boolean;
  onRefresh: () => void;
}

export const MarketDominance = ({ data, loading, onRefresh }: MarketDominanceProps) => {
  const altcoinDominance = 100 - data.btcDominance - data.ethDominance;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">MARKET DOMINANCE</h2>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* BTC Dominance - Màu cam */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">₿</span>
            <span className="text-sm font-medium text-gray-700">BTC Dominance</span>
          </div>
          <p className="text-3xl font-bold text-[#ff6726] mb-1">
            {data.btcDominance.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500">BTC Dominance Normal</p>
        </div>
        
        {/* ETH Dominance */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">Ξ</span>
            <span className="text-sm font-medium text-gray-700">ETH Dominance</span>
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-1">
            {data.ethDominance.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500">
            Altcoin {altcoinDominance.toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total Market Cap</p>
          <p className="text-xl font-bold text-gray-900">
            ${(data.totalMarketCap / 1e12).toFixed(2)}T
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">24h Volume</p>
          <p className="text-xl font-bold text-gray-900">
            ${(data.volume24h / 1e9).toFixed(1)}B
          </p>
        </div>
      </div>
    </div>
  );
};
