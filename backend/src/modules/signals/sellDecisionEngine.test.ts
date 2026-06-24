import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SellDecisionEngine } from './sellDecisionEngine.js';

const mockOpenSignals = vi.fn();
const mockGetLatestSnapshot = vi.fn();
const mockGetRecentTradesForMarket = vi.fn();
const mockUpdateStatus = vi.fn();

vi.mock('../markets/marketRepository.js', () => ({
  MarketRepository: vi.fn().mockImplementation(() => ({
    getLatestSnapshot: mockGetLatestSnapshot,
  })),
}));

vi.mock('../wallets/walletRepository.js', () => ({
  WalletRepository: vi.fn().mockImplementation(() => ({
    getRecentTradesForMarket: mockGetRecentTradesForMarket,
  })),
}));

vi.mock('./signalRepository.js', () => ({
  SignalRepository: vi.fn().mockImplementation(() => ({
    openSignals: mockOpenSignals,
    updateStatus: mockUpdateStatus,
  })),
}));

describe('SellDecisionEngine', () => {
  const baseNow = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseNow);
    mockOpenSignals.mockReset();
    mockGetLatestSnapshot.mockReset();
    mockGetRecentTradesForMarket.mockReset();
    mockUpdateStatus.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flags sell watch when stop loss or risk thresholds are broken', async () => {
    mockOpenSignals.mockResolvedValueOnce([
      {
        id: 91,
        market_id: 'm1',
        side: 'YES',
        stop_loss: 0.45,
        take_profit_1: 0.8,
        take_profit_2: 1.0,
        max_hold_hours: 12,
        close_near_resolution_if_risk_unknown: true,
        data_confidence: 'HIGH',
        market_score: '40',
        exit_if_market_score_below: 50,
        created_at: new Date(baseNow.getTime() - 60 * 60 * 1000).toISOString(),
      },
    ]);
    mockGetLatestSnapshot.mockResolvedValueOnce({
      marketId: 'm1',
      price: 0.38,
      spread: 0.012,
    });
    mockGetRecentTradesForMarket.mockResolvedValueOnce([]);

    const engine = new SellDecisionEngine();
    const result = await engine.monitorOpenSignals();

    expect(result).toEqual([91]);
    expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
    const [id, status, action, reason] = mockUpdateStatus.mock.calls[0];
    expect(id).toBe(91);
    expect(status).toBe('SELL_WATCH');
    expect(action).toBe('SELL_WATCH');
    expect(String(reason)).toContain('Stop loss touched');
    expect(String(reason)).toContain('Market score invalidated');
  });

  it('does nothing when no sell conditions are met', async () => {
    mockOpenSignals.mockResolvedValueOnce([
      {
        id: 92,
        market_id: 'm2',
        side: 'YES',
        stop_loss: 0.2,
        take_profit_1: 0.8,
        take_profit_2: 1.0,
        max_hold_hours: 24,
        close_near_resolution_if_risk_unknown: true,
        data_confidence: 'HIGH',
        market_score: '90',
        exit_if_market_score_below: 50,
        created_at: new Date(baseNow.getTime() - 30 * 60 * 1000).toISOString(),
      },
    ]);
    mockGetLatestSnapshot.mockResolvedValueOnce({
      marketId: 'm2',
      price: 0.5,
      spread: 0.01,
    });
    mockGetRecentTradesForMarket.mockResolvedValueOnce([
      { side: 'SELL', wallet_score: 74 },
      { side: 'SELL', wallet_score: 70 },
    ]);

    const engine = new SellDecisionEngine();
    const result = await engine.monitorOpenSignals();

    expect(result).toEqual([]);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });
});
