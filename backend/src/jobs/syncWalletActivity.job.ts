import { IngestionJob } from './ingestionJob.js';

export class SyncWalletActivityJob {
  async run() {
    return new IngestionJob().syncWalletActivity();
  }
}

