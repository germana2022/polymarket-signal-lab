import { env } from './config/env.js';
import { IngestionJob } from './jobs/ingestionJob.js';
import { BuyDecisionEngine } from './modules/signals/buyDecisionEngine.js';
import { SellDecisionEngine } from './modules/signals/sellDecisionEngine.js';

async function runOnce() {
  const ingestion = await new IngestionJob().run();
  const createdSignalIds = await new BuyDecisionEngine().generateSignals();
  const sellAlertIds = await new SellDecisionEngine().monitorOpenSignals();
  console.log(JSON.stringify({ time: new Date().toISOString(), ingestion, createdSignalIds, sellAlertIds }));
}

if (!env.WORKER_ENABLED) {
  console.log('Worker disabled by WORKER_ENABLED=false');
  process.exit(0);
}

await runOnce().catch((error) => console.error('Worker first run failed:', error));
setInterval(() => {
  runOnce().catch((error) => console.error('Worker run failed:', error));
}, env.WORKER_INTERVAL_SECONDS * 1000);
