import { env } from './config/env.js';
import { SyncMarketsJob } from './jobs/syncMarkets.job.js';
import { SyncMarketPricesJob } from './jobs/syncMarketPrices.job.js';
import { SyncWalletActivityJob } from './jobs/syncWalletActivity.job.js';
import { CalculateWalletScoresJob } from './jobs/calculateWalletScores.job.js';
import { GenerateBuySignalsJob } from './jobs/generateBuySignals.job.js';
import { MonitorSellSignalsJob } from './jobs/monitorSellSignals.job.js';
import { UpdatePaperTradesJob } from './jobs/updatePaperTrades.job.js';
import { SendTelegramAlertsJob } from './jobs/sendTelegramAlerts.job.js';

type ScheduledJob = {
  name: string;
  intervalSeconds: number;
  run: () => Promise<unknown>;
};

function withRecovery(job: ScheduledJob) {
  let inFlight = false;

  return async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const result = await job.run();
      console.log(JSON.stringify({ time: new Date().toISOString(), job: job.name, result }));
    } catch (error) {
      console.error(`${job.name} failed:`, error);
    } finally {
      inFlight = false;
    }
  };
}

function scheduleJob(job: ScheduledJob) {
  const safeRun = withRecovery(job);
  void safeRun();
  setInterval(safeRun, job.intervalSeconds * 1000);
}

if (!env.WORKER_ENABLED) {
  console.log('Worker disabled by WORKER_ENABLED=false');
  process.exit(0);
}

scheduleJob({ name: 'syncMarkets', intervalSeconds: env.WORKER_SYNC_MARKETS_INTERVAL_SECONDS, run: () => new SyncMarketsJob().run() });
scheduleJob({ name: 'syncMarketPrices', intervalSeconds: env.WORKER_SYNC_PRICES_INTERVAL_SECONDS, run: () => new SyncMarketPricesJob().run() });
scheduleJob({ name: 'syncWalletActivity', intervalSeconds: env.WORKER_SYNC_WALLETS_INTERVAL_SECONDS, run: () => new SyncWalletActivityJob().run() });
scheduleJob({ name: 'calculateWalletScores', intervalSeconds: env.WORKER_CALC_WALLET_SCORES_INTERVAL_SECONDS, run: () => new CalculateWalletScoresJob().run() });
scheduleJob({ name: 'generateBuySignals', intervalSeconds: env.WORKER_GENERATE_BUY_SIGNALS_INTERVAL_SECONDS, run: () => new GenerateBuySignalsJob().run() });
scheduleJob({ name: 'monitorSellSignals', intervalSeconds: env.WORKER_MONITOR_SELL_SIGNALS_INTERVAL_SECONDS, run: () => new MonitorSellSignalsJob().run() });
scheduleJob({ name: 'updatePaperTrades', intervalSeconds: env.WORKER_UPDATE_PAPER_TRADES_INTERVAL_SECONDS, run: () => new UpdatePaperTradesJob().run() });
scheduleJob({ name: 'sendTelegramAlerts', intervalSeconds: env.WORKER_SEND_TELEGRAM_ALERTS_INTERVAL_SECONDS, run: () => new SendTelegramAlertsJob().run() });

