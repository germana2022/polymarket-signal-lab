import { query } from '../../db/pool.js';
import type { Wallet, WalletTrade } from '../../types/domain.js';

export class WalletRepository {
  async upsertWallets(wallets: Wallet[]) {
    for (const w of wallets) {
      await query(
        `INSERT INTO wallets (address, total_profit, roi, win_rate, markets_traded, avg_position_size, wallet_score, first_seen_at, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
         ON CONFLICT (address) DO UPDATE SET
           total_profit = EXCLUDED.total_profit,
           roi = EXCLUDED.roi,
           win_rate = EXCLUDED.win_rate,
           markets_traded = EXCLUDED.markets_traded,
           avg_position_size = EXCLUDED.avg_position_size,
           wallet_score = EXCLUDED.wallet_score,
           last_seen_at = NOW()`,
        [w.address, w.totalProfit, w.roi, w.winRate, w.marketsTraded, w.avgPositionSize, w.walletScore],
      );
    }
  }

  async insertTrades(trades: WalletTrade[]) {
    for (const t of trades) {
      await query(
        `INSERT INTO wallet_trades (wallet_address, market_id, outcome, side, price, size, notional_value, timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,NOW()))`,
        [t.walletAddress, t.marketId, t.outcome, t.side, t.price, t.size, t.notionalValue, t.timestamp ?? null],
      );
    }
  }

  async getTopWallets() {
    return query('SELECT * FROM wallets ORDER BY wallet_score DESC, total_profit DESC LIMIT 100');
  }

  async getWallet(address: string) {
    const rows = await query('SELECT * FROM wallets WHERE address = $1', [address]);
    return rows[0] ?? null;
  }

  async getConfirmingTrades(marketId: string, outcome = 'YES') {
    return query(
      `SELECT wt.*, w.wallet_score, w.roi, w.win_rate, w.total_profit
       FROM wallet_trades wt
       JOIN wallets w ON w.address = wt.wallet_address
       WHERE wt.market_id = $1 AND wt.outcome = $2 AND wt.side = 'BUY'
       ORDER BY wt.timestamp DESC
       LIMIT 50`,
      [marketId, outcome],
    );
  }

  async getRecentTradesForMarket(marketId: string, outcome = 'YES') {
    return query(
      `SELECT wt.*, w.wallet_score, w.roi, w.win_rate, w.total_profit
       FROM wallet_trades wt
       JOIN wallets w ON w.address = wt.wallet_address
       WHERE wt.market_id = $1 AND wt.outcome = $2
       ORDER BY wt.timestamp DESC
       LIMIT 100`,
      [marketId, outcome],
    );
  }

}
