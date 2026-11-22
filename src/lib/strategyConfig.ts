export const STRATEGY_TIMEFRAMES = ['5m', '15m', '1h', '4h', '8h', '12h', '1d'] as const;
export type StrategyTimeframe = typeof STRATEGY_TIMEFRAMES[number];

/** Tunable thresholds used by the plain-language strategy condition presets. */
export const INDICATOR_PRESETS = {
  emaPeriods: [20, 50, 100, 200],
  emaCrossPairs: ['9/21', '20/50', '50/200'],
  rangeLookbacks: [20, 50, 100],
  rsi: { oversold: 30, pulledBack: 40, bullish: 50, overbought: 70, extreme: 75 },
  stochRsi: { oversold: 20, overbought: 80 },
  adx: { strong: 25, veryStrong: 40, choppy: 20 },
  distanceFromEmaPct: { stretched: 10 },
  distanceFrom24hPct: { near: 2 },
  rvol: { aboveNormal: 1.5, unusual: 2, extreme: 3 },
  takerBuyRatioPct: { buyers: 55, sellers: 45 },
  oiChangePct: { small: 0.5, medium: 1.5, large: 2.5, drop: -1 },
  fundingPerHourPct: { crowdedLongs: 0.005, crowdedShorts: -0.002, neutralUpper: 0.005 },
  longShortRatio: { moreLongs: 1.5, moreShorts: 0.7 },
  premiumBasisPct: { premium: 0.05, discount: -0.05 },
  consecutiveCandles: { minimum: 3 },
  typicalRanges: {
    rsi: '0–100', stochRsi: '0–100', adx: '0–100', di: '0–100',
    rvol: '0–10x', takerBuyRatio: '0–100%', funding: '−0.1–0.1%/h',
    longShortRatio: '0.1–10', consecutiveCandles: '1–20 candles',
    default: 'Depends on the market and timeframe',
  },
  units: {
    rsi: '%', stochRsi: '%', adx: '', changePct: '%', distancePct: '%', atr: '%',
    rvol: 'x', volume: '$', oi: '%', funding: '%/h', longShortRatio: 'x',
    premiumBasis: '%', candles: 'candles', takerBuyRatio: '%',
  },
  priceChangeChoices: { bigMove: 'bigMovePct', priceJump: 'priceJumpPct' },
} as const;

export const ATR_PRESETS: Record<StrategyTimeframe, { calmBelowPct: number; activeAbovePct: number; veryVolatileAbovePct: number }> = {
  '5m':  { calmBelowPct: 0.2, activeAbovePct: 0.4, veryVolatileAbovePct: 0.9 },
  '15m': { calmBelowPct: 0.35, activeAbovePct: 0.75, veryVolatileAbovePct: 1.5 },
  '1h':  { calmBelowPct: 0.7, activeAbovePct: 1.5, veryVolatileAbovePct: 3 },
  '4h':  { calmBelowPct: 1.4, activeAbovePct: 3, veryVolatileAbovePct: 6 },
  '8h':  { calmBelowPct: 2, activeAbovePct: 4.2, veryVolatileAbovePct: 8.5 },
  '12h': { calmBelowPct: 2.4, activeAbovePct: 5.2, veryVolatileAbovePct: 10 },
  '1d':  { calmBelowPct: 3.5, activeAbovePct: 7, veryVolatileAbovePct: 15 },
};

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
