'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Zap } from 'lucide-react';

// Define proper types
interface Signal {
  coin: string;
  action: string;
  signalType: string;
  confidence: number;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  positionSize: number;
  capitalAllocated: number;
  riskRewardRatio: number;
  reasoning: string;
}

interface TradeNowButtonProps {
  signal: Signal;
  onCopySuccess?: () => void;
}

type ColorType = 'blue' | 'red' | 'green';

interface PriceLevelProps {
  label: string;
  price: number;
  percentage?: string;
  color: ColorType;
}

export const TradeNowButton = ({ signal, onCopySuccess }: TradeNowButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyTradeInfo = () => {
    const tradeInfo = `
🎯 TRADING SIGNAL - ${signal.coin}

Action: ${signal.action} ${signal.signalType}
Confidence: ${signal.confidence}%
Timeframe: ${signal.timeframe}

💰 ENTRY & TARGETS:
Entry Price: $${signal.entryPrice.toLocaleString()}
Stop Loss: $${signal.stopLoss.toLocaleString()}
Take Profit 1: $${signal.takeProfit1.toLocaleString()} (+${((signal.takeProfit1 - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%)
Take Profit 2: $${signal.takeProfit2.toLocaleString()} (+${((signal.takeProfit2 - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%)
Take Profit 3: $${signal.takeProfit3.toLocaleString()} (+${((signal.takeProfit3 - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}%)

📊 POSITION SIZING:
Position Size: ${signal.positionSize} ${signal.coin}
Capital Allocated: $${signal.capitalAllocated}
Risk/Reward: ${signal.riskRewardRatio}:1
Risk: 2% ($${(signal.capitalAllocated * 0.02).toFixed(2)})

💡 REASONING:
${signal.reasoning}

⚠️ Remember: Always use Stop Loss!
    `.trim();

    navigator.clipboard.writeText(tradeInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    if (onCopySuccess) onCopySuccess();
  };

  return (
    <>
      {/* Trade Now Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 bg-gradient-to-r from-[#ff6726] to-[#ff8f5e] text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <Zap size={20} />
        Trade Now
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#ff6726] to-[#ff8f5e] p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Ready to Trade {signal.coin}?</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-white/90 text-sm">Copy the information below and execute on your exchange</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Signal Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{signal.action} {signal.coin}</h3>
                    <p className="text-sm text-gray-600">{signal.signalType} • {signal.timeframe}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-2xl font-bold text-green-600">{signal.confidence}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Risk/Reward</p>
                    <p className="text-lg font-bold text-purple-600">{signal.riskRewardRatio}:1</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Position Size</p>
                    <p className="text-lg font-bold text-gray-900">{signal.positionSize} {signal.coin}</p>
                  </div>
                </div>
              </div>

              {/* Price Levels */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Price Levels
                </h4>

                <div className="space-y-2">
                  <PriceLevel
                    label="Entry Price"
                    price={signal.entryPrice}
                    color="blue"
                  />
                  
                  <PriceLevel
                    label="Stop Loss"
                    price={signal.stopLoss}
                    percentage={((signal.stopLoss - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}
                    color="red"
                  />
                  
                  <PriceLevel
                    label="Take Profit 1"
                    price={signal.takeProfit1}
                    percentage={((signal.takeProfit1 - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}
                    color="green"
                  />
                  
                  <PriceLevel
                    label="Take Profit 2"
                    price={signal.takeProfit2}
                    percentage={((signal.takeProfit2 - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}
                    color="green"
                  />
                  
                  <PriceLevel
                    label="Take Profit 3"
                    price={signal.takeProfit3}
                    percentage={((signal.takeProfit3 - signal.entryPrice) / signal.entryPrice * 100).toFixed(2)}
                    color="green"
                  />
                </div>
              </div>

              {/* Risk Info */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-yellow-900 mb-1">Risk Management</p>
                    <p className="text-sm text-yellow-800">
                      Max risk: <strong>2%</strong> of capital (${(signal.capitalAllocated * 0.02).toFixed(2)})
                    </p>
                    <p className="text-sm text-yellow-800">
                      Always set Stop Loss at <strong>${signal.stopLoss.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  AI Reasoning
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {signal.reasoning}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Copy Button */}
                <button
                  onClick={handleCopyTradeInfo}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={20} />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copy Trade Information
                    </>
                  )}
                </button>

                {/* Open Exchange Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://www.binance.com/en/trade/${signal.coin}_USDT`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Open Binance
                  </a>
                  
                  <a
                    href={`https://www.bybit.com/trade/usdt/${signal.coin}USDT`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Open Bybit
                  </a>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">📝 How to Execute:</h4>
                <ol className="space-y-1 text-sm text-blue-800">
                  <li>1. Copy the trade information above</li>
                  <li>2. Open your exchange (Binance/Bybit/etc)</li>
                  <li>3. Go to {signal.coin}/USDT trading pair</li>
                  <li>4. Place {signal.action} order at Entry Price</li>
                  <li>5. Set Stop Loss immediately</li>
                  <li>6. Set Take Profit levels (optional, can close manually)</li>
                  <li>7. Monitor on this dashboard</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper component with proper types
const PriceLevel = ({ label, price, percentage, color }: PriceLevelProps) => {
  const colorClasses: Record<ColorType, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    green: 'bg-green-50 border-green-200 text-green-900'
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${colorClasses[color]}`}>
      <span className="font-medium">{label}</span>
      <div className="text-right">
        <span className="font-bold">${price.toLocaleString()}</span>
        {percentage && (
          <span className={`ml-2 text-sm ${parseFloat(percentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(percentage) >= 0 ? '+' : ''}{percentage}%
          </span>
        )}
      </div>
    </div>
  );
};
