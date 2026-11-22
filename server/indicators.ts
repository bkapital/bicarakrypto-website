export interface Candle {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  quoteVolume: number;
  volume?: number;
  takerBuyQuoteVolume?: number;
}

export interface IndicatorResult {
  lastClosedCandleTime: number;
  close: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  ema9_21Cross: 'up' | 'down' | null;
  ema20_50Cross: 'up' | 'down' | null;
  ema50_200Cross: 'up' | 'down' | null;
  ema20_50CrossAge: number | null;
  stochRsiCross: 'up' | 'down' | null;
  rsi50Cross: 'up' | 'down' | null;
  rsi14: number;
  previousRsi14: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
    histogramCross: 'up' | 'down' | null;
    histogramCrossAge: number | null;
  };
  adx14: number;
  plusDi14: number;
  minusDi14: number;
  diDirection: 'above' | 'below';
  supertrend: 'above' | 'below';
  stochRsi: { k: number; d: number };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
    squeeze: boolean;
  };
  atr14Percent: number;
  rvol: number;
  quoteVolume: number;
  takerBuyRatio: number;
  dailyVwap: number;
  dailyVwapDistancePct: number;
  changePct: number;
  breakout: boolean;
  breakdown: boolean;
}

const SMA_SEED = (values: number[], period: number, end: number): number => {
  if (end - period + 1 < 0) return NaN;
  let total = 0;
  for (let i = end - period + 1; i <= end; i++) total += values[i];
  return total / period;
};

export function ema(values: number[], period: number): number[] {
  const result = Array<number>(values.length).fill(NaN);
  if (values.length < period) return result;
  const seedIndex = period - 1;
  result[seedIndex] = SMA_SEED(values, period, seedIndex);
  const alpha = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * alpha + result[i - 1] * (1 - alpha);
  }
  return result;
}

function rsiSeries(closes: number[], period: number): number[] {
  const result = Array<number>(closes.length).fill(NaN);
  if (closes.length <= period) return result;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    gain += Math.max(0, change);
    loss += Math.max(0, -change);
  }
  let averageGain = gain / period;
  let averageLoss = loss / period;
  const value = () => averageLoss === 0 ? (averageGain === 0 ? 50 : 100) : 100 - 100 / (1 + averageGain / averageLoss);
  result[period] = value();
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    averageGain = (averageGain * (period - 1) + Math.max(0, change)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(0, -change)) / period;
    result[i] = value();
  }
  return result;
}

function lastCross(a: number[], b: number[], direction: 'up' | 'down', maxCandles = 3): number | null {
  const last = Math.min(a.length, b.length) - 1;
  for (let age = 0; age < maxCandles && last - age > 0; age++) {
    const i = last - age;
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i]) || !Number.isFinite(a[i - 1]) || !Number.isFinite(b[i - 1])) continue;
    if (direction === 'up' && a[i - 1] <= b[i - 1] && a[i] > b[i]) return age;
    if (direction === 'down' && a[i - 1] >= b[i - 1] && a[i] < b[i]) return age;
  }
  return null;
}

function lastZeroCross(values: number[], maxCandles = 3): { direction: 'up' | 'down'; age: number } | null {
  const last = values.length - 1;
  for (let age = 0; age < maxCandles && last - age > 0; age++) {
    const i = last - age;
    if (!Number.isFinite(values[i]) || !Number.isFinite(values[i - 1])) continue;
    if (values[i - 1] <= 0 && values[i] > 0) return { direction: 'up', age };
    if (values[i - 1] >= 0 && values[i] < 0) return { direction: 'down', age };
  }
  return null;
}

