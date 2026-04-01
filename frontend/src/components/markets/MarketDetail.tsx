'use client';

/**
 * Full detail view for a specific market
 * Combines BetPanel, PoolChart, and additional market information
 */

import { Market, getMarketStatus } from '@/types/market';
import { microAlgosToAlgo, getTimeRemaining, formatTimestamp } from '@/lib/lora';
import { AccountLink, AppLink } from '@/components/lora/LoraLink';
import { BetPanel } from './BetPanel';
import { PoolChart } from './PoolChart';
import { OddsDisplay } from './OddsDisplay';
import { Clock, TrendingUp, Calendar, User, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MarketDetailProps {
  market: Market;
  onUpdate?: () => void;
}

export function MarketDetail({ market, onUpdate }: MarketDetailProps) {
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
      badge: 'bg-green-100 text-green-700 border-green-200',
      label: 'Active',
      icon: <Clock className="w-5 h-5" />,
    },
    settled: {
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Settled',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    cancelled: {
      badge: 'bg-red-100 text-red-700 border-red-200',
      label: 'Cancelled',
      icon: <XCircle className="w-5 h-5" />,
    },
    expired: {
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
      label: 'Expired',
      icon: <Clock className="w-5 h-5" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{market.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Created by</span>
                <AccountLink address={market.creator} />
              </div>
              <div className="flex items-center gap-1">
                <span>Market #{market.id}</span>
              </div>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border ${config.badge}`}>
            {config.icon}
            {config.label}
          </span>
        </div>

        {status === 'active' && timeLeft.total > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Time Remaining:</span>
              <span className="text-lg font-mono font-bold text-blue-900">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </span>
            </div>
          </div>
        )}

        {status === 'settled' && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">
                Winning Outcome: {market.outcomes[market.winningIndex]}
              </span>
            </div>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-900">
                This market has been cancelled. Bettors can claim refunds.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pool</p>
              <p className="text-lg font-semibold text-gray-900">
                {microAlgosToAlgo(market.totalPool).toFixed(2)} ALGO
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">End Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTimestamp(market.endTimestamp)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Betting */}
        <div className="lg:col-span-2 space-y-6">
          <BetPanel market={market} onSuccess={onUpdate} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Odds</h3>
            <OddsDisplay 
              pools={market.pools} 
              totalPool={market.totalPool} 
              outcomes={market.outcomes} 
            />
          </div>
        </div>

        {/* Right Column - Pool Distribution */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Distribution</h3>
            <PoolChart pools={market.pools} outcomes={market.outcomes} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Market ID:</span>
                <span className="font-medium text-gray-900">#{market.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Outcomes:</span>
                <span className="font-medium text-gray-900">{market.numOutcomes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee:</span>
                <span className="font-medium text-gray-900">2%</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <AppLink appId={market.id} className="text-sm">
                  View on LORA Explorer
                </AppLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
