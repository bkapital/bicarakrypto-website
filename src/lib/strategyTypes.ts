export type StrategyMarket = {
  id: string;
  marketType: 'Spot'|'Futures'|'Options'|'CFD';
  assetClass: 'Crypto'|'Stocks'|'Commodities'|'Indices'|'Forex';
  hasPerpetualData: boolean;
  symbol: string;
  exchangeSymbol?: string;
  quote: string;
  quoteUsd: number;
  price: number;
  high24h?: number;
  low24h?: number;
  funding: number;
  fundingIntervalHours?: number;
  contractMultiplier?: number;
  oiChange: number;
  metrics?: Record<string,number>;
};
