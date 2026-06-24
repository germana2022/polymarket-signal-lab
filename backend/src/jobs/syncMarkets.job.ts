import { IngestionJob } from './ingestionJob.js';

export class SyncMarketsJob {
  async run() {
    return new IngestionJob().syncMarkets();
  }
}

