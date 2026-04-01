'use client';

/**
 * Dashboard page - main landing page with market listings
 * Filters active/settled markets
 */

import { useState } from 'react';
import { useMarkets } from '@/hooks/useMarkets';
import { WalletGuard } from '@/context/WalletContext';
import { ConnectPrompt } from '@/components/wallet/ConnectPrompt';
import { WalletButton } from '@/components/wallet/WalletButton';
import { PriceFeed } from '@/components/oracle/PriceFeed';
import { MarketCard } from '@/components/markets/MarketCard';
import { CreateMarketModal } from '@/components/markets/CreateMarketModal';
import { getMarketStatus } from '@/types/market';
import { algorandService } from '@/lib/algorand';
import { Plus, TrendingUp, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { markets, isLoading, refetch } = useMarkets();
  const [filter, setFilter] = useState<'all' | 'active' | 'settled' | 'expired'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const contractsNotDeployed = !algorandService.appId || algorandService.appId === 0;

  const filteredMarkets = markets.filter(market => {
    if (filter === 'all') return true;
    const status = getMarketStatus(market);
    if (filter === 'active') return status === 'active';
    if (filter === 'expired') return status === 'expired';
    if (filter === 'settled') return status === 'settled';
    return true;
  });

  return (
    <WalletGuard fallback={<ConnectPrompt />}>
      <div className="min-h-screen bg-gray-50">
        <PriceFeed />

        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Prediction Market</h1>
                  <p className="text-xs text-gray-600">Powered by Algorand</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Market
                </button>
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Contract Not Deployed Warning */}
          {contractsNotDeployed && (
            <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Smart Contracts Not Deployed</h3>
                  <p className="text-yellow-800 mb-4">
                    The prediction market smart contracts haven't been deployed yet. To use this application, you need to:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-yellow-800 mb-4">
                    <li>Deploy the smart contracts to Algorand TestNet</li>
                    <li>Update the <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code> file with your App IDs</li>
                    <li>Restart the development server</li>
                  </ol>
                  <div className="bg-yellow-100 p-4 rounded-lg font-mono text-sm text-yellow-900">
                    <p className="mb-2">To deploy contracts:</p>
                    <code className="block">cd prediction-market/projects/prediction-market</code>
                    <code className="block">poetry install</code>
                    <code className="block">algokit compile python</code>
                    <code className="block">algokit deploy --network testnet</code>
                  </div>
                  <p className="text-sm text-yellow-700 mt-4">
                    See <code>DEPLOYMENT.md</code> for detailed instructions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="mb-6 flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Markets
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'expired'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Expired
            </button>
            <button
              onClick={() => setFilter('settled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'settled'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settled
            </button>
          </div>

          {/* Markets Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading markets...</p>
              </div>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No markets found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'active' 
                   ? 'There are no active markets at the moment.' 
                   : filter === 'expired'
                   ? 'There are no pending markets awaiting settlement.'
                   : 'No markets match your filter.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Market
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map(market => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>Algorand Prediction Market • TestNet • Built with AlgoPy & Next.js</p>
            </div>
          </div>
        </footer>

        {/* Create Market Modal */}
        <CreateMarketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refetch}
        />
      </div>
    </WalletGuard>
  );
}
