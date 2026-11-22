import { calculateIndicators, type Candle, type IndicatorResult } from './indicators';

export const TIMEFRAMES = ['5m', '15m', '1h', '4h', '8h', '12h', '1d'] as const;
export type Timeframe = typeof TIMEFRAMES[number];

const INTERVAL_MS: Record<Timeframe, number> = {
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '8h': 8 * 60 * 60_000,
  '12h': 12 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

const FUTURES_BASE = (process.env.BINANCE_FAPI_BASE || 'https://fapi.binance.com').replace(/\/$/, '');
const RATE_LIMIT_PER_MINUTE = Number(process.env.BINANCE_WEIGHT_LIMIT || 2400);
const MAX_CONCURRENCY = 10;
// Fetch 500 rows because the current row is still forming; the cache keeps 499 closed candles.
const INITIAL_CANDLES = 500;
const RETRY_LIMIT = 5;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SymbolTa extends IndicatorResult {
  symbol: string;
  livePrice: number | null;
  updatedAt: string;
  status: 'ready' | 'error';
  error?: string;
}

interface TimeframeCache {
  status: 'loading' | 'ready';
  updatedAt: string | null;
  symbols: Record<string, Partial<Omit<SymbolTa, 'status'>> & { status: 'loading' | 'ready' | 'error' }>;
}

function parseKline(row: any[]): Candle {
  return {
    openTime: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    closeTime: Number(row[6]),
    quoteVolume: Number(row[7]),
  };
}

function nextIntervalClose(timeframe: Timeframe): number {
  const interval = INTERVAL_MS[timeframe];
  return Math.floor(Date.now() / interval) * interval + interval + 1_500;
}

export class BinanceTechnicalEngine {
  private symbols: string[] = [];
  private readonly caches = new Map<Timeframe, TimeframeCache>();
  private readonly candles = new Map<Timeframe, Map<string, Candle[]>>();
  private readonly prices = new Map<string, number>();
  private readonly timers = new Map<Timeframe, ReturnType<typeof setTimeout>>();
  private initialized = false;
  private initializationError: string | null = null;
  private usedWeight = 0;
  private weightWindowStartedAt = Math.floor(Date.now() / 60_000) * 60_000;
  private cooldownUntil = 0;
  private activeRequests = 0;
  private readonly requestWaiters: Array<() => void> = [];

  constructor() {
    for (const timeframe of TIMEFRAMES) {
      this.caches.set(timeframe, { status: 'loading', updatedAt: null, symbols: {} });
      this.candles.set(timeframe, new Map());
    }
  }

  async start(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    void this.refreshLivePrices();
    setInterval(() => void this.refreshLivePrices(), 30_000);
    try {
      await this.loadSymbols();
      for (const timeframe of TIMEFRAMES) {
        console.info(`[TA] Loading ${timeframe}: ${this.symbols.length} USDT perpetuals`);
        await this.loadInitialTimeframe(timeframe);
        this.scheduleTimeframeRefresh(timeframe);
      }
      console.info(`[TA] Indicator cache ready for ${this.symbols.length} USDT perpetuals`);
    } catch (error) {
      this.initializationError = error instanceof Error ? error.message : String(error);
      console.error('[TA] Engine initialization failed', error);
    }
  }

  getTimeframe(timeframe: Timeframe) {
    const cache = this.caches.get(timeframe)!;
    return {
      timeframe,
      status: cache.status,
      updatedAt: cache.updatedAt,
      initializationError: this.initializationError,
      symbols: cache.symbols,
    };
  }

  private async loadSymbols(): Promise<void> {
    const exchangeInfo = await this.fetchJson('/fapi/v1/exchangeInfo');
    this.symbols = (exchangeInfo.symbols || [])
      .filter((item: any) => item.status === 'TRADING' && item.quoteAsset === 'USDT' && String(item.contractType).includes('PERPETUAL'))
      .map((item: any) => String(item.symbol))
      .sort();
    if (!this.symbols.length) throw new Error('Binance returned no active USDT perpetual symbols');
    for (const cache of this.caches.values()) {
      for (const symbol of this.symbols) cache.symbols[symbol] = { status: 'loading' };
    }
  }

  private async loadInitialTimeframe(timeframe: Timeframe): Promise<void> {
    const candlesBySymbol = this.candles.get(timeframe)!;
    await this.forEachConcurrent(this.symbols, async symbol => {
      try {
        const rows = await this.fetchJson(`/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&limit=${INITIAL_CANDLES}`);
        const parsed = (rows as any[]).map(parseKline).filter(c => Number.isFinite(c.close) && Number.isFinite(c.openTime));
        candlesBySymbol.set(symbol, parsed);
        this.updateSymbolCache(timeframe, symbol, parsed, 'ready');
      } catch (error) {
        this.setSymbolError(timeframe, symbol, error);
      }
    });
    const cache = this.caches.get(timeframe)!;
    cache.status = 'ready';
    cache.updatedAt = new Date().toISOString();
  }

  private scheduleTimeframeRefresh(timeframe: Timeframe): void {
    const timer = setTimeout(async () => {
      try {
        await this.refreshTimeframe(timeframe);
      } catch (error) {
        console.error(`[TA] ${timeframe} refresh failed`, error);
      } finally {
        this.scheduleTimeframeRefresh(timeframe);
      }
    }, Math.max(500, nextIntervalClose(timeframe) - Date.now()));
    this.timers.set(timeframe, timer);
  }

  private async refreshTimeframe(timeframe: Timeframe): Promise<void> {
    const candlesBySymbol = this.candles.get(timeframe)!;
    await this.forEachConcurrent(this.symbols, async symbol => {
      const current = candlesBySymbol.get(symbol);
      if (!current?.length) return;
      try {
        const rows = await this.fetchJson(`/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&limit=3`);
        const fresh = (rows as any[]).map(parseKline).filter(c => Number.isFinite(c.close) && Number.isFinite(c.openTime));
        const merged = new Map(current.map(c => [c.openTime, c]));
        for (const candle of fresh) merged.set(candle.openTime, candle);
        const updated = [...merged.values()].sort((a, b) => a.openTime - b.openTime).slice(-INITIAL_CANDLES);
        const latestClosedTime = updated.length > 1 ? updated[updated.length - 2].closeTime : -1;
        const previous = this.caches.get(timeframe)!.symbols[symbol] as Partial<SymbolTa> | undefined;
        if (latestClosedTime !== previous?.lastClosedCandleTime) {
          candlesBySymbol.set(symbol, updated);
          this.updateSymbolCache(timeframe, symbol, updated, 'ready');
        }
      } catch (error) {
        this.setSymbolError(timeframe, symbol, error, true);
      }
    });
    this.caches.get(timeframe)!.updatedAt = new Date().toISOString();
  }

  private updateSymbolCache(timeframe: Timeframe, symbol: string, rawCandles: Candle[], status: 'ready'): void {
    // Binance includes the active, still-forming candle as its last kline. Exclude it from every signal.
    const closedCandles = rawCandles.filter(candle => candle.closeTime < Date.now()).slice(-499);
    const indicators = calculateIndicators(closedCandles);
    if (!indicators) {
      this.caches.get(timeframe)!.symbols[symbol] = { status: 'loading' };
      return;
    }
    this.caches.get(timeframe)!.symbols[symbol] = {
      symbol,
      ...indicators,
      livePrice: this.prices.get(symbol) ?? null,
      updatedAt: new Date().toISOString(),
      status,
    };
  }

  private setSymbolError(timeframe: Timeframe, symbol: string, error: unknown, keepPrevious = false): void {
    const cache = this.caches.get(timeframe)!;
    const current = cache.symbols[symbol] as Partial<SymbolTa> | undefined;
    if (keepPrevious && current && current.status === 'ready') return;
    cache.symbols[symbol] = {
      status: 'error',
      symbol,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }

  private async refreshLivePrices(): Promise<void> {
    try {
      const rows = await this.fetchJson('/fapi/v1/ticker/price');
      for (const row of rows as any[]) {
        const price = Number(row.price);
        if (Number.isFinite(price)) this.prices.set(row.symbol, price);
      }
      for (const timeframe of TIMEFRAMES) {
        const cache = this.caches.get(timeframe)!;
        for (const [symbol, result] of Object.entries(cache.symbols)) {
          if (result.status === 'ready') result.livePrice = this.prices.get(symbol) ?? null;
        }
      }
    } catch (error) {
      console.warn('[TA] Live price refresh failed', error);
    }
  }

  private async forEachConcurrent<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
    let next = 0;
    const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        await fn(item);
      }
    });
    await Promise.all(workers);
  }

  private async beforeRequest(): Promise<void> {
    while (true) {
      const now = Date.now();
      const windowStart = Math.floor(now / 60_000) * 60_000;
      if (windowStart !== this.weightWindowStartedAt) {
        this.weightWindowStartedAt = windowStart;
        this.usedWeight = 0;
        this.cooldownUntil = 0;
      }
      const wait = Math.max(this.cooldownUntil - now, this.usedWeight >= RATE_LIMIT_PER_MINUTE * 0.8 ? windowStart + 60_100 - now : 0);
      if (wait <= 0) return;
      await sleep(wait);
    }
  }

  private noteWeight(response: Response): void {
    const header = Number(response.headers.get('X-MBX-USED-WEIGHT-1M'));
    if (!Number.isFinite(header)) return;
    const windowStart = Math.floor(Date.now() / 60_000) * 60_000;
    if (windowStart !== this.weightWindowStartedAt) {
      this.weightWindowStartedAt = windowStart;
      this.usedWeight = 0;
      this.cooldownUntil = 0;
    }
    this.usedWeight = Math.max(this.usedWeight, header);
    if (this.usedWeight >= RATE_LIMIT_PER_MINUTE * 0.8) {
      this.cooldownUntil = Math.max(this.cooldownUntil, windowStart + 60_100);
    }
  }

  private async acquireRequestSlot(): Promise<() => void> {
    if (this.activeRequests >= MAX_CONCURRENCY) await new Promise<void>(resolve => this.requestWaiters.push(resolve));
    else this.activeRequests++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.requestWaiters.shift();
      if (next) next();
      else this.activeRequests--;
    };
  }

  private async fetchJson(path: string): Promise<any> {
    let lastError: unknown;
    for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
      await this.beforeRequest();
      const releaseRequestSlot = await this.acquireRequestSlot();
      try {
        await this.beforeRequest();
        const response = await fetch(`${FUTURES_BASE}${path}`);
        this.noteWeight(response);
        if (response.status === 429 || response.status === 418) {
          const backoff = response.status === 418 ? Math.min(60_000, 5_000 * 2 ** attempt) : Math.min(30_000, 1_000 * 2 ** attempt);
          this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + backoff);
          throw new Error(`Binance rate limit ${response.status}; retrying after ${backoff}ms`);
        }
        if (!response.ok) throw new Error(`Binance ${response.status} for ${path}`);
        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt + 1 < RETRY_LIMIT) await sleep(Math.min(30_000, 500 * 2 ** attempt));
      } finally {
        releaseRequestSlot();
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
