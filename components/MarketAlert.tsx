import { TrendingDown, AlertTriangle } from 'lucide-react';

interface MarketAlertProps {
  show: boolean;
}

export const MarketAlert = ({ show }: MarketAlertProps) => {
  if (!show) return null;
  
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <TrendingDown className="text-red-500" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-900 text-lg mb-2">
            Market Fear - Capital Fleeing
          </h3>
          <p className="text-sm text-red-800 mb-3">
            Money leaving altcoins, seeking safety in BTC or stablecoins.
          </p>
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
            <AlertTriangle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-yellow-900">
              Do NOT trade altcoins. Wait for BTC to form a bottom.
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Confidence: <span className="font-bold text-red-700">HIGH</span>
          </p>
        </div>
      </div>
    </div>
  );
};
