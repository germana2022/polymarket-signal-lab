import { PaperTradingRepository } from '../modules/paperTrading/paperTradingRepository.js';
import { SignalRepository } from '../modules/signals/signalRepository.js';
import { MarketRepository } from '../modules/markets/marketRepository.js';

export class UpdatePaperTradesJob {
  private paper = new PaperTradingRepository();
  private signals = new SignalRepository();
  private markets = new MarketRepository();

  async run() {
    const openTrades = await this.paper.openTradesWithSignals();
    const closedBySell: number[] = [];

    for (const trade of openTrades as any[]) {
      const signal = await this.signals.getById(Number(trade.signal_id));
      if (!signal || signal.status !== 'SELL_WATCH') continue;

      const snapshot: any = await this.markets.getLatestSnapshot(signal.market_id, signal.side);
      if (!snapshot) continue;

      await this.paper.close(Number(signal.id), Number(snapshot.price));
      await this.signals.updateStatus(Number(signal.id), 'PAPER_CLOSED', undefined, 'Paper trade auto-closed by worker.');
      closedBySell.push(Number(signal.id));
    }

    return { closedPaperTrades: closedBySell.length };
  }
}

