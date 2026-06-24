import WebSocket from 'ws';
import { env } from '../../config/env.js';
import type { MarketSnapshot, Side } from '../../types/domain.js';

const cacheKey = (marketId: string, outcome: Side) => `${marketId}:${outcome}`;

export class PolymarketWebSocketClient {
  private static shared?: PolymarketWebSocketClient;
  private ws?: WebSocket;
  private cache = new Map<string, MarketSnapshot>();
  private isConnecting = false;
  private connected = false;

  static get sharedInstance() {
    if (!this.shared) this.shared = new PolymarketWebSocketClient();
    return this.shared;
  }

  getSnapshots(marketIds: string[], outcome: Side = 'YES'): MarketSnapshot[] {
    return marketIds
      .map((id) => this.cache.get(cacheKey(id, outcome)))
      .filter((snapshot): snapshot is MarketSnapshot => Boolean(snapshot));
  }

  async start() {
    if (!env.POLYMARKET_WEBSOCKET_ENABLED || this.connected || this.isConnecting) return;
    this.isConnecting = true;

    return new Promise<void>((resolve) => {
      const ws = new WebSocket(env.POLYMARKET_WEBSOCKET_URL);
      this.ws = ws;

      ws.on('open', () => {
        this.connected = true;
        this.isConnecting = false;
        try {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              channels: ['market_snapshot'],
            }),
          );
        } catch (_error) {
          // Ignore websocket publish errors in live mode; data collection can continue via REST fallback.
        }
        resolve();
      });

      ws.on('message', (data) => {
        this.ingestMessage(data);
      });

      ws.on('close', () => {
        this.connected = false;
        this.isConnecting = false;
      });

      ws.on('error', () => {
        this.connected = false;
        this.isConnecting = false;
        resolve();
      });

    });
  }

  private ingestMessage(data: WebSocket.RawData) {
    try {
      const raw = JSON.parse(data.toString());
      const updates: any[] = Array.isArray(raw) ? raw : raw?.data ? [raw.data] : raw?.updates ?? [];
      for (const item of updates) {
        const marketId = String(item.marketId ?? item.market_id ?? item.conditionId ?? item.market_slug ?? '');
        if (!marketId) continue;
        const outcome = String(item.outcome ?? item.side ?? 'YES').toUpperCase() === 'NO' ? 'NO' : 'YES';
        const bestBid = Number(item.bestBid ?? item.best_bid ?? item.bids?.[0]?.price ?? 0);
        const bestAsk = Number(item.bestAsk ?? item.best_ask ?? item.asks?.[0]?.price ?? 0);
        const spread = Number(item.spread ?? (bestAsk - bestBid));
        const snapshot: MarketSnapshot = {
          marketId,
          outcome,
          price: Number(item.price ?? item.midpoint ?? (bestBid + bestAsk) / 2 ?? 0),
          bestBid,
          bestAsk,
          spread: Number.isFinite(spread) ? spread : 0,
          volume: Number(item.volume ?? 0),
          liquidity: Number(item.liquidity ?? item.bookSize ?? 0),
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        };
        this.cache.set(cacheKey(marketId, outcome), snapshot);
      }
    } catch (_error) {
      return;
    }
  }
}
