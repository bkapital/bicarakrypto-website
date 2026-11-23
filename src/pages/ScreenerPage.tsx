import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, ChevronDown, ExternalLink, LogOut, Search, ShieldAlert, SlidersHorizontal, Star, X } from 'lucide-react';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { clearPendingScreenerAuth, consumeScreenerAuthFailure, markScreenerAuthFailed, markScreenerAuthPending } from '../lib/screenerAccess';
import type { Session } from '@supabase/supabase-js';
import { indicatorFields, type IndicatorCondition, type IndicatorField } from '../components/screener/TechnicalFilters';
import { StrategyControls, quickStrategies, defaultStrategies, resolveStrategy, migrateCondition, type Strategy } from '../components/screener/StrategyControls';
import { VolumeRangeControl } from '../components/screener/VolumeRangeControl';
import { loadStrategyIndicators, type StrategyIndicatorRecord } from '../lib/strategyTa';
import { loadDirectDetails, loadDirectSnapshot } from '../lib/directExchangeFeed';
import { STRATEGY_THRESHOLDS, type StrategyTimeframe } from '../lib/strategyConfig';
import '../styles/screener.css';

type AssetClass='Crypto'|'Stocks'|'Commodities'|'Indices'|'Forex';
type MarketType='Spot'|'Futures'|'Options'|'CFD';
type Market = { id:string; marketType:MarketType; assetClass:AssetClass; hasPerpetualData:boolean; symbol:string; exchangeSymbol?:string; quote:string; quoteUsd:number; price:number; high24h?:number; low24h?:number; m5:number; h1:number; d1:number; v1:number; v15:number; v24:number; oi:number; oiChange:number; funding:number; fundingIntervalHours?:number; vol:number; trades:number; trend:number[]; mcap?:number; metrics?:Record<string,number> };
const classifyAsset=(underlyingType:string):AssetClass=>{switch(underlyingType){case 'EQUITY':case 'HK_EQUITY':case 'KR_EQUITY':case 'CN_EQUITY':case 'PREMARKET':return 'Stocks';case 'COMMODITY':return 'Commodities';case 'INDEX':return 'Indices';case 'FX':return 'Forex';default:return 'Crypto'}};
const readOAuthCallbackError=()=>{if(typeof window==='undefined')return '';const query=new URLSearchParams(window.location.search);const hash=new URLSearchParams(window.location.hash.replace(/^#/,'').replace(/^\?/,''));for(const params of [query,hash]){const code=params.get('error_code');const error=params.get('error');const description=params.get('error_description');if(code||error||description)return description||error||code||'Google sign-in failed.'}return ''};
const periods=['5m','15m','1h','4h','8h','12h','1d'];
const KITA_ACCESS_SESSION_KEY='bkp-kita-access-user';
type ScreenerPreferences={query?:string;exchange?:'Binance'|'Bybit'|'Gate';filter?:string;quoteFilter?:string;marketFilter?:'all'|MarketType;assetFilter?:'all'|AssetClass;sort?:{key:string;dir:number};watch?:string[];scrollTop?:number;strategyId?:string;strategyIds?:string[];minVolumeUsd?:number|null;maxVolumeUsd?:number|null};
const readScreenerPreferences=():ScreenerPreferences=>{try{return JSON.parse(localStorage.getItem('bkp-screener-preferences')||'{}')}catch{return{}}};
const resolveMarketFeedUrl=()=>{const configured=import.meta.env.VITE_MARKET_FEED_URL;if(configured)return configured.replace(/\/$/,'');const host=window.location.hostname;if(host==='staging.bicarakrypto-website.pages.dev')return 'https://bkp-market-feed-staging.bicarakapital2026.workers.dev';if(host==='bicarakrypto.com'||host==='www.bicarakrypto.com'||host==='bicarakrypto-website.pages.dev')return 'https://bkp-market-feed.bicarakapital2026.workers.dev';return ''};
const hasCachedKitaAccess=()=>{try{return Boolean(sessionStorage.getItem(KITA_ACCESS_SESSION_KEY))}catch{return false}};
const columnGroups=[
 {id:'core',label:'CORE',columns:[['trend','24h trend'],['symbol','Symbol'],['price','Price'],['oi','OI $'],['funding','Funding/h'],['rvol','RVOL'],['mcap','MCAP']]},
 ...[['chgPct','CHANGE %'],['chgUsd','CHANGE $'],['volume','VOLUME'],['trades','TRADES'],['volatility','VOLATILITY'],['oiPct','OI CHANGE %'],['oiUsd','OI CHANGE $'],['volumeDelta','VOLUME Δ'],['volChange','VOL CHANGE %'],['btcCorr','BTC CORR']].map(([id,label])=>({id,label,columns:periods.map(p=>[`${id}:${p}`,p])})),
].map(g=>({...g,columns:g.columns.map(([id,label])=>({id,label}))}));
const allColumns=columnGroups.flatMap(g=>g.columns);
const allColumnIds=allColumns.map(c=>c.id);
const defaultColumnIds=['trend','symbol','price','chgPct:5m','chgPct:1h','chgPct:1d','volume:1h','volume:15m','volume:1d','oi','oiPct:1h','funding','volatility:15m'];
const metricTitle=(id:string)=>{const [group,p]=id.split(':');const labels:any={chgPct:'CHG %',chgUsd:'CHG $',volume:'VOL',trades:'TRADES',volatility:'VLT',oiPct:'OI CHG %',oiUsd:'OI CHG $',volumeDelta:'VOL Δ',volChange:'VOL CHG %',btcCorr:'BTC CORR',taRSI:'RSI',taADX:'ADX',taRVOL:'RVOL'};return `${labels[group]||group} (${p?.toUpperCase()||''})`};
const seed: Market[] = [
  ['BTCUSDT',67482.4,0.12,0.68,2.34,48200000,812000000,1840000000,1.42,0.0001,0.84,18240],
  ['ETHUSDT',3521.82,-0.08,1.24,3.18,29800000,524000000,862000000,2.18,-0.0002,1.12,14688],
  ['SOLUSDT',178.64,0.43,2.86,8.42,18600000,306000000,412000000,6.84,0.0003,2.64,9214],
  ['BNBUSDT',594.18,0.05,0.42,1.88,8400000,128000000,186000000,0.62,0.0001,0.72,3240],
  ['XRPUSDT',0.6248,-0.22,-0.84,1.42,7200000,112000000,124000000,-0.82,-0.0001,1.48,5812],
  ['DOGEUSDT',0.16842,0.78,3.42,6.18,12600000,218000000,246000000,8.42,0.0004,3.82,10245],
  ['TONUSDT',7.842,0.18,1.68,4.24,6100000,94600000,118000000,3.12,0.0002,1.86,2984],
  ['AVAXUSDT',38.16,-0.12,-1.24,2.64,4800000,78400000,92000000,-1.24,-0.0002,2.08,2468],
  ['1000PEPEUSDT',0.01284,1.42,5.24,12.86,16400000,286000000,198000000,12.64,0.0005,4.18,12846],
  ['LINKUSDT',18.42,0.16,1.12,3.28,3900000,62400000,78000000,2.84,0.0001,1.04,1842],
  ['WIFUSDT',2.842,-0.46,-2.18,7.42,8200000,142000000,106000000,9.82,-0.0004,3.62,7284],
  ['NEARUSDT',7.184,0.24,2.12,5.86,5200000,86400000,74000000,4.64,0.0002,1.92,3842],
].map((r:any, i:number) => ({id:`Futures:${r[0]}`,marketType:'Futures' as const,assetClass:'Crypto' as const,hasPerpetualData:true,symbol:r[0],quote:'USDT',quoteUsd:1,price:r[1],m5:r[2],h1:r[3],d1:r[4],v1:r[5],v15:NaN,v24:r[6],oi:r[7],oiChange:r[8],funding:r[9],vol:r[10],trades:r[11],trend:Array.from({length:24},(_,n)=>Math.max(8,30+Math.sin(n*0.72+i)*11+Math.cos(n*0.3+i)*9+(n/24)*(r[4]>0?10:-7)))}));
const fmt=(n:number)=>!Number.isFinite(n)?'—':n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(1)}M`:`$${(n/1e3).toFixed(0)}K`;
const countFmt=(n:number)=>!Number.isFinite(n)?'—':n>=1e6?`${(n/1e6).toFixed(2)}M`:n>=1e3?`${(n/1e3).toFixed(2)}K`:Math.round(n).toLocaleString('en-US');
const priceFmt=(n:number,usdRate:number,quote:string)=>!Number.isFinite(n)?'—':Number.isFinite(usdRate)?(Math.abs(n*usdRate)<1?`$${(n*usdRate).toFixed(5)}`:`$${(n*usdRate).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`):(Math.abs(n)<1?`${n.toFixed(5)} ${quote}`:`${n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} ${quote}`);
const marketFmt=(n:number,usdRate:number,quote:string)=>Number.isFinite(usdRate)?fmt(n*usdRate):!Number.isFinite(n)?'—':`${n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':n.toFixed(2)} ${quote}`;
const pct=(n:number)=>!Number.isFinite(n)?<span className="neutral">—</span>:<span className={n>0?'up':n<0?'down':'neutral'}>{n>0?'+':''}{n.toFixed(2)}%</span>;
const exchangeOffers={
 Binance:{signup:'https://www.binance.com/register?ref=GZ199IKG',reward:'Get up to $100 in welcome rewards.',mobileReward:'Get up to $100 in welcome rewards.'},
 Bybit:{signup:'https://partner.bybit.com/b/44129',reward:'Get up to $100 in welcome rewards, plus up to $5,030 in TradFi rewards.',mobileReward:'Get up to $100 in welcome rewards.'},
 Gate:{signup:'https://www.gate.com/share/SCREENER',reward:'Get up to 125 USDT in sign-up rewards.',mobileReward:'Get up to 125 USDT in sign-up rewards.'}
} as const;
const pairTradeUrl=(exchange:'Binance'|'Bybit'|'Gate',market:Market,base:string)=>{
 let url:string;
 if(exchange==='Binance')url=market.marketType==='Futures'?`https://www.binance.com/en/futures/${encodeURIComponent(market.symbol)}`:`https://www.binance.com/en/trade/${encodeURIComponent(`${base}_${market.quote}`)}?type=spot`;
 else if(exchange==='Bybit')url=market.marketType==='Futures'?`https://www.bybit.com/en/trade/usdt/${encodeURIComponent(market.symbol)}`:market.marketType==='Options'?'https://www.bybit.com/en/trade/option':`https://www.bybit.com/en/trade/spot/${encodeURIComponent(base)}/${encodeURIComponent(market.quote)}`;
 else url=market.marketType==='Futures'?`https://www.gate.com/futures/${encodeURIComponent(market.quote)}/${encodeURIComponent(market.exchangeSymbol||market.symbol)}`:`https://www.gate.com/trade/${encodeURIComponent(market.exchangeSymbol||`${base}_${market.quote}`)}`;
 const link=new URL(url);
 if(exchange==='Binance')link.searchParams.set('ref','GZ199IKG');
 if(exchange==='Bybit')link.searchParams.set('affiliate_id','44129');
 if(exchange==='Gate')link.searchParams.set('ref','SCREENER');
 return link.toString();
};
const trackEvent=(event:string,exchange:string,pair:string)=>{window.dispatchEvent(new CustomEvent('bkp:screener-event',{detail:{event,exchange,pair}}))};
const CoinIcon:React.FC<{symbol:string;quote:string}>=({symbol,quote})=>{const [failed,setFailed]=useState(false);const base=symbol.replace(quote,'').replace(/^\d+/,'').toLowerCase();return <span className="coin">{!failed&&<img src={`https://assets.coincap.io/assets/icons/${base}@2x.png`} alt="" onError={()=>setFailed(true)}/>}<span className={failed?'':'coin-fallback'}>{base.slice(0,1).toUpperCase()}</span></span>};
type CandleBar=number[];
const ExchangeCandleChart:React.FC<{exchange:'Binance'|'Bybit'|'Gate';market:Market}>=({exchange,market})=>{
 const [bars,setBars]=useState<CandleBar[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [updatedAt,setUpdatedAt]=useState<Date|null>(null);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setBars([]);void(async()=>{try{if(market.marketType==='Options')throw new Error('Bybit’s public API provides option quotes, but not historical option candles. Open the option chain on Bybit to view its chart.');if(market.marketType==='CFD')throw new Error('CFD market data is not available in the public exchange feed.');let next:any[];if(exchange==='Binance'){const endpoint=market.marketType==='Spot'?'https://data-api.binance.vision/api/v3/klines':'https://fapi.binance.com/fapi/v1/klines';const response=await fetch(`${endpoint}?symbol=${encodeURIComponent(market.symbol)}&interval=1h&limit=48`,{signal:controller.signal});if(!response.ok)throw new Error(`${exchange} candle request failed (${response.status})`);next=await response.json()}else{const detail=await loadDirectDetails(exchange,market as any);next=detail.hours||[]}if(!Array.isArray(next)||next.length===0)throw new Error('No hourly candles are available for this pair.');const valid=next.map((row:any[])=>row.map(Number)).filter((row:number[])=>row.length>=5&&row.slice(0,5).every(Number.isFinite)).slice(-48);if(!valid.length)throw new Error('No hourly candles are available for this pair.');setBars(valid);setUpdatedAt(new Date());
 }catch(reason){if(!controller.signal.aborted)setError(exchange==='Binance'?'Could not reach Binance candle data. Connect your VPN and try again.':reason instanceof Error?reason.message:'Unable to load chart data.')}finally{if(!controller.signal.aborted)setLoading(false)}})();return()=>controller.abort()},[exchange,market.id,market.marketType,market.symbol,market.exchangeSymbol,market.quote]);
 if(loading)return <div className="pair-chart-wrap"><div className="pair-chart-caption"><span>1H CANDLES</span><span>{exchange.toUpperCase()} MARKET DATA · LOADING</span></div><div className="pair-chart-skeleton" aria-label="Loading hourly chart"><i/><i/><i/><i/><i/><i/><i/></div></div>;
 if(error||!bars.length)return <div className="pair-chart-wrap"><div className="pair-chart-caption"><span>1H CANDLES</span><span>{exchange.toUpperCase()} MARKET DATA</span></div><div className="pair-chart-status chart-error">Chart unavailable right now</div></div>;
 const updateLabel=updatedAt?updatedAt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}):'—';
 const width=800,height=250,left=8,right=72,top=10,plotBottom=166,volumeTop=180,volumeBottom=218,plotWidth=width-left-right,plotHeight=plotBottom-top;
 const highs=bars.map(row=>Number(row[2])),lows=bars.map(row=>Number(row[3]));const min=Math.min(...lows),max=Math.max(...highs),range=max-min||Math.abs(max)*.001||1;const y=(price:number)=>top+(max-price)/range*plotHeight;const maxVol=Math.max(...bars.map(row=>Number(row[7]??row[5])||0),1);const step=plotWidth/bars.length,candleWidth=Math.max(3,Math.min(11,step*.58));
 const priceLabel=(value:number)=>value>=1000?value.toLocaleString('en-US',{maximumFractionDigits:1}):value>=1?value.toFixed(3):value.toPrecision(4);
 return <div className="pair-chart-wrap"><div className="pair-chart-caption"><span>1H CANDLES</span><span>{exchange.toUpperCase()} MARKET DATA · UPDATED {updateLabel}</span></div><svg className="pair-candle-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${market.symbol} hourly candlestick chart from ${exchange}`}>
  {[0,1,2,3,4].map(index=>{const gy=top+plotHeight*index/4;const value=max-range*index/4;return <g key={index}><line x1={left} x2={width-right+5} y1={gy} y2={gy} className="chart-gridline"/><text x={width-right+10} y={gy+4} className="chart-axis-label">{priceLabel(value)}</text></g>})}
  {bars.map((row,index)=>{const open=Number(row[1]),high=Number(row[2]),low=Number(row[3]),close=Number(row[4]),volume=Number(row[7]??row[5])||0,x=left+step*index+step/2,up=close>=open,color=up?'#35d6a0':'#f36d83',bodyTop=y(Math.max(open,close)),bodyBottom=y(Math.min(open,close)),bodyHeight=Math.max(1,bodyBottom-bodyTop),volumeHeight=volume/maxVol*(volumeBottom-volumeTop);return <g key={`${row[0]}-${index}`}><title>{`${new Date(Number(row[0])).toLocaleString()} · O ${priceLabel(open)} · H ${priceLabel(high)} · L ${priceLabel(low)} · C ${priceLabel(close)}`}</title><line x1={x} x2={x} y1={y(high)} y2={y(low)} stroke={color} strokeWidth="1.2"/><rect x={x-candleWidth/2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} rx=".6"/><rect x={x-candleWidth/2} y={volumeBottom-volumeHeight} width={candleWidth} height={Math.max(1,volumeHeight)} fill={color} opacity=".38"/></g>})}
  {[0,Math.floor((bars.length-1)/2),bars.length-1].map((index,i)=><text key={`${i}-${index}`} x={left+step*index+step/2} y={height-10} textAnchor={i===0?'start':i===2?'end':'middle'} className="chart-axis-label">{new Date(Number(bars[index][0])).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</text>)}
 </svg></div>;
};
const correlation=(a:number[],b:number[])=>{const n=Math.min(a.length,b.length);if(n<3)return NaN;const x=a.slice(-n),y=b.slice(-n),mx=x.reduce((s,v)=>s+v,0)/n,my=y.reduce((s,v)=>s+v,0)/n;let cov=0,vx=0,vy=0;for(let i=0;i<n;i++){cov+=(x[i]-mx)*(y[i]-my);vx+=(x[i]-mx)**2;vy+=(y[i]-my)**2}return vx&&vy?cov/Math.sqrt(vx*vy):NaN};
const rollingReturns=(closes:number[],horizon:number)=>closes.slice(horizon).map((close,i)=>{const previous=closes[i];return previous>0?close/previous-1:NaN}).filter(Number.isFinite);
const indicatorValue=(record:StrategyIndicatorRecord|undefined,condition:IndicatorCondition):number|string|boolean|undefined=>{
 if(!record)return undefined;
 const field=condition.field, setting=String(condition.setting??'');
 const emaValue=(period:number)=>record[`ema${period}` as 'ema20'|'ema50'|'ema100'|'ema200'];
 if(field==='priceVsEma'){
  if(condition.preset==='crossUp')return record.priceEmaCross[setting]==='up'?'up':undefined;
  if(condition.preset==='crossDown')return record.priceEmaCross[setting]==='down'?'down':undefined;
  return Number.isFinite(emaValue(Number(setting)))?record.close>=emaValue(Number(setting))?'above':'below':undefined;
 }
 if(field==='distanceFromEmaPct'){const ema=emaValue(Number(setting));return Number.isFinite(ema)&&ema!==0?(record.close/ema-1)*100:undefined}
 if(field==='emaCross'){
  const [pair,mode]=setting.split(':');const [fast,slow]=pair.split('/').map(Number);const a=emaValue(fast),b=emaValue(slow);
  if(mode==='state')return Number.isFinite(a)&&Number.isFinite(b)?a>=b?'above':'below':undefined;
  const cross=fast===9?record.ema9_21Cross:fast===20?record.ema20_50Cross:record.ema50_200Cross;return cross??undefined;
 }
 if(field==='rsi14'&&setting==='cross'){
  const level=condition.crossLevel??50, values=record.rsiRecentValues;
  for(let i=values.length-1;i>0;i--){if(!Number.isFinite(values[i])||!Number.isFinite(values[i-1]))continue;if(values[i-1]<=level&&values[i]>level)return 'up';if(values[i-1]>=level&&values[i]<level)return 'down'}return undefined;
 }
 if(field==='stochRsi')return setting==='cross'?record.stochRsiCross??undefined:setting==='d'?record.stochRsi.d:record.stochRsi.k;
 if(field==='macd')return setting==='cross'?record.macd.histogramCross??undefined:record.macd.line>=record.macd.signal?'above':'below';
 if(field==='supertrend')return ['turnedBullish','turnedBearish'].includes(condition.preset||'')?record.supertrendCross??undefined:record.supertrend??undefined;
 if(field==='bollinger')return setting==='squeeze'?record.bollinger.squeeze??undefined:setting==='upper'?Number.isFinite(record.bollinger.upper)?record.close>record.bollinger.upper:undefined:Number.isFinite(record.bollinger.lower)?record.close<record.bollinger.lower:undefined;
 if(field==='rangeBreakout'){const [period,direction]=setting.split('-');return record.rangeBreakouts[period]?.[direction as 'up'|'down']??undefined}
 if(field==='dailyVwap')return setting==='distance'?record.dailyVwapDistancePct:record.priceVsVwap??undefined;
 if(field==='consecutiveCandles')return setting==='red'?record.redCandleStreak:record.greenCandleStreak;
 if(field==='priceVsEma20')return record.priceVsEma20??undefined;
 if(field==='priceVsEma50')return record.priceVsEma50??undefined;
 if(field==='priceVsEma100')return record.priceVsEma100??undefined;
 if(field==='priceVsEma200')return record.priceVsEma200??undefined;
 if(field==='priceVsTrendEma')return record.priceVsTrendEma??undefined;
 if(field==='ema50_200State')return record.ema50_200State??undefined;
 if(field==='ema9_21Cross')return record.ema9_21Cross??undefined;
 if(field==='ema20_50Cross')return record.ema20_50Cross??undefined;
 if(field==='ema50_200Cross')return record.ema50_200Cross??undefined;
 if(field==='rsi50Cross')return record.rsi50Cross??undefined;
 if(field==='stochRsi.k')return record.stochRsi.k;
 if(field==='stochRsi.d')return record.stochRsi.d;
 if(field==='stochRsi.kdCross')return record.stochRsiCross??undefined;
 if(field==='macd.histogram')return record.macd.histogram;
 if(field==='macd.histogramCross')return record.macd.histogramCross??undefined;
 if(field==='bollinger.squeeze')return record.bollinger.squeeze??undefined;
 if(field==='breakout')return record.breakout??undefined;
 if(field==='breakdown')return record.breakdown??undefined;
 if(field==='dailyVwapDistancePct')return record.dailyVwapDistancePct;
 if(field==='priceVsVwap')return record.priceVsVwap??undefined;
 if(field==='distanceFrom24hHighPct')return record.distanceFrom24hHighPct;
 if(field==='distanceFrom24hLowPct')return record.distanceFrom24hLowPct;
 if(field==='takerBuyRatio')return record.takerBuyRatio;
 if(field==='oiChangePct1h')return record.oiChangePct1h;
 if(field==='fundingPerHour')return record.fundingPerHour;
 if(field==='ema20')return record.ema20;if(field==='ema50')return record.ema50;if(field==='ema100')return record.ema100;if(field==='ema200')return record.ema200;
 const value=record[field as keyof StrategyIndicatorRecord] as number|string|boolean|null|undefined;return value===null?undefined:value;
};
const compareCondition=(value:number|string|boolean|undefined,condition:IndicatorCondition)=>{
 if(value===undefined||value===null)return false;
 if(condition.operator==='equals')return value===condition.value;
 if(typeof value!=='number'||!Number.isFinite(value))return false;
 const target=Number(condition.value);
 if(condition.operator==='between')return value>=Math.min(target,Number(condition.secondValue??target))&&value<=Math.max(target,Number(condition.secondValue??target));
 if(condition.operator==='beyond')return Math.abs(value)>Math.abs(target);
 if(condition.operator==='>')return value>target;if(condition.operator==='>=')return value>=target;if(condition.operator==='<')return value<target;return value<=target;
};
const minimumHistoryForField=(condition:IndicatorCondition):number=>{
 const field=condition.field,setting=String(condition.setting??'');
 if(field==='priceVsEma'||field==='distanceFromEmaPct')return Number(setting)||20;
 if(field==='emaCross')return Number(setting.split(':')[0].split('/')[1])||21;
 if(['ema20','priceVsEma20'].includes(field))return 20;if(['ema50','priceVsEma50'].includes(field))return 50;if(['ema100','priceVsEma100'].includes(field))return 100;
 if(['ema200','priceVsEma200','priceVsTrendEma'].includes(field))return 200;if(['ema50_200State','ema50_200Cross'].includes(field))return 201;
 if(field==='ema9_21Cross')return 23;if(field==='ema20_50Cross')return 52;if(field==='rsi14'||field==='rsi50Cross')return 15;
 if(['stochRsi','stochRsi.k','stochRsi.d','stochRsi.kdCross'].includes(field))return 33;if(field==='adx14')return 28;if(field==='diDirection')return 15;
 if(field==='supertrend')return 11;if(['macd','macd.histogram','macd.histogramCross'].includes(field))return 35;
 if(field==='bollinger'||field==='bollinger.squeeze')return setting==='squeeze'||field==='bollinger.squeeze'?120:20;
 if(field==='atr14Percent')return 14;if(field==='rangeBreakout')return Number(setting.split('-')[0])||20;if(['breakout','breakdown'].includes(field))return 21;if(field==='changePct')return 2;return 1;
};
const conditionMatches=(market:Market,condition:IndicatorCondition,ta:Record<string,Record<string,StrategyIndicatorRecord>>)=>{
 const record=ta[condition.timeframe]?.[market.id];
 let direct:number|string|boolean|undefined;
 switch(condition.field){
  case 'quoteVolume':direct=condition.timeframe==='1d'?market.v24*market.quoteUsd:record?.quoteVolume*market.quoteUsd;break;
  case 'oiChangePct1h':direct=market.marketType==='Futures'?market.metrics?.[`oiPct:${condition.timeframe}`]??(condition.timeframe==='1h'?market.oiChange:undefined):undefined;break;
  case 'fundingPerHour':direct=market.hasPerpetualData&&Number.isFinite(market.funding)?market.funding*100/(market.fundingIntervalHours||8):undefined;break;
  case 'changePct':direct=record?.changePct;break;
  case 'marketPositioning':{
   const priceChange=record?.changePct,oiChange=market.marketType==='Futures'?market.metrics?.[`oiPct:${condition.timeframe}`]:undefined;
   if(Number.isFinite(priceChange)&&Number.isFinite(oiChange)&&priceChange!==0&&oiChange!==0){direct=priceChange!>0?oiChange!>0?'newLongs':'shortCovering':oiChange!>0?'newShorts':'longLiquidation'}break;
  }
  case 'premiumBasisPct':direct=market.metrics?.premiumBasisPct;break;
  case 'longShortRatio':direct=record?.longShortRatio;break;
  default:break;
 }
 if(direct!==undefined)return compareCondition(direct,condition);
 return compareCondition(indicatorValue(record,condition),condition);
};

const ScreenerDashboard:React.FC<{userEmail:string;onSignOut:()=>void}>=({userEmail,onSignOut})=>{
 useEffect(()=>{const previous=document.title;document.title='Bicara Krypto Pulse';return()=>{document.title=previous}},[]);
 const [preferences]=useState(readScreenerPreferences);
 const [query,setQuery]=useState(preferences.query||''); const [exchange,setExchange]=useState<'Binance'|'Bybit'|'Gate'>(preferences.exchange||'Binance'); const [filter,setFilter]=useState(preferences.filter||'');const [quoteFilter,setQuoteFilter]=useState(preferences.quoteFilter||'all');const [marketFilter,setMarketFilter]=useState<'all'|MarketType>(preferences.marketFilter||'all');const [assetFilter,setAssetFilter]=useState<'all'|AssetClass>(preferences.assetFilter||'all'); const [sort,setSort]=useState<{key:string;dir:number}>(preferences.sort||{key:'volume:1d',dir:-1}); const [watch,setWatch]=useState<string[]>(preferences.watch||[]);const [columnsOpen,setColumnsOpen]=useState(false);const [visibleColumns,setVisibleColumns]=useState<string[]>(()=>{try{const saved=localStorage.getItem('bkp-screener-columns');return saved?JSON.parse(saved).filter((id:string)=>allColumnIds.includes(id)):defaultColumnIds}catch{return defaultColumnIds}});const [tableScrollTop,setTableScrollTop]=useState(preferences.scrollTop||0);const tableScrollRef=useRef<HTMLDivElement>(null);const scrollThrottleRef=useRef<number|null>(null);const filtersMountedRef=useRef(false);const visibleIdsRef=useRef<string[]>([]);const detailsAttemptedRef=useRef(new Map<string,number>());const loadAuxRef=useRef<()=>void>(()=>{});
 const [markets,setMarkets]=useState(seed); const [feed,setFeed]=useState<'connecting'|'live'|'reconnecting'|'unavailable'>('connecting'); const [feedError,setFeedError]=useState(''); const [pairAction,setPairAction]=useState<{market:Market;tradeUrl:string;exchange:'Binance'|'Bybit'|'Gate'}|null>(null);const pairDialogRef=useRef<HTMLElement|null>(null);const pairTriggerRef=useRef<HTMLElement|null>(null);const pairTouchStart=useRef<number|null>(null); const [snapshotLoaded,setSnapshotLoaded]=useState(false); const [updatedAt,setUpdatedAt]=useState<number|null>(null); const [exchangeMenuOpen,setExchangeMenuOpen]=useState(false); const [draggingColumn,setDraggingColumn]=useState<string|null>(null);const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
 useEffect(()=>{
  if(!pairAction)return;
  const dialog=pairDialogRef.current;
  dialog?.focus();
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape'){setPairAction(null);return}if(event.key==='Tab'&&dialog){const focusable=[...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>element.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};
  document.addEventListener('keydown',onKeyDown);
  return()=>{document.removeEventListener('keydown',onKeyDown);pairTriggerRef.current?.focus()};
 },[Boolean(pairAction)]);
 const [taData,setTaData]=useState<Record<string,Record<string,StrategyIndicatorRecord>>>({});
 const [taLoading,setTaLoading]=useState<Record<string,boolean>>({});
 const [customStrategies,setCustomStrategies]=useState<Strategy[]>(()=>{try{const saved:Strategy[]=JSON.parse(localStorage.getItem('bkp-screener-strategies')||'[]');for(const strategy of saved)strategy.conditions=(strategy.conditions||[]).map(condition=>{const next=migrateCondition(condition);if(next.field==='takerBuyRatio'&&typeof next.value==='number'&&next.value<=1)next.value*=100;return next});return saved}catch{return[]}});
 const strategyTimeframe:StrategyTimeframe='1h';
 const [minVolumeUsd,setMinVolumeUsd]=useState<number|null>(preferences.minVolumeUsd===undefined?10_000_000:preferences.minVolumeUsd);
 const [maxVolumeUsd,setMaxVolumeUsd]=useState<number|null>(preferences.maxVolumeUsd??null);
 const [activeStrategies,setActiveStrategies]=useState<Strategy[]>(()=>{const available=[...quickStrategies,...defaultStrategies,...customStrategies];const ids=preferences.strategyIds||(preferences.strategyId?[preferences.strategyId]:[]);return ids.map(id=>available.find(strategy=>strategy.id===id)).filter((strategy):strategy is Strategy=>Boolean(strategy))});
 const [previewStrategy,setPreviewStrategy]=useState<Strategy|null>(null);
 const handleStrategySelect=useCallback((strategy:Strategy|null)=>{setActiveStrategies(current=>strategy?current.some(item=>item.id===strategy.id)?current.filter(item=>item.id!==strategy.id):[...current,strategy]:[]);setPreviewStrategy(null);setFilter('')},[]);
 const handleStrategySave=useCallback((strategy:Strategy)=>{setActiveStrategies(current=>current.some(item=>item.id===strategy.id)?current.map(item=>item.id===strategy.id?strategy:item):[...current,strategy]);setPreviewStrategy(null);setFilter('')},[]);
 const handleStrategyPreview=useCallback((strategy:Strategy)=>setPreviewStrategy(strategy),[]);
 const selectedStrategies=previewStrategy?[previewStrategy]:activeStrategies;
 const evaluatedStrategies=useMemo(()=>selectedStrategies.map(strategy=>{const resolved=resolveStrategy(strategy,strategyTimeframe);if(exchange!=='Binance'&&resolved.id==='beginner-volume-breakout')return {...resolved,conditions:resolved.conditions.filter(condition=>condition.field!=='takerBuyRatio')};return resolved}),[selectedStrategies,strategyTimeframe,exchange]);
 const evaluatedStrategy=evaluatedStrategies[0]||null;
 const candleConditions=evaluatedStrategies.flatMap(strategy=>strategy.conditions).filter(condition=>!['oiChangePct1h','fundingPerHour','premiumBasisPct'].includes(condition.field)&&!(condition.field==='quoteVolume'&&condition.timeframe==='1d'));
 const strategyTimeframeKey=[...new Set([...candleConditions.map(condition=>condition.timeframe),...visibleColumns.filter(column=>column.startsWith('ta')).map(column=>column.split(':')[1])])].filter(timeframe=>periods.includes(timeframe)).sort((a,b)=>periods.indexOf(a)-periods.indexOf(b)).join(',');
 const strategyUpdatedAt=useMemo(()=>{const observed=Object.values(taData[strategyTimeframe]||{}).reduce((latest,record)=>Math.max(latest,record.lastClosedCandleTime),0);const duration=({ '5m':300000,'15m':900000,'1h':3600000,'4h':14400000,'8h':28800000,'12h':43200000,'1d':86400000 } as Record<StrategyTimeframe,number>)[strategyTimeframe];const close=observed||Math.floor(Date.now()/duration)*duration-1;return new Date(close).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})},[taData,strategyTimeframe]);
 const marketIdsKey=markets.map(market=>market.id).join(',');
 useEffect(()=>{localStorage.setItem('bkp-screener-strategies',JSON.stringify(customStrategies))},[customStrategies]);
 useEffect(()=>{
  if(!strategyTimeframeKey||markets.length===0){setTaLoading({});return}
  const controller=new AbortController();let stopped=false,busy=false;
  const timeframes=strategyTimeframeKey.split(',');
  setTaLoading(current=>({...current,...Object.fromEntries(timeframes.map(timeframe=>[timeframe,true]))}));
  const refresh=async()=>{
   if(busy||stopped)return;busy=true;
   await Promise.all(timeframes.map(async timeframe=>{
    try{
     const data=await loadStrategyIndicators({exchange,markets,timeframe,feedUrl:exchange==='Binance'?resolveMarketFeedUrl():'',includeLongShortRatio:evaluatedStrategies.some(strategy=>strategy.conditions.some(condition=>condition.field==='longShortRatio'&&condition.timeframe===timeframe)),signal:controller.signal,onResult:(marketId,record)=>{if(!stopped)setTaData(current=>({...current,[timeframe]:{...current[timeframe],[marketId]:record}}))}});
     if(!stopped)setTaData(current=>({...current,[timeframe]:{...current[timeframe],...data}}));
    }catch(error){if(!controller.signal.aborted)console.warn(`Unable to initialize ${timeframe} strategy indicators`,error)}
    finally{if(!stopped)setTaLoading(current=>({...current,[timeframe]:false}))}
   }));
   busy=false;
  };
  void refresh();const timer=window.setInterval(()=>void refresh(),30000);
  return()=>{stopped=true;controller.abort();window.clearInterval(timer)};
 },[exchange,strategyTimeframeKey,marketIdsKey,evaluatedStrategies]);
 useEffect(()=>{
   setMarkets(exchange==='Binance'?seed:[]);setSnapshotLoaded(false);setFeed('connecting');setFeedError('');setUpdatedAt(null);setTableScrollTop(0);detailsAttemptedRef.current.clear();
   let disposed=false;let marketList=exchange==='Binance'?seed:[];let btcMinuteBars:any[]=[];let btcHourBars:any[]=[];let btcDataFetchedAt=0;let futuresInfoReady=false;let spotInfoReady=false;let futuresSymbols=new Set(seed.map(m=>m.symbol));let futuresPerpetuals=new Set(seed.map(m=>m.symbol));let futuresQuote=new Map(seed.map(m=>[m.symbol,m.quote]));let futuresAssetClass=new Map(seed.map(m=>[m.symbol,'Crypto' as AssetClass]));let spotQuote=new Map<string,string>();let spotTickers=new Map<string,any>();let spotLoaded=false;let auxiliaryBusy=false;let auxiliaryPending=false;let volumeById=new Map(seed.map(m=>[m.id,m.v24]));let loadAux:()=>Promise<void>=async()=>{};
  const base='/binance-api/v1';
  const requestJson=async(url:string,label:string)=>{let lastError:unknown;for(let attempt=0;attempt<3;attempt++){try{const parsed=new URL(url,window.location.origin);let market='futures',path=parsed.pathname;if(path.startsWith('/binance-spot-api')){market='spot';path=path.replace('/binance-spot-api','/api')}else if(path.startsWith('/binance-data')){market='data';path=path.replace('/binance-data','')}else if(path.startsWith('/binance-api'))path=path.replace('/binance-api','/fapi');let target:string;if(market==='spot')target=`https://data-api.binance.vision${path}`;else if(market==='futures'||market==='data')target=`https://fapi.binance.com${path}`;else target=`${CONFIG.portal.supabaseUrl}/functions/v1/market-data?action=proxy&market=${market}&path=${encodeURIComponent(path)}`;parsed.searchParams.forEach((value,key)=>{const separator=target.includes('?')?'&':'?';target+=`${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`});const response=await fetch(target);if(!response.ok){const error:any=new Error(`${label} ${response.status}`);error.retryable=response.status===429||response.status>=500;throw error}return await response.json()}catch(error:any){lastError=error;if(error?.retryable===false||attempt===2)throw error;await new Promise(resolve=>window.setTimeout(resolve,350*(attempt+1)))}}throw lastError};
  const rest=(path:string)=>requestJson(`${base}${path}`,'Binance API');
  const spotRest=(path:string)=>requestJson(`/binance-spot-api/v3${path}`,'Binance Spot API');
  const futuresData=(path:string)=>requestJson(`/binance-data${path}`,'Binance API');
  const loadSnapshot=async()=>{
   try{
    if(exchange==='Bybit'||exchange==='Gate'){
     const incoming=await loadDirectSnapshot(exchange);
     if(disposed)return;
     marketList=incoming;volumeById=new Map(incoming.map(m=>[m.id,m.v24]));
     setMarkets(current=>{const previous=new Map(current.map(m=>[m.id,m]));return incoming.map(m=>{const old=previous.get(m.id);return old?{...m,m5:old.m5,h1:old.h1,v1:old.v1,v15:old.v15,oiChange:old.oiChange,vol:old.vol,trend:old.trend,metrics:{...m.metrics,...old.metrics}}:m})});
     setSnapshotLoaded(true);setUpdatedAt(Date.now());setFeed('live');return;
    }
    const [info,tickers,premiums,fundingIntervals]=await Promise.all([futuresInfoReady?Promise.resolve(null):rest('/exchangeInfo'),rest('/ticker/24hr'),rest('/premiumIndex'),rest('/fundingInfo').catch(()=>[])]);
    if(disposed||!Array.isArray(tickers)||!Array.isArray(premiums))return;
    if(!futuresInfoReady&&Array.isArray(info?.symbols)){
     const tradable=info.symbols.filter((s:any)=>s.status==='TRADING');futuresSymbols=new Set(tradable.map((s:any)=>s.symbol));futuresPerpetuals=new Set(tradable.filter((s:any)=>String(s.contractType).includes('PERPETUAL')).map((s:any)=>s.symbol));futuresQuote=new Map(tradable.map((s:any)=>[s.symbol,s.quoteAsset]));futuresAssetClass=new Map(tradable.map((s:any)=>[s.symbol,classifyAsset(String(s.underlyingType||'COIN'))]));futuresInfoReady=true;
    }
    try{
     const [spotInfo,spotData]=await Promise.all([spotInfoReady?Promise.resolve(null):spotRest('/exchangeInfo'),spotRest('/ticker/24hr')]);
     if(!spotInfoReady&&Array.isArray(spotInfo?.symbols)){spotQuote=new Map(spotInfo.symbols.filter((s:any)=>s.status==='TRADING').map((s:any)=>[s.symbol,s.quoteAsset]));spotInfoReady=true}
     if(Array.isArray(spotData)){spotTickers=new Map(spotData.filter((t:any)=>spotQuote.has(t.symbol)).map((t:any)=>[t.symbol,t]));spotLoaded=true}
    }catch(e){console.warn(`Could not load ${exchange} Spot snapshot`,e)}
    const tickerBySymbol=new Map(tickers.filter((t:any)=>futuresSymbols.has(t.symbol)).map((t:any)=>[t.symbol,t]));
    const premiumBySymbol=new Map(premiums.map((p:any)=>[p.symbol,p]));
    // Binance only returns symbols with non-default funding intervals; all others settle every 8 hours.
    const fundingIntervalBySymbol=new Map((Array.isArray(fundingIntervals)?fundingIntervals:[]).map((item:any)=>[item.symbol,Number(item.fundingIntervalHours)]));
    const usdQuotes=new Set(['USDT','USDC','FDUSD','BUSD','TUSD','USDP','DAI','USD','USD1','USDE']);
    const quoteUsd=(quote:string)=>{if(usdQuotes.has(quote))return 1;const direct=spotTickers.get(`${quote}USDT`)||tickerBySymbol.get(`${quote}USDT`);if(direct)return Number(direct.lastPrice);const inverse=spotTickers.get(`USDT${quote}`)||tickerBySymbol.get(`USDT${quote}`);return inverse?1/Number(inverse.lastPrice):NaN};
    const futuresMarkets=Array.from(tickerBySymbol.entries()).map(([symbol,t]:any)=>{const quote=futuresQuote.get(symbol)||'USD',premium=premiumBySymbol.get(symbol);const index=Number(premium?.indexPrice),mark=Number(premium?.markPrice);return {id:`Futures:${symbol}`,marketType:'Futures' as const,assetClass:futuresAssetClass.get(symbol)||'Crypto',hasPerpetualData:futuresPerpetuals.has(symbol),symbol,quote,quoteUsd:quoteUsd(quote),price:Number(t.lastPrice),high24h:Number(t.highPrice),low24h:Number(t.lowPrice),m5:NaN,h1:NaN,d1:Number(t.priceChangePercent),v1:NaN,v15:NaN,v24:Number(t.quoteVolume),oi:NaN,oiChange:NaN,funding:Number(premium?.lastFundingRate),fundingIntervalHours:fundingIntervalBySymbol.get(symbol)||8,vol:NaN,trades:0,trend:[],metrics:{premiumBasisPct:Number.isFinite(index)&&index!==0?(mark-index)/index*100:NaN}}});
    const spotMarkets=spotLoaded?Array.from(spotTickers.entries()).map(([symbol,t]:any)=>{const quote=spotQuote.get(symbol)||'';return {id:`Spot:${symbol}`,marketType:'Spot' as const,assetClass:'Crypto' as const,hasPerpetualData:false,symbol,quote,quoteUsd:quoteUsd(quote),price:Number(t.lastPrice),high24h:Number(t.highPrice),low24h:Number(t.lowPrice),m5:NaN,h1:NaN,d1:Number(t.priceChangePercent),v1:NaN,v15:NaN,v24:Number(t.quoteVolume),oi:NaN,oiChange:NaN,funding:NaN,vol:NaN,trades:Number(t.count)||0,trend:[]}}):[];
    const nextMarkets=[...futuresMarkets,...spotMarkets];marketList=nextMarkets;
    volumeById=new Map(nextMarkets.map(m=>[m.id,m.v24]));
    setMarkets(current=>{
     const previous=new Map(current.map(m=>[m.id,m]));return nextMarkets.map(m=>{const old=previous.get(m.id);return old?{...m,m5:old.m5,h1:old.h1,v1:old.v1,v15:old.v15,oi:old.oi,oiChange:old.oiChange,vol:old.vol,trend:old.trend,metrics:old.metrics}:m});
    });
    setSnapshotLoaded(true);setUpdatedAt(Date.now());setFeed('live');
    }catch(e){if(!disposed){setFeed('unavailable');setFeedError(e instanceof Error?e.message:String(e))}console.warn(`Could not load ${exchange} market snapshot`,e)}
  };
  loadAux=async()=>{
   if(disposed||marketList.length===0||document.visibilityState!=='visible')return;if(auxiliaryBusy){auxiliaryPending=true;return}auxiliaryBusy=true;
   if(Date.now()-btcDataFetchedAt>=300000){try{if(exchange==='Binance'){const [bm,bh]=await Promise.all([rest('/klines?symbol=BTCUSDT&interval=1m&limit=60'),rest('/klines?symbol=BTCUSDT&interval=1h&limit=24')]);btcMinuteBars=bm;btcHourBars=bh}else{const btcMarket=marketList.find(m=>m.symbol==='BTCUSDT'&&m.marketType==='Futures');if(btcMarket){const btcDetail=await loadDirectDetails(exchange,btcMarket as any);btcMinuteBars=btcDetail.minutes||[];btcHourBars=btcDetail.hours||[]}}btcDataFetchedAt=Date.now()}catch{}};
   const ranked=[...marketList].sort((a,b)=>((volumeById.get(b.id)||0)*(Number.isFinite(b.quoteUsd)?b.quoteUsd:0))-((volumeById.get(a.id)||0)*(Number.isFinite(a.quoteUsd)?a.quoteUsd:0)));
   const byId=new Map(ranked.map(m=>[m.id,m]));const stale=(id:string)=>Date.now()-(detailsAttemptedRef.current.get(id)||0)>300_000;const visible=visibleIdsRef.current.map(id=>byId.get(id)).filter((m):m is Market=>Boolean(m));const batch=visible.filter(m=>m.marketType!=='CFD'&&stale(m.id)).slice(0,40);let next=0;
   const loadContract=async(market:Market)=>{
    const {id,symbol,marketType,hasPerpetualData}=market;
    detailsAttemptedRef.current.set(id,Date.now());
    try{
     const candles=(path:string)=>marketType==='Spot'?spotRest(path):rest(path);
     let directDetail:any=null;
     const candleTask=(exchange==='Binance'?Promise.allSettled([
      candles(`/klines?symbol=${symbol}&interval=1m&limit=60`),
      candles(`/klines?symbol=${symbol}&interval=1h&limit=48`),
     ]).then(results=>{
      if(disposed)return;
     const value=(index:number)=>{const result=results[index];return result.status==='fulfilled'?result.value:[]};
     const minuteData=value(0),hourData=value(1);const minutes=Array.isArray(minuteData)?minuteData:[];const hours=Array.isArray(hourData)?hourData:[];return applyCandleDetails(minutes,hours);
     }):loadDirectDetails(exchange,market as any).then(detail=>{directDetail=detail;return applyCandleDetails(detail.minutes||[],detail.hours||[])}));
     const applyCandleDetails=(minutes:any[],hours:any[])=>{
     const last5=minutes.slice(-5),last15=minutes.slice(-15);
     if(minutes.length&&hours.length)detailsAttemptedRef.current.set(id,Date.now());
     const metrics:Record<string,number>={};
     for(const period of periods){const n=period==='5m'?5:period==='15m'?15:period==='1h'?60:period==='4h'?240:period==='8h'?480:period==='12h'?720:1440;const data=n<=60?minutes:hours;const count=Math.max(1,Math.round(n<=60?n:n/60));const bars=data.slice(-count);const prior=data.slice(-count*2,-count);const first=bars[0],last=bars.at(-1);const start=first?Number(first[1]):NaN;const end=last?Number(last[4]):NaN;const change=Number.isFinite(start)&&start!==0?(end/start-1)*100:NaN;const dollar=Number.isFinite(start)?end-start:NaN;const volume=bars.reduce((s:number,c:any)=>s+Number(c[7]||0),0);const tradeCount=bars.reduce((s:number,c:any)=>s+Number(c[8]||0),0);const range=bars.length&&end?((Math.max(...bars.map((c:any)=>Number(c[2])))-Math.min(...bars.map((c:any)=>Number(c[3]))))/end)*100:NaN;const oldVol=prior.reduce((s:number,c:any)=>s+Number(c[7]||0),0);
      metrics[`chgPct:${period}`]=change;metrics[`chgUsd:${period}`]=dollar;metrics[`volume:${period}`]=volume;const counts=bars.map((c:any)=>c[8]).filter((value:any)=>value!==null&&value!==undefined&&Number.isFinite(Number(value))).map(Number);metrics[`trades:${period}`]=counts.length?counts.reduce((sum:number,value:number)=>sum+value,0):NaN;metrics[`volatility:${period}`]=range;metrics[`oiPct:${period}`]=NaN;metrics[`oiUsd:${period}`]=NaN;metrics[`volumeDelta:${period}`]=volume-oldVol;metrics[`volChange:${period}`]=oldVol>0?(volume/oldVol-1)*100:NaN;const ownCandles=n<=15?minutes:hours;const btcCandles=n<=15?btcMinuteBars:btcHourBars;const horizon=n<=15?n:n/60;const ownReturns=rollingReturns(ownCandles.map((c:any)=>Number(c[4])),horizon);const btcReturns=rollingReturns(btcCandles.map((c:any)=>Number(c[4])),horizon);metrics[`btcCorr:${period}`]=correlation(ownReturns,btcReturns);
     }
     const meanHour=hours.slice(-25,-1).reduce((s:number,c:any)=>s+Number(c[7]||0),0)/Math.max(1,Math.min(24,hours.length-1));metrics.rvol=metrics['volume:1h']/meanHour;
     setMarkets(current=>current.map(row=>row.id!==id?row:{...row,metrics,
      trend:hours.length?hours.map((c:any)=>Number(c[4])):[],
      m5:last5.length===5?(Number(last5.at(-1)[4])/Number(last5[0][1])-1)*100:NaN,
      vol:last15.length===15?(Math.max(...last15.map((c:any)=>Number(c[2])))-Math.min(...last15.map((c:any)=>Number(c[3]))))/Number(last15.at(-1)[4])*100:NaN,
      h1:hours.length>=2?(Number(hours.at(-1)[4])/Number(hours.at(-2)[4])-1)*100:row.h1,
      v1:hours.length?Number(hours.at(-1)[7]):NaN,v15:last15.length===15?last15.reduce((sum:number,c:any)=>sum+Number(c[7]),0):NaN,
     }));
     };
     const oiTask=hasPerpetualData?(exchange==='Binance'?Promise.all([futuresData(`/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=200`),futuresData(`/futures/data/openInterestHist?symbol=${symbol}&period=4h&limit=10`),futuresData(`/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=30`)]).then(([five,four,hour]:any[][])=>({fiveMinute:five.map(x=>({time:Number(x.timestamp),value:Number(x.sumOpenInterest)})),fourHourly:four.map(x=>({time:Number(x.timestamp),value:Number(x.sumOpenInterest)})),hourly:hour.map(x=>({time:Number(x.timestamp),value:Number(x.sumOpenInterest)}))})):candleTask.then(()=>directDetail||{})).then((history:any)=>{
      if(disposed)return;const five=(history.fiveMinute||[]).filter((x:any)=>x.value!==null&&Number.isFinite(Number(x.value)));const four=(history.fourHourly||[]).filter((x:any)=>x.value!==null&&Number.isFinite(Number(x.value)));const hours=(history.hourly||[]).filter((x:any)=>x.value!==null&&Number.isFinite(Number(x.value)));if(exchange==='Binance'&&five.length===0)return;const metrics:Record<string,number>={};for(const period of periods){const useHourly=period==='1d'&&hours.length>1;const useFourHourly=['4h','8h','12h'].includes(period)&&four.length>0;const series=useHourly?hours:useFourHourly?four:five;const step=useHourly?24:useFourHourly?period==='4h'?1:period==='8h'?2:3:period==='5m'?1:period==='15m'?3:period==='1h'?12:period==='4h'?48:period==='8h'?96:144;const newest=Number(series.at(-1)?.value);const earlier=Number(series.at(-1-step)?.value);metrics[`oiPct:${period}`]=Number.isFinite(earlier)&&earlier>0?(newest/earlier-1)*100:NaN;metrics[`oiUsd:${period}`]=Number.isFinite(newest)&&Number.isFinite(earlier)?(newest-earlier)*market.price:NaN}
      setMarkets(current=>current.map(row=>row.id!==id?row:{...row,metrics:{...row.metrics,...metrics},oiChange:metrics['oiPct:1h']}));
     }).catch(()=>{}):Promise.resolve();
     await Promise.all([candleTask,oiTask]);
    }catch(e){console.warn(`Could not load ${exchange} ${marketType} candle details for ${symbol}`,e)}
   };
   await Promise.all(Array.from({length:Math.min(5,batch.length)},async()=>{while(next<batch.length){const market=batch[next++];await loadContract(market)}}));
   auxiliaryBusy=false;if(auxiliaryPending){auxiliaryPending=false;void loadAux()}
  };
  loadAuxRef.current=()=>void loadAux();
  void loadSnapshot();
  const refresh=window.setInterval(()=>void loadSnapshot(),30000);
  const refreshAux=window.setInterval(()=>void loadAux(),30000);const onVisibilityChange=()=>{if(document.visibilityState==='visible')void loadAux()};document.addEventListener('visibilitychange',onVisibilityChange);
  return ()=>{disposed=true;window.clearInterval(refresh);window.clearInterval(refreshAux);document.removeEventListener('visibilitychange',onVisibilityChange);if(scrollThrottleRef.current)window.clearTimeout(scrollThrottleRef.current)};
 },[exchange]);
 const quoteOptions=useMemo(()=>{const available=new Set(markets.map(m=>m.quote).filter(Boolean));const preferred=['USDT','USDC','FDUSD','TRY'];return [...preferred.filter(q=>available.has(q)),...Array.from(available).filter(q=>!preferred.includes(q)).sort()]},[markets]);
 const assetClassOptions:AssetClass[]=['Crypto','Stocks','Commodities','Indices','Forex'].filter(asset=>markets.some(m=>m.assetClass===asset)) as AssetClass[];
 const shown=visibleColumns.map(id=>allColumns.find(column=>column.id===id)).filter((column):column is (typeof allColumns)[number]=>Boolean(column));
 const stickyWidths:Record<string,number>={trend:96,symbol:190,price:126};
 const stickyLeft=(id:string)=>42+shown.slice(0,shown.findIndex(c=>c.id===id)).reduce((sum,c)=>sum+(stickyWidths[c.id]||0),0);
 const stickyClass=(id:string)=>stickyWidths[id]?`sticky-column sticky-${id}`:'';
 const metric=(m:Market,id:string):number=>{if(id==='price')return m.price;if(id==='oi')return m.oi;if(id==='funding')return m.funding;if(id==='rvol')return m.metrics?.rvol??NaN;if(id==='mcap')return m.mcap??NaN;if(id.startsWith('ta')){const [field,timeframe]=id.split(':');const record=taData[timeframe]?.[m.id];const key=field==='taRSI'?'rsi14':field==='taADX'?'adx14':'rvol';const value=record?.[key];return typeof value==='number'?value:NaN}if(id==='symbol')return 0;if(id==='trend')return 0;if(id==='chgPct:5m')return m.m5;if(id==='chgPct:1h')return m.h1;if(id==='chgPct:1d')return m.d1;if(id==='volume:1h')return m.v1;if(id==='volume:15m')return m.v15;if(id==='volume:1d')return m.v24;if(id==='oiPct:1h')return m.oiChange;return m.metrics?.[id]??NaN};
 const activeStrategyUnavailable=evaluatedStrategies.some(strategy=>strategy.conditions.some(condition=>{const availability=indicatorFields.find(field=>field.value===condition.field)?.exchanges;return availability&&!availability.includes(exchange)}));
 const evaluateStrategyCondition=(market:Market,condition:IndicatorCondition)=>conditionMatches(market,condition,taData);
 const insufficientHistoryCount=useMemo(()=>{
  if(!evaluatedStrategies.length)return 0;
  return markets.filter(market=>{
   if(marketFilter!=='all'&&market.marketType!==marketFilter)return false;
   if(assetFilter!=='all'&&market.assetClass!==assetFilter)return false;
   if(quoteFilter!=='all'&&market.quote!==quoteFilter)return false;
   return evaluatedStrategies.some(strategy=>{
    if(strategy.marketScope==='Futures'&&market.marketType!=='Futures')return false;
    const states=strategy.conditions.map(condition=>evaluateStrategyCondition(market,condition));
    if(strategy.join==='AND'?states.every(Boolean):states.some(Boolean))return false;
    const insufficient=strategy.conditions.map((condition,index)=>{
     if(['quoteVolume','oiChangePct1h','fundingPerHour','premiumBasisPct'].includes(condition.field))return false;
     const record=taData[condition.timeframe]?.[market.id];
     return Boolean(record&&record.historyBars<minimumHistoryForField(condition)&&!states[index]);
    });
    return strategy.join==='AND'?insufficient.some((missing,index)=>missing&&states.every((passed,other)=>other===index||passed)):insufficient.some(Boolean);
   });
  }).length;
 },[markets,evaluatedStrategies,marketFilter,assetFilter,quoteFilter,taData]);
 const volumeBaseRows=useMemo(()=>markets.filter(x=>x.symbol.toLowerCase().includes(query.toLowerCase())&&(quoteFilter==='all'||x.quote===quoteFilter)&&(marketFilter==='all'||x.marketType===marketFilter)&&(assetFilter==='all'||x.assetClass===assetFilter)),[markets,query,quoteFilter,marketFilter,assetFilter]);
 const volumeRangeCount=useMemo(()=>({total:volumeBaseRows.length,included:volumeBaseRows.filter(m=>{const usd=m.v24*m.quoteUsd;return Number.isFinite(usd)&&(minVolumeUsd===null||usd>=minVolumeUsd)&&(maxVolumeUsd===null||usd<=maxVolumeUsd)&&(minVolumeUsd===null||maxVolumeUsd===null||maxVolumeUsd>minVolumeUsd)}).length}),[volumeBaseRows,minVolumeUsd,maxVolumeUsd]);
 const handleVolumeRangeChange=useCallback((min:number|null,max:number|null)=>{setMinVolumeUsd(min);setMaxVolumeUsd(max)},[]);
 const rows=useMemo(()=>{
  let a=volumeBaseRows.filter(m=>{const usd=m.v24*m.quoteUsd;return Number.isFinite(usd)&&(minVolumeUsd===null||usd>=minVolumeUsd)&&(maxVolumeUsd===null||usd<=maxVolumeUsd)&&(minVolumeUsd===null||maxVolumeUsd===null||maxVolumeUsd>minVolumeUsd)});
  if(filter==='Watchlist')a=a.filter(x=>watch.includes(x.id));
  const volumeStrategy=evaluatedStrategies.find(strategy=>strategy.quickSort==='volume:1d');
  const topVolumeIds=volumeStrategy?new Set([...markets].sort((x,y)=>{
   const volumeOf=(market:Market)=>Number.isFinite(market.v24*market.quoteUsd)?market.v24*market.quoteUsd:Number.NEGATIVE_INFINITY;
   return volumeOf(y)-volumeOf(x);
  }).slice(0,Math.ceil(markets.length*0.2)).map(m=>m.id)):new Set<string>();
  if(evaluatedStrategies.length){
   const unavailableIds=new Set(evaluatedStrategies.filter(strategy=>strategy.conditions.some(condition=>{const available=indicatorFields.find(field=>field.value===condition.field)?.exchanges;return available&&!available.includes(exchange)})).map(strategy=>strategy.id));
   a=a.filter(m=>evaluatedStrategies.some(strategy=>{
    if(unavailableIds.has(strategy.id)||(strategy.marketScope==='Futures'&&m.marketType!=='Futures'))return false;
    if(strategy.quickSort==='volume:1d'&&!topVolumeIds.has(m.id))return false;
    const matches=strategy.conditions.map(condition=>evaluateStrategyCondition(m,condition));
    return strategy.join==='AND'?matches.length>0&&matches.every(Boolean):matches.some(Boolean);
   }));
  }
  return [...a].sort((x,y)=>{
   const quickSort=evaluatedStrategies.length===1?evaluatedStrategy?.quickSort:undefined;
   if(quickSort){
    const value=(m:Market)=>quickSort==='volume:1d'?m.v24*m.quoteUsd:quickSort==='oiPct'?Number(m.metrics?.[`oiPct:${strategyTimeframe}`]??m.oiChange):quickSort==='chgPct'?Math.abs(Number(taData[strategyTimeframe]?.[m.id]?.changePct)):Math.abs(m.funding*100/(m.fundingIntervalHours||8));
    return value(y)-value(x);
   }
   const av=metric(x,sort.key),bv=metric(y,sort.key),af=Number.isFinite(av),bf=Number.isFinite(bv);
   if(!af&&!bf)return 0;if(!af)return 1;if(!bf)return-1;return(av-bv)*sort.dir;
  });
 },[markets,volumeBaseRows,minVolumeUsd,maxVolumeUsd,filter,sort,watch,taData,evaluatedStrategies,evaluatedStrategy,strategyTimeframe,exchange]);
 const rowHeight=42,headerHeight=39,viewportHeight=tableScrollRef.current?.clientHeight||600;const firstRow=Math.max(0,Math.floor(Math.max(0,tableScrollTop-headerHeight)/rowHeight)-10);const visibleCount=Math.ceil(viewportHeight/rowHeight)+20;const loaderRows=rows.slice(firstRow,firstRow+visibleCount);visibleIdsRef.current=loaderRows.map(m=>m.id);const visibleKey=loaderRows.map(m=>m.id).join(',');const handleTableScroll=()=>{if(scrollThrottleRef.current!==null)return;scrollThrottleRef.current=window.setTimeout(()=>{scrollThrottleRef.current=null;setTableScrollTop(tableScrollRef.current?.scrollTop||0)},100)};useEffect(()=>{if(!filtersMountedRef.current){filtersMountedRef.current=true;if(tableScrollRef.current)tableScrollRef.current.scrollTop=tableScrollTop;return}if(tableScrollRef.current)tableScrollRef.current.scrollTop=0;setTableScrollTop(0)},[query,quoteFilter,marketFilter,assetFilter,filter,sort]);useEffect(()=>{if(snapshotLoaded)loadAuxRef.current()},[query,quoteFilter,marketFilter,assetFilter,filter,sort,snapshotLoaded,visibleKey]);

 const sortBy=(key:string)=>setSort(s=>({key,dir:s.key===key?-s.dir:-1}));
 const fixedColumnIds=new Set(['trend','symbol','price']);
 const reorderColumn=(source:string,target:string)=>{if(source===target||fixedColumnIds.has(source)||fixedColumnIds.has(target))return;setVisibleColumns(current=>{const next=[...current],movable=next.filter(id=>!fixedColumnIds.has(id)),from=movable.indexOf(source),to=movable.indexOf(target);if(from<0||to<0)return current;movable.splice(from,1);movable.splice(to,0,source);let index=0;return next.map(id=>fixedColumnIds.has(id)?id:movable[index++])})};
 const th=(title:string,key:string)=><th key={key} draggable={!fixedColumnIds.has(key)} onDragStart={event=>{if(fixedColumnIds.has(key)){event.preventDefault();return}setDraggingColumn(key);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',key)}} onDragOver={event=>{if(!fixedColumnIds.has(key))event.preventDefault()}} onDrop={event=>{event.preventDefault();const source=event.dataTransfer.getData('text/plain')||draggingColumn;if(source)reorderColumn(source,key);setDraggingColumn(null)}} onDragEnd={()=>setDraggingColumn(null)} className={`${stickyClass(key)} ${draggingColumn===key?'column-dragging':''}`} style={stickyWidths[key]?{left:stickyLeft(key)}:undefined} onClick={()=>sortBy(key)} title={fixedColumnIds.has(key)?'Pinned column; click to sort':'Drag to reorder; click to sort'}>{title}<span className="sort">{sort.key===key?(sort.dir===1?<ArrowUp size={11}/>:<ArrowDown size={11}/>):'↕'}</span></th>;
 useEffect(()=>{try{localStorage.setItem('bkp-screener-columns',JSON.stringify(visibleColumns))}catch{}},[visibleColumns]);
 useEffect(()=>{try{localStorage.setItem('bkp-screener-preferences',JSON.stringify({query,exchange,filter,quoteFilter,marketFilter,assetFilter,sort,watch,scrollTop:tableScrollTop,strategyIds:activeStrategies.map(strategy=>strategy.id),minVolumeUsd,maxVolumeUsd} satisfies ScreenerPreferences))}catch{}},[query,exchange,filter,quoteFilter,marketFilter,assetFilter,sort,watch,tableScrollTop,activeStrategies,minVolumeUsd,maxVolumeUsd]);
 const renderCell=(m:Market,id:string)=>{const value=metric(m,id);if(id.startsWith('ta')){const timeframe=id.split(':')[1];if(taLoading[timeframe])return <span className="neutral" title={`${timeframe} indicators are being initialized on demand`}>LOADING</span>;if(!Number.isFinite(value))return <span className="neutral">—</span>;return <span>{id.startsWith('taRVOL:')?`${value.toFixed(2)}x`:value.toFixed(2)}</span>}if(id==='trend')return <svg className="spark" viewBox="0 0 84 30" preserveAspectRatio="none"><polyline points={m.trend.map((v,i)=>`${i*3.65},${27-((v-Math.min(...m.trend))/(Math.max(...m.trend)-Math.min(...m.trend)||1))*22}`).join(' ')} fill="none" stroke={m.d1>=0?'#36d6a0':'#f36d83'} strokeWidth="1.5"/></svg>;if(id==='symbol'){const base=m.symbol.replace(m.quote,'');const tradeUrl=pairTradeUrl(exchange,m,base);return <button className="symbol-link" type="button" aria-haspopup="dialog" onClick={event=>{pairTriggerRef.current=event.currentTarget;setPairAction({market:m,tradeUrl,exchange})}} title={`Open ${base}/${m.quote} on ${exchange}`}><div className="symbol-cell"><CoinIcon symbol={m.symbol} quote={m.quote}/><b>{base}</b><small>{m.quote} · {m.marketType.toUpperCase()}</small></div></button>}if(id==='price')return <span className="price-cell">{priceFmt(m.price,m.quoteUsd,m.quote)}</span>;if(id==='oi'||id.startsWith('oiUsd:'))return <span>{m.marketType==='Spot'?'—':fmt(value)}</span>;if(id==='funding')return <span className={m.funding>0?'up':'down'}>{Number.isFinite(value)?`${(m.funding*100/(m.fundingIntervalHours||8)).toFixed(4)}%`:'—'}</span>;if(id==='mcap')return <span title="Market capitalization is not provided by Binance public market data.">{Number.isFinite(value)?fmt(value):'N/A'}</span>;if(id.startsWith('chgPct:')||id.startsWith('oiPct:')||id.startsWith('volChange:'))return pct(value);if(id.startsWith('volume:')||id.startsWith('volumeDelta:'))return <span>{marketFmt(value,m.quoteUsd,m.quote)}</span>;if(id.startsWith('trades:'))return countFmt(value);if(id.startsWith('volatility:'))return Number.isFinite(value)?`${value.toFixed(2)}%`:'—';if(id.startsWith('btcCorr:'))return Number.isFinite(value)?value.toFixed(2):'—';if(id.startsWith('chgUsd:'))return Number.isFinite(value)?priceFmt(value,m.quoteUsd,m.quote):'—';return Number.isFinite(value)?value.toFixed(2):'—'};
 const trackedVolume=markets.reduce((sum,m)=>sum+(Number.isFinite(m.v24)&&Number.isFinite(m.quoteUsd)?m.v24*m.quoteUsd:0),0); const volumeHistory=markets.filter(m=>Number.isFinite(m.metrics?.['volume:1d'])&&Number.isFinite(m.metrics?.['volumeDelta:1d'])&&Number.isFinite(m.quoteUsd));const currentTrackedVolume=volumeHistory.reduce((sum,m)=>sum+m.metrics!['volume:1d']*m.quoteUsd,0);const previousTrackedVolume=volumeHistory.reduce((sum,m)=>sum+(m.metrics!['volume:1d']-m.metrics!['volumeDelta:1d'])*m.quoteUsd,0);const trackedVolumeChange=previousTrackedVolume>0?(currentTrackedVolume/previousTrackedVolume-1)*100:NaN; const oiValues=markets.filter(m=>Number.isFinite(m.oi)); const trackedOi=oiValues.length?oiValues.reduce((sum,m)=>sum+m.oi,0):NaN;const oiHistory=oiValues.filter(m=>Number.isFinite(m.metrics?.['oiUsd:1d']));const currentTrackedOi=oiHistory.reduce((sum,m)=>sum+m.oi,0);const previousTrackedOi=oiHistory.reduce((sum,m)=>sum+m.oi-m.metrics!['oiUsd:1d'],0);const trackedOiChange=previousTrackedOi>0?(currentTrackedOi/previousTrackedOi-1)*100:NaN; const btc=markets.find(m=>m.symbol==='BTCUSDT');
 const freshness=updatedAt?`${Math.max(0,Math.floor((Date.now()-updatedAt)/1000))}s ago`:'WAITING FOR FEED';
 const exchangeLogos:Record<'Binance'|'Bybit'|'Gate',string>={Binance:'/binance-mark.svg',Bybit:'/bybit.svg',Gate:'/gate.svg'};
 const exchangeChoices:Array<'Binance'|'Bybit'|'Gate'>=['Binance','Bybit','Gate'];
 const chooseExchange=(next:'Binance'|'Bybit'|'Gate')=>{setExchange(next);setQuoteFilter('all');setMarketFilter('all');setAssetFilter('all');setFilter('');setExchangeMenuOpen(false)};
 return <div className="screen-page"><header className="screen-header"><a className="screen-brand" href="/"><img className="brand-logo" src="/bicara-krypto.svg" alt="Bicara Krypto"/><span className="brand-pulse">Bicara Krypto Pulse</span></a><div className="screen-head-right"><span className="market-status"><i/>{exchange.toUpperCase()} MARKETS</span><div className="exchange-picker"><button className="exchange-select header-exchange" type="button" aria-label="Exchange" aria-haspopup="listbox" aria-expanded={exchangeMenuOpen} onClick={()=>setExchangeMenuOpen(open=>!open)}><img className="exchange-logo" src={exchangeLogos[exchange]} alt=""/><span>{exchange}</span><ChevronDown size={13}/></button>{exchangeMenuOpen&&<><button className="exchange-menu-dismiss" type="button" aria-label="Close exchange menu" onClick={()=>setExchangeMenuOpen(false)}/><div className="exchange-menu" role="listbox" aria-label="Choose exchange">{exchangeChoices.map(choice=><button key={choice} type="button" role="option" aria-selected={exchange===choice} className={exchange===choice?'selected':''} onClick={()=>chooseExchange(choice)}><img className="exchange-logo" src={exchangeLogos[choice]} alt=""/><span>{choice}</span></button>)}</div></>}</div><button className="avatar logout-button" type="button" onClick={onSignOut} title={`Sign out ${userEmail}`} aria-label="Sign out"><LogOut size={13}/></button></div></header>
 <main className="screen-main"><div className="screen-title-row"><div><div className="eyebrow"><span>MARKET TOOLS</span><span className="slash">/</span><span>SCREENER</span></div><h1>Market Screener</h1><p>Real-time spot and futures data. Find your next setup.</p></div></div>
 {['Binance','Bybit'].includes(exchange)&&feed!=='live'&&<div className="feed-notice"><b>Please Connect Your VPN to view {exchange} Data.</b><span>{exchange} may be unavailable on some networks. Connect a VPN that can access {exchange}, then refresh this page.</span></div>}
 <section className="market-overview"><div className="overview-label"><span className="overview-icon"><Activity size={15}/></span>MARKET PULSE <span className={`pulse-live feed-${feed}`}>{feed==='live'?'LIVE':['Binance','Bybit'].includes(exchange)?'NOT SYNCED':'SYNC'}</span></div><div className="overview-stat"><small>BTC 24H CHANGE</small><b>{btc?pct(btc.d1):'—'}</b><span className="muted">{exchange.toUpperCase()} MARKETS</span></div><div className="overview-stat"><small>24H VOLUME · TRACKED</small><b>{fmt(trackedVolume)}<span className="stat-change">{pct(trackedVolumeChange)}</span></b><span className="muted">vs prior 24h · {volumeHistory.length} markets with history</span></div><div className="overview-stat"><small>OPEN INTEREST · TRACKED</small><b>{fmt(trackedOi)}<span className="stat-change">{pct(trackedOiChange)}</span></b><span className="muted">24h change · {oiHistory.length} futures with history</span></div></section>
 <section className="screener-panel"><div className="panel-top"><div className="panel-heading"><span className="panel-icon"><img className="market-exchange-logo" src={exchangeLogos[exchange]} alt=""/></span><div><h2>{exchange} markets</h2><p>Spot and derivatives markets</p></div>{feed!=='live'&&<span className="data-state">{['Binance','Bybit'].includes(exchange)&&(feed==='connecting'||feed==='unavailable')?'Please Connect Your VPN to view '+exchange+' Data.':feed==='unavailable'?'REST RETRYING':snapshotLoaded?'REST SNAPSHOT':feed==='connecting'?'SAMPLE SNAPSHOT':'REFRESHING'}</span>}</div><div className="panel-controls"><button className="icon-button column-visibility-button" title="Column visibility" onClick={()=>setColumnsOpen(true)}><SlidersHorizontal size={15}/> Columns</button><label className="search-box"><Search size={15}/><input placeholder="Search markets..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></label></div></div>
 <div className="filters-row screener-filter-layout">
  <section className="filter-find-row" aria-label="What to find">
   <span className="filter-row-kicker">WHAT TO FIND</span>
   <div className="strategy-filter-row"><StrategyControls exchange={exchange} customStrategies={customStrategies} active={activeStrategies} onSelect={handleStrategySelect} onSave={handleStrategySave} onCustomStrategiesChange={setCustomStrategies} onPreview={handleStrategyPreview} ready={Object.values(taLoading).every(loading=>!loading)} selectedTimeframe={strategyTimeframe} updatedAt={strategyUpdatedAt} insufficientHistoryCount={insufficientHistoryCount}/>{activeStrategyUnavailable&&<span className="strategy-unavailable-note">Some selected strategies use data unavailable on {exchange}.</span>}{selectedStrategies.some(strategy=>strategy.id==='beginner-volume-breakout')&&exchange!=='Binance'&&<span className="technical-filter-hint">Taker data not available on this exchange.</span>}</div>
  </section>
  <section className="filter-markets-row" aria-label="Which markets">
   <span className="filter-row-kicker">WHICH MARKETS</span>
   <div className="market-filter-controls">
    <label className="quote-filter"><span>MARKET</span><select value={marketFilter} onChange={e=>setMarketFilter(e.target.value as 'all'|MarketType)}><option value="all">All markets</option><option value="Spot">Spot</option><option value="Futures">Futures</option><option value="Options">Options</option><option value="CFD" disabled>CFD (feed unavailable)</option></select><ChevronDown size={12}/></label>
    <label className="quote-filter"><span>ASSET</span><select value={assetFilter} onChange={e=>setAssetFilter(e.target.value as 'all'|AssetClass)}><option value="all">All assets</option>{assetClassOptions.map(asset=><option key={asset} value={asset}>{asset}</option>)}</select><ChevronDown size={12}/></label>
    <label className="quote-filter"><span>QUOTE</span><select value={quoteFilter} onChange={e=>setQuoteFilter(e.target.value)}><option value="all">All pairs</option>{quoteOptions.map(q=><option key={q} value={q}>{q}</option>)}</select><ChevronDown size={12}/></label>
    <VolumeRangeControl minVolumeUsd={minVolumeUsd} maxVolumeUsd={maxVolumeUsd} onChange={handleVolumeRangeChange} count={volumeRangeCount}/>
    <button type="button" className="mobile-filter-button" onClick={()=>setMobileFiltersOpen(true)}><SlidersHorizontal size={14}/> Filters <b>{(marketFilter!=='all'?1:0)+(assetFilter!=='all'?1:0)+(quoteFilter!=='all'?1:0)+(minVolumeUsd!==10_000_000||maxVolumeUsd!==null?1:0)}</b></button>
    <div className="results-count"><span className="live-dot"/><span className="market-count-text">{rows.length} of {markets.length} markets{activeStrategies.length>1?` · match any of ${activeStrategies.length} strategies`:''}</span><span className="desktop-updated">· Updated {updatedAt?new Date(updatedAt).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}):'—'}</span><button title="Watchlist" onClick={()=>setFilter(filter==='Watchlist'?'':'Watchlist')}><Star size={14}/></button></div>
    {(marketFilter!=='all'||assetFilter!=='all'||quoteFilter!=='all'||minVolumeUsd!==10_000_000||maxVolumeUsd!==null)&&<button className="reset-market-filters" type="button" onClick={()=>{setMarketFilter('all');setAssetFilter('all');setQuoteFilter('all');setMinVolumeUsd(10_000_000);setMaxVolumeUsd(null)}}>Reset all</button>}
   </div>
  </section>
  {mobileFiltersOpen&&<div className="mobile-filters-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setMobileFiltersOpen(false)}}><section className="mobile-filters-sheet" role="dialog" aria-modal="true" aria-label="Market filters"><header><b>Filters</b><button type="button" onClick={()=>{setMarketFilter('all');setAssetFilter('all');setQuoteFilter('all');setMinVolumeUsd(10_000_000);setMaxVolumeUsd(null)}}>Reset all</button><button type="button" className="mobile-filter-close" aria-label="Close filters" onClick={()=>setMobileFiltersOpen(false)}><X size={18}/></button></header>
   <label className="mobile-filter-select"><span>MARKET</span><select value={marketFilter} onChange={e=>setMarketFilter(e.target.value as 'all'|MarketType)}><option value="all">All markets</option><option value="Spot">Spot</option><option value="Futures">Futures</option><option value="Options">Options</option><option value="CFD" disabled>CFD (feed unavailable)</option></select></label>
   <label className="mobile-filter-select"><span>ASSET</span><select value={assetFilter} onChange={e=>setAssetFilter(e.target.value as 'all'|AssetClass)}><option value="all">All assets</option>{assetClassOptions.map(asset=><option key={asset} value={asset}>{asset}</option>)}</select></label>
   <label className="mobile-filter-select"><span>QUOTE</span><select value={quoteFilter} onChange={e=>setQuoteFilter(e.target.value)}><option value="all">All pairs</option>{quoteOptions.map(q=><option key={q} value={q}>{q}</option>)}</select></label>
   <div className="mobile-volume-control"><VolumeRangeControl minVolumeUsd={minVolumeUsd} maxVolumeUsd={maxVolumeUsd} onChange={handleVolumeRangeChange} count={volumeRangeCount}/></div>
   <button type="button" className="mobile-show-markets" onClick={()=>setMobileFiltersOpen(false)}>Show {rows.length} markets</button>
  </section></div>}
 </div>
 {pairAction&&(()=>{const market=markets.find(item=>item.id===pairAction.market.id)||pairAction.market;const base=market.marketType==='Options'?market.symbol:market.symbol.replace(market.quote,'');const pair=market.marketType==='Options'?market.symbol:`${base}/${market.quote}`;const offer=exchangeOffers[pairAction.exchange];return <div className="pair-action-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setPairAction(null)}}><section ref={pairDialogRef} tabIndex={-1} className="pair-action-dialog" role="dialog" aria-modal="true" aria-labelledby="pair-action-title" onTouchStart={event=>{pairTouchStart.current=event.touches[0]?.clientY??null}} onTouchEnd={event=>{const start=pairTouchStart.current;const end=event.changedTouches[0]?.clientY;if(start!==null&&end!==undefined&&end-start>90&&(pairDialogRef.current?.scrollTop??0)<8)setPairAction(null);pairTouchStart.current=null}}><div className="pair-action-drag-handle" aria-hidden="true"/><header className="pair-action-header"><div className="pair-action-kicker">{pairAction.exchange} · {market.marketType}</div><button type="button" aria-label="Close snapshot" onClick={()=>setPairAction(null)}><X size={20}/></button></header><div className="pair-action-summary"><div className="pair-action-pair-line"><h2 id="pair-action-title">{pair}</h2><a className="pair-open-link" href={pairAction.tradeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${pair} on ${pairAction.exchange}`} onClick={()=>trackEvent('open_header_tag',pairAction.exchange,pair)}><span className="pair-open-desktop">Open on {pairAction.exchange}</span><ExternalLink size={13}/></a></div><div className="pair-action-price-line"><strong>{priceFmt(market.price,market.quoteUsd,market.quote)}</strong><span className={`pair-change-badge ${market.d1>=0?'positive':'negative'}`}>{market.d1>0?'+':''}{Number.isFinite(market.d1)?market.d1.toFixed(2):'—'}% 24h</span></div></div><div className="pair-action-market-stats"><span>24h volume</span><strong>{marketFmt(market.v24,market.quoteUsd,market.quote)}</strong></div><ExchangeCandleChart exchange={pairAction.exchange} market={market}/><section className="pair-offer-card" aria-label={`${pairAction.exchange} referral offer`}><img className="pair-offer-logo" src={exchangeLogos[pairAction.exchange]} alt={`${pairAction.exchange} logo`}/><div className="pair-offer-copy"><h3>Trade {pair} on {pairAction.exchange}</h3><p>New to {pairAction.exchange}? <a href={offer.signup} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent('reward_link',pairAction.exchange,pair)}><span className="reward-desktop">{offer.reward}</span><span className="reward-mobile">{offer.mobileReward}</span> ↗</a></p></div><div className="pair-offer-actions"><a className="pair-action-signup" href={offer.signup} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent('signup_button',pairAction.exchange,pair)}>Sign up and trade {base} <span aria-hidden="true">→</span></a><div className="pair-offer-existing">Already have an account? <a href={pairAction.tradeUrl} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent('open_bottom_link',pairAction.exchange,pair)}>Open on {pairAction.exchange}</a></div></div></section><small className="pair-action-disclosure">Referral links may support Bicara Krypto Pulse. Rewards and eligibility are set by each exchange. Not financial advice.</small></section></div>})()}
 {columnsOpen&&<div className="columns-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setColumnsOpen(false)}}><section className="columns-panel" role="dialog" aria-modal="true" aria-label="Column Visibility"><header><span>Column Visibility</span><button onClick={()=>setColumnsOpen(false)} aria-label="Close">×</button></header><div className="columns-content">{columnGroups.map(group=><section className="column-group" key={group.id}><div className="column-group-title"><span>{group.label}</span>{group.id!=='core'&&<button onClick={()=>setVisibleColumns(v=>v.filter(id=>!group.columns.some(c=>c.id===id)))}>Hide All</button>}</div><div className="column-options">{group.columns.map(c=><label key={c.id} className={c.id==='symbol'?'disabled-option':''}><input type="checkbox" checked={visibleColumns.includes(c.id)} onChange={e=>setVisibleColumns(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/><span>{c.label}</span></label>)}</div></section>)}</div><footer><button onClick={()=>setVisibleColumns(allColumnIds)}>All</button><button onClick={()=>setVisibleColumns(defaultColumnIds)}>Defaults</button><button onClick={()=>setVisibleColumns(['trend','symbol','price','oi','funding','rvol','mcap'])}>Core Only</button></footer></section></div>}
 <div className="table-scroll" ref={tableScrollRef} onScroll={handleTableScroll}><table><thead><tr><th className="star-cell sticky-column sticky-star" style={{left:0}}></th>{shown.map(c=>th(c.id==='trend'?'24H TREND':c.id==='symbol'?'SYMBOL':c.id==='price'?'PRICE':c.id==='oi'?'OI $':c.id==='funding'?'FUNDING / H':c.id==='rvol'?'RVOL':c.id==='mcap'?'MCAP':metricTitle(c.id),c.id))}</tr></thead><tbody>{rows.map(m=><tr key={m.id}><td className="star-cell sticky-column sticky-star" style={{left:0}}><button className={watch.includes(m.id)?'is-watch':''} onClick={()=>setWatch(w=>w.includes(m.id)?w.filter(x=>x!==m.id):[...w,m.id])}><Star size={13}/></button></td>{shown.map(c=><td key={c.id} className={`${c.id==='symbol'?'symbol-data ':c.id==='price'?'price-cell ':''}${stickyClass(c.id)}`} style={stickyWidths[c.id]?{left:stickyLeft(c.id)}:undefined}>{renderCell(m,c.id)}</td>)}</tr>)}</tbody></table>{rows.length===0&&<div className="empty-state">{selectedStrategies.length>0&&Object.values(taLoading).some(Boolean)?'Loading closed-candle history for this strategy. Markets will appear as data arrives.':'No markets match this filter.'}</div>}</div>
 <div className="table-footer"><span>Showing <b>{rows.length}</b> of <b>{markets.length}</b> {exchange} markets</span><span className={`footer-live feed-${feed}`}><span className="live-dot"/>{freshness}</span></div></section>
 <footer className="screen-footer"><span>BICARA KRYPTO PULSE <span>·</span> MARKET SCREENER</span><nav><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#status">System status <i/></a></nav><span>MARKET DATA FOR INFORMATIONAL PURPOSES</span></footer></main></div>
};

export const ScreenerPage:React.FC=()=>{
 const [session,setSession]=useState<Session|null>(null);const [authLoading,setAuthLoading]=useState(true);const [accessLoading,setAccessLoading]=useState(false);const [hasAccess,setHasAccess]=useState<boolean|null>(null);const [signInLoading,setSignInLoading]=useState(false);const [authError,setAuthError]=useState(()=>readOAuthCallbackError());const [loginFailed,setLoginFailed]=useState(()=>consumeScreenerAuthFailure()||Boolean(readOAuthCallbackError()));
 const activeUserIdRef=useRef<string|null>(null);const accessChecksInFlightRef=useRef(new Set<string>());
 useEffect(()=>{
  let mounted=true;
  const checkKitaAccess=async(userId:string)=>{
   let cachedUserId='';try{cachedUserId=sessionStorage.getItem(KITA_ACCESS_SESSION_KEY)||''}catch{}
   if(cachedUserId===userId){setHasAccess(true);setAccessLoading(false);return}
   if(accessChecksInFlightRef.current.has(userId))return;
   accessChecksInFlightRef.current.add(userId);setAccessLoading(true);
   const {data,error}=await supabase.from('students').select('id').eq('user_id',userId).eq('has_kita',true).neq('status','suspended').maybeSingle();
   const {data:{session:latestSession}}=await supabase.auth.getSession();
   accessChecksInFlightRef.current.delete(userId);
   if(!mounted||latestSession?.user.id!==userId)return;
   const allowed=!error&&Boolean(data);setHasAccess(allowed);setAccessLoading(false);
   try{if(allowed)sessionStorage.setItem(KITA_ACCESS_SESSION_KEY,userId);else if(sessionStorage.getItem(KITA_ACCESS_SESSION_KEY)===userId)sessionStorage.removeItem(KITA_ACCESS_SESSION_KEY)}catch{}
  };
  void supabase.auth.getSession().then(({data})=>{if(!mounted)return;const userId=data.session?.user.id||null;activeUserIdRef.current=userId;setSession(data.session);setAuthLoading(false);if(userId)void checkKitaAccess(userId);else setHasAccess(false)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
   if(!mounted)return;
   const nextUserId=nextSession?.user.id||null;const sameUser=activeUserIdRef.current===nextUserId;
   activeUserIdRef.current=nextUserId;setSession(nextSession);
   if(nextUserId){if(sameUser&&hasCachedKitaAccess()){setHasAccess(true);setAccessLoading(false);return}setHasAccess(null);window.setTimeout(()=>{if(mounted)void checkKitaAccess(nextUserId)},0)}
   else{try{sessionStorage.removeItem(KITA_ACCESS_SESSION_KEY)}catch{}setAccessLoading(false);setHasAccess(false)}
  });
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 const signIn=async()=>{setSignInLoading(true);setLoginFailed(false);setAuthError('');try{markScreenerAuthPending();const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/screener`}});if(error){clearPendingScreenerAuth();markScreenerAuthFailed();setAuthError(error.message);setLoginFailed(true);setSignInLoading(false)}}catch(error){clearPendingScreenerAuth();markScreenerAuthFailed();setAuthError(error instanceof Error?error.message:'Unable to start Google sign-in.');setLoginFailed(true);setSignInLoading(false)}};
 const signOut=async()=>{try{sessionStorage.removeItem(KITA_ACCESS_SESSION_KEY)}catch{}await supabase.auth.signOut();window.location.replace('/')};
 if(authLoading||(session?.user&&(accessLoading||hasAccess===null)))return <div className="screen-page"><main className="access-wrap"><section className="access-card"><div className="access-spinner"/><h1>{hasCachedKitaAccess()?'Restoring your screener':'Checking KITA access'}</h1><p>{hasCachedKitaAccess()?'Restoring your previous session and screener settings.':'Please wait while we verify your student account.'}</p></section></main></div>;
 if(!session?.user)return <div className="screen-page"><header className="screen-header"><a className="screen-brand" href="/"><img className="brand-logo" src="/bicara-krypto.svg" alt="Bicara Krypto"/><span className="brand-pulse">Bicara Krypto Pulse</span></a></header><main className="access-wrap"><section className="access-card"><div className="access-badge">KITA STUDENTS</div><h1>Sign in to open the screener</h1><p>Access is reserved for KITA students. Sign in with the Google account registered for your course.</p>{(loginFailed||authError)&&<div className="access-error"><strong>Screener Hanya Untuk Pelajar KITA.</strong>{' '}<span>Email ini tidak berdaftar sebagai pelajar KITA. Jika anda pelajar, hubungi kami di WhatsApp.</span></div>}<button className="google-signin" type="button" onClick={()=>void signIn()} disabled={signInLoading}><GoogleMark/><span>{signInLoading?'Connecting to Google…':'Continue with Google'}</span></button><a className="access-home" href="/" onClick={clearPendingScreenerAuth}>Back to Bicara Krypto</a></section></main></div>;
 if(!hasAccess)return <div className="screen-page"><header className="screen-header"><a className="screen-brand" href="/"><img className="brand-logo" src="/bicara-krypto.svg" alt="Bicara Krypto"/><span className="brand-pulse">Bicara Krypto Pulse</span></a></header><main className="access-wrap"><section className="access-card"><ShieldAlert className="access-shield"/><div className="access-badge">ACCESS RESTRICTED</div><h1>Screener Hanya Untuk Pelajar KITA.</h1><p>Email ini tidak berdaftar sebagai pelajar KITA. Jika anda pelajar, hubungi kami di WhatsApp.</p><button className="google-signin secondary" type="button" onClick={()=>void signOut()}><LogOut size={16}/><span>Sign out</span></button><a className="access-home" href="/" onClick={clearPendingScreenerAuth}>Back to Bicara Krypto</a></section></main></div>;
 return <ScreenerDashboard userEmail={session.user.email||'KITA student'} onSignOut={()=>void signOut()}/>;
};

const GoogleMark:React.FC=()=> <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.2-1.8 13.6-4.8L31 34.1c-1.8 1.2-4.1 2-7 2-5.3 0-9.9-3.6-11.5-8.4H5.7V33C9.1 39.6 16 44 24 44z"/><path fill="#FBBC05" d="M12.5 27.7a12 12 0 0 1 0-7.4v-5.3H5.7a20 20 0 0 0 0 18z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.2 5.8 29.5 4 24 4 16 4 9.1 8.4 5.7 15l6.8 5.3C14.1 15.6 18.7 12 24 12z"/></svg>;
