type MarketType = 'Spot' | 'Futures' | 'Options' | 'CFD';
type AssetClass = 'Crypto' | 'Stocks' | 'Commodities' | 'Indices' | 'Forex';
type Market = {
  id: string; marketType: MarketType; assetClass: AssetClass; hasPerpetualData: boolean;
  symbol: string; exchangeSymbol: string; quote: string; quoteUsd: number; price: number; high24h: number;
  m5: number; h1: number; d1: number; v1: number; v15: number; v24: number;
  oi: number; oiChange: number; funding: number; vol: number; trades: number;
  trend: number[]; metrics: Record<string, number>;
};
type Exchange = 'Binance' | 'Bybit' | 'Gate';
type Snapshot = { exchange: Exchange; updatedAt: string; markets: Market[] };
type Env = { MARKET_FEED: DurableObjectNamespace };

const exchanges: Exchange[] = ['Binance', 'Bybit', 'Gate'];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};
const stableQuotes = new Set(['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'USDP', 'DAI', 'USD', 'USD1', 'USDE']);
const finite = (value: unknown, fallback = Number.NaN) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const respond = (value: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(value), {
  status,
  headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});
async function json(url: string) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    const endpoint = new URL(url);
    const detail = (await response.text()).slice(0, 240).replace(/\s+/g, ' ');
    throw new Error(`${endpoint.host}${endpoint.pathname} returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return response.json();
}
const quoteUsd = (quote: string) => stableQuotes.has(quote) ? 1 : Number.NaN;
const applyQuoteRates = (markets: Market[]) => {
  const spotPrices = new Map(markets.filter(market => market.marketType === 'Spot').map(market => [market.symbol, market.price]));
  for (const market of markets) {
    if (stableQuotes.has(market.quote)) { market.quoteUsd = 1; continue; }
    const direct = spotPrices.get(`${market.quote}USDT`);
    const inverse = spotPrices.get(`USDT${market.quote}`);
    market.quoteUsd = typeof direct === 'number' && Number.isFinite(direct)
      ? direct
      : typeof inverse === 'number' && Number.isFinite(inverse) && inverse > 0 ? 1 / inverse : Number.NaN;
  }
  return markets;
};
const baseMarket = (exchange: Exchange, marketType: MarketType, exchangeSymbol: string, symbol: string, quote: string): Market => ({
  id: `${exchange}:${marketType}:${exchangeSymbol}`, marketType, assetClass: 'Crypto',
  hasPerpetualData: marketType === 'Futures', symbol, exchangeSymbol, quote, quoteUsd: quoteUsd(quote),
  price: Number.NaN, high24h: Number.NaN, m5: Number.NaN, h1: Number.NaN, d1: Number.NaN,
  v1: Number.NaN, v15: Number.NaN, v24: Number.NaN, oi: Number.NaN,
  oiChange: Number.NaN, funding: Number.NaN, vol: Number.NaN, trades: Number.NaN,
  trend: [], metrics: {},
});
const classifyBinance = (type: string): AssetClass => {
  if (['EQUITY', 'HK_EQUITY', 'KR_EQUITY', 'CN_EQUITY', 'PREMARKET'].includes(type)) return 'Stocks';
  if (type === 'COMMODITY') return 'Commodities';
  if (type === 'INDEX') return 'Indices';
  if (type === 'FX') return 'Forex';
  return 'Crypto';
};
const classifyBybit = (type: string): AssetClass => {
  switch (type.toLowerCase()) {
    case 'xstocks':
    case 'mstocks':
    case 'stock':
    case 'etf':
      return 'Stocks';
    case 'commodity':
      return 'Commodities';
    case 'forex':
      return 'Forex';
    default:
      return 'Crypto';
  }
};
const classifyBybitUnderlying = (type: unknown): AssetClass => {
  switch (String(type)) {
    case '1':
    case '4': return 'Commodities'; // Commodity and oil options
    case '2': return 'Stocks';
    case '3': return 'Forex';
    default: return 'Crypto';
  }
};

async function binanceSnapshot(): Promise<Market[]> {
  const [spotInfo, spotTickers, futuresInfo, futuresTickers, premiums] = await Promise.all([
    json('https://data-api.binance.vision/api/v3/exchangeInfo'),
    json('https://data-api.binance.vision/api/v3/ticker/24hr'),
    json('https://fapi.binance.com/fapi/v1/exchangeInfo'),
    json('https://fapi.binance.com/fapi/v1/ticker/24hr'),
    json('https://fapi.binance.com/fapi/v1/premiumIndex').catch(error => {
      console.warn(`Binance funding data unavailable: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }),
  ]);
  const spotMeta = new Map((spotInfo.symbols || []).filter((s: any) => s.status === 'TRADING').map((s: any) => [s.symbol, s]));
  const futuresMeta = new Map((futuresInfo.symbols || []).filter((s: any) => s.status === 'TRADING').map((s: any) => [s.symbol, s]));
  const premiumBySymbol = new Map((premiums || []).map((p: any) => [p.symbol, p]));
  const markets: Market[] = [];
  for (const ticker of spotTickers || []) {
    const meta: any = spotMeta.get(ticker.symbol);
    if (!meta) continue;
    const market = baseMarket('Binance', 'Spot', ticker.symbol, ticker.symbol, meta.quoteAsset);
    market.price = finite(ticker.lastPrice);
    market.high24h = finite(ticker.highPrice);
    market.d1 = finite(ticker.priceChangePercent);
    market.v24 = finite(ticker.quoteVolume);
    market.trades = finite(ticker.count);
    markets.push(market);
  }
  for (const ticker of futuresTickers || []) {
    const meta: any = futuresMeta.get(ticker.symbol);
    if (!meta) continue;
    const market = baseMarket('Binance', 'Futures', ticker.symbol, ticker.symbol, meta.quoteAsset);
    market.assetClass = classifyBinance(String(meta.underlyingType || 'COIN'));
    market.hasPerpetualData = String(meta.contractType).includes('PERPETUAL');
    market.price = finite(ticker.lastPrice);
    market.high24h = finite(ticker.highPrice);
    market.d1 = finite(ticker.priceChangePercent);
    market.v24 = finite(ticker.quoteVolume);
    market.trades = finite(ticker.count);
    market.funding = finite((premiumBySymbol.get(ticker.symbol) as any)?.lastFundingRate);
    market.oi = finite((premiumBySymbol.get(ticker.symbol) as any)?.openInterest);
    markets.push(market);
  }
  return applyQuoteRates(markets);
}

