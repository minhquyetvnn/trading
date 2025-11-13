'use client';

import { TrendingUp, TrendingDown, Target, Shield, Clock, DollarSign, Percent } from 'lucide-react';
import { SignalQualityBadge } from './SignalQualityBadge';
import { TradeNowButton } from './TradeNowButton';

interface SignalCardProps {
  signal: {
    id: string;
    coin: string;
    action: 'BUY' | 'SELL';
    signalType: 'LONG' | 'SHORT';
    confidence: number;
    timeframe: string;
    
    entryPrice: number;
    currentPrice: number;
    
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    
    capitalAllocated: number;
    positionSize: number;
    riskRewardRatio: number;
    riskPercentage?: number;
    
    pnlUSD: number;
    pnlPercentage: number;
    
    tp1Hit: boolean;
    tp2Hit: boolean;
    tp3Hit: boolean;
    
    status: string;
    createdAt: string;
    expiresAt?: string;
    
    reasoning?: string;
    keyFactors?: string[];
    
    quality?: {
      rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
      score: number;
      reasons: string[];
    };
  };
  onClose?: (signalId: string) => void;
}

export const SignalCard = ({ signal, onClose }: SignalCardProps) => {
  
  const getActionColor = (action: string) => {
    return action === 'BUY' 
      ? 'bg-green-500 text-white' 
      : 'bg-red-500 text-white';
  };

  const getActionBorderColor = (action: string) => {
    return action === 'BUY' 
      ? 'border-green-500' 
      : 'border-red-500';
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 bg-green-50';
    if (pnl < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 70) return 'bg-blue-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const priceChangePercent = ((signal.currentPrice - signal.entryPrice) / signal.entryPrice) * 100;
  const isPositive = signal.action === 'BUY' ? priceChangePercent > 0 : priceChangePercent < 0;

  return (
    <div className={`bg-white rounded-xl border-2 ${getActionBorderColor(signal.action)} p-5 shadow-lg hover:shadow-xl transition-all`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full ${getActionColor(signal.action)} font-bold text-sm flex items-center gap-1.5 shadow-md`}>
            {signal.action === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {signal.action}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{signal.coin}</h3>
            <p className="text-xs text-gray-500">{signal.signalType} • {signal.timeframe}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(signal.confidence)}`}></div>
            <span className="text-sm font-semibold text-gray-700">{signal.confidence}%</span>
          </div>
          <p className="text-xs text-gray-500">{formatTime(signal.createdAt)}</p>
          
          {/* Quality Badge */}
          {signal.quality && (
            <div className="mt-2">
              <SignalQualityBadge quality={signal.quality} />
            </div>
          )}
        </div>
      </div>

      {/* Current P/L */}
      <div className={`flex items-center justify-between p-4 rounded-xl mb-4 border-2 ${
        signal.pnlUSD > 0 ? 'bg-green-50 border-green-200' :
        signal.pnlUSD < 0 ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div>
          <p className="text-xs font-medium mb-1 text-gray-600">Current P/L</p>
          <p className={`text-2xl font-bold ${getPnLColor(signal.pnlUSD)}`}>
            ${signal.pnlUSD.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium mb-1 text-gray-600">ROI</p>
          <p className={`text-xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}{signal.pnlPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Price Levels */}
      <div className="space-y-3 mb-4">
        {/* Entry Price */}
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Target className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-blue-900">Entry</span>
          </div>
          <span className="font-bold text-blue-900">${signal.entryPrice.toLocaleString()}</span>
        </div>

        {/* Current Price */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <DollarSign className="text-gray-600" size={16} />
            <span className="text-sm font-medium text-gray-700">Current</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-gray-900">${signal.currentPrice.toLocaleString()}</span>
            <span className={`ml-2 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(priceChangePercent).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Take Profits */}
        <div className="space-y-2">
          <TPLevel 
            label="TP1" 
            price={signal.takeProfit1} 
            hit={signal.tp1Hit}
            percentage={((Math.abs(signal.takeProfit1 - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}
          />
          <TPLevel 
            label="TP2" 
            price={signal.takeProfit2} 
            hit={signal.tp2Hit}
            percentage={((Math.abs(signal.takeProfit2 - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}
          />
          <TPLevel 
            label="TP3" 
            price={signal.takeProfit3} 
            hit={signal.tp3Hit}
            percentage={((Math.abs(signal.takeProfit3 - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}
          />
        </div>

        {/* Stop Loss */}
        <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <Shield className="text-red-600" size={16} />
            <span className="text-sm font-medium text-red-900">Stop Loss</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-red-900">${signal.stopLoss.toLocaleString()}</span>
            <span className="ml-2 text-xs text-red-600">
              -{((Math.abs(signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Position Info */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200 text-center">
          <p className="text-xs text-purple-700 font-medium mb-1">Position</p>
          <p className="text-sm font-bold text-purple-900">{signal.positionSize.toFixed(4)}</p>
          <p className="text-xs text-purple-600">{signal.coin}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200 text-center">
          <p className="text-xs text-blue-700 font-medium mb-1">Capital</p>
          <p className="text-sm font-bold text-blue-900">${signal.capitalAllocated}</p>
          <p className="text-xs text-blue-600">Allocated</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 text-center">
          <p className="text-xs text-green-700 font-medium mb-1">R:R</p>
          <p className="text-sm font-bold text-green-900">{signal.riskRewardRatio.toFixed(1)}:1</p>
          <p className="text-xs text-green-600">Ratio</p>
        </div>
      </div>

      {/* Quality Details (if available) */}
      {signal.quality && signal.quality.reasons.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">✨ Why This Signal is {signal.quality.rating}:</p>
          <ul className="space-y-1">
            {signal.quality.reasons.slice(0, 3).map((reason, index) => (
              <li key={index} className="text-xs text-blue-800 flex items-start gap-1">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {signal.status !== 'CLOSED' && signal.status !== 'SL_HIT' && signal.status !== 'TP3_HIT' ? (
        <div className="space-y-2">
          {/* Trade Now Button */}
          <TradeNowButton signal={signal} />
          
          {/* Close Position Button */}
          {onClose && (
            <button
              onClick={() => onClose(signal.id)}
              className="w-full py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
            >
              Close Position
            </button>
          )}
        </div>
      ) : (
        /* Status Badge for Completed Signals */
        <div className={`text-center py-3 rounded-lg font-semibold ${
          signal.status === 'TP3_HIT' ? 'bg-green-100 text-green-700 border-2 border-green-300' :
          signal.status === 'SL_HIT' ? 'bg-red-100 text-red-700 border-2 border-red-300' :
          'bg-gray-100 text-gray-700 border-2 border-gray-300'
        }`}>
          {signal.status === 'TP3_HIT' ? '🎉 All Targets Hit!' :
           signal.status === 'SL_HIT' ? '⚠️ Stop Loss Hit' :
           '✓ Position Closed'}
        </div>
      )}

      {/* Expiration Timer (if active) */}
      {signal.expiresAt && signal.status === 'ACTIVE' && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Clock size={12} />
          <span>Expires: {new Date(signal.expiresAt).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

// TP Level Component
const TPLevel = ({ label, price, hit, percentage }: { 
  label: string; 
  price: number; 
  hit: boolean;
  percentage: string;
}) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
    hit 
      ? 'bg-green-100 border-green-400 shadow-md' 
      : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="flex items-center gap-2">
      {hit && <span className="text-green-600 font-bold text-lg">✓</span>}
      <span className={`text-sm font-medium ${hit ? 'text-green-900' : 'text-gray-700'}`}>
        {label}
      </span>
    </div>
    <div className="text-right">
      <span className={`font-bold ${hit ? 'text-green-900' : 'text-gray-900'}`}>
        ${price.toLocaleString()}
      </span>
      <span className="ml-2 text-xs text-green-600 font-semibold">
        +{percentage}%
      </span>
    </div>
  </div>
);
