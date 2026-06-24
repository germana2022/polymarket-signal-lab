import { describe, expect, it, vi } from 'vitest';
import { SignalRepository } from './signalRepository.js';

vi.mock('../../db/pool.js', () => ({
  query: vi.fn(),
}));

describe('SignalRepository', () => {
  it('inserts signal with late-entry metadata and creates exit rules', async () => {
    const { query } = await import('../../db/pool.js');
    const queryMock = vi.mocked(query);

    queryMock
      .mockResolvedValueOnce([{ id: '77' }])
      .mockResolvedValueOnce([]);

    const repo = new SignalRepository();
    const signalId = await repo.createSignal({
      marketId: 'm3',
      side: 'YES',
      action: 'BUY_WATCH',
      currentPrice: 0.5,
      marketScore: 80,
      whaleScore: 85,
      executionScore: 78,
      entrySpread: 0.02,
      isLateSignal: true,
      entryDelayMs: 3500,
      dataConfidence: 'HIGH',
      confidence: 'MEDIUM_HIGH',
      reason: 'test signal',
      status: 'BUY_WATCH',
    });

    expect(signalId).toBe(77);
    expect(queryMock).toHaveBeenCalledTimes(2);
    const insertQuery = queryMock.mock.calls[0][0] as string;
    const exitRuleQuery = queryMock.mock.calls[1][0] as string;

    expect(insertQuery).toContain('entry_spread');
    expect(insertQuery).toContain('is_late_signal');
    expect(insertQuery).toContain('entry_delay_ms');
    expect(insertQuery).toContain('(market_id, side, action, current_price, market_score');

    const params = queryMock.mock.calls[0][1] as unknown[];
    expect(params?.[7]).toBe(0.02);
    expect(params?.[8]).toBe(true);
    expect(params?.[9]).toBe(3500);

    const exitParams = queryMock.mock.calls[1][1] as unknown[];
    expect(exitParams?.[0]).toBe(77);
    expect(exitParams?.[1]).toBe(0.5);
    expect(exitParams?.[2]).toBeCloseTo(0.425);
    expect(exitParams?.[3]).toBeCloseTo(0.625);
    expect(exitParams?.[4]).toBeCloseTo(0.725);

    expect(exitRuleQuery).toContain('INSERT INTO signal_exit_rules');
  });
});
