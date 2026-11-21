type MarketType = 'Spot' | 'Futures';
type AssetClass = 'Crypto' | 'Stocks' | 'Commodities' | 'Indices' | 'Forex';
type Market = {
  id: string; marketType: MarketType; assetClass: AssetClass; hasPerpetualData: boolean;
  symbol: string; exchangeSymbol: string; quote: string; quoteUsd: number; price: number;
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
    const detail = (await response.text()).slice(0, 240).replace(/\s+/g, ' ');
    throw new Error(`${new URL(url).host} returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return response.json();
}
const quoteUsd = (quote: string) => stableQuotes.has(quote) ? 1 : Number.NaN;
const baseMarket = (exchange: Exchange, marketType: MarketType, exchangeSymbol: string, symbol: string, quote: string): Market => ({
  id: `${exchange}:${marketType}:${exchangeSymbol}`, marketType, assetClass: 'Crypto',
  hasPerpetualData: marketType === 'Futures', symbol, exchangeSymbol, quote, quoteUsd: quoteUsd(quote),
  price: Number.NaN, m5: Number.NaN, h1: Number.NaN, d1: Number.NaN,
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

async function binanceSnapshot(): Promise<Market[]> {
  const [spotInfo, spotTickers, futuresInfo, futuresTickers, premiums] = await Promise.all([
    json('https://data-api.binance.vision/api/v3/exchangeInfo'),
    json('https://data-api.binance.vision/api/v3/ticker/24hr'),
    json('https://fapi.binance.com/fapi/v1/exchangeInfo'),
    json('https://fapi.binance.com/fapi/v1/ticker/24hr'),
    json('https://fapi.binance.com/fapi/v1/premiumIndex'),
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
    market.d1 = finite(ticker.priceChangePercent);
    market.v24 = finite(ticker.quoteVolume);
    market.trades = finite(ticker.count);
    market.funding = finite((premiumBySymbol.get(ticker.symbol) as any)?.lastFundingRate);
    market.oi = finite((premiumBySymbol.get(ticker.symbol) as any)?.openInterest);
    markets.push(market);
  }
  return markets;
}

async function bybitSnapshot(): Promise<Market[]> {
  const categories = ['spot', 'linear'] as const;
  const data = await Promise.all(categories.map(async category => {
    const [instruments, tickers] = await Promise.all([
      json(`https://api.bybit.com/v5/market/instruments-info?category=${category}&limit=1000`),
      json(`https://api.bybit.com/v5/market/tickers?category=${category}`),
    ]);
    if (instruments.retCode !== 0 || tickers.retCode !== 0) throw new Error(`Bybit ${category} API returned an error`);
    let instrumentRows = instruments.result?.list || [];
    let cursor = instruments.result?.nextPageCursor;
    while (category === 'linear' && cursor) {
      const page = await json(`https://api.bybit.com/v5/market/instruments-info?category=linear&limit=1000&cursor=${encodeURIComponent(cursor)}`);
      if (page.retCode !== 0) throw new Error('Bybit linear instrument paging failed');
      instrumentRows = instrumentRows.concat(page.result?.list || []);
      cursor = page.result?.nextPageCursor;
    }
    return { category, instruments: instrumentRows, tickers: tickers.result?.list || [] };
  }));
  const markets: Market[] = [];
  for (const group of data) {
    const metadata = new Map(group.instruments.filter((row: any) => row.status === 'Trading').map((row: any) => [row.symbol, row]));
    for (const ticker of group.tickers) {
      const meta: any = metadata.get(ticker.symbol);
      if (!meta) continue;
      const marketType = group.category === 'spot' ? 'Spot' : 'Futures';
      const market = baseMarket('Bybit', marketType, ticker.symbol, ticker.symbol, meta.quoteCoin || '');
      market.hasPerpetualData = marketType === 'Futures' && String(meta.contractType || '').toLowerCase().includes('perpetual');
      market.price = finite(ticker.lastPrice);
      market.d1 = finite(ticker.price24hPcnt) * 100;
      market.h1 = Number.isFinite(finite(ticker.prevPrice1h)) && finite(ticker.prevPrice1h) !== 0
        ? (market.price / finite(ticker.prevPrice1h) - 1) * 100 : Number.NaN;
      market.v24 = finite(ticker.turnover24h);
      market.trades = finite(ticker.totalVolume);
      market.funding = finite(ticker.fundingRate);
      market.oi = finite(ticker.openInterestValue);
      markets.push(market);
    }
  }
  return markets;
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
    market.d1 = finite(ticker.change_percentage);
    market.v24 = finite(ticker.volume_24h_quote ?? ticker.volume_24h_usd ?? ticker.volume_24h);
    market.funding = finite(ticker.funding_rate);
    market.oi = finite(ticker.total_size);
    markets.push(market);
  }
  return markets;
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
    if (!['/snapshot', '/stream'].includes(url.pathname)) return respond({ error: 'Not found' }, 404);
    if (url.pathname === '/snapshot' && request.method !== 'GET') return respond({ error: 'GET only' }, 405);
    if (url.pathname === '/stream' && request.method !== 'GET') return respond({ error: 'GET only' }, 405);
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
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private readSnapshot(exchange: Exchange): Snapshot | null {
    const rows = this.ctx.storage.sql.exec<{ payload: string }>('SELECT payload FROM snapshots WHERE exchange = ?', exchange);
    const row = rows.toArray()[0];
    if (!row) return null;
    try { return JSON.parse(row.payload) as Snapshot; } catch { return null; }
  }

  private async refresh() {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      await Promise.all(exchanges.map(async exchange => {
        try {
          const markets = await snapshotLoaders[exchange]();
          const snapshot: Snapshot = { exchange, updatedAt: new Date().toISOString(), markets };
          this.ctx.storage.sql.exec('INSERT INTO snapshots (exchange, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(exchange) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at', exchange, JSON.stringify(snapshot), snapshot.updatedAt);
          const serialized = JSON.stringify({ type: 'snapshot', ...snapshot });
          for (const socket of this.ctx.getWebSockets()) {
            const attachment = socket.deserializeAttachment() as { exchange?: Exchange } | null;
            if (attachment?.exchange === exchange) {
              try { socket.send(serialized); } catch { /* a reconnecting client will receive the next snapshot */ }
            }
          }
        } catch (error) {
          console.error(`Market snapshot refresh failed for ${exchange}: ${error instanceof Error ? error.message : String(error)}`);
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
      await this.refresh();
      return respond({ ok: true, refreshedAt: new Date().toISOString() });
    }
    if (!exchange || !exchanges.includes(exchange)) return respond({ error: 'A supported exchange is required' }, 400);
    if (url.pathname === '/snapshot') {
      let snapshot = this.readSnapshot(exchange);
      if (!snapshot) {
        await this.refresh();
        snapshot = this.readSnapshot(exchange);
      }
      if (!snapshot) return respond({ exchange, status: 'loading', updatedAt: null, markets: [] }, 503);
      return respond(snapshot, 200, { 'cache-control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=30' });
    }
    if (url.pathname === '/stream') {
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

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (message === 'ping') socket.send('pong');
  }

  webSocketClose(socket: WebSocket, code: number, reason: string) {
    try { socket.close(code, reason); } catch { /* already closed */ }
  }
}
