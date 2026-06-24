import { describe, expect, it } from 'vitest';
import { calculateExecutionScore, calculateMarketScore, calculateWhaleScore, classifyBuyAction } from './scoringService.js';

describe('scoringService', () => {
  it('assigns high market score to liquid low-spread markets', () => {
    const score = calculateMarketScore({ volume: 250000, liquidity: 90000, spread: 0.016, active: true, enableOrderBook: true });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('penalizes late entries relative to whale entry', () => {
    const score = calculateExecutionScore({ spread: 0.016, liquidity: 90000, currentPrice: 0.45, avgWhaleEntry: 0.29 });
    expect(score).toBeLessThan(80);
  });

  it('classifies strong buy watch when all scores are high', () => {
    expect(classifyBuyAction(90, 88, 85)).toBe('STRONG_BUY_WATCH');
  });

  it('computes whale confirmation with multiple wallets', () => {
    const score = calculateWhaleScore({ walletsConfirming: 3, avgWalletScore: 85, avgWalletEntry: 0.29, currentPrice: 0.31 });
    expect(score).toBeGreaterThanOrEqual(75);
  });
});
