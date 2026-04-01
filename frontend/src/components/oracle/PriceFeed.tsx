'use client';

/**
 * Price ticker component
 * Displays real-time cryptocurrency prices at the top of the interface
 */

import { usePriceFeed } from '@/hooks/usePriceFeed';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PriceFeed() {
  const { prices, isLoading } = usePriceFeed(['bitcoin', 'ethereum', 'algorand']);

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-center">
          <p className="text-sm">Loading prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white py-2 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex items-center gap-8 justify-center flex-wrap">
          {Object.values(prices).map((price) => (
            <div key={price.symbol} className="flex items-center gap-2">
              <span className="font-semibold text-sm">{price.symbol}</span>
              <span className="text-sm">${price.price.toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}</span>
              <span
                className={`flex items-center gap-1 text-xs ${
                  price.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {price.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(price.change24h).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
