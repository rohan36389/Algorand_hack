'use client';

/**
 * Modal form to create new prediction markets
 */

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { algorandService } from '@/lib/algorand';
import { TxLink } from '@/components/lora/LoraLink';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import algosdk from 'algosdk';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateMarketModal({ isOpen, onClose, onSuccess }: CreateMarketModalProps) {
  const { activeAccount, peraWallet } = useWallet();
  const [title, setTitle] = useState('');
  const [outcomes, setOutcomes] = useState(['', '']);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOutcome = () => {
    if (outcomes.length < 4) {
      setOutcomes([...outcomes, '']);
    }
  };

  const handleRemoveOutcome = (index: number) => {
    if (outcomes.length > 2) {
      setOutcomes(outcomes.filter((_, i) => i !== index));
    }
  };

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index] = value;
    setOutcomes(newOutcomes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAccount) {
      setError('Please connect your wallet');
      return;
    }

    // Check if contracts are deployed
    if (!algorandService.appId || algorandService.appId === 0) {
      setError('Smart contracts not deployed. Please deploy contracts first and update .env.local with the App IDs.');
      return;
    }

    // Validation
    if (!title.trim()) {
      setError('Please enter a market title');
      return;
    }

    const validOutcomes = outcomes.filter(o => o.trim().length > 0);
    if (validOutcomes.length < 2) {
      setError('Please enter at least 2 outcomes');
      return;
    }

    if (!endDate || !endTime) {
      setError('Please select an end date and time');
      return;
    }

    const endTimestamp = Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    const minBuffer = 60 * 60; // 1 hour buffer

    if (endTimestamp < now + minBuffer) {
      setError('End time must be at least 1 hour in the future');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTxId(null);

    try {
      // Build transaction group
      const txns = await algorandService.buildCreateMarketTxns(
        activeAccount,
        title.trim(),
        validOutcomes,
        endTimestamp
      );

      // ATC already assigns the group ID, we don't need to reassign it
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
      
      // Reset form
      setTitle('');
      setOutcomes(['', '']);
      setEndDate('');
      setEndTime('');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error creating market:', err);
      setError(err.message || 'Failed to create market');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Market</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcomes (2-4)
            </label>
            <div className="space-y-2">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => handleOutcomeChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Outcome ${index + 1}`}
                    required
                  />
                  {outcomes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOutcome(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {outcomes.length < 4 && (
              <button
                type="button"
                onClick={handleAddOutcome}
                className="mt-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Outcome
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Note:</span> Creating a market requires 0.2 ALGO for storage costs.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {txId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-2">Market created successfully!</p>
              <TxLink txId={txId} className="text-sm" />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Market'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
