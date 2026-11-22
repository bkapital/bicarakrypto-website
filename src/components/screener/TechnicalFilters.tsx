import React from 'react';
import { Plus, SlidersHorizontal, X } from 'lucide-react';

export type IndicatorField =
  | 'rsi14' | 'adx14' | 'rvol' | 'ema20' | 'ema50' | 'ema100' | 'ema200'
  | 'macd.histogram' | 'ema9_21Cross' | 'ema20_50Cross' | 'ema50_200Cross' | 'macd.histogramCross'
  | 'diDirection' | 'supertrend' | 'stochRsi.k' | 'stochRsi.d' | 'bollinger.squeeze' | 'atr14Percent'
  | 'breakout' | 'breakdown' | 'changePct' | 'distanceFrom24hHighPct' | 'quoteVolume' | 'takerBuyRatio'
  | 'dailyVwapDistancePct' | 'priceVsVwap' | 'oiChangePct1h' | 'fundingPerHour'
  | 'priceVsEma20' | 'priceVsEma50' | 'priceVsEma100' | 'priceVsEma200' | 'ema50_200State';

export type IndicatorCondition = {
  id: string;
  timeframe: string;
  field: IndicatorField;
  operator: '>' | '>=' | '<' | '<=' | 'between' | 'beyond' | 'equals';
  value: number | string | boolean;
  secondValue?: number;
};

export type IndicatorJoin = 'AND' | 'OR';
export type IndicatorKind = 'number' | 'signal' | 'boolean' | 'state';
export const indicatorFields: Array<{ value: IndicatorField; label: string; kind: IndicatorKind; exchanges?: Array<'Binance'|'Bybit'|'Gate'> }> = [
  { value: 'priceVsEma20', label: 'Price vs EMA 20', kind: 'state' },
  { value: 'priceVsEma50', label: 'Price vs EMA 50', kind: 'state' },
  { value: 'priceVsEma100', label: 'Price vs EMA 100', kind: 'state' },
  { value: 'priceVsEma200', label: 'Price vs EMA 200', kind: 'state' },
  { value: 'ema50_200State', label: 'EMA 50 vs EMA 200', kind: 'state' },
  { value: 'rsi14', label: 'RSI (14)', kind: 'number' },
  { value: 'stochRsi.k', label: 'Stoch RSI %K', kind: 'number' },
  { value: 'stochRsi.d', label: 'Stoch RSI %D', kind: 'number' },
  { value: 'ema9_21Cross', label: 'EMA 9/21 cross', kind: 'signal' },
  { value: 'ema20_50Cross', label: 'EMA 20/50 cross', kind: 'signal' },
  { value: 'ema50_200Cross', label: 'EMA 50/200 cross', kind: 'signal' },
  { value: 'diDirection', label: 'ADX direction (+DI / −DI)', kind: 'state' },
  { value: 'adx14', label: 'ADX (14)', kind: 'number' },
  { value: 'supertrend', label: 'SuperTrend (10, 3)', kind: 'state' },
  { value: 'macd.histogram', label: 'MACD histogram', kind: 'number' },
  { value: 'macd.histogramCross', label: 'MACD histogram cross', kind: 'signal' },
  { value: 'bollinger.squeeze', label: 'Bollinger squeeze', kind: 'boolean' },
  { value: 'atr14Percent', label: 'ATR % (14)', kind: 'number' },
  { value: 'breakout', label: '20 candle breakout', kind: 'boolean' },
  { value: 'breakdown', label: '20 candle breakdown', kind: 'boolean' },
  { value: 'changePct', label: 'Price change %', kind: 'number' },
  { value: 'distanceFrom24hHighPct', label: 'Distance from 24h high %', kind: 'number' },
  { value: 'quoteVolume', label: 'Quote volume (USD)', kind: 'number' },
  { value: 'rvol', label: 'RVOL (20)', kind: 'number' },
  { value: 'takerBuyRatio', label: 'Taker buy ratio', kind: 'number', exchanges: ['Binance'] },
  { value: 'dailyVwapDistancePct', label: 'Daily VWAP distance %', kind: 'number' },
  { value: 'priceVsVwap', label: 'Price vs daily VWAP', kind: 'state' },
  { value: 'oiChangePct1h', label: 'OI change (1h) %', kind: 'number', exchanges: ['Binance','Bybit','Gate'] },
  { value: 'fundingPerHour', label: 'Funding / hour %', kind: 'number', exchanges: ['Binance','Bybit','Gate'] },
  { value: 'ema20', label: 'EMA 20 value', kind: 'number' },
  { value: 'ema50', label: 'EMA 50 value', kind: 'number' },
  { value: 'ema100', label: 'EMA 100 value', kind: 'number' },
  { value: 'ema200', label: 'EMA 200 value', kind: 'number' },
];

const timeframes = ['5m', '15m', '1h', '4h', '8h', '12h', '1d'];
const fieldKind = (field: IndicatorField) => indicatorFields.find(item => item.value === field)?.kind || 'number';

type Props = {
  open: boolean;
  onToggle: () => void;
  conditions: IndicatorCondition[];
  onConditionsChange: (conditions: IndicatorCondition[]) => void;
  join: IndicatorJoin;
  onJoinChange: (join: IndicatorJoin) => void;
  ready: boolean;
  inline?: boolean;
  exchange?: 'Binance'|'Bybit'|'Gate';
};