function adxSeries(candles: Candle[], period: number): number[] {
  const n = candles.length;
  const result = Array<number>(n).fill(NaN);
  if (n <= period * 2) return result;
  const tr = Array<number>(n).fill(0);
  const plusDm = Array<number>(n).fill(0);
  const minusDm = Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    plusDm[i] = up > down && up > 0 ? up : 0;
    minusDm[i] = down > up && down > 0 ? down : 0;
    tr[i] = Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - candles[i - 1].close), Math.abs(candles[i].low - candles[i - 1].close));
  }
  let smoothTr = 0;
  let smoothPlus = 0;
  let smoothMinus = 0;
  for (let i = 1; i <= period; i++) {
    smoothTr += tr[i];
    smoothPlus += plusDm[i];
    smoothMinus += minusDm[i];
  }
  const dx = Array<number>(n).fill(NaN);
  const setDx = (i: number) => {
    const plusDi = smoothTr === 0 ? 0 : 100 * smoothPlus / smoothTr;
    const minusDi = smoothTr === 0 ? 0 : 100 * smoothMinus / smoothTr;
    const denominator = plusDi + minusDi;
    dx[i] = denominator === 0 ? 0 : 100 * Math.abs(plusDi - minusDi) / denominator;
  };
  setDx(period);
  for (let i = period + 1; i < n; i++) {
    smoothTr = smoothTr - smoothTr / period + tr[i];
    smoothPlus = smoothPlus - smoothPlus / period + plusDm[i];
    smoothMinus = smoothMinus - smoothMinus / period + minusDm[i];
    setDx(i);
  }
  const firstAdxIndex = period * 2 - 1;
  let seed = 0;
  for (let i = period; i <= firstAdxIndex; i++) seed += dx[i];
  result[firstAdxIndex] = seed / period;
  for (let i = firstAdxIndex + 1; i < n; i++) result[i] = (result[i - 1] * (period - 1) + dx[i]) / period;
  return result;
}

function directionalIndex(candles: Candle[], period: number): { plus: number; minus: number } {
  if (candles.length <= period) return { plus: NaN, minus: NaN };
  let tr = 0, plus = 0, minus = 0;
  for (let i = 1; i <= period; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    tr += Math.max(candles[i].high-candles[i].low, Math.abs(candles[i].high-candles[i-1].close), Math.abs(candles[i].low-candles[i-1].close));
    plus += up > down && up > 0 ? up : 0;
    minus += down > up && down > 0 ? down : 0;
  }
  for (let i = period + 1; i < candles.length; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    tr = tr - tr / period + Math.max(candles[i].high-candles[i].low, Math.abs(candles[i].high-candles[i-1].close), Math.abs(candles[i].low-candles[i-1].close));
    plus = plus - plus / period + (up > down && up > 0 ? up : 0);
    minus = minus - minus / period + (down > up && down > 0 ? down : 0);
  }
  return tr === 0 ? { plus: 0, minus: 0 } : { plus: plus / tr * 100, minus: minus / tr * 100 };
}

function stochRsi(rsi: number[], period = 14): { k: number; d: number; cross: 'up'|'down'|null } {
  const raw = rsi.map((value, i) => {
    const slice = rsi.slice(Math.max(0, i - period + 1), i + 1).filter(Number.isFinite);
    if (!Number.isFinite(value) || slice.length < period) return NaN;
    const low = Math.min(...slice), high = Math.max(...slice);
    return high === low ? 0 : (value - low) / (high - low) * 100;
  });
  const smooth = (series: number[], i: number, length: number) => {
    const window = series.slice(Math.max(0, i - length + 1), i + 1);
    return window.length === length && window.every(Number.isFinite) ? window.reduce((sum, value) => sum + value, 0) / length : NaN;
  };
  const kSeries = raw.map((_, i) => smooth(raw, i, 3));
  const dSeries = kSeries.map((_, i) => smooth(kSeries, i, 3));
  const up = lastCross(kSeries, dSeries, 'up');
  const down = lastCross(kSeries, dSeries, 'down');
  return { k: kSeries.at(-1) ?? NaN, d: dSeries.at(-1) ?? NaN, cross: up !== null && (down === null || up <= down) ? 'up' : down !== null ? 'down' : null };
}

function lastLevelCross(values: number[], level: number, maxCandles = 3): 'up'|'down'|null {
  for (let age=0; age<maxCandles && values.length-1-age>0; age++) {
    const i=values.length-1-age;
    if (!Number.isFinite(values[i]) || !Number.isFinite(values[i-1])) continue;
    if (values[i-1] <= level && values[i] > level) return 'up';
    if (values[i-1] >= level && values[i] < level) return 'down';
  }
  return null;
}

