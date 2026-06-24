import { createDataProvider } from '../providers/dataProvider.js';
import { MarketRepository } from '../modules/markets/marketRepository.js';
import { WalletRepository } from '../modules/wallets/walletRepository.js';

export class IngestionJob {
  private provider = createDataProvider();
  private markets = new MarketRepository();
  private wallets = new WalletRepository();

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
