import { MarketRepository } from '../markets/marketRepository.js';
import { WalletRepository } from '../wallets/walletRepository.js';
import { SignalRepository } from './signalRepository.js';

export class SellDecisionEngine {
  constructor(
    private readonly markets = new MarketRepository(),
    private readonly wallets = new WalletRepository(),
    private readonly signals = new SignalRepository(),
  ) {}

  async monitorOpenSignals() {
    const open: any[] = await this.signals.openSignals();
    const sellAlerts: number[] = [];

    for (const signal of open) {
      const snapshot: any = await this.markets.getLatestSnapshot(signal.market_id, signal.side);
      if (!snapshot) continue;

      const currentPrice = Number(snapshot.price);
      const stopLoss = Number(signal.stop_loss);
      const tp1 = Number(signal.take_profit_1);
      const tp2 = Number(signal.take_profit_2);
      const spread = Number(snapshot.spread ?? 0);
      const maxHoldHours = Number(signal.max_hold_hours ?? 0);
      const closeNearResolution = Boolean(signal.close_near_resolution_if_risk_unknown ?? false);
      const dataConfidence = String(signal.data_confidence ?? 'MEDIUM').toUpperCase();
      const createdAt = new Date(signal.created_at ?? Date.now());
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      const reasons: string[] = [];
      if (currentPrice <= stopLoss) reasons.push(`Stop loss touched: ${currentPrice} <= ${stopLoss}`);
      if (currentPrice >= tp1) reasons.push(`Take profit 1 touched: ${currentPrice} >= ${tp1}`);
      if (currentPrice >= tp2) reasons.push(`Take profit 2 touched: ${currentPrice} >= ${tp2}`);
      if (maxHoldHours > 0 && ageHours >= maxHoldHours) reasons.push(`Time stop reached: ${ageHours.toFixed(1)}h >= ${maxHoldHours}h`);
      if (spread >= 0.05) reasons.push(`Spread too high: ${spread}`);
      if (Number(signal.market_score) < Number(signal.exit_if_market_score_below ?? 50)) reasons.push('Market score invalidated.');
      if (closeNearResolution && dataConfidence === 'LOW') reasons.push('Risk confidence is low; exit due near-resolution uncertainty rule.');

      // Simple whale reduction proxy: recent SELL by high-score wallets on same market/outcome.
      const recentTrades: any[] = await this.wallets.getRecentTradesForMarket(signal.market_id, signal.side);
      const sellPressure = recentTrades.filter((t) => t.side === 'SELL' && Number(t.wallet_score) >= 75).length;
      if (sellPressure >= 2) reasons.push('High-score wallets appear to be reducing exposure.');

      if (reasons.length > 0) {
        await this.signals.updateStatus(Number(signal.id), 'SELL_WATCH', 'SELL_WATCH', reasons.join(' '));
        sellAlerts.push(Number(signal.id));
      }
    }

    return sellAlerts;
  }
}
