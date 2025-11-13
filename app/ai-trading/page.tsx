'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AITradingSignal } from '@/components/AITradingSignal';
import { PerformanceStats } from '@/components/PerformanceStats';
import { Brain, History, TrendingUp } from 'lucide-react';
import axios from 'axios';

const TRACKED_COINS = ['BTC', 'ETH', 'BNB', 'SOL'];

export default function AITradingPage() {
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [signal, setSignal] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Load performance khi chọn coin
  useEffect(() => {
    loadPerformance();
  }, [selectedCoin]);

  const loadPerformance = async () => {
    setPerformanceLoading(true);
    try {
      const response = await axios.get(`/api/performance?coin=${selectedCoin}&days=30&timeframe=24h`);
      if (response.data.success) {
        setPerformance(response.data.performance);
        setRecentPredictions(response.data.recentPredictions);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const generateSignal = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/generate-signal', {
        coin: selectedCoin
      });

      if (response.data.success) {
        setSignal(response.data.signal);
        // Reload performance sau khi tạo signal mới
        setTimeout(() => loadPerformance(), 1000);
      }
    } catch (error: any) {
      console.error('Error generating signal:', error);
      alert('Failed to generate signal: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff6726] to-[#ff8f5e] rounded-lg flex items-center justify-center">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Trading Assistant</h1>
                <p className="text-gray-600">Self-learning AI powered by DeepSeek-R1</p>
              </div>
            </div>
          </div>

          {/* Coin Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-[#ff6726]" size={20} />
              <h3 className="font-bold text-gray-900">Select Cryptocurrency</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TRACKED_COINS.map(coin => (
                <button
                  key={coin}
                  onClick={() => {
                    setSelectedCoin(coin);
                    setSignal(null); // Clear old signal
                  }}
                  className={`p-4 rounded-lg font-semibold transition-all ${
                    selectedCoin === coin
                      ? 'bg-[#ff6726] text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {coin}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* AI Signal - Takes 2 columns */}
            <div className="lg:col-span-2">
              <AITradingSignal
                coin={selectedCoin}
                signal={signal}
                loading={loading}
                onGenerateSignal={generateSignal}
              />
            </div>

            {/* Performance Stats - Takes 1 column */}
            <div>
              <PerformanceStats
                coin={selectedCoin}
                performance={performance}
                loading={performanceLoading}
              />
            </div>
          </div>

          {/* Recent Predictions History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="text-[#ff6726]" size={20} />
              <h3 className="text-xl font-bold text-gray-900">Recent Predictions</h3>
            </div>

            {recentPredictions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No predictions yet. Generate your first signal!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Confidence</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Entry</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Target</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actual</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">P/L</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPredictions.map((pred, index) => (
                      <tr key={pred.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(pred.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            pred.action === 'BUY' ? 'bg-green-100 text-green-700' :
                            pred.action === 'SELL' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {pred.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {pred.confidence}%
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          ${pred.entryPrice?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          ${pred.targetPrice?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {pred.actualPrice ? `$${pred.actualPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {pred.profitLoss !== null ? (
                            <span className={pred.profitLoss >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {pred.profitLoss >= 0 ? '+' : ''}{pred.profitLoss.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {pred.isCorrect !== null ? (
                            pred.isCorrect ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                                ✓ Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                                ✗ Wrong
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How AI Learning Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• AI analyzes technical indicators (RSI, MACD, Bollinger Bands, Volume)</li>
              <li>• Reviews its past performance to identify successful patterns</li>
              <li>• Learns from mistakes and adjusts confidence levels</li>
              <li>• Improves accuracy over time with more data</li>
              <li>• Results are automatically tracked after 24 hours</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
