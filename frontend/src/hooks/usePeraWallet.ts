/**
 * Pera Wallet integration hook
 * Module-level singleton implementation
 */

import { PeraWalletConnect } from '@perawallet/connect';
import { useEffect, useState, useCallback } from 'react';

// Module-level singleton
let peraWallet: PeraWalletConnect | null = null;

function getPeraWallet(): PeraWalletConnect {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    throw new Error('PeraWallet can only be used in browser environment');
  }
  
  if (!peraWallet) {
    peraWallet = new PeraWalletConnect({
      chainId: 416002, // TestNet (416001 = MainNet, 416002 = TestNet, 416003 = BetaNet)
    });
  }
  return peraWallet;
}

export function usePeraWallet() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize and check for existing session
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      return;
    }

    const wallet = getPeraWallet();

    // Check for existing session
    wallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setAccounts(accounts);
          setIsConnected(true);
        }
      })
      .catch((error) => {
        console.error('Failed to reconnect session:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen for disconnect events
    wallet.connector?.on('disconnect', () => {
      setAccounts([]);
      setIsConnected(false);
    });

    return () => {
      // Cleanup listener
      wallet.connector?.off('disconnect');
    };
  }, [mounted]);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') {
      throw new Error('Connect can only be called in browser environment');
    }
    
    try {
      setIsLoading(true);
      const wallet = getPeraWallet();
      const newAccounts = await wallet.connect();
      
      setAccounts(newAccounts);
      setIsConnected(true);
      
      // Listen for account changes
      wallet.connector?.on('disconnect', () => {
        setAccounts([]);
        setIsConnected(false);
      });

      return newAccounts;
    } catch (error) {
      console.error('Failed to connect to Pera Wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const wallet = getPeraWallet();
      await wallet.disconnect();
      setAccounts([]);
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from Pera Wallet:', error);
      throw error;
    }
  }, []);

  const signTransaction = useCallback(
    async (txnGroup: any[], signerAddress?: string) => {
      if (typeof window === 'undefined') {
        throw new Error('Sign transaction can only be called in browser environment');
      }
      
      try {
        const wallet = getPeraWallet();
        const signer = signerAddress || accounts[0];
        
        if (!signer) {
          throw new Error('No account connected');
        }

        const signedTxns = await wallet.signTransaction([txnGroup]);
        return signedTxns;
      } catch (error) {
        console.error('Failed to sign transaction:', error);
        throw error;
      }
    },
    [accounts]
  );

  // Safe getter for peraWallet that doesn't throw during SSR
  const getWalletInstance = useCallback(() => {
    if (typeof window === 'undefined' || !mounted) {
      return null;
    }
    try {
      return getPeraWallet();
    } catch {
      return null;
    }
  }, [mounted]);

  return {
    peraWallet: getWalletInstance() as any,
    accounts,
    activeAccount: accounts[0] || null,
    isConnected,
    isLoading,
    connect,
    disconnect,
    signTransaction,
  };
}
