'use client';

/**
 * Wallet Context Provider
 * Global state management for Pera Wallet connection
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { usePeraWallet } from '@/hooks/usePeraWallet';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextType {
  peraWallet: PeraWalletConnect;
  accounts: string[];
  activeAccount: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<string[]>;
  disconnect: () => Promise<void>;
  signTransaction: (txnGroup: any[], signerAddress?: string) => Promise<Uint8Array[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const wallet = usePeraWallet();

  // Ensure we only render after client-side hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, render a loading state
  if (!mounted) {
    return (
      <WalletContext.Provider value={{
        peraWallet: null as any,
        accounts: [],
        activeAccount: null,
        isConnected: false,
        isLoading: true,
        connect: async () => [],
        disconnect: async () => {},
        signTransaction: async () => [],
      }}>
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

/**
 * WalletGuard component
 * Wraps content that requires wallet connection
 */
interface WalletGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WalletGuard({ children, fallback }: WalletGuardProps) {
  const { isConnected, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
