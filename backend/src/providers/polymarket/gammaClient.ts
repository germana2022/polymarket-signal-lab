import { env } from '../../config/env.js';
import type { Market } from '../../types/domain.js';

export class GammaClient {
  constructor(private readonly baseUrl = env.POLYMARKET_GAMMA_BASE_URL) {}

  async getMarkets(): Promise<Market[]> {
    // Polymarket Gamma schemas can evolve. This adapter intentionally normalizes defensively.
    const url = `${this.baseUrl}/markets?active=true&closed=false&limit=50`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Gamma getMarkets failed: ${response.status}`);
    const data: any = await response.json();
    const items = Array.isArray(data) ? data : data.markets ?? data.data ?? [];

    return items.map((item: any) => ({
      id: String(item.id ?? item.conditionId ?? item.slug),
      title: String(item.question ?? item.title ?? item.slug ?? 'Untitled market'),
      slug: item.slug,
      category: item.category ?? item.tags?.[0]?.label,
      endDate: item.endDate ?? item.end_date ?? null,
      active: Boolean(item.active ?? true),
      enableOrderBook: Boolean(item.enableOrderBook ?? item.enable_order_book ?? true),
      volume: Number(item.volume ?? item.volume24hr ?? item.volume24h ?? 0),
      liquidity: Number(item.liquidity ?? item.liquidityNum ?? 0),
      openInterest: Number(item.openInterest ?? item.open_interest ?? 0),
    }));
  }
}
