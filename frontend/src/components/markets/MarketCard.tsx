'use client';

/**
 * Market summary card with live countdown and odds
 */

import { Market, getMarketStatus } from '@/types/market';
import { microAlgosToAlgo, getTimeRemaining } from '@/lib/algorand';
import { Clock, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(market.endTimestamp));
  const status = getMarketStatus(market);

  useEffect(() => {
    if (status !== 'active') return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(market.endTimestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [market.endTimestamp, status]);

  const statusConfig = {
    active: {
      badge: 'bg-green-100 text-green-700',
      label: 'Active',
      icon: <Clock className="w-4 h-4" />,
    },
    settled: {
      badge: 'bg-blue-100 text-blue-700',
      label: 'Settled',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    cancelled: {
      badge: 'bg-red-100 text-red-700',
      label: 'Cancelled',
      icon: <XCircle className="w-4 h-4" />,
    },
    expired: {
      badge: 'bg-gray-100 text-gray-700',
      label: 'Expired',
      icon: <Clock className="w-4 h-4" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">{market.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.badge}`}>
            {config.icon}
            {config.label}
          </span>
        </div>

        {status === 'active' && timeLeft.total > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-semibold">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </span>
            </div>
          </div>
        )}

        {status === 'settled' && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-900">
              <span className="font-semibold">Winner:</span> {market.outcomes[market.winningIndex]}
            </p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {market.outcomes.map((outcome, index) => {
            const percentage = market.totalPool > 0 
              ? (market.pools[index] / market.totalPool) * 100 
              : 0;

            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{outcome}</span>
                <span className="font-medium text-gray-900">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">{microAlgosToAlgo(market.totalPool).toFixed(2)} ALGO</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Market #{market.id}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
