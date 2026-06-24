import { IngestionJob } from './ingestionJob.js';

export class CalculateWalletScoresJob {
  async run() {
    return new IngestionJob().calculateWalletScores();
  }
}

