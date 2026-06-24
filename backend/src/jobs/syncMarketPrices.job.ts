import { IngestionJob } from './ingestionJob.js';

export class SyncMarketPricesJob {
  async run() {
    return new IngestionJob().syncMarketPrices();
  }
}

