'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { algorandService } from '@/lib/algorand';
import { Loader2, Settings } from 'lucide-react';

interface SettleMarketDebugProps {
  marketId: number;
  outcomes: string[];
  onSuccess?: () => void;
}

export function SettleMarketDebug({ marketId, outcomes, onSuccess }: SettleMarketDebugProps) {
  const { activeAccount, peraWallet } = useWallet();
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const handleSettle = async () => {
    if (!activeAccount) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const txns = await algorandService.buildSettleMarketTxns(activeAccount, marketId, selectedOutcome);
      
      const signedTxns = await peraWallet.signTransaction([
        txns.map(txn => ({ txn, signers: [activeAccount] }))
      ]);

      const response = await algorandService.algodClient.sendRawTransaction(signedTxns).do();
      await algorandService.waitForConfirmation(response.txid);

      if (onSuccess) onSuccess();
      setShow(false);
    } catch (err: any) {
      console.error('Error settling market:', err);
      setError(err.message || 'Failed to settle market. (Are you the creator/oracle?)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-dashed border-gray-300 pt-6">
      <button 
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
      >
        <Settings className="w-4 h-4" />
        Testing: Force Settle Market
      </button>

      {show && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
          <p className="text-sm text-gray-600 font-medium font-mono lowercase">
            [Dev-Only] Manually choose the winner to test the claim logic. 
          </p>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((outcome, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOutcome(idx)}
                className={`py-2 px-3 text-xs rounded border transition-all ${
                  selectedOutcome === idx 
                    ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {outcome}
              </button>
            ))}
          </div>

          <button
            onClick={handleSettle}
            disabled={isSubmitting}
            className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-400 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            SETTLE TO {outcomes[selectedOutcome].toUpperCase()}
          </button>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}
