import React from 'react';
import { Plus, Save, SlidersHorizontal, X } from 'lucide-react';
import { ATR_PRESETS, INDICATOR_PRESETS, STRATEGY_THRESHOLDS } from '../../lib/strategyConfig';

export type IndicatorField =
  | 'priceVsEma' | 'emaCross' | 'rsi14' | 'stochRsi' | 'macd' | 'diDirection' | 'adx14' | 'supertrend'
  | 'bollinger' | 'atr14Percent' | 'rangeBreakout' | 'changePct' | 'distanceFrom24hHighPct' | 'distanceFrom24hLowPct'
  | 'quoteVolume' | 'rvol' | 'takerBuyRatio' | 'dailyVwap' | 'oiChangePct1h' | 'fundingPerHour'
  | 'marketPositioning' | 'distanceFromEmaPct' | 'consecutiveCandles' | 'longShortRatio' | 'premiumBasisPct'
  | 'ema20' | 'ema50' | 'ema100' | 'ema200' | 'macd.histogram' | 'ema9_21Cross' | 'ema20_50Cross' | 'ema50_200Cross'
  | 'macd.histogramCross' | 'stochRsi.kdCross' | 'rsi50Cross' | 'stochRsi.k' | 'stochRsi.d' | 'bollinger.squeeze'
  | 'breakout' | 'breakdown' | 'dailyVwapDistancePct' | 'priceVsVwap' | 'priceVsEma20' | 'priceVsEma50'
  | 'priceVsEma100' | 'priceVsEma200' | 'priceVsTrendEma' | 'ema50_200State';

export type IndicatorCondition = {
  id: string; timeframe: string; field: IndicatorField;
  operator: '>' | '>=' | '<' | '<=' | 'between' | 'beyond' | 'equals';
  value: number | string | boolean; secondValue?: number; setting?: string | number; crossLevel?: number; preset?: string;
};
export type IndicatorJoin = 'AND' | 'OR';
export type IndicatorKind = 'number' | 'signal' | 'boolean' | 'state';
type Group = 'Trend' | 'Momentum' | 'Volatility' | 'Volume' | 'Derivatives';
type Exchange = 'Binance'|'Bybit'|'Gate';
type Recipe = { id:string; label:string; operator:IndicatorCondition['operator']; value:number|string|boolean; secondValue?:number; setting?:string; crossLevel?:number };