async function bybitSnapshot(): Promise<Market[]> {
  const categories = ['spot', 'linear', 'inverse'] as const;
  const data = await Promise.all(categories.map(async category => {
    const symbolTypes = category === 'spot' ? ['xstocks', 'mstocks'] : category === 'linear' ? ['commodity', 'stock', 'forex', 'ETF'] : [];
    const fetchInstruments = async (symbolType?: string) => {
      const rows: any[] = [];
      let cursor = '';
      do {
        const params = new URLSearchParams({ category, limit: '1000' });
        if (symbolType) params.set('symbolType', symbolType);
        if (cursor) params.set('cursor', cursor);
        const page = await json(`https://api.bybit.com/v5/market/instruments-info?${params}`);
        if (page.retCode !== 0) throw new Error(`Bybit ${category}${symbolType ? ` ${symbolType}` : ''} instrument request failed`);
        rows.push(...(page.result?.list || []));
        cursor = page.result?.nextPageCursor || '';
      } while (cursor);
      return rows;
    };
    const [instrumentGroups, tickers] = await Promise.all([
      Promise.all([fetchInstruments(), ...symbolTypes.map(type => fetchInstruments(type))]),
      json(`https://api.bybit.com/v5/market/tickers?category=${category}`),
    ]);
    if (tickers.retCode !== 0) throw new Error(`Bybit ${category} ticker API returned an error`);
    const instrumentRows = new Map(instrumentGroups.flat().map((row: any) => [row.symbol, row]));
    return { category, instruments: [...instrumentRows.values()], tickers: tickers.result?.list || [] };
  }));
  const markets: Market[] = [];
  for (const group of data) {
    const metadata = new Map(group.instruments
      .filter((row: any) => row.status === 'Trading')
      .map((row: any) => [row.symbol, row]));
    for (const ticker of group.tickers) {
      const meta: any = metadata.get(ticker.symbol);
      if (!meta) continue;
      const marketType: MarketType = group.category === 'spot' ? 'Spot' : 'Futures';
      const market = baseMarket('Bybit', marketType, ticker.symbol, ticker.symbol, meta.quoteCoin || meta.settleCoin || 'USD');
      market.assetClass = classifyBybit(String(meta.symbolType || ''));
      market.hasPerpetualData = marketType === 'Futures' && String(meta.contractType || '').toLowerCase().includes('perpetual');
      market.price = finite(ticker.lastPrice);
      market.high24h = finite(ticker.highPrice24h);
      market.d1 = finite(ticker.price24hPcnt) * 100;
      market.h1 = Number.isFinite(finite(ticker.prevPrice1h)) && finite(ticker.prevPrice1h) !== 0
        ? (market.price / finite(ticker.prevPrice1h) - 1) * 100 : Number.NaN;
      market.v24 = finite(ticker.turnover24h);
      // Bybit totalVolume is traded quantity, not the number of executions.
      // Exact trade counts are populated only when an exchange supplies them.
      market.trades = Number.NaN;
      market.funding = finite(ticker.fundingRate);
      market.oi = finite(ticker.openInterestValue);
      markets.push(market);
    }
  }
  const optionBases: any = await json('https://api.bybit.com/v5/market/option/base-coins');
  if (optionBases.retCode !== 0) throw new Error('Bybit option base coin API returned an error');
  const activeBases = (optionBases.result?.list || []).filter((base: any) => Number(base.hasSymbol) === 1);
  for (let offset = 0; offset < activeBases.length; offset += 5) {
    const batch = activeBases.slice(offset, offset + 5);
    const optionGroups = await Promise.all(batch.map(async (base: any) => {
      const params = new URLSearchParams({ category: 'option', baseCoin: base.baseCoin, limit: '1000' });
      const instrumentRows: any[] = [];
      let cursor = '';
      do {
        if (cursor) params.set('cursor', cursor);
        const instruments: any = await json(`https://api.bybit.com/v5/market/instruments-info?${params}`);
        if (instruments.retCode !== 0) throw new Error(`Bybit option instruments failed for ${base.baseCoin}`);
        instrumentRows.push(...(instruments.result?.list || []));
        cursor = instruments.result?.nextPageCursor || '';
      } while (cursor);
      const tickers: any = await json(`https://api.bybit.com/v5/market/tickers?category=option&baseCoin=${encodeURIComponent(base.baseCoin)}`);
      if (tickers.retCode !== 0) throw new Error(`Bybit option tickers failed for ${base.baseCoin}`);
      return { base, instruments: instrumentRows, tickers: tickers.result?.list || [] };
    }));
    for (const group of optionGroups) {
      const metadata = new Map(group.instruments.filter((row: any) => row.status === 'Trading').map((row: any) => [row.symbol, row]));
      for (const ticker of group.tickers) {
        const meta: any = metadata.get(ticker.symbol);
        if (!meta) continue;
        const quote = String(meta.quoteCoin || meta.settleCoin || group.base.quoteCoin || 'USDT');
        const market = baseMarket('Bybit', 'Options', ticker.symbol, ticker.symbol, quote);
        market.assetClass = classifyBybitUnderlying(group.base.underlyingType);
        market.hasPerpetualData = false;
        market.price = finite(ticker.lastPrice);
      market.high24h = finite(ticker.highPrice24h);
        const change24h = finite(ticker.change24h);
        const previousPrice = market.price - change24h;
        market.d1 = Number.isFinite(previousPrice) && previousPrice !== 0 ? change24h / previousPrice * 100 : Number.NaN;
        market.v24 = finite(ticker.turnover24h);
        market.metrics = {
          bid: finite(ticker.bid1Price), ask: finite(ticker.ask1Price), markPrice: finite(ticker.markPrice),
          impliedVolatility: finite(ticker.markIv), delta: finite(ticker.delta), gamma: finite(ticker.gamma),
          vega: finite(ticker.vega), theta: finite(ticker.theta), underlyingPrice: finite(ticker.underlyingPrice),
        };
        markets.push(market);
      }
    }
  }
  return applyQuoteRates(markets);
}

