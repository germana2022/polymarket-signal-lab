import { BuyDecisionEngine } from '../modules/signals/buyDecisionEngine.js';

export class GenerateBuySignalsJob {
  async run() {
    return new BuyDecisionEngine().generateSignals();
  }
}