export const indicatorFields: Array<{ value: IndicatorField; label: string; kind: IndicatorKind; group: Group; help: string; exchanges?: Exchange[] }> = [
  {value:'priceVsEma',label:'Price vs EMA',kind:'state',group:'Trend',help:'Compare the latest closed price with an exponential moving average.'},
  {value:'emaCross',label:'EMA cross',kind:'signal',group:'Trend',help:'Compare a fast and slow EMA, or find a recent cross.'},
  {value:'diDirection',label:'Trend direction (+DI / −DI)',kind:'state',group:'Trend',help:'Shows whether buyers (+DI) or sellers (−DI) have stronger directional movement.'},
  {value:'adx14',label:'ADX (14)',kind:'number',group:'Trend',help:'Measures trend strength, regardless of direction.'},
  {value:'supertrend',label:'SuperTrend (10, 3)',kind:'state',group:'Trend',help:'Trend direction from the 10-period ATR and 3x multiplier.'},
  {value:'distanceFromEmaPct',label:'Distance from EMA %',kind:'number',group:'Trend',help:'Percent distance between the latest closed price and selected EMA.'},
  {value:'rsi14',label:'RSI (14)',kind:'number',group:'Momentum',help:'Wilder RSI from closed candles; crosses use the selected timeframe cross window.'},
  {value:'stochRsi',label:'Stoch RSI',kind:'number',group:'Momentum',help:'Stochastic RSI %K/%D or their recent cross direction.'},
  {value:'macd',label:'MACD (12, 26, 9)',kind:'state',group:'Momentum',help:'Compare MACD line with its signal line or detect a recent turn.'},
  {value:'changePct',label:'Price change %',kind:'number',group:'Momentum',help:'Percent price change over the selected timeframe.'},
  {value:'consecutiveCandles',label:'Consecutive candles',kind:'number',group:'Momentum',help:'Count green or red closed candles in a row.'},
  {value:'bollinger',label:'Bollinger Bands (20, 2)',kind:'boolean',group:'Volatility',help:'Detect a squeeze or a close outside either band.'},
  {value:'atr14Percent',label:'ATR % (14)',kind:'number',group:'Volatility',help:'Average true range as a percentage of the latest closed price.'},
  {value:'rangeBreakout',label:'Range breakout',kind:'boolean',group:'Volatility',help:'Check whether the close broke the previous N-candle high or low.'},
  {value:'distanceFrom24hHighPct',label:'Distance from 24h high %',kind:'number',group:'Volatility',help:'Percent distance below the exchange-reported rolling 24-hour high.'},
  {value:'distanceFrom24hLowPct',label:'Distance from 24h low %',kind:'number',group:'Volatility',help:'Percent distance above the exchange-reported rolling 24-hour low.'},
  {value:'quoteVolume',label:'Quote volume (USD)',kind:'number',group:'Volume',help:'Quote volume converted to USD where a quote conversion is available.'},
  {value:'rvol',label:'RVOL (20)',kind:'number',group:'Volume',help:'Last closed candle quote volume divided by the previous 20-candle average.'},
  {value:'takerBuyRatio',label:'Taker buy ratio (%)',kind:'number',group:'Volume',help:'Share of taker volume that was buying.',exchanges:['Binance']},
  {value:'dailyVwap',label:'VWAP (daily)',kind:'state',group:'Volume',help:'Compare price with UTC-day VWAP. Available on 5m, 15m and 1h only.'},
  {value:'oiChangePct1h',label:'OI change %',kind:'number',group:'Derivatives',help:'Open-interest change in contracts over the condition timeframe.',exchanges:['Binance','Bybit','Gate']},
  {value:'fundingPerHour',label:'Funding per hour %',kind:'number',group:'Derivatives',help:'Live funding normalized using each contract’s funding interval.',exchanges:['Binance','Bybit','Gate']},
  {value:'marketPositioning',label:'Market positioning',kind:'state',group:'Derivatives',help:'Classify price direction and contract open-interest direction together.',exchanges:['Binance','Bybit','Gate']},
  {value:'longShortRatio',label:'Long/short ratio',kind:'number',group:'Derivatives',help:'Global futures long/short account ratio.',exchanges:['Binance']},
  {value:'premiumBasisPct',label:'Premium / basis %',kind:'number',group:'Derivatives',help:'(Mark price − index price) ÷ index price × 100.',exchanges:['Binance','Bybit','Gate']},
];

const timeframes = ['5m','15m','1h','4h','8h','12h','1d'];
const groups: Group[] = ['Trend','Momentum','Volatility','Volume','Derivatives'];
const isVwap=(field:IndicatorField)=>field==='dailyVwap'||field==='dailyVwapDistancePct'||field==='priceVsVwap';
const fieldKind=(field:IndicatorField,setting?:string|number):IndicatorKind=>{
  if(field==='stochRsi')return setting==='cross'?'signal':'number';
  if(field==='rsi14')return setting==='cross'?'signal':'number';
  if(field==='emaCross')return String(setting||'').endsWith(':state')?'state':'signal';
  if(field==='macd')return setting==='cross'?'signal':'state';
  if(field==='dailyVwap')return setting==='distance'?'number':'state';
  if(field==='bollinger'||field==='rangeBreakout')return 'boolean';
  return indicatorFields.find(item=>item.value===field)?.kind||'number';
};
const settings:Partial<Record<IndicatorField,Array<[string,string]>>>= {
  priceVsEma:INDICATOR_PRESETS.emaPeriods.map(period=>[String(period),`EMA ${period}`]),
  distanceFromEmaPct:INDICATOR_PRESETS.emaPeriods.map(period=>[String(period),`EMA ${period}`]),
  emaCross:INDICATOR_PRESETS.emaCrossPairs.flatMap(pair=>[[`${pair}:state`,`${pair} state`],[`${pair}:cross`,`${pair} cross`]]),
  rsi14:[['value','RSI value'],['cross','Cross level']], stochRsi:[['k','%K'],['d','%D'],['cross','K / D cross']],
  macd:[['state','Line vs signal'],['cross','Recent cross']],
  rangeBreakout:INDICATOR_PRESETS.rangeLookbacks.flatMap(period=>[[`${period}-up`,`${period} candle high`],[`${period}-down`,`${period} candle low`]]),
  bollinger:[['squeeze','Squeeze'],['upper','Upper band'],['lower','Lower band']], dailyVwap:[['state','Price vs VWAP'],['distance','Distance %']],
  consecutiveCandles:[['green','Green candles'],['red','Red candles']],
};

