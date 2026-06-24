import { MarketRepository } from '../markets/marketRepository.js';
import { WalletRepository } from '../wallets/walletRepository.js';
import { SignalRepository } from './signalRepository.js';
import { calculateExecutionScore, calculateMarketScore, calculateWhaleScore, classifyBuyAction, confidenceFromScores, dataConfidenceFromScores } from '../scoring/scoringService.js';
import { strategyConfig } from '../../config/strategy.js';

export class BuyDecisionEngine {
  constructor(
    private readonly markets = new MarketRepository(),
    private readonly wallets = new WalletRepository(),
    private readonly signals = new SignalRepository(),
  ) {}

  async generateSignals() {
    const hotMarkets: any[] = await this.markets.getHotMarkets();
    const created: number[] = [];

    for (const market of hotMarkets) {
      const snapshot: any = await this.markets.getLatestSnapshot(market.id, 'YES');
      if (!snapshot) continue;

      const trades: any[] = await this.wallets.getConfirmingTrades(market.id, 'YES');
      const qualityTrades = trades.filter((t) => Number(t.wallet_score) >= 70 && Number(t.notional_value) >= 1000);
      const walletsConfirming = new Set(qualityTrades.map((t) => t.wallet_address)).size;
      const firstTradeTimestamp = qualityTrades.length ? qualityTrades.reduce((oldest, trade) => {
        const ts = new Date(trade.timestamp).getTime();
        return Number.isNaN(ts) ? oldest : Math.min(oldest, ts);
      }, Number.MAX_SAFE_INTEGER) : Date.now();
      const entryDelayMs = Number.isFinite(firstTradeTimestamp) ? Date.now() - firstTradeTimestamp : 0;

      const avgWalletScore = qualityTrades.length
        ? qualityTrades.reduce((sum, t) => sum + Number(t.wallet_score), 0) / qualityTrades.length
        : 0;

      const avgWhaleEntry = qualityTrades.length
        ? qualityTrades.reduce((sum, t) => sum + Number(t.price), 0) / qualityTrades.length
        : Number(snapshot.price);

      const marketScore = calculateMarketScore({
        volume: Number(market.volume ?? snapshot.volume ?? 0),
        liquidity: Number(market.liquidity ?? snapshot.liquidity ?? 0),
        spread: Number(snapshot.spread ?? 1),
        active: Boolean(market.active),
        enableOrderBook: Boolean(market.enable_order_book),
      });

      const whaleScore = calculateWhaleScore({
        walletsConfirming,
        avgWalletScore,
        avgWalletEntry,
        currentPrice: Number(snapshot.price),
      });

      const executionScore = calculateExecutionScore({
        spread: Number(snapshot.spread ?? 1),
        liquidity: Number(market.liquidity ?? snapshot.liquidity ?? 0),
        currentPrice: Number(snapshot.price),
        avgWhaleEntry,
      });

      const action = classifyBuyAction(marketScore, whaleScore, executionScore);
      if (action === 'NO_TRADE') continue;

      const confidence = confidenceFromScores(marketScore, whaleScore, executionScore);
      const dataConfidence = dataConfidenceFromScores(marketScore, whaleScore, executionScore);
      const isLateSignal = avgWhaleEntry > 0 && Number(snapshot.price) / avgWhaleEntry - 1 > strategyConfig.buyRules.maxPriceChase;
      const finalAction = dataConfidence === 'LOW' && action === 'STRONG_BUY_WATCH' ? 'WATCH' : action;
      const status = finalAction === 'WATCH' ? 'WATCHING' : 'BUY_WATCH';
      const reason = [
        `${finalAction}: Market score ${marketScore}, whale score ${whaleScore}, execution score ${executionScore}.`,
        `${walletsConfirming} high-quality wallet(s) confirming YES.`,
        `Current price ${snapshot.price}, avg whale entry ${avgWhaleEntry.toFixed(4)}, spread ${snapshot.spread}.`,
        `Data confidence: ${dataConfidence}.`,
        'Manual review required. No auto-trading enabled.',
      ].join(' ');

      const id = await this.signals.createSignal({
        marketId: market.id,
        side: 'YES',
        action: finalAction,
        currentPrice: Number(snapshot.price),
        marketScore,
        whaleScore,
        executionScore,
        confidence,
        dataConfidence,
        reason,
        entrySpread: Number(snapshot.spread ?? 0),
        isLateSignal,
        entryDelayMs,
        status,
      });
      created.push(id);
    }

    return created;
  }
}