export const TechnicalFilters: React.FC<Props> = ({ open, onToggle, conditions, onConditionsChange, join, onJoinChange, ready, inline = false, exchange = 'Binance' }) => {
  const update = (id: string, patch: Partial<IndicatorCondition>) => onConditionsChange(conditions.map(condition => condition.id === id ? { ...condition, ...patch } : condition));
  const add = () => onConditionsChange([...conditions, { id: crypto.randomUUID(), timeframe: '1h', field: 'rsi14', operator: '<', value: 30 }]);
  return <div className={inline ? 'technical-filter-wrap strategy-condition-editor' : 'technical-filter-wrap'}>
    {!inline && <button type="button" className={`quick-filter technical-filter-toggle ${conditions.length ? 'selected' : ''}`} onClick={onToggle} aria-expanded={open}>
      <SlidersHorizontal size={12} /> Indicators {conditions.length > 0 && <span className="technical-filter-count">{conditions.length}</span>}
    </button>}
    {(inline || open) && <section className={`technical-filter-panel${inline ? ' strategy-inline-panel' : ''}`} aria-label="Indicator filters">
      {!inline && <header><div><b>Indicator filters</b><span>Combine closed-candle signals; each condition can use its own timeframe.</span></div><button type="button" onClick={onToggle} aria-label="Close indicator filters"><X size={15} /></button></header>}
      {!ready && conditions.length > 0 && <p className="technical-filter-hint">Loading the selected timeframe data from {exchange}. Results appear as each market is ready.</p>}
      {!inline && conditions.length > 1 && <label className="technical-filter-join">Match <select value={join} onChange={event => onJoinChange(event.target.value as IndicatorJoin)}><option>AND</option><option>OR</option></select> conditions</label>}
      {conditions.map((condition, index) => {
        const kind = fieldKind(condition.field);
        return <div className="technical-filter-condition" key={condition.id}>
          <span className="technical-filter-index">{index + 1}</span>
          <select aria-label={`Condition ${index + 1} indicator`} value={condition.field} onChange={event => {
            const field = event.target.value as IndicatorField;
            const nextKind = fieldKind(field);
            const vwapField=['dailyVwapDistancePct','priceVsVwap'].includes(field);
            const timeframe=vwapField&&!['5m','15m','1h'].includes(condition.timeframe)?'1h':condition.timeframe;
            update(condition.id, { field, timeframe, operator: nextKind === 'number' ? '<' : 'equals', value: nextKind === 'number' ? 30 : nextKind === 'boolean' ? true : nextKind === 'signal' ? 'up' : 'above', secondValue: undefined });
          }}>{indicatorFields.map(field => <option key={field.value} value={field.value} disabled={field.exchanges && !field.exchanges.includes(exchange)}>{field.label}{field.exchanges && !field.exchanges.includes(exchange) ? ' (unavailable)' : ''}</option>)}</select>
          <select aria-label={`Condition ${index + 1} timeframe`} value={condition.timeframe} onChange={event => update(condition.id, { timeframe: event.target.value })}>{timeframes.map(timeframe => <option key={timeframe} disabled={['dailyVwapDistancePct','priceVsVwap'].includes(condition.field)&&!['5m','15m','1h'].includes(timeframe)}>{timeframe}</option>)}</select>
          {kind === 'number' ? <>
            <select aria-label={`Condition ${index + 1} operator`} value={condition.operator} onChange={event => update(condition.id, { operator: event.target.value as IndicatorCondition['operator'] })}>
              <option value="<">&lt;</option><option value="<=">≤</option><option value=">">&gt;</option><option value=">=">≥</option><option value="between">Between</option><option value="beyond">Beyond ±</option>
            </select>
            <input aria-label={`Condition ${index + 1} value`} type="number" step="any" value={Number(condition.value)} onChange={event => update(condition.id, { value: event.target.value === '' ? 0 : Number(event.target.value) })} />
            {condition.operator === 'between' && <input aria-label={`Condition ${index + 1} upper value`} type="number" step="any" value={condition.secondValue ?? 70} onChange={event => update(condition.id, { secondValue: Number(event.target.value) })} />}
          </> : <select aria-label={`Condition ${index + 1} value`} value={String(condition.value)} onChange={event => update(condition.id, { value: kind === 'boolean' ? event.target.value === 'true' : event.target.value })}>
            {kind === 'signal' ? <><option value="up">Cross up</option><option value="down">Cross down</option></> : kind === 'state' ? <><option value="above">Above / bullish</option><option value="below">Below / bearish</option></> : <><option value="true">True</option><option value="false">False</option></>}
          </select>}
          <button type="button" className="technical-filter-remove" onClick={() => onConditionsChange(conditions.filter(item => item.id !== condition.id))} aria-label={`Remove condition ${index + 1}`}><X size={14} /></button>
        </div>;
      })}
      <footer><button type="button" className="technical-filter-add" onClick={add}><Plus size={13} /> Add condition</button><button type="button" className="technical-filter-clear" onClick={() => onConditionsChange([])}>Clear</button></footer>
      <p className="technical-filter-hint">Indicators use completed candles. Missing or unsupported data never passes a condition.</p>
    </section>}
  </div>;
};
