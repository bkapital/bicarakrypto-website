type Exchange = 'Bybit' | 'Gate';
type MarketType = 'Spot' | 'Futures' | 'Options';
type AssetClass = 'Crypto' | 'Stocks' | 'Commodities' | 'Indices' | 'Forex';
export type DirectMarket = {
  id:string;marketType:MarketType;assetClass:AssetClass;hasPerpetualData:boolean;symbol:string;exchangeSymbol:string;quote:string;quoteUsd:number;
  price:number;high24h:number;m5:number;h1:number;d1:number;v1:number;v15:number;v24:number;oi:number;oiChange:number;funding:number;vol:number;trades:number;trend:number[];metrics:Record<string,number>;
};
const nan=Number.NaN;
const finite=(value:unknown)=>{const n=Number(value);return Number.isFinite(n)?n:nan};
const json=async(url:string):Promise<any>=>{
  let response:Response;
  try { response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15_000)}); }
  catch(error){throw new Error(`Could not reach ${new URL(url).host} from this browser. The exchange may block this network or browser CORS access. ${error instanceof Error?error.message:''}`.trim())}
  if(!response.ok)throw new Error(`${new URL(url).host}${new URL(url).pathname} returned HTTP ${response.status}`);
  return response.json();
};
const stable=new Set(['USDT','USDC','FDUSD','BUSD','TUSD','USDP','DAI','USD','USD1','USDE']);
const baseMarket=(exchange:Exchange,type:MarketType,exchangeSymbol:string,symbol:string,quote:string):DirectMarket=>({id:`${exchange}:${type}:${exchangeSymbol}`,marketType:type,assetClass:'Crypto',hasPerpetualData:type==='Futures',symbol,exchangeSymbol,quote,quoteUsd:stable.has(quote)?1:nan,price:nan,high24h:nan,m5:nan,h1:nan,d1:nan,v1:nan,v15:nan,v24:nan,oi:nan,oiChange:nan,funding:nan,vol:nan,trades:nan,trend:[],metrics:{}});
const classifyBybit=(type:string):AssetClass=>{switch(type.toLowerCase()){case'xstocks':case'mstocks':case'stock':case'etf':return'Stocks';case'commodity':return'Commodities';case'forex':return'Forex';default:return'Crypto'}};
const classifyUnderlying=(type:unknown):AssetClass=>({1:'Commodities',2:'Stocks',3:'Forex',4:'Commodities'} as Record<string,AssetClass>)[String(type)]||'Crypto';
let bybitMetadata:Promise<any>|null=null;
let gateMetadata:Promise<any>|null=null;
const bybitMeta=()=>bybitMetadata??=(async()=>{
  const categories=['spot','linear','inverse'] as const;
  const result=await Promise.all(categories.map(async category=>{
    const types=category==='spot'?['xstocks','mstocks']:category==='linear'?['commodity','stock','forex','ETF']:[];
    const fetchInstruments=async(symbolType?:string)=>{const rows:any[]=[];let cursor='';do{const p=new URLSearchParams({category,limit:'1000'});if(symbolType)p.set('symbolType',symbolType);if(cursor)p.set('cursor',cursor);const page=await json(`https://api.bybit.com/v5/market/instruments-info?${p}`);if(page.retCode!==0)throw new Error(`Bybit ${category} instruments returned ${page.retCode}`);rows.push(...(page.result?.list||[]));cursor=page.result?.nextPageCursor||''}while(cursor);return rows};
    const groups=await Promise.all([fetchInstruments(),...types.map(type=>fetchInstruments(type))]);
    return {category,instruments:[...new Map(groups.flat().map((r:any)=>[r.symbol,r])).values()]};
  }));
  const optionBases=await json('https://api.bybit.com/v5/market/option/base-coins');
  if(optionBases.retCode!==0)throw new Error('Bybit option base-coin API returned an error');
  return {categories:result,optionBases:(optionBases.result?.list||[]).filter((b:any)=>Number(b.hasSymbol)===1)};
})();
const gateMeta=()=>gateMetadata??=(async()=>Promise.all([
  json('https://api.gateio.ws/api/v4/spot/currency_pairs'),
  json('https://api.gateio.ws/api/v4/futures/usdt/contracts'),
]))();
function attachQuoteRates(markets:DirectMarket[]) {
  const prices=new Map(markets.filter(m=>m.marketType==='Spot').map(m=>[m.symbol,m.price]));
  for(const m of markets){if(stable.has(m.quote)){m.quoteUsd=1;continue}const direct=prices.get(`${m.quote}USDT`),inverse=prices.get(`USDT${m.quote}`);m.quoteUsd=Number.isFinite(direct)?direct!:Number.isFinite(inverse)&&inverse!>0?1/inverse!:nan}
  return markets;
}
async function loadBybit():Promise<DirectMarket[]> {
  const metadata=await bybitMeta();
  const data=await Promise.all(metadata.categories.map(async(group:any)=>{
    const response=await json(`https://api.bybit.com/v5/market/tickers?category=${group.category}`);
    if(response.retCode!==0)throw new Error(`Bybit ${group.category} tickers returned ${response.retCode}`);
    return {...group,tickers:response.result?.list||[]};
  }));
  const markets:DirectMarket[]=[];
  for(const group of data){const instruments=new Map(group.instruments.filter((r:any)=>r.status==='Trading').map((r:any)=>[r.symbol,r]));for(const t of group.tickers){const meta:any=instruments.get(t.symbol);if(!meta)continue;const type:MarketType=group.category==='spot'?'Spot':'Futures';const quote=meta.quoteCoin||meta.settleCoin||'USD';const m=baseMarket('Bybit',type,t.symbol,t.symbol,quote);m.assetClass=classifyBybit(String(meta.symbolType||''));m.hasPerpetualData=type==='Futures'&&String(meta.contractType||'').toLowerCase().includes('perpetual');m.price=finite(t.lastPrice);m.high24h=finite(t.highPrice24h);m.d1=finite(t.price24hPcnt)*100;m.h1=Number.isFinite(finite(t.prevPrice1h))&&finite(t.prevPrice1h)!==0?(m.price/finite(t.prevPrice1h)-1)*100:nan;m.v24=finite(t.turnover24h);m.funding=finite(t.fundingRate);m.oi=finite(t.openInterestValue);markets.push(m)}}
  for(const base of metadata.optionBases){const p=new URLSearchParams({category:'option',baseCoin:base.baseCoin,limit:'1000'});const [ins,tickers]=await Promise.all([json(`https://api.bybit.com/v5/market/instruments-info?${p}`),json(`https://api.bybit.com/v5/market/tickers?category=option&baseCoin=${encodeURIComponent(base.baseCoin)}`)]);if(ins.retCode!==0||tickers.retCode!==0)continue;const instruments=new Map((ins.result?.list||[]).filter((r:any)=>r.status==='Trading').map((r:any)=>[r.symbol,r]));for(const t of tickers.result?.list||[]){const meta:any=instruments.get(t.symbol);if(!meta)continue;const quote=String(meta.quoteCoin||meta.settleCoin||base.quoteCoin||'USDT');const m=baseMarket('Bybit','Options',t.symbol,t.symbol,quote);m.assetClass=classifyUnderlying(base.underlyingType);m.hasPerpetualData=false;m.price=finite(t.lastPrice);m.high24h=finite(t.highPrice24h);const change=finite(t.change24h),previous=m.price-change;m.d1=Number.isFinite(previous)&&previous!==0?change/previous*100:nan;m.v24=finite(t.turnover24h);m.metrics={bid:finite(t.bid1Price),ask:finite(t.ask1Price),markPrice:finite(t.markPrice),impliedVolatility:finite(t.markIv),delta:finite(t.delta),gamma:finite(t.gamma),vega:finite(t.vega),theta:finite(t.theta),underlyingPrice:finite(t.underlyingPrice)};markets.push(m)}}
  return attachQuoteRates(markets);
}
async function loadGate():Promise<DirectMarket[]> {
  const [metadata,spotTickers,futuresTickers]=await Promise.all([gateMeta(),json('https://api.gateio.ws/api/v4/spot/tickers'),json('https://api.gateio.ws/api/v4/futures/usdt/tickers')]);
  const [pairs,contracts]=metadata;const spotMeta=new Map((pairs||[]).filter((p:any)=>p.trade_status==='tradable').map((p:any)=>[p.id,p]));const contractMeta=new Map((contracts||[]).filter((c:any)=>!c.in_delisting&&(!c.status||c.status==='trading')).map((c:any)=>[c.name,c]));const markets:DirectMarket[]=[];
  for(const t of spotTickers||[]){const p:any=spotMeta.get(t.currency_pair);if(!p)continue;const symbol=`${p.base}${p.quote}`,m=baseMarket('Gate','Spot',t.currency_pair,symbol,p.quote);m.price=finite(t.last);m.high24h=finite(t.high_24h);m.d1=finite(t.change_percentage);m.v24=finite(t.quote_volume);markets.push(m)}
  for(const t of futuresTickers||[]){const meta:any=contractMeta.get(t.contract);if(!meta)continue;const [base,quote='USDT']=String(t.contract).split('_'),m=baseMarket('Gate','Futures',t.contract,`${base}${quote}`,quote);m.price=finite(t.last);m.high24h=finite(t.high_24h);m.d1=finite(t.change_percentage);m.v24=finite(t.volume_24h_quote??t.volume_24h_usd??t.volume_24h);m.funding=finite(t.funding_rate);const size=finite(meta.quanto_multiplier),count=finite(t.total_size);m.oi=Number.isFinite(size)&&Number.isFinite(count)?size*count*m.price:nan;markets.push(m)}
  return attachQuoteRates(markets);
}
export const loadDirectSnapshot=(exchange:Exchange)=>exchange==='Bybit'?loadBybit():loadGate();

