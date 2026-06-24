import { TelegramService } from '../modules/alerts/telegramService.js';
import { formatSignalAlert } from '../modules/alerts/alertFormatter.js';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';

export class SendTelegramAlertsJob {
  private telegram = new TelegramService();

  async run() {
    if (!env.TELEGRAM_ENABLED) return { alertsSent: 0, reason: 'TELEGRAM_ENABLED=false' };
    const nowIso = new Date().toISOString();
    const alertWindowSeconds = Math.max(30, env.WORKER_SEND_TELEGRAM_ALERTS_INTERVAL_SECONDS * 2);
    const rows = await query<any>(
      `SELECT s.*, m.title, r.stop_loss, r.take_profit_1, r.take_profit_2
       FROM signals s
       JOIN markets m ON m.id = s.market_id
       LEFT JOIN signal_exit_rules r ON r.signal_id = s.id
       WHERE (s.created_at >= NOW() - ($1 || ' seconds')::interval AND s.action IN ('BUY_WATCH','STRONG_BUY_WATCH','WATCH'))
          OR (s.updated_at >= NOW() - ($1 || ' seconds')::interval AND s.status = 'SELL_WATCH')
       ORDER BY s.created_at DESC`,
      [alertWindowSeconds],
    );

    if (!rows.length) return { alertsSent: 0 };

    let alertsSent = 0;
    for (const signal of rows) {
      await this.telegram.send(formatSignalAlert(signal));
      alertsSent += 1;
    }

    return { alertsSent, checkedAt: nowIso };
  }
}
