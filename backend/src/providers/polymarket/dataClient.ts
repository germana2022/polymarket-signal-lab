import { env } from '../../config/env.js';
import type { Wallet, WalletTrade } from '../../types/domain.js';

export class PolymarketDataClient {
  constructor(private readonly baseUrl = env.POLYMARKET_DATA_BASE_URL) {}

  async getTopWallets(): Promise<Wallet[]> {
    // Defensive placeholder for Data API leaderboards. Different deployments may expose different paths.
    // Keep normalized output stable for the rest of the app.
    const url = `${this.baseUrl}/leaderboard?limit=50`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Data API leaderboard unavailable: ${response.status}`);
      return [];
    }
    const data: any = await response.json();
    const items = Array.isArray(data) ? data : data.data ?? data.leaderboard ?? [];
    return items.map((item: any) => ({
      address: String(item.address ?? item.user ?? item.proxyWallet),
      totalProfit: Number(item.profit ?? item.totalProfit ?? item.pnl ?? 0),
      roi: Number(item.roi ?? 0),
      winRate: Number(item.winRate ?? item.win_rate ?? 0),
      marketsTraded: Number(item.marketsTraded ?? item.markets_traded ?? 0),
      avgPositionSize: Number(item.avgPositionSize ?? item.avg_position_size ?? 0),
      walletScore: Number(item.walletScore ?? item.score ?? 0),
    }));
  }

  async getRecentTrades(): Promise<WalletTrade[]> {
    const url = `${this.baseUrl}/trades?limit=100`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Data API trades unavailable: ${response.status}`);
      return [];
    }
    const data: any = await response.json();
    const items = Array.isArray(data) ? data : data.data ?? data.trades ?? [];
    return items
      .filter((item: any) => item.user || item.address || item.proxyWallet)
      .map((item: any) => ({
        walletAddress: String(item.user ?? item.address ?? item.proxyWallet),
        marketId: String(item.market ?? item.marketId ?? item.conditionId),
        outcome: String(item.outcome ?? item.sideOutcome ?? 'YES').toUpperCase() === 'NO' ? 'NO' : 'YES',
        side: String(item.side ?? item.action ?? 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
        price: Number(item.price ?? 0),
        size: Number(item.size ?? item.amount ?? 0),
        notionalValue: Number(item.notionalValue ?? item.usdcSize ?? item.sizeUsd ?? 0),
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      }));
  }
}
