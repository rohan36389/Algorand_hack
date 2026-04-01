'use client';

/**
 * Hook to fetch and poll all markets
 * Polls every 15 seconds
 */

import { useState, useEffect } from 'react';
import { algorandService } from '@/lib/algorand';
import { Market } from '@/types/market';

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    try {
      const data = await algorandService.getAllMarkets();
      setMarkets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to fetch markets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();

    // Poll every 15 seconds
    const interval = setInterval(fetchMarkets, 15_000);

    return () => clearInterval(interval);
  }, []);

  return {
    markets,
    isLoading,
    error,
    refetch: fetchMarkets,
  };
}
