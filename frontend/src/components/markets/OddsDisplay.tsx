/**
 * Visual representation of betting odds
 */

import { calculateOdds } from '@/types/market';

interface OddsDisplayProps {
  pools: number[];
  totalPool: number;
  outcomes: string[];
  className?: string;
}

export function OddsDisplay({ pools, totalPool, outcomes, className = '' }: OddsDisplayProps) {
  const odds = calculateOdds(pools, totalPool);

  return (
    <div className={`space-y-2 ${className}`}>
      {outcomes.map((outcome, index) => {
        const odd = odds[index];
        const percentage = totalPool > 0 ? (pools[index] / totalPool) * 100 : 0;

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{outcome}</span>
              <span className="text-gray-900 font-semibold">
                {odd > 0 ? `${odd.toFixed(2)}x` : '—'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              {percentage.toFixed(1)}% of pool
            </div>
          </div>
        );
      })}
    </div>
  );
}
