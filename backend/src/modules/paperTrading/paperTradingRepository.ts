import { query } from '../../db/pool.js';
import { strategyConfig } from '../../config/strategy.js';

export class PaperTradingRepository {
  async open(signalId: number, entryPrice: number, sizeUsd = strategyConfig.paperTrading.defaultSizeUsd) {
    const existing = await query('SELECT id FROM paper_trades WHERE signal_id=$1 AND status=$2', [signalId, 'OPEN']);
    if (existing.length > 0) return Number(existing[0].id);
    const rows = await query<{ id: string }>(
      `INSERT INTO paper_trades (signal_id, entry_price, size_usd, status, opened_at)
       VALUES ($1,$2,$3,'OPEN',NOW()) RETURNING id`,
      [signalId, entryPrice, sizeUsd],
    );
    return Number(rows[0].id);
  }

  async close(signalId: number, exitPrice: number) {
    const rows: any[] = await query('SELECT * FROM paper_trades WHERE signal_id=$1 AND status=$2 ORDER BY opened_at DESC LIMIT 1', [signalId, 'OPEN']);
    if (!rows[0]) return null;
    const trade = rows[0];
    const entryPrice = Number(trade.entry_price);
    const sizeUsd = Number(trade.size_usd);
    const shares = entryPrice > 0 ? sizeUsd / entryPrice : 0;
    const exitValue = shares * exitPrice;
    const pnl = exitValue - sizeUsd;
    const roi = sizeUsd > 0 ? pnl / sizeUsd : 0;
    await query(
      `UPDATE paper_trades SET exit_price=$2, pnl=$3, roi=$4, status='CLOSED', closed_at=NOW() WHERE id=$1`,
      [trade.id, exitPrice, pnl, roi],
    );
    return { pnl, roi };
  }

  async performance() {
    const rows = await query(
      `WITH closed AS (
         SELECT id, opened_at, COALESCE(pnl,0)::float8 AS pnl, COALESCE(roi,0)::float8 AS roi
         FROM paper_trades
         WHERE status='CLOSED'
       ),
       equity AS (
         SELECT
           id,
           opened_at,
           pnl,
           SUM(pnl) OVER (ORDER BY opened_at, id ROWS UNBOUNDED PRECEDING) AS cumulative_pnl
         FROM closed
       ),
       equity_peak AS (
         SELECT
           opened_at,
           cumulative_pnl,
           MAX(cumulative_pnl) OVER (ORDER BY opened_at, id ROWS UNBOUNDED PRECEDING) AS running_peak
         FROM equity
       )
       SELECT
         COUNT(*)::int AS total_trades,
         COUNT(*) FILTER (WHERE pt.status='CLOSED')::int AS closed_trades,
         COUNT(*) FILTER (WHERE pt.status='OPEN')::int AS open_trades,
         COALESCE(SUM(pt.pnl) FILTER (WHERE pt.status='CLOSED'),0)::float AS total_pnl,
         COALESCE(AVG(pt.roi) FILTER (WHERE pt.status='CLOSED'),0)::float AS avg_roi,
         COALESCE(AVG(pt.pnl) FILTER (WHERE pt.status='CLOSED'),0)::float AS expectancy,
         COALESCE(
           SUM(CASE WHEN pt.pnl > 0 THEN pt.pnl ELSE 0 END) FILTER (WHERE pt.status='CLOSED'),
           0
         ) / NULLIF(ABS(SUM(CASE WHEN pt.pnl < 0 THEN pt.pnl ELSE 0 END) FILTER (WHERE pt.status='CLOSED')), 0)::float AS profit_factor,
         COALESCE((SELECT MAX(running_peak - cumulative_pnl) FROM equity_peak), 0)::float AS max_drawdown,
         COALESCE(AVG(CASE WHEN pt.pnl > 0 THEN 1 ELSE 0 END) FILTER (WHERE pt.status='CLOSED'),0)::float AS win_rate,
         COALESCE(AVG(ms.spread),0)::float AS avg_spread,
         COALESCE(AVG(CASE WHEN s.is_late_signal THEN 1 ELSE 0 END),0)::float AS late_signal_ratio,
         COALESCE(AVG(COALESCE(s.entry_delay_ms, 0)::float),0)::float AS avg_entry_delay_ms,
         COUNT(DISTINCT s.id)::int AS total_signals
       FROM paper_trades pt
       LEFT JOIN signals s ON s.id = pt.signal_id
       LEFT JOIN LATERAL (
         SELECT spread FROM market_snapshots ms
           WHERE ms.market_id = s.market_id
           ORDER BY ms.timestamp DESC
           LIMIT 1
       ) ms ON TRUE`,
    );
    return rows[0];
  }

  async openTradesWithSignals() {
    return query(
      `SELECT pt.id AS paper_trade_id, pt.signal_id, pt.entry_price, s.market_id, s.side, s.status AS signal_status
       FROM paper_trades pt
       JOIN signals s ON s.id = pt.signal_id
       WHERE pt.status='OPEN'`,
    );
  }
}
