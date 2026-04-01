'use client';

/**
 * Sophisticated betting interface
 * Outcome selection and ALGO betting with transaction handling
 */

import { useState } from 'react';
import { Market, getMarketStatus, calculatePayout } from '@/types/market';
import { useWallet } from '@/context/WalletContext';
import { algorandService } from '@/lib/algorand';
import { TxLink } from '@/components/lora/LoraLink';
import { Loader2, TrendingUp, CheckCircle } from 'lucide-react';
import algosdk from 'algosdk';

interface BetPanelProps {
  market: Market;
  onSuccess?: () => void;
}

export function BetPanel({ market, onSuccess }: BetPanelProps) {
  const { activeAccount, peraWallet } = useWallet();
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = getMarketStatus(market);
  const canBet = status === 'active' && activeAccount;

  const handlePlaceBet = async () => {
    if (!activeAccount || !canBet) return;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1) {
      setError('Minimum bet is 1 ALGO');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTxId(null);

    try {
      // Build transaction group
      const txns = await algorandService.buildPlaceBetTxns(
        activeAccount,
        market.id,
        selectedOutcome,
        amount
      );

      // ATC already assigns the group ID
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([
        txns.map(txn => ({ txn, signers: [activeAccount] }))
      ]);

      // Send to network
      const response = await algorandService.algodClient
        .sendRawTransaction(signedTxns)
        .do();

      const confirmedTxId = response.txid;

      // Wait for confirmation
      await algorandService.waitForConfirmation(confirmedTxId);

      setTxId(confirmedTxId);
      setBetAmount('1');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error placing bet:', err);
      setError(err.message || 'Failed to place bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedPayout = calculatePayout(
    parseFloat(betAmount || '0') * 1_000_000,
    market.pools[selectedOutcome],
    market.totalPool
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Your Bet</h3>

      {!canBet && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">
            {status !== 'active' 
              ? 'This market is no longer accepting bets' 
              : 'Connect your wallet to place a bet'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Outcome
          </label>
          <div className="grid grid-cols-1 gap-2">
            {market.outcomes.map((outcome, index) => {
              const percentage = market.totalPool > 0 
                ? (market.pools[index] / market.totalPool) * 100 
                : 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedOutcome(index)}
                  disabled={!canBet}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedOutcome === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!canBet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{outcome}</span>
                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (ALGO)
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={!canBet || isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter amount"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum: 1 ALGO</p>
        </div>

        {estimatedPayout > 0 && parseFloat(betAmount) >= 1 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-900">Estimated Payout:</span>
              <span className="font-semibold text-green-900 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {(estimatedPayout / 1_000_000).toFixed(2)} ALGO
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handlePlaceBet}
          disabled={!canBet || isSubmitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Bet...
            </>
          ) : (
            'Place Bet'
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {txId && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm font-bold">Bet Placed Successfully!</p>
            </div>
            <p className="text-xs text-green-700 mb-3">Your bid has been recorded on the Algorand blockchain.</p>
            <TxLink txId={txId} className="w-full justify-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 no-underline font-medium text-xs">
              View Receipt on LORA Explorer
            </TxLink>
          </div>
        )}
      </div>
    </div>
  );
}
