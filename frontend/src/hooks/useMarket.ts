'use client';

/**
 * Hook to fetch and poll a single market
 * Polls every 10 seconds
 */

import { useState, useEffect } from 'react';
import { algorandService } from '@/lib/algorand';
import { Market } from '@/types/market';

export function useMarket(marketId: number) {
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = async () => {
    try {
      const data = await algorandService.getMarket(marketId);
      setMarket(data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching market ${marketId}:`, err);
      setError('Failed to fetch market');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!marketId) return;

    fetchMarket();

    // Poll every 10 seconds
    const interval = setInterval(fetchMarket, 10_000);

    return () => clearInterval(interval);
  }, [marketId]);

  return {
    market,
    isLoading,
    error,
    refetch: fetchMarket,
  };
}