async function gateSnapshot(): Promise<Market[]> {
  const [pairs, spotTickers, contracts, futuresTickers] = await Promise.all([
    json('https://api.gateio.ws/api/v4/spot/currency_pairs'),
    json('https://api.gateio.ws/api/v4/spot/tickers'),
    json('https://api.gateio.ws/api/v4/futures/usdt/contracts'),
    json('https://api.gateio.ws/api/v4/futures/usdt/tickers'),
  ]);
  const spotMeta = new Map((pairs || []).filter((pair: any) => pair.trade_status === 'tradable').map((pair: any) => [pair.id, pair]));
  const contractMeta = new Map((contracts || []).map((contract: any) => [contract.name, contract]));
  const markets: Market[] = [];
  for (const ticker of spotTickers || []) {
    const meta: any = spotMeta.get(ticker.currency_pair);
    if (!meta) continue;
    const market = baseMarket('Gate', 'Spot', ticker.currency_pair, `${meta.base}${meta.quote}`, meta.quote);
    market.price = finite(ticker.last);
    market.high24h = finite(ticker.high_24h);
    market.d1 = finite(ticker.change_percentage);
    market.v24 = finite(ticker.quote_volume);
    markets.push(market);
  }
  for (const ticker of futuresTickers || []) {
    const meta: any = contractMeta.get(ticker.contract);
    if (!meta || meta.in_delisting || (meta.status && meta.status !== 'trading')) continue;
    const [base, quote = 'USDT'] = String(ticker.contract).split('_');
    const market = baseMarket('Gate', 'Futures', ticker.contract, `${base}${quote}`, quote);
    market.price = finite(ticker.last);
    market.high24h = finite(ticker.high_24h);
    market.d1 = finite(ticker.change_percentage);
    market.v24 = finite(ticker.volume_24h_quote ?? ticker.volume_24h_usd ?? ticker.volume_24h);
    market.funding = finite(ticker.funding_rate);
    // Gate total_size is a contract count. Convert contracts to quote notional
    // using the contract multiplier and last price so it matches OI $ columns.
    const contractSize = finite(meta.quanto_multiplier);
    const contractCount = finite(ticker.total_size);
    market.oi = Number.isFinite(contractSize) && Number.isFinite(contractCount)
      ? contractCount * contractSize * market.price : Number.NaN;
    markets.push(market);
  }
  return applyQuoteRates(markets);
}

