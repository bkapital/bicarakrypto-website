import { calculateIndicators, type Candle, type IndicatorResult } from '../../server/indicators';
import type { StrategyMarket as Market } from './strategyTypes';
import { STRATEGY_THRESHOLDS, type StrategyTimeframe } from './strategyConfig';

export type StrategyIndicatorRecord = IndicatorResult & {
  id: string;
  historyBars: number;
  ema50_200State: 'above'|'below'|null;
  priceVsEma20: 'above'|'below'|null;
  priceVsEma50: 'above'|'below'|null;
  priceVsEma100: 'above'|'below'|null;
  priceVsEma200: 'above'|'below'|null;
  priceVsTrendEma: 'above'|'below'|null;
  priceVsVwap: 'above'|'below'|null;
  distanceFrom24hHighPct: number;
  distanceFrom24hLowPct: number;
  fundingPerHour: number;
  oiChangePct1h: number;
  longShortRatio: number;
  priceEmaCross: Record<string, 'up' | 'down' | null>;
};

type CandleRow = number[];
type CacheEntry = { candles: Candle[]; result: StrategyIndicatorRecord; lastClosedTime: number };
const cache = new Map<string, CacheEntry>();
const intervalMs: Record<string,number> = { '5m':300_000, '15m':900_000, '1h':3_600_000, '4h':14_400_000, '8h':28_800_000, '12h':43_200_000, '1d':86_400_000 };
const keyFor = (exchange:string, market:Market, timeframe:string) => `${exchange}:${market.id}:${timeframe}`;

const parseRows = (rows:CandleRow[]): Candle[] => rows.map(row => ({
  openTime:Number(row[0]), open:Number(row[1]), high:Number(row[2]), low:Number(row[3]), close:Number(row[4]),
  volume:Number(row[5]), closeTime:Number(row[6]), quoteVolume:Number(row[7]), takerBuyQuoteVolume:Number(row[10]),
})).filter(c => [c.openTime,c.open,c.high,c.low,c.close,c.closeTime,c.quoteVolume].every(Number.isFinite));

async function requestJson(url:string, signal?:AbortSignal):Promise<any> {
  const original=new URL(url);
  const urls=original.hostname==='api.bybit.com'||original.hostname==='api.bytick.com'
    ?['api.bybit.com','api.bytick.com'].map(host=>{const target=new URL(url);target.hostname=host;return target.toString()})
    :[url];
  let last:unknown;
  for (let attempt=0;attempt<5;attempt++) {
    for(const candidate of urls){
      try {
        const response=await fetch(candidate,{signal});
        if (!response.ok) {
          const error=new Error(`Market candle request failed (${response.status})`);
          last=error;
          if (response.status===418||response.status===429||response.status>=500) {
            const retryAfter=Number(response.headers.get('Retry-After'));
            await new Promise(resolve=>window.setTimeout(resolve,Math.min(30_000,retryAfter>0?retryAfter*1000:500*2**attempt)));
          }
          continue;
        }
        const payload=await response.json();
        if(urls.length>1&&payload?.retCode!==undefined&&Number(payload.retCode)!==0){last=new Error(`Bybit returned ${payload.retCode}: ${payload.retMsg||'request rejected'}`);continue}
        return payload;
      } catch(error) { if(signal?.aborted)throw error; last=error; }
    }
    if(attempt<4)await new Promise(resolve=>window.setTimeout(resolve,250*2**attempt));
  }
  throw last instanceof Error?last:new Error('Market candle request failed');
}

