# Bicara Krypto Pulse shared market feed

This Worker serves Binance shared market data and remains available for production. Bybit and Gate market snapshots, candles, and open-interest details are requested directly by the browser, so their staging page views do not invoke this Durable Object. No exchange API keys are needed.

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

The production Worker retains its one-minute scheduled refresh. The staging Worker disables that schedule because the Bybit and Gate staging clients now call public exchange APIs from the browser. Its `/snapshot`, `/details`, and `/stream` routes remain available for Binance's shared market data.

## Current scope

The screener's Binance candle, open-interest, and technical-analysis requests still use the existing Binance data path. The indicator combination-filter interface loads Bybit and Gate candles directly on demand. Their APIs provide candle-derived price change, dollar change, volume, volatility, RVOL, and BTC-correlation fields; futures also provide open-interest history and funding. Exact historical execution counts are not available from the candle endpoints, so trade-count cells remain unavailable for those exchanges.

The website uses the configured Worker URL for Binance shared feed features. Do not set the staging Worker URL in the production Pages environment.
