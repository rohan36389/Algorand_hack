'use client';

/**
 * Hook to fetch real-time cryptocurrency prices from CoinGecko
 */

import { useState, useEffect } from 'react';
import { PriceData } from '@/types/market';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export function usePriceFeed(symbols: string[] = ['bitcoin', 'ethereum', 'algorand']) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const ids = symbols.join(',');
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Silently fail for rate limiting or API issues
        console.warn('CoinGecko API unavailable, using fallback data');
        setError(null); // Don't show error to user
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      const priceData: Record<string, PriceData> = {};
      for (const symbol of symbols) {
        if (data[symbol]) {
          priceData[symbol] = {
            symbol: symbol.toUpperCase(),
            price: data[symbol].usd,
            change24h: data[symbol].usd_24h_change || 0,
            lastUpdate: Date.now(),
          };
        }
      }

      setPrices(priceData);
      setError(null);
    } catch (err) {
      // Silently fail - price feed is not critical
      console.warn('Price feed unavailable:', err);
      setError(null); // Don't show error to user
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Update every 30 seconds
    const interval = setInterval(fetchPrices, 30_000);

    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return {
    prices,
    isLoading,
    error,
    refetch: fetchPrices,
  };
}
