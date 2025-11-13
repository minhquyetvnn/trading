'use client';

import { TrendingUp, TrendingDown, Target, Award, AlertTriangle } from 'lucide-react';

interface PerformanceData {
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  commonMistakes: string[];
  bestConditions: string[];
  recentTrend: string;
}

interface PerformanceStatsProps {
  coin: string;
  performance: PerformanceData | null;
  loading: boolean;
}

export const PerformanceStats = ({ coin, performance, loading }: PerformanceStatsProps) => {
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        No performance data available
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (performance.recentTrend) {
      case 'IMPROVING': return <TrendingUp className="text-green-500" size={20} />;
      case 'DECLINING': return <TrendingDown className="text-red-500" size={20} />;
      default: return <Target className="text-gray-500" size={20} />;
    }
  };

  const getTrendColor = () => {
    switch (performance.recentTrend) {
      case 'IMPROVING': return 'text-green-600 bg-green-50';
      case 'DECLINING': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">AI Performance Stats</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getTrendColor()}`}>
          {getTrendIcon()}
          {performance.recentTrend}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-blue-900">
            {performance.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {performance.correctPredictions}/{performance.totalPredictions}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Avg Profit</div>
          <div className="text-2xl font-bold text-green-900">
            +{performance.avgProfit.toFixed(2)}%
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600 mb-1">Avg Loss</div>
          <div className="text-2xl font-bold text-red-900">
            {performance.avgLoss.toFixed(2)}%
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">Profit Factor</div>
          <div className="text-2xl font-bold text-purple-900">
            {performance.profitFactor.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Best Conditions */}
      {performance.bestConditions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="text-green-600" size={18} />
            <h4 className="font-bold text-gray-900">Best Conditions</h4>
          </div>
          <ul className="space-y-2">
            {performance.bestConditions.map((condition, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes */}
      {performance.commonMistakes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600" size={18} />
            <h4 className="font-bold text-gray-900">Common Mistakes</h4>
          </div>
          <ul className="space-y-2">
            {performance.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
