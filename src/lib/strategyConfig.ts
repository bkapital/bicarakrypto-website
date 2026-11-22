export const STRATEGY_TIMEFRAMES = ['5m', '15m', '1h', '4h', '8h', '12h', '1d'] as const;
export type StrategyTimeframe = typeof STRATEGY_TIMEFRAMES[number];

export const STRATEGY_THRESHOLDS: Record<StrategyTimeframe, {
  bigMovePct: number;
  priceJumpPct: number;
  oiSmallRisePct: number;
  oiMediumRisePct: number;
  oiLargeRisePct: number;
  oiDropPct: number;
  trendEmaPeriod: 50 | 200;
  crossWindow: 2 | 3;
}> = {
  '5m':  { bigMovePct: 1,   priceJumpPct: 2,  oiSmallRisePct: 0.5, oiMediumRisePct: 1,  oiLargeRisePct: 1.5, oiDropPct: -1, trendEmaPeriod: 200, crossWindow: 3 },
  '15m': { bigMovePct: 1.5, priceJumpPct: 3,  oiSmallRisePct: 1,   oiMediumRisePct: 1.5,oiLargeRisePct: 2,   oiDropPct: -1, trendEmaPeriod: 200, crossWindow: 3 },
  '1h':  { bigMovePct: 3,   priceJumpPct: 5,  oiSmallRisePct: 2,   oiMediumRisePct: 3,  oiLargeRisePct: 4,   oiDropPct: -2, trendEmaPeriod: 200, crossWindow: 3 },
  '4h':  { bigMovePct: 5,   priceJumpPct: 8,  oiSmallRisePct: 3,   oiMediumRisePct: 5,  oiLargeRisePct: 7,   oiDropPct: -3, trendEmaPeriod: 200, crossWindow: 3 },
  '8h':  { bigMovePct: 7,   priceJumpPct: 10, oiSmallRisePct: 4,   oiMediumRisePct: 7,  oiLargeRisePct: 9,   oiDropPct: -4, trendEmaPeriod: 50,  crossWindow: 2 },
  '12h': { bigMovePct: 8,   priceJumpPct: 12, oiSmallRisePct: 4,   oiMediumRisePct: 8,  oiLargeRisePct: 11,  oiDropPct: -4, trendEmaPeriod: 50,  crossWindow: 2 },
  '1d':  { bigMovePct: 10,  priceJumpPct: 15, oiSmallRisePct: 5,   oiMediumRisePct: 10, oiLargeRisePct: 15,  oiDropPct: -5, trendEmaPeriod: 50,  crossWindow: 2 },
};

export const SELECTED_TIMEFRAME = 'selected';
