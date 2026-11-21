/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MARKET_FEED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
