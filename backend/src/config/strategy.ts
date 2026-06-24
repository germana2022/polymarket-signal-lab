export const strategyConfig = {
  buyRules: {
    minMarketScore: 70,
    minWhaleScore: 75,
    minExecutionScore: 70,
    minWalletsConfirming: 2,
    maxSpread: 0.03,
    maxPriceChase: 0.05,
    minLiquidityUsd: 25_000,
    minVolume24hUsd: 50_000,
  },
  sellRules: {
    stopLossPct: 0.15,
    takeProfit1Pct: 0.25,
    takeProfit2Pct: 0.45,
    exitIfMarketScoreBelow: 50,
    exitIfSpreadAbove: 0.05,
    exitIfWhalesReducing: true,
    maxHoldHours: 24,
    closeNearResolutionIfRiskUnknown: true,
  },
  paperTrading: {
    defaultSizeUsd: 10,
  },
} as const;
