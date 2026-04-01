'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { algorandService } from '@/lib/algorand';
import { Loader2, Settings, CheckCircle } from 'lucide-react';

interface SettleMarketDebugProps {
  marketId: number;
  outcomes: string[];
  onSuccess?: () => void;
}

export function SettleMarketDebug({ marketId, outcomes, onSuccess }: SettleMarketDebugProps) {
  const { activeAccount, peraWallet } = useWallet();
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0);
  const [oracleAddress, setOracleAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchOracle = async () => {
      const addr = await algorandService.getOracleAddress();
      setOracleAddress(addr);
    };
    if (show) fetchOracle();
  }, [show]);

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
    <div className="mt-8 border-2 border-dashed border-amber-200 rounded-2xl p-6 bg-amber-50/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-700">
          <Settings className="w-5 h-5 animate-pulse-slow" />
          <span className="font-bold uppercase tracking-wider text-sm">Developer Payout Testing</span>
        </div>
        <button 
          onClick={() => setShow(!show)}
          className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-full hover:bg-amber-700 transition-all shadow-sm"
        >
          {show ? 'HIDE PANEL' : 'OPEN SETTLEMENT TOOL'}
        </button>
      </div>

      {show && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
            <p className="text-xs text-amber-800 font-medium mb-3">
              Normally, an AI Oracle settles the market automatically. 
              <br/>For your demo, <strong>choose a winner below</strong> to simulate a real result:
            </p>

            {oracleAddress && activeAccount !== oracleAddress && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-[10px] font-bold text-red-700 uppercase mb-1">⚠️ Restricted Access</p>
                <p className="text-xs text-red-800">
                  Only the Developer/Oracle can settle markets. 
                  <br/>Please switch to: <span className="font-mono text-[10px] break-all">{oracleAddress}</span> in your Pera Wallet.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {outcomes.map((outcome, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOutcome(idx)}
                  className={`py-3 px-4 text-sm rounded-lg border-2 transition-all font-semibold ${
                    selectedOutcome === idx 
                      ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-inner' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-amber-200'
                  }`}
                >
                  {outcome}
                </button>
              ))}
            </div>

            <button
              onClick={handleSettle}
              disabled={isSubmitting}
              className="w-full py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:bg-gray-300 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {isSubmitting ? 'BROADCASTING TO ALGORAND...' : `SETTLE AS "${outcomes[selectedOutcome].toUpperCase()}"`}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