const intervalMs:Record<string,number>={'1m':60_000,'1h':3_600_000};
const normalizeRows=(exchange:Exchange,market:DirectMarket,rows:any[],interval:'1m'|'1h')=>exchange==='Bybit'
  ?rows.map(r=>{const t=finite(r[0]);return[t,r[1],r[2],r[3],r[4],r[5],t+intervalMs[interval]-1,r[6],nan] as any[]}).sort((a,b)=>a[0]-b[0])
  :rows.map(r=>market.marketType==='Spot'?[(finite(r[0]))*1000,r[5],r[3],r[4],r[2],r[1],finite(r[0])*1000+intervalMs[interval]-1,r[6],nan]:[finite(r.t)*1000,r.o,r.h,r.l,r.c,r.v,finite(r.t)*1000+intervalMs[interval]-1,r.sum,nan]).filter(r=>r[0]>0).sort((a,b)=>a[0]-b[0]);
export async function loadDirectDetails(exchange:Exchange,market:DirectMarket) {
  if(market.marketType==='Options')return {minutes:[],hours:[],fiveMinute:[],hourly:[]};
  const getBars=async(interval:'1m'|'1h',limit:number)=>{
    if(exchange==='Bybit'){const category=market.marketType==='Spot'?'spot':market.quote==='USD'?'inverse':'linear';const int=interval==='1m'?'1':'60';const r=await json(`https://api.bybit.com/v5/market/kline?category=${category}&symbol=${encodeURIComponent(market.symbol)}&interval=${int}&limit=${limit}`);if(r.retCode!==0)throw new Error(`Bybit candle API returned ${r.retCode}`);return normalizeRows(exchange,market,r.result?.list||[],interval)}
    const url=market.marketType==='Spot'?`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(market.exchangeSymbol)}&interval=${interval}&limit=${limit}`:`https://api.gateio.ws/api/v4/futures/${market.quote.toLowerCase()}/candlesticks?contract=${encodeURIComponent(market.exchangeSymbol)}&interval=${interval}&limit=${limit}`;
    return normalizeRows(exchange,market,await json(url),interval);
  };
  const [minutes,hours,oi]=await Promise.all([getBars('1m',60),getBars('1h',96),market.marketType==='Futures'?loadDirectOi(exchange,market).catch(()=>({fiveMinute:[],hourly:[]})):Promise.resolve({fiveMinute:[],hourly:[]})]);
  return {minutes,hours,...oi};
}
async function loadDirectOi(exchange:Exchange,market:DirectMarket){
  if(exchange==='Bybit'){const category=market.quote==='USD'?'inverse':'linear';const [five,hour]=await Promise.all([json(`https://api.bybit.com/v5/market/open-interest?category=${category}&symbol=${encodeURIComponent(market.symbol)}&intervalTime=5min&limit=200`),json(`https://api.bybit.com/v5/market/open-interest?category=${category}&symbol=${encodeURIComponent(market.symbol)}&intervalTime=1h&limit=30`)]);if(five.retCode!==0||hour.retCode!==0)throw new Error('Bybit open-interest API returned an error');const map=(r:any)=>(r.result?.list||[]).map((x:any)=>({time:finite(x.timestamp),value:finite(x.openInterest)})).sort((a:any,b:any)=>a.time-b.time);return {fiveMinute:map(five),hourly:map(hour)}}
  const url=`https://api.gateio.ws/api/v4/futures/${market.quote.toLowerCase()}/contract_stats?contract=${encodeURIComponent(market.exchangeSymbol)}`;const [five,hour]=await Promise.all([json(`${url}&interval=5m&limit=200`),json(`${url}&interval=1h&limit=30`)]);const map=(rows:any[])=>(rows||[]).map(r=>({time:finite(r.time)*1000,value:finite(r.open_interest??r.open_interest_usd)})).sort((a,b)=>a.time-b.time);return {fiveMinute:map(five),hourly:map(hour)};
}
