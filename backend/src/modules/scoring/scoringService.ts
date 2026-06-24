import { strategyConfig } from '../../config/strategy.js';

export interface MarketScoreInput {
  volume: number;
  liquidity: number;
  spread: number;
  active: boolean;
  enableOrderBook: boolean;
}

export interface WhaleScoreInput {
  walletsConfirming: number;
  avgWalletScore: number;
  avgWalletEntry: number;
  currentPrice: number;
}

export interface ExecutionScoreInput {
  spread: number;
  liquidity: number;
  currentPrice: number;
  avgWhaleEntry: number;
}

export function calculateMarketScore(input: MarketScoreInput): number {
  const volumeScore = Math.min(30, (input.volume / strategyConfig.buyRules.minVolume24hUsd) * 30);
  const liquidityScore = Math.min(30, (input.liquidity / strategyConfig.buyRules.minLiquidityUsd) * 30);
  const spreadScore = input.spread <= strategyConfig.buyRules.maxSpread
    ? 25
    : Math.max(0, 25 - input.spread * 300);
  const statusScore = input.active && input.enableOrderBook ? 15 : 0;
  return round(Math.min(100, volumeScore + liquidityScore + spreadScore + statusScore));
}

export function calculateWhaleScore(input: WhaleScoreInput): number {
  const confirmationScore = Math.min(35, input.walletsConfirming * 17.5);
  const walletQualityScore = Math.min(45, (input.avgWalletScore / 100) * 45);
  const chase = input.avgWhaleEntry > 0 ? Math.max(0, (input.currentPrice - input.avgWhaleEntry) / input.avgWhaleEntry) : 1;
  const timingScore = chase <= strategyConfig.buyRules.maxPriceChase ? 20 : Math.max(0, 20 - chase * 200);
  return round(Math.min(100, confirmationScore + walletQualityScore + timingScore));
}

export function calculateExecutionScore(input: ExecutionScoreInput): number {
  const spreadScore = input.spread <= strategyConfig.buyRules.maxSpread ? 40 : Math.max(0, 40 - input.spread * 500);
  const liquidityScore = Math.min(30, (input.liquidity / strategyConfig.buyRules.minLiquidityUsd) * 30);
  const chase = input.avgWhaleEntry > 0 ? Math.max(0, (input.currentPrice - input.avgWhaleEntry) / input.avgWhaleEntry) : 1;
  const chaseScore = chase <= strategyConfig.buyRules.maxPriceChase ? 30 : Math.max(0, 30 - chase * 300);
  return round(Math.min(100, spreadScore + liquidityScore + chaseScore));
}

export function classifyBuyAction(marketScore: number, whaleScore: number, executionScore: number): 'NO_TRADE' | 'WATCH' | 'BUY_WATCH' | 'STRONG_BUY_WATCH' {
  const rules = strategyConfig.buyRules;
  if (marketScore >= 85 && whaleScore >= 85 && executionScore >= 80) return 'STRONG_BUY_WATCH';
  if (marketScore >= rules.minMarketScore && whaleScore >= rules.minWhaleScore && executionScore >= rules.minExecutionScore) return 'BUY_WATCH';
  if (marketScore >= 60 && whaleScore >= 60) return 'WATCH';
  return 'NO_TRADE';
}

export function confidenceFromScores(marketScore: number, whaleScore: number, executionScore: number): string {
  const avg = (marketScore + whaleScore + executionScore) / 3;
  if (avg >= 85) return 'HIGH';
  if (avg >= 75) return 'MEDIUM_HIGH';
  if (avg >= 60) return 'MEDIUM';
  return 'LOW';
}

export function dataConfidenceFromScores(marketScore: number, whaleScore: number, executionScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  const avg = (marketScore + whaleScore + executionScore) / 3;
  if (avg >= 75) return 'HIGH';
  if (avg >= 60) return 'MEDIUM';
  return 'LOW';
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
