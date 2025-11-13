'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Brain, AlertCircle, Target, Shield } from 'lucide-react';

interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  predictionId: string;
}

interface AITradingSignalProps {
  coin: string;
  signal: TradingSignal | null;
  loading: boolean;
  onGenerateSignal: () => void;
}

export const AITradingSignal = ({ 
  coin, 
  signal, 
  loading, 
  onGenerateSignal 
}: AITradingSignalProps) => {
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HOLD': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp size={24} />;
      case 'SELL': return <TrendingDown size={24} />;
      case 'HOLD': return <Minus size={24} />;
      default: return <Minus size={24} />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border-2 border-[#ff6726] p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#ff6726] rounded-full flex items-center justify-center">
            <Brain className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Trading Signal</h3>
            <p className="text-sm text-gray-500">DeepSeek-R1 Analysis for {coin}</p>
          </div>
        </div>
        
        <button
          onClick={onGenerateSignal}
          disabled={loading}
          className="px-4 py-2 bg-[#ff6726] text-white rounded-lg font-semibold hover:bg-[#e55a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Generate Signal'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#ff6726] border-t-transparent"></div>
          <p className="mt-4 text-gray-600">AI is analyzing market data...</p>
        </div>
      )}

      {/* No Signal State */}
      {!loading && !signal && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No signal generated yet</p>
          <p className="text-sm text-gray-500 mt-2">Click "Generate Signal" to get AI analysis</p>
        </div>
      )}

      {/* Signal Display */}
      {!loading && signal && (
        <div className="space-y-6">
          {/* Action Badge */}
          <div className={`flex items-center justify-center gap-3 p-6 rounded-lg border-2 ${getActionColor(signal.action)}`}>
            {getActionIcon(signal.action)}
            <div>
              <div className="text-3xl font-bold">{signal.action}</div>
              <div className="text-sm opacity-75">Recommended Action</div>
            </div>
          </div>

          {/* Confidence & Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Confidence Level</div>
              <div className={`text-3xl font-bold ${getConfidenceColor(signal.confidence)}`}>
                {signal.confidence}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${signal.confidence >= 75 ? 'bg-green-500' : signal.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${signal.confidence}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Risk Level</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(signal.riskLevel)}`}>
                <Shield size={16} />
                {signal.riskLevel}
              </div>
            </div>
          </div>

          {/* Price Levels */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-blue-600" size={20} />
              <h4 className="font-bold text-gray-900">Price Targets</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Entry Price</div>
                <div className="text-lg font-bold text-gray-900">
                  ${signal.entryPrice.toLocaleString()}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-600 mb-1">Target Price</div>
                <div className="text-lg font-bold text-green-600">
                  ${signal.targetPrice.toLocaleString()}
                </div>
                <div className="text-xs text-green-600">
                  +{((signal.targetPrice - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-600 mb-1">Stop Loss</div>
                <div className="text-lg font-bold text-red-600">
                  ${signal.stopLoss.toLocaleString()}
                </div>
                <div className="text-xs text-red-600">
                  {((signal.stopLoss - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Brain size={18} className="text-[#ff6726]" />
              AI Reasoning
            </h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {signal.reasoning}
            </p>
          </div>

          {/* Timestamp */}
          <div className="text-center text-xs text-gray-500">
            Generated at {new Date(signal.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
