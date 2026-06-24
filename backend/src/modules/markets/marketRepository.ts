import { query } from '../../db/pool.js';
import type { Market, MarketSnapshot } from '../../types/domain.js';

export class MarketRepository {
  async upsertMarkets(markets: Market[]) {
    for (const m of markets) {
      await query(
        `INSERT INTO markets (id, title, slug, category, end_date, active, enable_order_book, volume, liquidity, open_interest, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           slug = EXCLUDED.slug,
           category = EXCLUDED.category,
           end_date = EXCLUDED.end_date,
           active = EXCLUDED.active,
           enable_order_book = EXCLUDED.enable_order_book,
           volume = EXCLUDED.volume,
           liquidity = EXCLUDED.liquidity,
           open_interest = EXCLUDED.open_interest,
           updated_at = NOW()`,
        [m.id, m.title, m.slug ?? null, m.category ?? null, m.endDate ?? null, m.active, m.enableOrderBook, m.volume, m.liquidity, m.openInterest],
      );
    }
  }

  async insertSnapshots(snapshots: MarketSnapshot[]) {
    for (const s of snapshots) {
      await query(
        `INSERT INTO market_snapshots (market_id, outcome, price, best_bid, best_ask, spread, volume, liquidity, timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW()))`,
        [s.marketId, s.outcome, s.price, s.bestBid, s.bestAsk, s.spread, s.volume, s.liquidity, s.timestamp ?? null],
      );
    }
  }

  async getHotMarkets() {
    return query(
      `SELECT m.*, latest.price, latest.spread, latest.best_bid, latest.best_ask,
              LEAST(100,
                (CASE WHEN m.volume >= 50000 THEN 30 ELSE (m.volume / 50000.0) * 30 END) +
                (CASE WHEN m.liquidity >= 25000 THEN 30 ELSE (m.liquidity / 25000.0) * 30 END) +
                (CASE WHEN latest.spread <= 0.03 THEN 25 ELSE GREATEST(0, 25 - latest.spread * 300) END) +
                (CASE WHEN m.enable_order_book AND m.active THEN 15 ELSE 0 END)
              ) AS market_score
       FROM markets m
       LEFT JOIN LATERAL (
         SELECT * FROM market_snapshots ms WHERE ms.market_id = m.id ORDER BY ms.timestamp DESC LIMIT 1
       ) latest ON true
       WHERE m.active = true
       ORDER BY market_score DESC NULLS LAST, m.volume DESC
       LIMIT 50`,
    );
  }

  async getById(id: string) {
    const rows = await query('SELECT * FROM markets WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async getLatestSnapshot(marketId: string, outcome = 'YES') {
    const rows = await query(
      `SELECT * FROM market_snapshots WHERE market_id=$1 AND outcome=$2 ORDER BY timestamp DESC LIMIT 1`,
      [marketId, outcome],
    );
    return rows[0] ?? null;
  }
}