async function fetchCandles(exchange:'Binance'|'Bybit'|'Gate', market:Market, timeframe:string, feedUrl:string, limit:number, signal?:AbortSignal):Promise<Candle[]> {
  if (exchange==='Binance') {
    const interval=timeframe;
    const endpoint=market.marketType==='Spot'?'https://data-api.binance.vision/api/v3/klines':'https://fapi.binance.com/fapi/v1/klines';
    return parseRows(await requestJson(`${endpoint}?symbol=${encodeURIComponent(market.symbol)}&interval=${interval}&limit=${limit}`,signal));
  }
  if (feedUrl) {
    const params=new URLSearchParams({exchange,marketType:market.marketType,symbol:market.symbol,exchangeSymbol:market.exchangeSymbol||market.symbol,quote:market.quote,timeframe,limit:String(limit)});
    const result=await requestJson(`${feedUrl}/details?${params}`,signal);
    if(!Array.isArray(result.candles))throw new Error(result.error||`${exchange} returned no candle history`);
    return parseRows(result.candles);
  }
  if(exchange==='Bybit') {
    const interval:Record<string,string>={'5m':'5','15m':'15','1h':'60','4h':'240','8h':'240','12h':'720','1d':'D'};
    const category=market.marketType==='Spot'?'spot':market.quote==='USD'?'inverse':'linear';
    const multiplier=timeframe==='8h'?2:1;
    const res=await requestJson(`https://api.bybit.com/v5/market/kline?category=${category}&symbol=${encodeURIComponent(market.symbol)}&interval=${interval[timeframe==='8h'?'4h':timeframe]}&limit=${Math.min(1000,limit*multiplier)}`,signal);
    if(res.retCode!==0)throw new Error(`Bybit candle API returned ${res.retCode}`);
    return parseRows((res.result?.list||[]).map((r:any[])=>{const t=Number(r[0]);const source=intervalMs[timeframe==='8h'?'4h':timeframe];const inverse=category==='inverse';return[t,r[1],r[2],r[3],r[4],inverse?r[6]:r[5],t+source-1,inverse?r[5]:r[6],NaN,NaN,NaN]}).sort((a:number[],b:number[])=>a[0]-b[0]));
  }
  const interval:Record<string,string>={'5m':'5m','15m':'15m','1h':'1h','4h':'4h','8h':'8h','12h':'4h','1d':'1d'};
  const multiplier=timeframe==='12h'?3:1;
  const base=timeframe==='12h'?'4h':timeframe;
  const buildGateUrl=(max:number,to?:number)=>market.marketType==='Spot'?`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${encodeURIComponent(market.exchangeSymbol||market.symbol)}&interval=${interval[base]}&limit=${max}${to?`&to=${to}`:''}`:`https://api.gateio.ws/api/v4/futures/${market.quote.toLowerCase()}/candlesticks?contract=${encodeURIComponent(market.exchangeSymbol||market.symbol)}&interval=${interval[base]}&limit=${max}${to?`&to=${to}`:''}`;
  let raw:any[]=await requestJson(buildGateUrl(Math.min(1000,limit*multiplier)),signal);
  if(timeframe==='12h'&&limit*3>1000&&raw.length){const oldest=Number(market.marketType==='Spot'?raw[0][0]:raw[0].t);const older:any[]=await requestJson(buildGateUrl(Math.min(1000,limit*3-raw.length),oldest-1),signal);raw=[...older,...raw]}
  let rows=raw.map((r:any)=>market.marketType==='Spot'?[Number(r[0])*1000,r[5],r[3],r[4],r[2],r[6],Number(r[0])*1000+intervalMs[base]-1,r[1],NaN,NaN,NaN]:[Number(r.t)*1000,r.o,r.h,r.l,r.c,Number(r.v)*Number(market.contractMultiplier||1),Number(r.t)*1000+intervalMs[base]-1,r.sum,NaN,NaN,NaN]).sort((a:number[],b:number[])=>a[0]-b[0]);
  const factor=multiplier;
  if(factor>1){const target=intervalMs[timeframe];const groups=new Map<number,number[][]>();for(const row of rows){const b=Math.floor(row[0]/target)*target;groups.set(b,[...(groups.get(b)||[]),row])}rows=[...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([t,g])=>[t,g[0][1],Math.max(...g.map(x=>x[2])),Math.min(...g.map(x=>x[3])),g.at(-1)![4],g.reduce((s,x)=>s+x[5],0),t+target-1,g.reduce((s,x)=>s+x[7],0),NaN,NaN,NaN]);}
  return parseRows(rows);
}

function computeRecord(exchange:'Binance'|'Bybit'|'Gate', market:Market, timeframe:StrategyTimeframe, candles:Candle[]):StrategyIndicatorRecord|null {
  const closed=candles.filter(c=>c.closeTime<Date.now());
  const base=calculateIndicators(closed,{crossWindow:STRATEGY_THRESHOLDS[timeframe].crossWindow}); if(!base)return null;
  const trendEma=STRATEGY_THRESHOLDS[timeframe].trendEmaPeriod===200?base.ema200:base.ema50;
  const ema50_200State=Number.isFinite(base.ema50)&&Number.isFinite(base.ema200)?base.ema50>base.ema200?'above':'below':null;
  const priceVsVwap=Number.isFinite(base.dailyVwap)&&base.dailyVwap>0?base.close>=base.dailyVwap?'above':'below':null;
  const high24=market.high24h;
  const low24=market.low24h;
  const distanceFrom24hHighPct=typeof high24==='number'&&Number.isFinite(high24)&&high24>0?(base.close/high24-1)*100:NaN;
  const distanceFrom24hLowPct=typeof low24==='number'&&Number.isFinite(low24)&&low24>0?(base.close/low24-1)*100:NaN;
  // Exchanges publish the current rate for the contract's settlement interval. Eight hours is the common interval;
  // interval-specific normalization is applied where the market snapshot provides an interval field.
  const intervalHours=Number(market.fundingIntervalHours)||8;
  const fundingPerHour=market.hasPerpetualData&&Number.isFinite(market.funding)?market.funding*100/intervalHours:NaN;
  const oiChangePct1h=Number(market.metrics?.['oiPct:1h']);
  const priceEmaCross: Record<string, 'up' | 'down' | null> = {};
  for (const period of [20,50,100,200]) {
    let direction: 'up' | 'down' | null = null;
    for (let age=0; age<STRATEGY_THRESHOLDS[timeframe].crossWindow && closed.length-1-age>0; age++) {
      const i=closed.length-1-age;
      // The indicator result contains only the latest EMA, so calculate the two latest EMA series locally.
      const currentEma=emaAt(closed,i,period), previousEma=emaAt(closed,i-1,period);
      if (!Number.isFinite(currentEma)||!Number.isFinite(previousEma)) continue;
      if (closed[i-1].close<=previousEma&&closed[i].close>currentEma) { direction='up'; break; }
      if (closed[i-1].close>=previousEma&&closed[i].close<currentEma) { direction='down'; break; }
    }
    priceEmaCross[String(period)]=direction;
  }
  return {...base,id:market.id,historyBars:closed.length,ema50_200State,priceEmaCross,priceVsEma20:Number.isFinite(base.ema20)?base.close>=base.ema20?'above':'below':null,priceVsEma50:Number.isFinite(base.ema50)?base.close>=base.ema50?'above':'below':null,priceVsEma100:Number.isFinite(base.ema100)?base.close>=base.ema100?'above':'below':null,priceVsEma200:Number.isFinite(base.ema200)?base.close>=base.ema200?'above':'below':null,priceVsTrendEma:Number.isFinite(trendEma)?base.close>=trendEma?'above':'below':null,priceVsVwap,distanceFrom24hHighPct,distanceFrom24hLowPct,fundingPerHour,oiChangePct1h,longShortRatio:NaN};
}

