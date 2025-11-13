'use client';

import { useState } from 'react';
import { Brain, Zap, TrendingUp } from 'lucide-react';

interface SignalGeneratorProps {
  coins: string[];
  onGenerate: (coin: string, capital: number) => void;
  loading: boolean;
}

export const SignalGenerator = ({ coins, onGenerate, loading }: SignalGeneratorProps) => {
  const [selectedCoin, setSelectedCoin] = useState(coins[0]);
  const [capital, setCapital] = useState(1000);

  const handleGenerate = () => {
    onGenerate(selectedCoin, capital);
  };

  return (
    <div className="bg-gradient-to-br from-[#ff6726] to-[#ff8f5e] rounded-lg p-6 text-white shadow-xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <Brain className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold">AI Signal Generator</h3>
          <p className="text-sm opacity-90">Powered by DeepSeek-R1</p>
        </div>
      </div>

      {/* Coin Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 opacity-90">
          Select Cryptocurrency
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {coins.map(coin => (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              disabled={loading}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedCoin === coin
                  ? 'bg-white text-[#ff6726] shadow-lg'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {coin}
            </button>
          ))}
        </div>
      </div>

      {/* Capital Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 opacity-90">
          Capital Allocation (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-bold">
            $
          </span>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(parseFloat(e.target.value) || 1000)}
            disabled={loading}
            min="100"
            max="10000"
            step="100"
            className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/60 font-bold text-lg focus:outline-none focus:border-white disabled:opacity-50"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {[500, 1000, 2000, 5000].map(amount => (
            <button
              key={amount}
              onClick={() => setCapital(amount)}
              disabled={loading}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-4 bg-white text-[#ff6726] rounded-lg font-bold text-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#ff6726] border-t-transparent"></div>
            <span>Analyzing Market...</span>
          </>
        ) : (
          <>
            <Zap size={20} />
            <span>Generate Signal</span>
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs opacity-90">
            AI will analyze technical indicators, market conditions, and generate precise entry, stop loss, and take profit levels with optimal position sizing.
          </p>
        </div>
      </div>
    </div>
  );
};
