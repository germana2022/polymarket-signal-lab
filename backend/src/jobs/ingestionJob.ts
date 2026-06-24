import { createDataProvider } from '../providers/dataProvider.js';
import { MarketRepository } from '../modules/markets/marketRepository.js';
import { WalletRepository } from '../modules/wallets/walletRepository.js';
import { query } from '../db/pool.js';

export class IngestionJob {
  private provider = createDataProvider();
  private markets = new MarketRepository();
  private wallets = new WalletRepository();

  async syncMarkets() {
    const markets = await this.provider.getMarkets();
    await this.markets.upsertMarkets(markets);
    return { markets: markets.length };
  }

  async syncMarketPrices() {
    const markets = await this.provider.getMarkets();
    const snapshots = await this.provider.getMarketSnapshots(markets);
    await this.markets.insertSnapshots(snapshots);
    return { snapshots: snapshots.length };
  }

  async syncWalletActivity() {
    const wallets = await this.provider.getTopWallets();
    await this.wallets.upsertWallets(wallets);

    const trades = await this.provider.getRecentTrades();
    // Ensure referenced wallets exist when live data contains unknown wallets.
    const walletsFromTrades = trades.map((t) => ({
      address: t.walletAddress,
      totalProfit: 0,
      roi: 0,
      winRate: 0,
      marketsTraded: 0,
      avgPositionSize: t.notionalValue,
      walletScore: 50,
    }));
    await this.wallets.upsertWallets(walletsFromTrades);
    await this.wallets.insertTrades(trades);

    return { wallets: wallets.length, trades: trades.length };
  }

  async calculateWalletScores() {
    await query(`
      UPDATE wallets
      SET wallet_score = LEAST(
        100,
        GREATEST(
          0,
          COALESCE(win_rate::float, 0) * 100 * 0.6 +
          LEAST(30, COALESCE(markets_traded, 0) * 0.6) +
          LEAST(30, COALESCE(roi::float, 0) * 100)
        )
      )
    `);
    return { walletsScored: 'updated' };
  }

  async run() {
    const markets = await this.provider.getMarkets();
    await this.markets.upsertMarkets(markets);

    const snapshots = await this.provider.getMarketSnapshots(markets);
    await this.markets.insertSnapshots(snapshots);

    const wallets = await this.provider.getTopWallets();
    await this.wallets.upsertWallets(wallets);

    const trades = await this.provider.getRecentTrades();
    // Ensure referenced wallets exist when live data contains unknown wallets.
    const walletsFromTrades = trades.map((t) => ({
      address: t.walletAddress,
      totalProfit: 0,
      roi: 0,
      winRate: 0,
      marketsTraded: 0,
      avgPositionSize: t.notionalValue,
      walletScore: 50,
    }));
    await this.wallets.upsertWallets(walletsFromTrades);
    await this.wallets.insertTrades(trades);

    return { markets: markets.length, snapshots: snapshots.length, wallets: wallets.length, trades: trades.length };
  }
}