const snapshotLoaders: Record<Exchange, () => Promise<Market[]>> = {
  Binance: binanceSnapshot,
  Bybit: bybitSnapshot,
  Gate: gateSnapshot,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);
    const exchange = url.searchParams.get('exchange') as Exchange | null;
    if (url.pathname === '/health') return respond({ ok: true, exchanges });
    if (!['/snapshot', '/stream', '/details'].includes(url.pathname)) return respond({ error: 'Not found' }, 404);
    if (['/snapshot', '/stream', '/details'].includes(url.pathname) && request.method !== 'GET') return respond({ error: 'GET only' }, 405);
    if (exchange && !exchanges.includes(exchange)) return respond({ error: 'Unsupported exchange' }, 400);
    const id = env.MARKET_FEED.idFromName('global-market-feed');
    return env.MARKET_FEED.get(id).fetch(new Request(`https://market-feed.internal${url.pathname}${url.search}`, request));
  },
  async scheduled(_controller: ScheduledController, env: Env) {
    const id = env.MARKET_FEED.idFromName('global-market-feed');
    await env.MARKET_FEED.get(id).fetch('https://market-feed.internal/_scheduled_refresh', { method: 'POST' });
  },
};

export class MarketFeed {
  private ctx: DurableObjectState;
  private refreshing: Promise<void> | null = null;

