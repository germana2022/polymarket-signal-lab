import { env } from '../config/env.js';
import { GammaClient } from './polymarket/gammaClient.js';
import { PolymarketDataClient } from './polymarket/dataClient.js';
import { PolymarketWebSocketClient } from './polymarket/websocketClient.js';
import { mockMarkets, mockSnapshots, mockTrades, mockWallets } from './mock/mockData.js';
import type { Market, MarketSnapshot, Wallet, WalletTrade } from '../types/domain.js';

export interface DataProvider {
  getMarkets(): Promise<Market[]>;
  getMarketSnapshots(markets: Market[]): Promise<MarketSnapshot[]>;
  getTopWallets(): Promise<Wallet[]>;
  getRecentTrades(): Promise<WalletTrade[]>;
}

class MockDataProvider implements DataProvider {
  async getMarkets() { return mockMarkets; }
  async getMarketSnapshots() { return mockSnapshots; }
  async getTopWallets() { return mockWallets; }
  async getRecentTrades() { return mockTrades; }
}

class LiveDataProvider implements DataProvider {
  private gamma = new GammaClient();
  private data = new PolymarketDataClient();
  private websocket = PolymarketWebSocketClient.sharedInstance;

  async getMarkets() { return this.gamma.getMarkets(); }

  async getMarketSnapshots(markets: Market[]) {
    await this.websocket.start();
    const ids = markets.map((m) => m.id);
    const liveSnapshots = this.websocket.getSnapshots(ids, 'YES');
    const liveById = new Map(liveSnapshots.map((snapshot) => [snapshot.marketId, snapshot]));

    // Fase 1 live adapter: snapshots require outcome token mapping. Return market-level synthetic snapshots
    // from normalized market data until token mapping is implemented.
    return markets.map((m) => {
      const cached = liveById.get(m.id);
      if (cached) return cached;
      return {
        marketId: m.id,
        outcome: 'YES' as const,
        price: 0.5,
        bestBid: 0.49,
        bestAsk: 0.51,
        spread: 0.02,
        volume: m.volume,
        liquidity: m.liquidity,
      };
    });
  }

  async getTopWallets() { return this.data.getTopWallets(); }
  async getRecentTrades() { return this.data.getRecentTrades(); }
}

export function createDataProvider(): DataProvider {
  return env.DATA_MODE === 'live' ? new LiveDataProvider() : new MockDataProvider();
}
