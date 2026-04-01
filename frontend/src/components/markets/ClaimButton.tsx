'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { algorandService } from '@/lib/algorand';
import { TxLink } from '@/components/lora/LoraLink';
import { Loader2, Trophy, CheckCircle } from 'lucide-react';

interface ClaimButtonProps {
  marketId: number;
  onSuccess?: () => void;
}

export function ClaimButton({ marketId, onSuccess }: ClaimButtonProps) {
  const { activeAccount, peraWallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!activeAccount) return;

    setIsSubmitting(true);
    setError(null);
    setTxId(null);

    try {
      const txns = await algorandService.buildClaimWinningsTxns(activeAccount, marketId);
      
      const signedTxns = await peraWallet.signTransaction([
        txns.map(txn => ({ txn, signers: [activeAccount] }))
      ]);

      const response = await algorandService.algodClient.sendRawTransaction(signedTxns).do();
      await algorandService.waitForConfirmation(response.txid);

      setTxId(response.txid);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error claiming winnings:', err);
      setError(err.message || 'Failed to claim. Are you a winner?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleClaim}
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:bg-gray-300 transition-all font-bold flex items-center justify-center gap-3 shadow-lg shadow-yellow-200"
      >
        {isSubmitting ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Trophy className="w-6 h-6" />
        )}
        {isSubmitting ? 'Processing Claim...' : 'CLAIM YOUR WINNINGS'}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {txId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <p className="text-sm font-bold">Winnings Claimed!</p>
          </div>
          <p className="text-xs text-green-700 mb-3">Your payout transaction has been confirmed on-chain.</p>
          <TxLink txId={txId} className="w-full justify-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 no-underline font-medium text-xs">
            View Receipt on LORA Explorer
          </TxLink>
        </div>
      )}
    </div>
  );
}
