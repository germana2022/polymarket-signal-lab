export type Side = 'YES' | 'NO';
export type TradeSide = 'BUY' | 'SELL';
export type SignalAction = 'NO_TRADE' | 'WATCH' | 'BUY_WATCH' | 'STRONG_BUY_WATCH' | 'SELL_WATCH';
export type SignalStatus = 'DETECTED' | 'WATCHING' | 'BUY_WATCH' | 'PAPER_OPEN' | 'HOLD' | 'SELL_WATCH' | 'PAPER_CLOSED' | 'INVALIDATED';

export interface Market {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  endDate?: Date | string | null;
  active: boolean;
  enableOrderBook: boolean;
  volume: number;
  liquidity: number;
  openInterest: number;
}

export interface MarketSnapshot {
  marketId: string;
  outcome: Side;
  price: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  volume: number;
  liquidity: number;
  timestamp?: Date;
}

export interface Wallet {
  address: string;
  totalProfit: number;
  roi: number;
  winRate: number;
  marketsTraded: number;
  avgPositionSize: number;
  walletScore: number;
}

export interface WalletTrade {
  walletAddress: string;
  marketId: string;
  outcome: Side;
  side: TradeSide;
  price: number;
  size: number;
  notionalValue: number;
  timestamp?: Date;
}

export interface SignalCandidate {
  market: Market;
  side: Side;
  currentPrice: number;
  avgWhaleEntry: number;
  walletsConfirming: number;
  marketScore: number;
  whaleScore: number;
  executionScore: number;
  spread: number;
}
