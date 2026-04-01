'use client';

/**
 * Market detail page
 * Shows full market information and betting interface
 */

import { use } from 'react';
import { useMarket } from '@/hooks/useMarket';
import { WalletGuard } from '@/context/WalletContext';
import { ConnectPrompt } from '@/components/wallet/ConnectPrompt';
import { WalletButton } from '@/components/wallet/WalletButton';
import { PriceFeed } from '@/components/oracle/PriceFeed';
import { MarketDetail } from '@/components/markets/MarketDetail';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarketPage({ params }: PageProps) {
  const { id } = use(params);
  const marketId = parseInt(id);
  const { market, isLoading, error, refetch } = useMarket(marketId);

  return (
    <WalletGuard fallback={<ConnectPrompt />}>
      <div className="min-h-screen bg-gray-50">
        <PriceFeed />

        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Markets</span>
              </Link>
              <WalletButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading market...</p>
              </div>
            </div>
          ) : error || !market ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Market not found</h3>
              <p className="text-gray-600 mb-6">
                {error || 'The market you are looking for does not exist.'}
              </p>
              <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Markets
              </Link>
            </div>
          ) : (
            <MarketDetail market={market} onUpdate={refetch} />
          )}
        </main>
      </div>
    </WalletGuard>
  );
}
