'use client';

import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  byAction: { BUY: number; SELL: number; HOLD: number };
  byQuality: { EXCELLENT: number; GOOD: number; FAIR: number; POOR: number };
  byTimeframe: { '15m': number; '1h': number; '4h': number };
  avgConfidence: number;
  avgRiskReward: number;
  bestCoin: string;
  worstCoin: string;
}

interface SignalAnalyticsProps {
  signals: any[];
}

export const SignalAnalytics = ({ signals }: SignalAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (signals.length === 0) return;

    // Calculate analytics
    const byAction = { BUY: 0, SELL: 0, HOLD: 0 };
    const byQuality = { EXCELLENT: 0, GOOD: 0, FAIR: 0, POOR: 0 };
    const byTimeframe = { '15m': 0, '1h': 0, '4h': 0 };
    const coinPerformance: Record<string, { wins: number; total: number }> = {};

    let totalConfidence = 0;
    let totalRiskReward = 0;

    signals.forEach(signal => {
      // Action
      byAction[signal.action as keyof typeof byAction]++;

      // Quality
      if (signal.quality?.rating) {
        byQuality[signal.quality.rating as keyof typeof byQuality]++;
      }

      // Timeframe
      if (signal.timeframe in byTimeframe) {
        byTimeframe[signal.timeframe as keyof typeof byTimeframe]++;
      }

      // Confidence & R:R
      totalConfidence += signal.confidence;
      totalRiskReward += signal.riskRewardRatio;

      // Coin performance
      if (signal.isCorrect24h !== null) {
        if (!coinPerformance[signal.coin]) {
          coinPerformance[signal.coin] = { wins: 0, total: 0 };
        }
        coinPerformance[signal.coin].total++;
        if (signal.isCorrect24h) {
          coinPerformance[signal.coin].wins++;
        }
      }
    });

    // Find best/worst coin
    let bestCoin = 'N/A';
    let worstCoin = 'N/A';
    let bestWinRate = 0;
    let worstWinRate = 100;

    Object.entries(coinPerformance).forEach(([coin, perf]) => {
      if (perf.total < 3) return; // Need at least 3 trades
      const winRate = (perf.wins / perf.total) * 100;
      
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestCoin = coin;
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate;
        worstCoin = coin;
      }
    });

    setAnalytics({
      byAction,
      byQuality,
      byTimeframe,
      avgConfidence: totalConfidence / signals.length,
      avgRiskReward: totalRiskReward / signals.length,
      bestCoin,
      worstCoin
    });

  }, [signals]);

  if (!analytics || signals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        <BarChart3 className="mx-auto mb-3 text-gray-400" size={48} />
        <p>Not enough data for analytics</p>
        <p className="text-sm mt-1">Generate at least 5 signals to see insights</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <BarChart3 className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Signal Analytics</h3>
          <p className="text-sm text-gray-600">Performance insights & patterns</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <Target className="mx-auto text-blue-600 mb-2" size={20} />
          <p className="text-xs text-blue-700 mb-1">Avg Confidence</p>
          <p className="text-2xl font-bold text-blue-900">{analytics.avgConfidence.toFixed(0)}%</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <TrendingUp className="mx-auto text-green-600 mb-2" size={20} />
          <p className="text-xs text-green-700 mb-1">Avg R:R</p>
          <p className="text-2xl font-bold text-green-900">{analytics.avgRiskReward.toFixed(1)}:1</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
          <Award className="mx-auto text-purple-600 mb-2" size={20} />
          <p className="text-xs text-purple-700 mb-1">Best Coin</p>
          <p className="text-2xl font-bold text-purple-900">{analytics.bestCoin}</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
          <Target className="mx-auto text-orange-600 mb-2" size={20} />
          <p className="text-xs text-orange-700 mb-1">Total Signals</p>
          <p className="text-2xl font-bold text-orange-900">{signals.length}</p>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* By Action */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">By Action</h4>
          <div className="space-y-2">
            <DistributionBar label="BUY" value={analytics.byAction.BUY} total={signals.length} color="green" />
            <DistributionBar label="SELL" value={analytics.byAction.SELL} total={signals.length} color="red" />
            <DistributionBar label="HOLD" value={analytics.byAction.HOLD} total={signals.length} color="gray" />
          </div>
        </div>

        {/* By Quality */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">By Quality</h4>
          <div className="space-y-2">
            <DistributionBar label="💎 EXCELLENT" value={analytics.byQuality.EXCELLENT} total={signals.length} color="green" />
            <DistributionBar label="✨ GOOD" value={analytics.byQuality.GOOD} total={signals.length} color="blue" />
            <DistributionBar label="⚡ FAIR" value={analytics.byQuality.FAIR} total={signals.length} color="yellow" />
            <DistributionBar label="❌ POOR" value={analytics.byQuality.POOR} total={signals.length} color="red" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Distribution Bar Component
const DistributionBar = ({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};