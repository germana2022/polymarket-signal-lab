import { env } from '../../config/env.js';
import type { MarketSnapshot, Side } from '../../types/domain.js';

export class ClobClient {
  constructor(private readonly baseUrl = env.POLYMARKET_CLOB_BASE_URL) {}

  async getMarketSnapshot(marketId: string, outcome: Side = 'YES'): Promise<MarketSnapshot> {
    // Placeholder adapter. Real asset/token IDs must be mapped from Gamma market data.
    // For Fase 1, this adapter returns a conservative empty snapshot when token mapping is not configured.
    return {
      marketId,
      outcome,
      price: 0,
      bestBid: 0,
      bestAsk: 0,
      spread: 1,
      volume: 0,
      liquidity: 0,
    };
  }
}