const recipe=(id:string,label:string,operator:IndicatorCondition['operator'],value:number|string|boolean,extra:Partial<Recipe>={}):Recipe=>({id,label,operator,value,...extra});
const recipesFor=(field:IndicatorField,setting:string,timeframe:string):Recipe[]=>{
  const thresholds=STRATEGY_THRESHOLDS[timeframe as keyof typeof STRATEGY_THRESHOLDS]||STRATEGY_THRESHOLDS['1h'];
  const presets=INDICATOR_PRESETS;
  switch(field){
    case 'priceVsEma':return [recipe('above','Above','equals','above'),recipe('below','Below','equals','below'),recipe('crossUp','Just crossed above','equals','up'),recipe('crossDown','Just crossed below','equals','down')];
    case 'emaCross':return setting.endsWith(':state')?[recipe('bullish','Bullish (fast above slow)','equals','above'),recipe('bearish','Bearish','equals','below')]:[recipe('crossUp','Just crossed up','equals','up'),recipe('crossDown','Just crossed down','equals','down')];
    case 'rsi14':return setting==='cross'?[recipe('crossUp50','Just crossed above 50','equals','up',{crossLevel:presets.rsi.bullish}),recipe('crossDown50','Just crossed below 50','equals','down',{crossLevel:presets.rsi.bullish})]:[
      recipe('oversold',`Oversold (below ${presets.rsi.oversold})`,'<',presets.rsi.oversold),recipe('pulledBack',`Pulled back (below ${presets.rsi.pulledBack})`,'<',presets.rsi.pulledBack),recipe('bullish',`Bullish (above ${presets.rsi.bullish})`,'>',presets.rsi.bullish),recipe('overbought',`Overbought (above ${presets.rsi.overbought})`,'>',presets.rsi.overbought),recipe('custom','Custom','<',presets.rsi.oversold)];
    case 'stochRsi':return setting==='cross'?[recipe('turningUp','Turning up (%K crosses above %D)','equals','up'),recipe('turningDown','Turning down (%K crosses below %D)','equals','down')]:[recipe('oversold',`Oversold (%K below ${presets.stochRsi.oversold})`,'<',presets.stochRsi.oversold,{setting:'k'}),recipe('overbought',`Overbought (%K above ${presets.stochRsi.overbought})`,'>',presets.stochRsi.overbought,{setting:'k'}),recipe('custom','Custom','<',presets.stochRsi.oversold,{setting:'k'})];
    case 'adx14':return [recipe('strong',`Strong trend (above ${presets.adx.strong})`,'>',presets.adx.strong),recipe('veryStrong',`Very strong (above ${presets.adx.veryStrong})`,'>',presets.adx.veryStrong),recipe('choppy',`Choppy (below ${presets.adx.choppy})`,'<',presets.adx.choppy),recipe('custom','Custom','>',presets.adx.strong)];
    case 'diDirection':return [recipe('buyers','Buyers in control','equals','above'),recipe('sellers','Sellers in control','equals','below')];
    case 'supertrend':return [recipe('bullish','Bullish','equals','above'),recipe('bearish','Bearish','equals','below'),recipe('turnedBullish','Just turned bullish','equals','up'),recipe('turnedBearish','Just turned bearish','equals','down')];
    case 'macd':return setting==='cross'?[recipe('turnedBullish','Just turned bullish','equals','up'),recipe('turnedBearish','Just turned bearish','equals','down')]:[recipe('bullish','Bullish (above signal)','equals','above'),recipe('bearish','Bearish','equals','below')];
    case 'bollinger':return [recipe('squeeze','Squeeze','equals',true,{setting:'squeeze'}),recipe('upper','Breaking above upper band','equals',true,{setting:'upper'}),recipe('lower','Breaking below lower band','equals',true,{setting:'lower'})];
    case 'rangeBreakout':return [recipe('newHigh','New high','equals',true,{setting:`${setting.split('-')[0]}-up`}),recipe('newLow','New low','equals',true,{setting:`${setting.split('-')[0]}-down`})];
    case 'dailyVwap':return setting==='distance'?[recipe('custom','Custom','>',0)]:[recipe('above','Price above','equals','above'),recipe('below','Price below','equals','below')];
    case 'changePct':return [recipe('bigUp',`Big move up (above ${thresholds.bigMovePct}%)`,'>',thresholds.bigMovePct),recipe('bigDown',`Big move down (below −${thresholds.bigMovePct}%)`,'<',-thresholds.bigMovePct),recipe('bigEither',`Big move either way (±${thresholds.bigMovePct}%)`,'beyond',thresholds.bigMovePct),recipe('custom','Custom','>',thresholds.bigMovePct)];
    case 'distanceFromEmaPct':return [recipe('stretchedAbove',`Stretched above (>${presets.distanceFromEmaPct.stretched}%)`,'>',presets.distanceFromEmaPct.stretched),recipe('stretchedBelow',`Stretched below (<−${presets.distanceFromEmaPct.stretched}%)`,'<',-presets.distanceFromEmaPct.stretched),recipe('custom','Custom','>',0)];
    case 'distanceFrom24hHighPct':return [recipe('nearHigh',`Near the high (within ${presets.distanceFrom24hPct.near}%)`,'>=',-presets.distanceFrom24hPct.near),recipe('custom','Custom','>',-presets.distanceFrom24hPct.near)];
    case 'distanceFrom24hLowPct':return [recipe('nearLow',`Near the low (within ${presets.distanceFrom24hPct.near}%)`,'<=',presets.distanceFrom24hPct.near),recipe('custom','Custom','>',presets.distanceFrom24hPct.near)];
    case 'atr14Percent':{const atr=ATR_PRESETS[timeframe as keyof typeof ATR_PRESETS]||ATR_PRESETS['1h'];return [recipe('calm',`Calm (below ${atr.calmBelowPct}%)`,'<',atr.calmBelowPct),recipe('active',`Active (above ${atr.activeAbovePct}%)`,'>',atr.activeAbovePct),recipe('veryVolatile',`Very volatile (above ${atr.veryVolatileAbovePct}%)`,'>',atr.veryVolatileAbovePct),recipe('custom','Custom','>',atr.activeAbovePct)]}
    case 'rvol':return [recipe('aboveNormal',`Above normal (≥${presets.rvol.aboveNormal}x)`,'>=',presets.rvol.aboveNormal),recipe('unusual',`Unusual (≥${presets.rvol.unusual}x)`,'>=',presets.rvol.unusual),recipe('extreme',`Extreme (≥${presets.rvol.extreme}x)`,'>=',presets.rvol.extreme),recipe('custom','Custom','>',presets.rvol.aboveNormal)];
    case 'takerBuyRatio':return [recipe('buyers',`Buyers dominant (>${presets.takerBuyRatioPct.buyers}%)`,'>',presets.takerBuyRatioPct.buyers),recipe('sellers',`Sellers dominant (<${presets.takerBuyRatioPct.sellers}%)`,'<',presets.takerBuyRatioPct.sellers),recipe('custom','Custom','>',presets.takerBuyRatioPct.buyers)];
    case 'oiChangePct1h':return [recipe('rising',`Rising (>${thresholds.oiSmallRisePct}%)`,'>',thresholds.oiSmallRisePct),recipe('falling',`Falling (<${thresholds.oiDropPct}%)`,'<',thresholds.oiDropPct),recipe('spike',`Spike (>${thresholds.oiLargeRisePct}%)`,'>',thresholds.oiLargeRisePct),recipe('custom','Custom','>',thresholds.oiSmallRisePct)];
    case 'fundingPerHour':return [recipe('crowdedLongs',`Crowded longs (>${presets.fundingPerHourPct.crowdedLongs}%/h)`,'>',presets.fundingPerHourPct.crowdedLongs),recipe('crowdedShorts',`Crowded shorts (<${presets.fundingPerHourPct.crowdedShorts}%/h)`,'<',presets.fundingPerHourPct.crowdedShorts),recipe('neutral',`Neutral (${presets.fundingPerHourPct.crowdedShorts}–${presets.fundingPerHourPct.neutralUpper}%/h)`,'between',presets.fundingPerHourPct.crowdedShorts,{secondValue:presets.fundingPerHourPct.neutralUpper}),recipe('custom','Custom','>',0)];
    case 'marketPositioning':return ['newLongs','newShorts','shortCovering','longLiquidation'].map((id,i)=>recipe(id,['New longs','New shorts','Short covering','Long liquidation'][i],'equals',id));
    case 'longShortRatio':return [recipe('moreLongs',`More longs (>${presets.longShortRatio.moreLongs})`,'>',presets.longShortRatio.moreLongs),recipe('moreShorts',`More shorts (<${presets.longShortRatio.moreShorts})`,'<',presets.longShortRatio.moreShorts),recipe('custom','Custom','>',1)];
    case 'premiumBasisPct':return [recipe('premium',`Futures at premium (>${presets.premiumBasisPct.premium}%)`,'>',presets.premiumBasisPct.premium),recipe('discount',`Futures at discount (<${presets.premiumBasisPct.discount}%)`,'<',presets.premiumBasisPct.discount),recipe('custom','Custom','>',0)];
    case 'consecutiveCandles':return [recipe('streak',`${presets.consecutiveCandles.minimum}+ ${setting==='red'?'red':'green'} in a row`,'>=',presets.consecutiveCandles.minimum),recipe('custom','Custom','>=',presets.consecutiveCandles.minimum)];
    case 'quoteVolume':return [recipe('custom','Custom','>',0)];
    default:return [recipe('custom','Custom','>',0)];
  }
};