function emaAt(candles:Candle[], end:number, period:number):number {
  if(end+1<period)return NaN;
  let value=candles.slice(0,period).reduce((sum,c)=>sum+c.close,0)/period;
  const alpha=2/(period+1);
  for(let i=period;i<=end;i++)value=candles[i].close*alpha+value*(1-alpha);
  return value;
}

async function fetchLongShortRatio(symbol:string,timeframe:string,signal?:AbortSignal):Promise<number> {
  const period=timeframe==='8h'?'4h':timeframe;
  const payload=await requestJson(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}&limit=${timeframe==='8h'?2:1}`,signal);
  const values=(Array.isArray(payload)?payload:[]).map((row:any)=>Number(row.longShortRatio)).filter(Number.isFinite);
  return values.length?values.reduce((sum:number,value:number)=>sum+value,0)/values.length:NaN;
}

export async function loadStrategyIndicators(args:{exchange:'Binance'|'Bybit'|'Gate';markets:Market[];timeframe:string;feedUrl:string;includeLongShortRatio?:boolean;signal?:AbortSignal;onProgress?:(done:number,total:number)=>void;onResult?:(marketId:string,record:StrategyIndicatorRecord)=>void}):Promise<Record<string,StrategyIndicatorRecord>> {
  const {exchange,markets,timeframe,feedUrl,includeLongShortRatio=false,signal,onProgress,onResult}=args;
  const eligible=markets.filter(m=>['Spot','Futures'].includes(m.marketType)&&m.assetClass==='Crypto'&&(m.marketType!=='Futures'||m.hasPerpetualData));
  const results:Record<string,StrategyIndicatorRecord>={};let next=0,done=0;
  const worker=async()=>{while(next<eligible.length){if(signal?.aborted)return;const market=eligible[next++];const key=keyFor(exchange,market,timeframe);let entry=cache.get(key);const duration=intervalMs[timeframe]||3_600_000;const expectedOpen=Math.floor(Date.now()/duration)*duration-duration;
      try {
        if(!entry||entry.lastClosedTime<expectedOpen){
          const fresh=await fetchCandles(exchange,market,timeframe,feedUrl,entry?3:500,signal);
          const mergedByOpenTime=new Map((entry?.candles||[]).map(bar=>[bar.openTime,bar]));
          for(const bar of fresh)mergedByOpenTime.set(bar.openTime,bar);
          const merged=[...mergedByOpenTime.values()];
          // Store the 499 completed candles only; the live candle is never cached into indicator history.
          const candles=merged.sort((a,b)=>a.openTime-b.openTime).filter(bar=>bar.closeTime<Date.now()).slice(-499);
          const record=computeRecord(exchange,market,timeframe as StrategyTimeframe,candles);
          if(record){entry={candles,result:record,lastClosedTime:candles.at(-1)?.openTime||0};cache.set(key,entry)}
        }
        if(entry){
          if(includeLongShortRatio&&exchange==='Binance'&&market.marketType==='Futures'&&!Number.isFinite(entry.result.longShortRatio)){
            try{entry.result.longShortRatio=await fetchLongShortRatio(market.symbol,timeframe,signal)}catch(error){if(!signal?.aborted)console.warn(`Long/short ratio unavailable for ${market.symbol} ${timeframe}`,error)}
          }
          results[market.id]=entry.result;onResult?.(market.id,entry.result)
        }
      } catch(error) { if(signal?.aborted)return; console.warn(`Strategy candle data unavailable for ${market.symbol} ${timeframe}`,error); }
      done++;onProgress?.(done,eligible.length);
    }};
  await Promise.all(Array.from({length:Math.min(6,eligible.length)},worker));
  return results;
}
