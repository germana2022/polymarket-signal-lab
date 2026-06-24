import { query } from '../../db/pool.js';
import { strategyConfig } from '../../config/strategy.js';

export class SignalRepository {
  async createSignal(input: {
    marketId: string;
    side: string;
    action: string;
    currentPrice: number;
    marketScore: number;
    whaleScore: number;
    executionScore: number;
    entrySpread: number;
    isLateSignal: boolean;
    entryDelayMs: number;
    dataConfidence: string;
    confidence: string;
    reason: string;
    status: string;
  }) {
    const rows = await query<{ id: string }>(
      `INSERT INTO signals
       (market_id, side, action, current_price, market_score, whale_score, execution_score, entry_spread, is_late_signal, entry_delay_ms, data_confidence, confidence, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        input.marketId,
        input.side,
        input.action,
        input.currentPrice,
        input.marketScore,
        input.whaleScore,
        input.executionScore,
        input.entrySpread,
        input.isLateSignal,
        input.entryDelayMs,
        input.dataConfidence,
        input.confidence,
        input.reason,
        input.status,
      ],
    );
    const signalId = Number(rows[0].id);
    await this.createExitRules(signalId, input.currentPrice);
    return signalId;
  }

  async createExitRules(signalId: number, entryPrice: number) {
    const rules = strategyConfig.sellRules;
    await query(
      `INSERT INTO signal_exit_rules
       (signal_id, entry_price, stop_loss, take_profit_1, take_profit_2, max_hold_hours, exit_if_market_score_below, exit_if_spread_above, exit_if_whales_sell, close_near_resolution_if_risk_unknown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        signalId,
        entryPrice,
        entryPrice * (1 - rules.stopLossPct),
        entryPrice * (1 + rules.takeProfit1Pct),
        entryPrice * (1 + rules.takeProfit2Pct),
        rules.maxHoldHours,
        rules.exitIfMarketScoreBelow,
        rules.exitIfSpreadAbove,
        rules.exitIfWhalesReducing,
        rules.closeNearResolutionIfRiskUnknown,
      ],
    );
  }

  async latest(limit = 50) {
    return query(
      `SELECT s.*, m.title, m.category, r.stop_loss, r.take_profit_1, r.take_profit_2, r.max_hold_hours, r.exit_if_market_score_below, r.exit_if_spread_above, r.close_near_resolution_if_risk_unknown
       FROM signals s
       JOIN markets m ON m.id = s.market_id
       LEFT JOIN signal_exit_rules r ON r.signal_id = s.id
       ORDER BY s.created_at DESC
       LIMIT $1`,
      [limit],
    );
  }

  async openSignals() {
    return query(
      `SELECT s.*, m.title, r.stop_loss, r.take_profit_1, r.take_profit_2, r.max_hold_hours, r.exit_if_market_score_below, r.exit_if_spread_above, r.close_near_resolution_if_risk_unknown
       FROM signals s
       JOIN markets m ON m.id = s.market_id
       LEFT JOIN signal_exit_rules r ON r.signal_id = s.id
       WHERE s.status IN ('DETECTED','WATCHING','BUY_WATCH','PAPER_OPEN','HOLD')
       ORDER BY s.created_at DESC`,
    );
  }

  async getById(id: number) {
    const rows = await query(
      `SELECT s.*, m.title, r.stop_loss, r.take_profit_1, r.take_profit_2, r.max_hold_hours, r.exit_if_market_score_below, r.exit_if_spread_above, r.close_near_resolution_if_risk_unknown
       FROM signals s
       JOIN markets m ON m.id = s.market_id
       LEFT JOIN signal_exit_rules r ON r.signal_id = s.id
       WHERE s.id=$1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async updateStatus(signalId: number, status: string, action?: string, reasonSuffix?: string) {
    await query(
      `UPDATE signals
       SET status=$2,
           action=COALESCE($3, action),
           reason=CASE WHEN $4::text IS NULL THEN reason ELSE reason || ' | ' || $4 END,
           updated_at=NOW()
       WHERE id=$1`,
      [signalId, status, action ?? null, reasonSuffix ?? null],
    );
  }
}