function supertrendDirection(candles: Candle[], period = 10, multiplier = 3): 'above' | 'below' {
  if (candles.length < period + 2) return 'below';
  const tr = candles.map((c, i) => i === 0 ? c.high - c.low : Math.max(c.high-c.low, Math.abs(c.high-candles[i-1].close), Math.abs(c.low-candles[i-1].close)));
  const atr = Array<number>(candles.length).fill(NaN);
  atr[period - 1] = tr.slice(0, period).reduce((sum, n) => sum + n, 0) / period;
  for (let i = period; i < tr.length; i++) atr[i] = (atr[i-1] * (period - 1) + tr[i]) / period;
  let finalUpper = 0, finalLower = 0, direction: 'above'|'below' = 'below';
  for (let i = period - 1; i < candles.length; i++) {
    const midpoint = (candles[i].high + candles[i].low) / 2;
    const upper = midpoint + multiplier * atr[i], lower = midpoint - multiplier * atr[i];
    if (i === period - 1) { finalUpper = upper; finalLower = lower; direction = candles[i].close > midpoint ? 'above' : 'below'; continue; }
    const prevClose = candles[i-1].close;
    finalUpper = upper < finalUpper || prevClose > finalUpper ? upper : finalUpper;
    finalLower = lower > finalLower || prevClose < finalLower ? lower : finalLower;
    if (direction === 'below' && candles[i].close > finalUpper) direction = 'above';
    else if (direction === 'above' && candles[i].close < finalLower) direction = 'below';
  }
  return direction;
}

interface BollingerPoint { upper: number; middle: number; lower: number; width: number }

function bollingerSeries(closes: number[], period: number, multiplier: number): Array<BollingerPoint | null> {
  return closes.map((_, i) => {
    if (i + 1 < period) return null;
    const start = i - period + 1;
    let mean = 0;
    for (let j = start; j <= i; j++) mean += closes[j];
    mean /= period;
    let variance = 0;
    for (let j = start; j <= i; j++) variance += (closes[j] - mean) ** 2;
    const deviation = Math.sqrt(variance / period);
    const upper = mean + multiplier * deviation;
    const lower = mean - multiplier * deviation;
    return { upper, middle: mean, lower, width: mean === 0 ? NaN : (upper - lower) / mean };
  });
}

