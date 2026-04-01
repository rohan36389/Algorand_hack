'use client';

/**
 * Wallet connection button component
 * Handles Pera Wallet connect/disconnect with LORA integration
 */

import { useWallet } from '@/context/WalletContext';
import { AccountLink } from '@/components/lora/LoraLink';
import { Wallet, LogOut } from 'lucide-react';
import { truncateAddress } from '@/lib/algorand';

export function WalletButton() {
  const { activeAccount, isConnected, isLoading, connect, disconnect } = useWallet();

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (isConnected && activeAccount) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Wallet className="w-4 h-4 text-green-600" />
          <AccountLink address={activeAccount} className="text-sm font-mono">
            {truncateAddress(activeAccount)}
          </AccountLink>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors font-medium"
    >
      <Wallet className="w-5 h-5" />
      Connect Pera Wallet
    </button>
  );
}
