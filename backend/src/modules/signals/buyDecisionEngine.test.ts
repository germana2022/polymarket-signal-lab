import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyDecisionEngine } from './buyDecisionEngine.js';

const mockGetHotMarkets = vi.fn();
const mockGetLatestSnapshot = vi.fn();
const mockGetConfirmingTrades = vi.fn();
const mockCreateSignal = vi.fn();

vi.mock('../markets/marketRepository.js', () => ({
  MarketRepository: vi.fn().mockImplementation(() => ({
    getHotMarkets: mockGetHotMarkets,
    getLatestSnapshot: mockGetLatestSnapshot,
  })),
}));

vi.mock('../wallets/walletRepository.js', () => ({
  WalletRepository: vi.fn().mockImplementation(() => ({
    getConfirmingTrades: mockGetConfirmingTrades,
  })),
}));

vi.mock('./signalRepository.js', () => ({
  SignalRepository: vi.fn().mockImplementation(() => ({
    createSignal: mockCreateSignal,
  })),
}));

describe('BuyDecisionEngine', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockGetHotMarkets.mockReset();
    mockGetLatestSnapshot.mockReset();
    mockGetConfirmingTrades.mockReset();
    mockCreateSignal.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a buy signal when quality wallets confirm and captures late-signal metadata', async () => {
    mockGetHotMarkets.mockResolvedValueOnce([
      {
        id: 'm1',
        volume: 200000,
        liquidity: 50000,
        active: true,
        enable_order_book: true,
      },
    ]);
    mockGetLatestSnapshot.mockResolvedValueOnce({
      marketId: 'm1',
      price: 1,
      spread: 0.01,
      volume: 200000,
      liquidity: 50000,
      timestamp: now,
    });
    mockGetConfirmingTrades.mockResolvedValueOnce([
      {
        wallet_address: 'w1',
        wallet_score: 90,
        notional_value: 5000,
        price: 0.9,
        timestamp: new Date(now.getTime() - 30_000).toISOString(),
      },
      {
        wallet_address: 'w2',
        wallet_score: 88,
        notional_value: 5000,
        price: 0.9,
        timestamp: new Date(now.getTime() - 10_000).toISOString(),
      },
    ]);
    mockCreateSignal.mockResolvedValueOnce(123);

    const engine = new BuyDecisionEngine();
    const result = await engine.generateSignals();

    expect(result).toEqual([123]);
    expect(mockCreateSignal).toHaveBeenCalledTimes(1);
    const payload = mockCreateSignal.mock.calls[0][0];

    expect(payload.marketId).toBe('m1');
    expect(payload.action).toBe('BUY_WATCH');
    expect(payload.status).toBe('BUY_WATCH');
    expect(payload.entrySpread).toBe(0.01);
    expect(payload.entryDelayMs).toBe(30_000);
    expect(payload.isLateSignal).toBe(true);
  });

  it('skips low-quality markets and does not create a signal', async () => {
    mockGetHotMarkets.mockResolvedValueOnce([
      {
        id: 'm2',
        volume: 1000,
        liquidity: 1000,
        active: false,
        enable_order_book: true,
      },
    ]);
    mockGetLatestSnapshot.mockResolvedValueOnce({
      marketId: 'm2',
      price: 0.4,
      spread: 0.2,
      volume: 1000,
      liquidity: 1000,
      timestamp: now,
    });
    mockGetConfirmingTrades.mockResolvedValueOnce([
      {
        wallet_address: 'w1',
        wallet_score: 20,
        notional_value: 100,
        price: 0.4,
        timestamp: now.toISOString(),
      },
    ]);

    const engine = new BuyDecisionEngine();
    const result = await engine.generateSignals();

    expect(result).toEqual([]);
    expect(mockCreateSignal).not.toHaveBeenCalled();
  });
});
