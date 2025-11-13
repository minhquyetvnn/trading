'use client';

import { Award, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';

interface SignalQualityBadgeProps {
  quality: {
    rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    score: number;
    reasons: string[];
  };
  showDetails?: boolean;
}

export const SignalQualityBadge = ({ quality, showDetails = false }: SignalQualityBadgeProps) => {
  
  const getConfig = () => {
    switch (quality.rating) {
      case 'EXCELLENT':
        return {
          icon: Award,
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
          textColor: 'text-white',
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50',
          emoji: '💎'
        };
      case 'GOOD':
        return {
          icon: TrendingUp,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-600',
          textColor: 'text-white',
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50',
          emoji: '✨'
        };
      case 'FAIR':
        return {
          icon: AlertTriangle,
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          textColor: 'text-white',
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50',
          emoji: '⚠️'
        };
      case 'POOR':
        return {
          icon: XCircle,
          color: 'bg-gradient-to-r from-red-500 to-pink-600',
          textColor: 'text-white',
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50',
          emoji: '❌'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div>
      {/* Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color} ${config.textColor} font-bold text-sm shadow-lg`}>
        <span className="text-lg">{config.emoji}</span>
        <Icon size={16} />
        <span>{quality.rating}</span>
        <span className="opacity-90">({quality.score}/100)</span>
      </div>

      {/* Details */}
      {showDetails && (
        <div className={`mt-3 p-3 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}>
          <p className="text-xs font-semibold text-gray-700 mb-2">Quality Factors:</p>
          <ul className="space-y-1">
            {quality.reasons.map((reason, index) => (
              <li key={index} className="text-xs text-gray-700 flex items-start gap-1">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
