'use client';

import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface CompletedSignal {
  id: string;
  coin: string;
  action: string;
  confidence: number;
  entryPrice: number;
  currentPrice: number;
  pnlUSD: number;
  pnlPercentage: number;
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  status: string;
  createdAt: string;
  closedAt: string;
}

interface CompletedSignalsTableProps {
  signals: CompletedSignal[];
  loading: boolean;
}

export const CompletedSignalsTable = ({ signals, loading }: CompletedSignalsTableProps) => {
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Clock className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 font-medium">No completed signals yet</p>
        <p className="text-sm text-gray-500 mt-2">Signals will appear here once closed</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Coin</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Action</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Entry</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Exit</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">TPs Hit</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">P/L</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => {
              const isProfit = signal.pnlUSD >= 0;
              const tpsHit = [signal.tp1Hit, signal.tp2Hit, signal.tp3Hit].filter(Boolean).length;
              
              return (
                <tr key={signal.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-bold text-gray-900">{signal.coin}</span>
                  </td>
                  
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      signal.action === 'BUY' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {signal.action}
                    </span>
                  </td>
                  
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                    ${signal.entryPrice.toLocaleString()}
                  </td>
                  
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                    ${signal.currentPrice.toLocaleString()}
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            (i === 1 && signal.tp1Hit) || 
                            (i === 2 && signal.tp2Hit) || 
                            (i === 3 && signal.tp3Hit)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {i}
                        </div>
                      ))}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div>
                      <p className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}${signal.pnlUSD.toFixed(2)}
                      </p>
                      <p className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{signal.pnlPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                      signal.status === 'TP3_HIT' ? 'bg-green-100 text-green-700' :
                      signal.status === 'SL_HIT' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {signal.status === 'TP3_HIT' && <CheckCircle size={12} />}
                      {signal.status === 'SL_HIT' && <XCircle size={12} />}
                      {signal.status === 'TP3_HIT' ? 'All TPs' :
                       signal.status === 'SL_HIT' ? 'Stop Loss' :
                       'Closed'}
                    </span>
                  </td>
                  
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(signal.closedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
