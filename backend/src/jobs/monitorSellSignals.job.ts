import { SellDecisionEngine } from '../modules/signals/sellDecisionEngine.js';

export class MonitorSellSignalsJob {
  async run() {
    return new SellDecisionEngine().monitorOpenSignals();
  }
}

