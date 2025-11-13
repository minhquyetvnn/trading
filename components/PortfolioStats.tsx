'use client';

import { DollarSign, TrendingUp, TrendingDown, Target, Award, Activity } from 'lucide-react';

interface PortfolioStatsProps {
  portfolio: {
    startingCapital: number;
    currentCapital: number;
    netProfit: number;
    netProfitPercentage: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    totalLoss: number;
    profitFactor: number;
    activePositions: number;
  } | null;
  loading: boolean;
}

export const PortfolioStats = ({ portfolio, loading }: PortfolioStatsProps) => {
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        No portfolio data available
      </div>
    );
  }

  const isProfit = portfolio.netProfit >= 0;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-200 p-6 shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff6726] to-[#ff8f5e] rounded-lg flex items-center justify-center">
            <DollarSign className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Portfolio</h3>
            <p className="text-sm text-gray-500">Trading Performance</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1">Total Balance</p>
            <p className="text-4xl font-bold">${portfolio.currentCapital.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90 mb-1">Net P/L</p>
            <div className="flex items-center gap-2">
              {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <p className="text-2xl font-bold">
                {isProfit ? '+' : ''}${portfolio.netProfit.toFixed(2)}
              </p>
            </div>
            <p className="text-sm opacity-90 mt-1">
              {isProfit ? '+' : ''}{portfolio.netProfitPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div>
            <p className="text-xs opacity-75">Starting Capital</p>
            <p className="text-lg font-semibold">${portfolio.startingCapital.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Active Positions</p>
            <p className="text-lg font-semibold">{portfolio.activePositions}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-green-600" size={18} />
            <p className="text-sm text-green-700 font-medium">Win Rate</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{portfolio.winRate.toFixed(1)}%</p>
          <p className="text-xs text-green-600 mt-1">
            {portfolio.winningTrades}/{portfolio.totalTrades} trades
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-purple-600" size={18} />
            <p className="text-sm text-purple-700 font-medium">Profit Factor</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">
            {portfolio.profitFactor.toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {portfolio.profitFactor >= 2 ? 'Excellent' : portfolio.profitFactor >= 1.5 ? 'Good' : 'Needs improvement'}
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Total Trades</span>
          <span className="font-bold text-gray-900">{portfolio.totalTrades}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm text-green-700">Winning Trades</span>
          <span className="font-bold text-green-900">{portfolio.winningTrades}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <span className="text-sm text-red-700">Losing Trades</span>
          <span className="font-bold text-red-900">{portfolio.losingTrades}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm text-green-700">Total Profit</span>
          <span className="font-bold text-green-900">+${portfolio.totalProfit.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <span className="text-sm text-red-700">Total Loss</span>
          <span className="font-bold text-red-900">-${portfolio.totalLoss.toFixed(2)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Capital Growth</span>
          <span className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {portfolio.netProfitPercentage.toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all ${isProfit ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
            style={{ width: `${Math.min(Math.abs(portfolio.netProfitPercentage), 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
