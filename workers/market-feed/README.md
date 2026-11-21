# Bicara Krypto Pulse shared market feed

This Worker is the staging shared-feed foundation. It polls public exchange REST endpoints once per minute, stores the latest per-exchange snapshot in a SQLite-backed Durable Object, and serves snapshots or one shared browser WebSocket stream. It currently includes Binance, Bybit and Gate public market snapshots; no exchange API keys are needed.

## Staging deploy

The Worker deploy workflow automatically deploys changes under `workers/market-feed/` when they are pushed to `staging`. It also has a manual trigger, but GitHub only exposes the manual Run workflow button after a workflow file exists on the repository's default branch. The staging push trigger lets us deploy without merging this workflow into production. Add these repository Actions secrets:

- `CLOUDFLARE_API_TOKEN`: a scoped token with permission to edit Workers and Durable Objects for this account.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.

After both secrets are saved, push a change under `workers/market-feed/` to `staging` to deploy. The staging Worker is named `bkp-market-feed-staging`. Its URL is `https://bkp-market-feed-staging.<your-workers-subdomain>.workers.dev` and is printed in the successful deployment log.

Endpoints:

- `GET /health`
- `GET /snapshot?exchange=Binance` (also `Bybit` and `Gate`)
- `GET /details?exchange=Bybit&marketType=Futures&symbol=BTCUSDT&exchangeSymbol=BTCUSDT&quote=USDT` (also Binance and Gate)
- `GET /stream?exchange=Binance` with a WebSocket upgrade

The one-minute schedule is the upstream snapshot polling cadence. WebSocket clients receive the cached shared snapshot after each successful poll; this is not an exchange-native WebSocket connection. `/details` retrieves 1m and 1h candles and (for futures) open-interest history on demand, then caches each market's result in the Durable Object for 45 seconds. Bybit and Gate details are served through this shared Worker so browsers do not make per-market calls to Supabase. `/_scheduled_refresh` is internal to the Worker and is intentionally not exposed publicly.

## Current scope

The screener's Binance candle, open-interest, and technical-analysis requests still use the existing Supabase-backed data path. The indicator combination-filter interface currently reads only the Binance Futures TA cache. Bybit and Gate provide candle-derived price change, dollar change, volume, volatility, RVOL, and BTC-correlation fields; their futures also provide open-interest history and funding. Exact historical execution counts are not available from the candle endpoints, so trade-count cells remain unavailable for those exchanges. Indicator calculations have not yet been ported to this Worker.

The website can use the Worker snapshot after setting `VITE_MARKET_FEED_URL` in the staging Pages build environment. Until then it keeps its existing market-data path. Do not set that variable to the staging Worker URL in production.