const unitFor=(field:IndicatorField)=>{
  const units=INDICATOR_PRESETS.units;
  if(field==='rsi14')return units.rsi;
  if(field==='stochRsi')return units.stochRsi;
  if(field==='adx14')return units.adx;
  if(field==='changePct')return units.changePct;
  if(field==='distanceFromEmaPct'||field==='distanceFrom24hHighPct'||field==='distanceFrom24hLowPct')return units.distancePct;
  if(field==='atr14Percent')return units.atr;
  if(field==='rvol')return units.rvol;
  if(field==='quoteVolume')return units.volume;
  if(field==='oiChangePct1h')return units.oi;
  if(field==='fundingPerHour')return units.funding;
  if(field==='longShortRatio')return units.longShortRatio;
  if(field==='premiumBasisPct')return units.premiumBasis;
  if(field==='consecutiveCandles')return units.candles;
  if(field==='takerBuyRatio')return units.takerBuyRatio;
  return '';
};
const typicalFor=(field:IndicatorField)=>{
  if(field==='rsi14')return INDICATOR_PRESETS.typicalRanges.rsi;
  if(field==='stochRsi')return INDICATOR_PRESETS.typicalRanges.stochRsi;
  if(field==='adx14')return INDICATOR_PRESETS.typicalRanges.adx;
  if(field==='rvol')return INDICATOR_PRESETS.typicalRanges.rvol;
  if(field==='takerBuyRatio')return INDICATOR_PRESETS.typicalRanges.takerBuyRatio;
  if(field==='fundingPerHour')return INDICATOR_PRESETS.typicalRanges.funding;
  if(field==='longShortRatio')return INDICATOR_PRESETS.typicalRanges.longShortRatio;
  if(field==='consecutiveCandles')return INDICATOR_PRESETS.typicalRanges.consecutiveCandles;
  return INDICATOR_PRESETS.typicalRanges.default;
};
const resolvedTimeframe=(value:string,selected:string)=>value==='selected'?selected:value;
const isCustom=(condition:IndicatorCondition,recipes:Recipe[])=>condition.preset?condition.preset==='custom':!recipes.some(item=>item.operator===condition.operator&&item.value===condition.value&&item.secondValue===condition.secondValue&&(!item.setting||item.setting===String(condition.setting??'')));
const conditionText=(condition:IndicatorCondition,selectedTimeframe:string,fieldMeta?:typeof indicatorFields[number],recipeChoice?:Recipe)=>{
  const timeframe=resolvedTimeframe(condition.timeframe,selectedTimeframe),setting=condition.setting?` ${String(condition.setting).replace(':state','').replace(':cross','').replace('-up','').replace('-down','')}`:'';
  const title=fieldMeta?.label||condition.field;
  if(recipeChoice&&condition.preset!=='custom')return `${title}${setting} on ${timeframe} is ${recipeChoice.label.toLowerCase()}`;
  const unit=unitFor(condition.field),suffix=unit?` ${unit}`:'';
  if(condition.operator==='equals')return `${title}${setting} on ${timeframe} is ${String(condition.value)}`;
  if(condition.operator==='between')return `${title}${setting} on ${timeframe} is between ${condition.value}${suffix} and ${condition.secondValue??''}${suffix}`;
  if(condition.operator==='beyond')return `${title}${setting} on ${timeframe} moved more than ±${condition.value}${suffix}`;
  const op=condition.operator==='>'?'above':condition.operator==='<'?'below':condition.operator==='>='?'at least':'at most';
  return `${title}${setting} on ${timeframe} is ${op} ${condition.value}${suffix}`;
};
export const validateCondition=(condition:IndicatorCondition)=>{
  if(condition.operator==='between'&&Number(condition.value)>=Number(condition.secondValue))return 'The lower value must be less than the upper value.';
  if(['rsi14','stochRsi','adx14'].includes(condition.field)&&[condition.value,...(condition.operator==='between'?[condition.secondValue]:[])].some(value=>!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100))return 'Values must be between 0 and 100.';
  if(condition.field==='takerBuyRatio'&&(!Number.isFinite(Number(condition.value))||Number(condition.value)<0||Number(condition.value)>100))return 'Taker buy ratio must be between 0 and 100%.';
  if(['rvol','longShortRatio','quoteVolume','consecutiveCandles'].includes(condition.field)&&Number(condition.value)<=0)return 'Value must be greater than zero.';
  return '';
};