  constructor(ctx: DurableObjectState) {
    this.ctx = ctx;
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS snapshots (exchange TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS snapshot_errors (exchange TEXT PRIMARY KEY, message TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS market_details (cache_key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private readSnapshot(exchange: Exchange): Snapshot | null {
    const rows = this.ctx.storage.sql.exec<{ payload: string }>('SELECT payload FROM snapshots WHERE exchange = ?', exchange);
    const row = rows.toArray()[0];
    if (!row) return null;
    try { return JSON.parse(row.payload) as Snapshot; } catch { return null; }
  }

  private readError(exchange: Exchange): string | null {
    const rows = this.ctx.storage.sql.exec<{ message: string }>('SELECT message FROM snapshot_errors WHERE exchange = ?', exchange);
    return rows.toArray()[0]?.message ?? null;
  }

  private async refresh(targetExchanges: Exchange[] = exchanges) {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      await Promise.all(targetExchanges.map(async exchange => {
        try {
          const markets = await snapshotLoaders[exchange]();
          const snapshot: Snapshot = { exchange, updatedAt: new Date().toISOString(), markets };
          this.ctx.storage.sql.exec('INSERT INTO snapshots (exchange, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(exchange) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at', exchange, JSON.stringify(snapshot), snapshot.updatedAt);
          this.ctx.storage.sql.exec('DELETE FROM snapshot_errors WHERE exchange = ?', exchange);
          const serialized = JSON.stringify({ type: 'snapshot', ...snapshot });
          for (const socket of this.ctx.getWebSockets()) {
            const attachment = socket.deserializeAttachment() as { exchange?: Exchange } | null;
            if (attachment?.exchange === exchange) {
              try { socket.send(serialized); } catch { /* a reconnecting client will receive the next snapshot */ }
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.ctx.storage.sql.exec('INSERT INTO snapshot_errors (exchange, message, updated_at) VALUES (?, ?, ?) ON CONFLICT(exchange) DO UPDATE SET message = excluded.message, updated_at = excluded.updated_at', exchange, message, new Date().toISOString());
          console.error(`Market snapshot refresh failed for ${exchange}: ${message}`);
        }
      }));
    })().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const exchange = url.searchParams.get('exchange') as Exchange | null;
    // This internal route is only called by the Worker's Cron Trigger. It is not
    // forwarded by the public Worker entry point, so visitors cannot force
    // repeated upstream exchange requests.
    if (url.pathname === '/_scheduled_refresh') {
      if (request.method !== 'POST') return respond({ error: 'POST only' }, 405);
      await this.refresh(['Bybit', 'Gate']);
      return respond({ ok: true, refreshedAt: new Date().toISOString() });
    }
    if (!exchange || !exchanges.includes(exchange)) return respond({ error: 'A supported exchange is required' }, 400);
    if (url.pathname === '/details') {
      const marketType = url.searchParams.get('marketType');
      const symbol = url.searchParams.get('symbol') || '';
      const exchangeSymbol = url.searchParams.get('exchangeSymbol') || symbol;
      const quote = url.searchParams.get('quote') || 'USDT';
      const timeframe = url.searchParams.get('timeframe');
      const candleLimit = Math.max(200, Math.min(1000, Number(url.searchParams.get('limit')) || 300));
      if (!['Spot', 'Futures', 'Options'].includes(marketType || '') || !/^[A-Z0-9_-]{1,40}$/.test(symbol)
        || !/^[A-Z0-9_-]{1,40}$/.test(exchangeSymbol) || !/^[A-Z0-9]{2,12}$/.test(quote)) {
        return respond({ error: 'marketType, symbol and quote are required' }, 400);
      }
      if (timeframe && !['5m','15m','1h','4h','8h','12h','1d'].includes(timeframe)) return respond({ error: 'Unsupported timeframe' }, 400);
      const snapshot = this.readSnapshot(exchange);
      if (!snapshot?.markets.some(market => market.marketType === marketType && market.exchangeSymbol === exchangeSymbol)) {
        return respond({ error: 'Market is not in the current exchange snapshot' }, 404);
      }
      const cacheKey = timeframe ? `${exchange}:${marketType}:${exchangeSymbol}:${timeframe}:${candleLimit}` : `${exchange}:${marketType}:${exchangeSymbol}`;
      const cached = this.ctx.storage.sql.exec<{ payload: string; updated_at: number }>(
        'SELECT payload, updated_at FROM market_details WHERE cache_key = ?', cacheKey,
      ).toArray()[0];
      if (cached && Date.now() - cached.updated_at < 45_000) {
        return respond(JSON.parse(cached.payload), 200, { 'cache-control': 'public, max-age=0, s-maxage=15' });
      }
      try {
        const payload = timeframe
          ? { exchange, marketType, symbol, timeframe, candles: await this.loadIndicatorCandles(exchange, marketType as MarketType, symbol, exchangeSymbol, quote, timeframe, candleLimit), updatedAt: new Date().toISOString() }
          : await this.loadDetails(exchange, marketType as MarketType, symbol, exchangeSymbol, quote);
        this.ctx.storage.sql.exec(
          'INSERT INTO market_details (cache_key, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at',
          cacheKey, JSON.stringify(payload), Date.now(),
        );
        return respond(payload, 200, { 'cache-control': 'public, max-age=0, s-maxage=15' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (cached) return respond({ ...JSON.parse(cached.payload), stale: true, error: message });
        return respond({ error: message }, 502);
      }
    }
    if (url.pathname === '/snapshot') {
      let snapshot = this.readSnapshot(exchange);
      if (!snapshot) {
        if (exchange === 'Binance') return respond({ exchange, status: 'disabled', updatedAt: null, markets: [], error: 'Binance data is loaded directly by the screener browser; connect to a VPN that can access Binance.' }, 503);
        await this.refresh([exchange]);
        snapshot = this.readSnapshot(exchange);
      }
      if (!snapshot) return respond({ exchange, status: 'loading', updatedAt: null, markets: [], error: this.readError(exchange) }, 503);
      return respond(snapshot, 200, { 'cache-control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=30' });
    }
    if (url.pathname === '/stream') {
      if (exchange === 'Binance') return respond({ error: 'Binance uses the browser network because the Worker network is blocked by Binance.' }, 503);
      if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return respond({ error: 'WebSocket upgrade required' }, 426);
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.serializeAttachment({ exchange });
      this.ctx.acceptWebSocket(server);
      const snapshot = this.readSnapshot(exchange);
      if (snapshot) server.send(JSON.stringify({ type: 'snapshot', ...snapshot }));
      else void this.refresh();
      return new Response(null, { status: 101, webSocket: client, headers: cors });
    }
    return respond({ error: 'Not found' }, 404);
  }

  private async loadIndicatorCandles(exchange: Exchange, marketType: MarketType, symbol: string, exchangeSymbol: string, quote: string, timeframe: string, limit: number): Promise<number[][]> {
    const stepMs: Record<string,number> = { '5m':300_000, '15m':900_000, '1h':3_600_000, '4h':14_400_000, '8h':28_800_000, '12h':43_200_000, '1d':86_400_000 };
    const requestedStep = stepMs[timeframe];
    const sourceTimeframe = exchange === 'Bybit' && timeframe === '8h' || timeframe === '12h' && exchange !== 'Bybit' ? '4h' : timeframe;
    const sourceStep = stepMs[sourceTimeframe];
    const factor = Math.max(1, Math.round(requestedStep / sourceStep));
    const sourceLimit = Math.min(1000, limit * factor);
    let rows: number[][];
    if (exchange === 'Bybit') {
      const category = marketType === 'Spot' ? 'spot' : quote === 'USD' ? 'inverse' : 'linear';
      const interval: Record<string,string> = { '5m':'5', '15m':'15', '1h':'60', '4h':'240', '8h':'240', '12h':'720', '1d':'D' };
      const result: any = await json(`https://api.bybit.com/v5/market/kline?category=${category}&symbol=${encodeURIComponent(symbol)}&interval=${interval[sourceTimeframe]}&limit=${sourceLimit}`);
      if (result.retCode !== 0) throw new Error(`Bybit kline API returned ${result.retCode}`);
      rows = (result.result?.list || []).map((row:any[]) => {
        const openTime = finite(row[0]);
        return [openTime,finite(row[1]),finite(row[2]),finite(row[3]),finite(row[4]),finite(row[5]),openTime+sourceStep-1,finite(row[6]),NaN,NaN];
      }).sort((a:number[],b:number[])=>a[0]-b[0]);
    } else {
      const interval: Record<string,string> = { '5m':'5m', '15m':'15m', '1h':'1h', '4h':'4h', '8h':'8h', '12h':'4h', '1d':'1d' };
      const path = marketType === 'Spot'
        ? `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(exchangeSymbol)}&interval=${interval[sourceTimeframe]}&limit=${sourceLimit}`
        : `https://api.gateio.ws/api/v4/futures/${quote.toLowerCase()}/candlesticks?contract=${encodeURIComponent(exchangeSymbol)}&interval=${interval[sourceTimeframe]}&limit=${sourceLimit}`;
      const data:any[] = await json(path);
      rows = data.map((row:any) => {
        if (marketType === 'Spot') { const t=finite(row[0])*1000; return [t,finite(row[5]),finite(row[3]),finite(row[4]),finite(row[2]),finite(row[6]),t+sourceStep-1,finite(row[1]),NaN,NaN]; }
        const t=finite(row.t)*1000; return [t,finite(row.o),finite(row.h),finite(row.l),finite(row.c),finite(row.v),t+sourceStep-1,finite(row.sum),NaN,NaN];
      }).sort((a:number[],b:number[])=>a[0]-b[0]);
    }
    if (factor === 1) return rows.slice(-limit);
    const groups = new Map<number,number[][]>();
    for (const row of rows) { const bucket=Math.floor(row[0]/requestedStep)*requestedStep; const group=groups.get(bucket)||[]; group.push(row); groups.set(bucket,group); }
    return [...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([openTime,group])=>[
      openTime,group[0][1],Math.max(...group.map(row=>row[2])),Math.min(...group.map(row=>row[3])),group.at(-1)![4],group.reduce((sum,row)=>sum+row[5],0),openTime+requestedStep-1,group.reduce((sum,row)=>sum+row[7],0),group.reduce((sum,row)=>sum+(Number.isFinite(row[8])?row[8]:0),0),group.reduce((sum,row)=>sum+(Number.isFinite(row[9])?row[9]:0),0),
    ]).slice(-limit);
  }

  private async loadDetails(exchange: Exchange, marketType: MarketType, symbol: string, exchangeSymbol: string, quote: string) {
    const interval = '1m';
    const minuteLimit = '30';
    const hourLimit = '96';
    const getBars = async (timeframe: '1m' | '1h', limit: string) => {
      if (marketType === 'Options') return [];
      if (exchange === 'Binance') {
        const host = marketType === 'Spot' ? 'https://data-api.binance.vision/api/v3/klines' : 'https://fapi.binance.com/fapi/v1/klines';
        const rows: any[] = await json(`${host}?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&limit=${limit}`);
        return rows.map(row => row.map((value: unknown) => finite(value)));
      }
      if (exchange === 'Bybit') {
        const category = marketType === 'Spot' ? 'spot' : quote === 'USD' ? 'inverse' : 'linear';
        const result: any = await json(`https://api.bybit.com/v5/market/kline?category=${category}&symbol=${encodeURIComponent(symbol)}&interval=${timeframe === '1m' ? '1' : '60'}&limit=${limit}`);
        if (result.retCode !== 0) throw new Error(`Bybit kline API returned ${result.retCode}`);
        return (result.result?.list || []).map((row: any[]) => {
          const openTime = finite(row[0]);
          return [openTime, finite(row[1]), finite(row[2]), finite(row[3]), finite(row[4]), finite(row[5]), openTime + (timeframe === '1m' ? 60_000 : 3_600_000) - 1, finite(row[6]), Number.NaN];
        }).sort((a: number[], b: number[]) => a[0] - b[0]);
      }
      const path = marketType === 'Spot'
        ? `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(exchangeSymbol)}&interval=${timeframe}&limit=${limit}`
        : `https://api.gateio.ws/api/v4/futures/${quote.toLowerCase()}/candlesticks?contract=${encodeURIComponent(exchangeSymbol)}&interval=${timeframe}&limit=${limit}`;
      const rows: any[] = await json(path);
      return rows.map((row: any) => {
        if (marketType === 'Spot') {
          const openTime = finite(row[0]) * 1000;
          return [openTime, finite(row[5]), finite(row[3]), finite(row[4]), finite(row[2]), finite(row[6]), openTime + (timeframe === '1m' ? 60_000 : 3_600_000) - 1, finite(row[1]), Number.NaN];
        }
        const openTime = finite(row.t) * 1000;
        return [openTime, finite(row.o), finite(row.h), finite(row.l), finite(row.c), finite(row.v), openTime + (timeframe === '1m' ? 60_000 : 3_600_000) - 1, finite(row.sum), Number.NaN];
      }).sort((a: number[], b: number[]) => a[0] - b[0]);
    };
    const [minutes, hours, oiHistory] = await Promise.all([
      getBars(interval, minuteLimit),
      getBars('1h', hourLimit),
      marketType === 'Futures' ? this.loadOiHistory(exchange, symbol, exchangeSymbol, quote).catch(() => ({ fiveMinute: [], hourly: [] })) : Promise.resolve({ fiveMinute: [], hourly: [] }),
    ]);
    return { exchange, marketType, symbol, minutes, hours, fiveMinute: oiHistory.fiveMinute, hourly: oiHistory.hourly, updatedAt: new Date().toISOString() };
  }

  private async loadOiHistory(exchange: Exchange, symbol: string, exchangeSymbol: string, quote: string) {
    if (exchange === 'Binance') {
      const [fiveMinute, hourly]: any[][] = await Promise.all([
        json(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${encodeURIComponent(symbol)}&period=5m&limit=200`),
        json(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${encodeURIComponent(symbol)}&period=1h&limit=30`),
      ]);
      return { fiveMinute: fiveMinute.map(row => ({ time: finite(row.timestamp), value: finite(row.sumOpenInterest) })), hourly: hourly.map(row => ({ time: finite(row.timestamp), value: finite(row.sumOpenInterest) })) };
    }
    if (exchange === 'Bybit') {
      const category = quote === 'USD' ? 'inverse' : 'linear';
      const [fiveMinute, hourly]: any[] = await Promise.all([
        json(`https://api.bybit.com/v5/market/open-interest?category=${category}&symbol=${encodeURIComponent(symbol)}&intervalTime=5min&limit=200`),
        json(`https://api.bybit.com/v5/market/open-interest?category=${category}&symbol=${encodeURIComponent(symbol)}&intervalTime=1h&limit=30`),
      ]);
      if (fiveMinute.retCode !== 0 || hourly.retCode !== 0) throw new Error('Bybit open-interest API returned an error');
      const map = (result: any) => (result.result?.list || []).map((row: any) => ({ time: finite(row.timestamp), value: finite(row.openInterest) })).sort((a: any, b: any) => a.time - b.time);
      return { fiveMinute: map(fiveMinute), hourly: map(hourly) };
    }
    const [fiveMinute, hourly]: any[][] = await Promise.all([
      json(`https://api.gateio.ws/api/v4/futures/${quote.toLowerCase()}/contract_stats?contract=${encodeURIComponent(exchangeSymbol)}&interval=5m&limit=200`),
      json(`https://api.gateio.ws/api/v4/futures/${quote.toLowerCase()}/contract_stats?contract=${encodeURIComponent(exchangeSymbol)}&interval=1h&limit=30`),
    ]);
    const map = (rows: any[]) => rows.map(row => ({ time: finite(row.time) * 1000, value: finite(row.open_interest ?? row.open_interest_usd) })).sort((a, b) => a.time - b.time);
    return { fiveMinute: map(fiveMinute), hourly: map(hourly) };
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (message === 'ping') socket.send('pong');
  }

  webSocketClose(socket: WebSocket, code: number, reason: string) {
    try { socket.close(code, reason); } catch { /* already closed */ }
  }
}
