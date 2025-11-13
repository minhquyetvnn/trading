import { Bell } from 'lucide-react';

interface CoinCardProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  high: string;
  low: string;
}

export const CoinCard = ({ symbol, name, price, change, high, low }: CoinCardProps) => {
  const changeNum = parseFloat(change);
  const isNegative = changeNum < 0;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{symbol}</h3>
          <p className="text-xs text-gray-500">{name}</p>
        </div>
        <button 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Set alert"
        >
          <Bell size={16} className="text-gray-400" />
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900 mb-2">
          ${parseFloat(price).toLocaleString()}
        </p>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
          isNegative 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {isNegative ? '↓' : '↑'} {Math.abs(changeNum).toFixed(2)}%
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-500 text-xs mb-1">24h High</p>
          <p className="font-semibold text-gray-900">
            ${parseFloat(high).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-500 text-xs mb-1">24h Low</p>
          <p className="font-semibold text-gray-900">
            ${parseFloat(low).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