type Props = {open:boolean;onToggle:()=>void;conditions:IndicatorCondition[];onConditionsChange:(conditions:IndicatorCondition[])=>void;join:IndicatorJoin;onJoinChange:(join:IndicatorJoin)=>void;ready:boolean;inline?:boolean;exchange?:Exchange;selectedTimeframe?:string;onSaveConditions?:()=>void;saveConditionsDisabled?:boolean};

export const TechnicalFilters:React.FC<Props>=({open,onToggle,conditions,onConditionsChange,join,onJoinChange,ready,inline=false,exchange='Binance',selectedTimeframe='1h',onSaveConditions,saveConditionsDisabled=false})=>{
  const update=(id:string,patch:Partial<IndicatorCondition>)=>onConditionsChange(conditions.map(condition=>condition.id===id?{...condition,...patch}:condition));
  const add=()=>onConditionsChange([...conditions,{id:crypto.randomUUID(),timeframe:'selected',field:'rsi14',operator:'<',value:INDICATOR_PRESETS.rsi.oversold,preset:'oversold'}]);
  const resolved=conditions.map(condition=>{const fieldMeta=indicatorFields.find(field=>field.value===condition.field);const options=recipesFor(condition.field,String(condition.setting??''),resolvedTimeframe(condition.timeframe,selectedTimeframe));const choice=options.find(item=>item.id===(condition.preset||''))||options.find(item=>item.operator===condition.operator&&item.value===condition.value&&item.secondValue===condition.secondValue&&(!item.setting||item.setting===String(condition.setting??'')));return {condition,fieldMeta,options,choice,custom:isCustom(condition,options)}});
  const summary=resolved.length?`Find coins where ${resolved.map(({condition,fieldMeta,choice})=>conditionText(condition,selectedTimeframe,fieldMeta,choice)).join(` ${join} `)}.`:'';
  return <div className={inline?'technical-filter-wrap strategy-condition-editor':'technical-filter-wrap'}>
    {!inline&&<button type="button" className={`quick-filter technical-filter-toggle ${conditions.length?'selected':''}`} onClick={onToggle} aria-expanded={open}><SlidersHorizontal size={12}/> Indicators {conditions.length>0&&<span className="technical-filter-count">{conditions.length}</span>}</button>}
    {(inline||open)&&<section className={`technical-filter-panel${inline?' strategy-inline-panel':''}`} aria-label="Indicator filters">
      {!inline&&<header><div><b>Indicator filters</b><span>Combine closed-candle conditions; each can use its own timeframe.</span></div><button type="button" onClick={onToggle} aria-label="Close indicator filters"><X size={15}/></button></header>}
      {!ready&&conditions.length>0&&<p className="technical-filter-hint">Loading the selected timeframe data from {exchange}. Results appear as each market is ready.</p>}
      {summary&&<p className="technical-filter-sentence">{summary}</p>}
      {!inline&&conditions.length>1&&<label className="technical-filter-join">Match <select value={join} onChange={event=>onJoinChange(event.target.value as IndicatorJoin)}><option>AND</option><option>OR</option></select> conditions</label>}
      {resolved.map(({condition,fieldMeta,options,choice,custom},index)=>{
        const kind=fieldKind(condition.field,condition.setting),unavailable=Boolean(fieldMeta?.exchanges&&!fieldMeta.exchanges.includes(exchange)),settingChoices=settings[condition.field],showCustom=custom&&kind==='number';
        const error=showCustom?validateCondition(condition):'';
        return <div className="technical-filter-condition-wrap" key={condition.id}>
          <div className="technical-filter-condition"><span className="technical-filter-index">{index+1}</span>
            <div className="technical-filter-field-wrap"><select aria-label={`Condition ${index+1} indicator`} value={condition.field} onChange={event=>{const field=event.target.value as IndicatorField;const setting=settings[field]?.[0]?.[0];const first=recipesFor(field,String(setting??''),selectedTimeframe)[0];update(condition.id,{field,setting:setting??first.setting,timeframe:field==='dailyVwap'&&!['5m','15m','1h'].includes(condition.timeframe)?'1h':condition.timeframe,operator:first.operator,value:first.value,secondValue:first.secondValue,preset:first.id,crossLevel:first.crossLevel})}}>
              {groups.map(group=><optgroup key={group} label={group}>{indicatorFields.filter(field=>field.group===group).map(field=><option key={field.value} value={field.value} disabled={field.exchanges&&!field.exchanges.includes(exchange)}>{field.label}{field.exchanges&&!field.exchanges.includes(exchange)?' (unavailable)':''}</option>)}</optgroup>)}
            </select><small className="technical-filter-help">{unavailable?`${fieldMeta?.label} is unavailable on ${exchange}.`:fieldMeta?.help}</small></div>
            {settingChoices&&<select aria-label={`Condition ${index+1} setting`} value={String(condition.setting??settingChoices[0][0])} onChange={event=>{const setting=event.target.value;const next=recipesFor(condition.field,setting,resolvedTimeframe(condition.timeframe,selectedTimeframe))[0];update(condition.id,{setting,operator:next.operator,value:next.value,secondValue:next.secondValue,preset:next.id,crossLevel:next.crossLevel})}}>{settingChoices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>}
            <select aria-label={`Condition ${index+1} timeframe`} value={condition.timeframe} onChange={event=>{const timeframe=event.target.value;const next=recipesFor(condition.field,String(condition.setting??''),resolvedTimeframe(timeframe,selectedTimeframe));const selected=next.find(item=>item.id===condition.preset)||next[0];update(condition.id,{timeframe,operator:custom?condition.operator:selected.operator,value:custom?condition.value:selected.value,secondValue:custom?condition.secondValue:selected.secondValue,preset:custom?'custom':selected.id})}}><option value="selected">Selected ({selectedTimeframe})</option>{timeframes.map(value=><option key={value} disabled={isVwap(condition.field)&&!['5m','15m','1h'].includes(value)}>{value}</option>)}</select>
            {condition.field==='rsi14'&&condition.setting==='cross'&&<input aria-label={`Condition ${index+1} RSI cross level`} type="number" min="0" max="100" value={condition.crossLevel??INDICATOR_PRESETS.rsi.bullish} onChange={event=>update(condition.id,{crossLevel:Number(event.target.value)})}/>}
            {options.length>0&&<select aria-label={`Condition ${index+1} choice`} value={custom?'custom':choice?.id||options[0].id} onChange={event=>{const selected=options.find(item=>item.id===event.target.value)||options[0];update(condition.id,{operator:selected.operator,value:selected.value,secondValue:selected.secondValue,setting:selected.setting??condition.setting,preset:selected.id,crossLevel:selected.crossLevel??condition.crossLevel})}}>{options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select>}
            {showCustom&&<><select aria-label={`Condition ${index+1} custom operator`} value={condition.operator} onChange={event=>update(condition.id,{operator:event.target.value as IndicatorCondition['operator'],preset:'custom'})}><option value=">">is above</option><option value="<">is below</option><option value="between">is between</option>{['changePct','oiChangePct1h','fundingPerHour','distanceFromEmaPct','premiumBasisPct'].includes(condition.field)&&<option value="beyond">moved more than (up or down)</option>}</select><label className="technical-filter-number"><input aria-label={`Condition ${index+1} custom value`} type="number" step="any" value={Number(condition.value)} onChange={event=>update(condition.id,{value:event.target.value===''?0:Number(event.target.value),preset:'custom'})}/><span>{unitFor(condition.field)}</span></label>{condition.operator==='between'&&<label className="technical-filter-number"><input aria-label={`Condition ${index+1} upper value`} type="number" step="any" value={condition.secondValue??70} onChange={event=>update(condition.id,{secondValue:Number(event.target.value),preset:'custom'})}/><span>{unitFor(condition.field)}</span></label>}</>}
            <button type="button" className="technical-filter-remove" onClick={()=>onConditionsChange(conditions.filter(item=>item.id!==condition.id))} aria-label={`Remove condition ${index+1}`}><X size={14}/></button>
          </div>
          {showCustom&&!error&&<small className="technical-filter-custom-hint">Typical: {typicalFor(condition.field)}{unitFor(condition.field)&&` · Unit: ${unitFor(condition.field)}`}</small>}{error&&<small className="technical-filter-validation">{error}</small>}
        </div>;
      })}
      <footer><button type="button" className="technical-filter-add" onClick={add}><Plus size={13}/> Add condition</button>{inline&&onSaveConditions&&<button type="button" className="technical-filter-save" disabled={saveConditionsDisabled} title="Continue to strategy details with these conditions" onClick={onSaveConditions}><Save size={13}/> Save condition</button>}<button type="button" className="technical-filter-clear" onClick={()=>onConditionsChange([])}>Clear</button></footer>
      <p className="technical-filter-hint">Indicators use completed candles. Missing or unsupported data never passes a condition.</p>
    </section>}
  </div>;
};