export function calculateIndicators(candles: Candle[], options: { crossWindow?: number } = {}): IndicatorResult | null {
  if (candles.length < 200) return null;
  const crossWindow = Math.max(1, Math.floor(options.crossWindow ?? 3));
  const closes = candles.map(c => c.close);
  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const ema100Series = ema(closes, 100);
  const ema200Series = ema(closes, 200);
  const ema9Series = ema(closes, 9);
  const ema21Series = ema(closes, 21);
  const ema20_50CrossAge = lastCross(ema20Series, ema50Series, 'up', crossWindow) ?? null;
  const ema9_21Up = lastCross(ema9Series, ema21Series, 'up', crossWindow);
  const ema9_21Down = lastCross(ema9Series, ema21Series, 'down', crossWindow);
  const ema50_200Up = lastCross(ema50Series, ema200Series, 'up', crossWindow);
  const ema50_200Down = lastCross(ema50Series, ema200Series, 'down', crossWindow);
  const crossUpAge = lastCross(ema20Series, ema50Series, 'up', crossWindow);
  const crossDownAge = lastCross(ema20Series, ema50Series, 'down', crossWindow);
  const emaCross = crossUpAge !== null && (crossDownAge === null || crossUpAge <= crossDownAge) ? 'up' : crossDownAge !== null ? 'down' : null;
  const emaCrossAge = emaCross === 'up' ? crossUpAge : emaCross === 'down' ? crossDownAge : null;

  const fast = ema(closes, 12);
  const slow = ema(closes, 26);
  const macdLine = closes.map((_, i) => Number.isFinite(fast[i]) && Number.isFinite(slow[i]) ? fast[i] - slow[i] : NaN);
  const firstMacdIndex = macdLine.findIndex(Number.isFinite);
  const macdValues = macdLine.slice(firstMacdIndex);
  const macdSignalPartial = ema(macdValues, 9);
  const signalLine = Array<number>(candles.length).fill(NaN);
  macdSignalPartial.forEach((v, i) => { signalLine[firstMacdIndex + i] = v; });
  const histogram = macdLine.map((v, i) => Number.isFinite(v) && Number.isFinite(signalLine[i]) ? v - signalLine[i] : NaN);
  const macdCross = lastZeroCross(histogram, crossWindow);

  const rsi = rsiSeries(closes, 14);
  const stochastic = stochRsi(rsi);
  const bands = bollingerSeries(closes, 20, 2);
  const currentBands = bands.at(-1);
  const recentWidths = bands.slice(-120).filter((x): x is BollingerPoint => x !== null && Number.isFinite(x.width)).map(x => x.width).sort((a, b) => a - b);
  const squeezeThreshold = recentWidths.length ? recentWidths[Math.max(0, Math.ceil(recentWidths.length * 0.1) - 1)] : NaN;

  const tr = candles.map((c, i) => i === 0 ? c.high - c.low : Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close)));
  let atr = tr.slice(0, 14).reduce((sum, x) => sum + x, 0) / 14;
  for (let i = 14; i < tr.length; i++) atr = (atr * 13 + tr[i]) / 14;
  const last = candles.length - 1;
  const previous20 = candles.slice(-21, -1);
  const previous20QuoteVolumes = candles.slice(-21, -1).map(c => c.quoteVolume);
  const averagePreviousQuoteVolume = previous20QuoteVolumes.reduce((sum, v) => sum + v, 0) / 20;
  const breakoutHigh = Math.max(...previous20.map(c => c.high));
  const breakdownLow = Math.min(...previous20.map(c => c.low));
  const di = directionalIndex(candles, 14);
  const dayStart = new Date(candles[last].closeTime).setUTCHours(0,0,0,0);
  const today = candles.filter(c => c.openTime >= dayStart);
  const dayBaseVolume = today.reduce((sum, c) => sum + (c.volume || 0), 0);
  const dayQuoteVolume = today.reduce((sum, c) => sum + c.quoteVolume, 0);
  const dailyVwap = dayBaseVolume > 0 ? dayQuoteVolume / dayBaseVolume : NaN;
  const candleChangePct = last > 0 && candles[last-1].close !== 0 ? (candles[last].close / candles[last-1].close - 1) * 100 : NaN;
  const currentCandle = candles[last];

  return {
    lastClosedCandleTime: candles[last].closeTime,
    close: candles[last].close,
    ema20: ema20Series[last],
    ema50: ema50Series[last],
    ema100: ema100Series[last],
    ema200: ema200Series[last],
    ema9_21Cross: ema9_21Up !== null && (ema9_21Down === null || ema9_21Up <= ema9_21Down) ? 'up' : ema9_21Down !== null ? 'down' : null,
    ema20_50Cross: emaCross,
    ema50_200Cross: ema50_200Up !== null && (ema50_200Down === null || ema50_200Up <= ema50_200Down) ? 'up' : ema50_200Down !== null ? 'down' : null,
    ema20_50CrossAge,
    stochRsiCross: stochastic.cross,
    rsi50Cross: lastLevelCross(rsi, 50, crossWindow),
    rsi14: rsi[last],
    previousRsi14: rsi[last - 1],
    macd: {
      line: macdLine[last],
      signal: signalLine[last],
      histogram: histogram[last],
      histogramCross: macdCross?.direction ?? null,
      histogramCrossAge: macdCross?.age ?? null,
    },
    adx14: adxSeries(candles, 14)[last],
    plusDi14: di.plus,
    minusDi14: di.minus,
    diDirection: di.plus >= di.minus ? 'above' : 'below',
    supertrend: supertrendDirection(candles),
    stochRsi: stochastic,
    bollinger: {
      upper: currentBands?.upper ?? NaN,
      middle: currentBands?.middle ?? NaN,
      lower: currentBands?.lower ?? NaN,
      width: currentBands?.width ?? NaN,
      squeeze: Boolean(currentBands && Number.isFinite(squeezeThreshold) && currentBands.width <= squeezeThreshold),
    },
    atr14Percent: candles[last].close === 0 ? NaN : atr / candles[last].close * 100,
    rvol: averagePreviousQuoteVolume === 0 ? NaN : candles[last].quoteVolume / averagePreviousQuoteVolume,
    quoteVolume: currentCandle.quoteVolume,
    takerBuyRatio: currentCandle.quoteVolume > 0 && Number.isFinite(currentCandle.takerBuyQuoteVolume) ? (currentCandle.takerBuyQuoteVolume as number) / currentCandle.quoteVolume : NaN,
    dailyVwap,
    dailyVwapDistancePct: dailyVwap > 0 ? (candles[last].close / dailyVwap - 1) * 100 : NaN,
    changePct: candleChangePct,
    breakout: candles[last].close > breakoutHigh,
    breakdown: candles[last].close < breakdownLow,
  };
}
