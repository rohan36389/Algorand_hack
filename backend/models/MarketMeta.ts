// Hackathon fast in-memory DB mock to prevent MongoDB installation failures
export interface IComment {
  userAddress: string;
  content: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  createdAt: Date;
}

export interface IMarketMeta {
  marketId: number;
  category: string;
  tags: string[];
  aiConfidenceLabel?: string;
  aiProbabilityYes?: number;
  comments: IComment[];
  save: () => Promise<void>;
}

const mockDb = new Map<number, IMarketMeta>();

export const MarketMeta = {
  findOne: async (query: { marketId: number }) => {
    return mockDb.get(query.marketId) || null;
  },
  create: async (data: any) => {
    const defaultMeta: IMarketMeta = {
      marketId: data.marketId,
      category: data.category || 'General',
      tags: data.tags || [],
      aiConfidenceLabel: data.aiConfidenceLabel,
      aiProbabilityYes: data.aiProbabilityYes,
      comments: data.comments || [],
      save: async function() {
        mockDb.set(this.marketId, this);
      }
    };
    mockDb.set(defaultMeta.marketId, defaultMeta);
    return defaultMeta;
  }
};
