/**
 * TypeScript interfaces for Market data structures
 */

export interface Market {
  id: number;
  title: string;
  outcomes: string[];
  numOutcomes: number;
  endTimestamp: number;
  winningIndex: number; // 255 = unsettled
  isCancelled: boolean;
  pools: number[]; // microAlgos in each outcome pool
  totalPool: number; // total microAlgos
  creator: string;
}

export interface UserBet {
  marketId: number;
  optionIndex: number;
  amount: number; // microAlgos
  claimed: boolean;
}

export interface TxResult {
  txId: string;
  confirmedRound?: number;
}

export interface OracleRound {
  marketId: number;
  nonce: number;
  attestCount: number;
  winningIndex: number;
  finalised: boolean;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: number;
}

export type MarketStatus = 'active' | 'settled' | 'cancelled' | 'expired';

export function getMarketStatus(market: Market): MarketStatus {
  if (market.isCancelled) return 'cancelled';
  if (market.winningIndex !== 255) return 'settled';
  
  const now = Math.floor(Date.now() / 1000);
  if (now >= market.endTimestamp) return 'expired';
  
  return 'active';
}

export function calculateOdds(pools: number[], totalPool: number): number[] {
  if (totalPool === 0) {
    return pools.map(() => 0);
  }
  
  return pools.map(pool => {
    if (pool === 0) return 0;
    return totalPool / pool;
  });
}

export function calculatePayout(
  betAmount: number,
  winningPool: number,
  totalPool: number,
  feeBps: number = 200 // 2%
): number {
  if (winningPool === 0) return 0;
  
  const netPool = totalPool - Math.floor((totalPool * feeBps) / 10_000);
  return Math.floor((betAmount * netPool) / winningPool);
}
