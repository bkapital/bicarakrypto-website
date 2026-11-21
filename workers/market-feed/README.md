# Bicara Krypto Pulse shared market feed

This Worker is the staging shared-feed foundation. It polls public exchange REST endpoints once per minute, stores the latest per-exchange snapshot in a SQLite-backed Durable Object, and serves snapshots or one shared browser WebSocket stream. It currently includes Binance, Bybit and Gate public market snapshots; no exchange API keys are needed.

## Staging deploy

The Worker deploy workflow is manual and only deploys while the selected GitHub branch is `staging`. Add these repository Actions secrets:

- `CLOUDFLARE_API_TOKEN`: a scoped token with permission to edit Workers and Durable Objects for this account.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.

Then choose **Actions → Deploy staging market feed → Run workflow**, with branch `staging` selected. The staging Worker is named `bkp-market-feed-staging`. Its URL is `https://bkp-market-feed-staging.<your-workers-subdomain>.workers.dev`.

Endpoints:

- `GET /health`
- `GET /snapshot?exchange=Binance` (also `Bybit` and `Gate`)
- `GET /stream?exchange=Binance` with a WebSocket upgrade

The one-minute schedule is the upstream polling cadence. WebSocket clients receive the cached shared snapshot after each successful poll; this is not an exchange-native WebSocket connection. `/_scheduled_refresh` is internal to the Worker and is intentionally not exposed publicly.

## Current scope

The staging Worker does not yet replace the screener's candle, open-interest, or technical-analysis requests. Those still use the existing data path. The indicator combination-filter interface in the website currently reads the existing Binance Futures TA cache. Migrate those paths and compare Cloudflare Free usage before turning down the Supabase job or treating this as a full Supabase replacement.

The website can use the Worker snapshot after setting `VITE_MARKET_FEED_URL` in the staging Pages build environment. Until then it keeps its existing market-data path. Do not set that variable to the staging Worker URL in production.
