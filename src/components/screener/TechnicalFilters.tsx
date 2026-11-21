import React from 'react';
import { Plus, SlidersHorizontal, X } from 'lucide-react';

export type IndicatorField =
  | 'rsi14'
  | 'adx14'
  | 'rvol'
  | 'ema20'
  | 'ema50'
  | 'ema200'
  | 'macd.histogram'
  | 'ema20_50Cross'
  | 'macd.histogramCross'
  | 'bollinger.squeeze'
  | 'breakout'
  | 'breakdown';

export type IndicatorCondition = {
  id: string;
  timeframe: string;
  field: IndicatorField;
  operator: '>' | '>=' | '<' | '<=' | 'between' | 'equals';
  value: number | string | boolean;
  secondValue?: number;
};

export type IndicatorJoin = 'AND' | 'OR';

export const indicatorFields: Array<{ value: IndicatorField; label: string; kind: 'number' | 'signal' | 'boolean' }> = [
  { value: 'rsi14', label: 'RSI (14)', kind: 'number' },
  { value: 'adx14', label: 'ADX (14)', kind: 'number' },
  { value: 'rvol', label: 'RVOL', kind: 'number' },
  { value: 'ema20', label: 'EMA 20', kind: 'number' },
  { value: 'ema50', label: 'EMA 50', kind: 'number' },
  { value: 'ema200', label: 'EMA 200', kind: 'number' },
  { value: 'macd.histogram', label: 'MACD histogram', kind: 'number' },
  { value: 'ema20_50Cross', label: 'EMA 20/50 cross', kind: 'signal' },
  { value: 'macd.histogramCross', label: 'MACD zero cross', kind: 'signal' },
  { value: 'bollinger.squeeze', label: 'Bollinger squeeze', kind: 'boolean' },
  { value: 'breakout', label: '20 candle breakout', kind: 'boolean' },
  { value: 'breakdown', label: '20 candle breakdown', kind: 'boolean' },
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
};

export const TechnicalFilters: React.FC<Props> = ({ open, onToggle, conditions, onConditionsChange, join, onJoinChange, ready }) => {
  const update = (id: string, patch: Partial<IndicatorCondition>) => onConditionsChange(conditions.map(condition => condition.id === id ? { ...condition, ...patch } : condition));
  const add = () => onConditionsChange([...conditions, { id: crypto.randomUUID(), timeframe: '1h', field: 'rsi14', operator: '<', value: 30 }]);

  return <div className="technical-filter-wrap">
    <button type="button" className={`quick-filter technical-filter-toggle ${conditions.length ? 'selected' : ''}`} onClick={onToggle} aria-expanded={open}>
      <SlidersHorizontal size={12} /> Indicators {conditions.length > 0 && <span className="technical-filter-count">{conditions.length}</span>}
    </button>
    {open && <section className="technical-filter-panel" aria-label="Indicator filters">
      <header><div><b>Indicator filters</b><span>Combine closed-candle signals for Binance USDT perpetuals.</span></div><button type="button" onClick={onToggle} aria-label="Close indicator filters"><X size={15} /></button></header>
      {!ready && conditions.length > 0 && <p className="technical-filter-hint">Loading the selected timeframe data from the indicator cache.</p>}
      {conditions.length > 1 && <label className="technical-filter-join">Match <select value={join} onChange={event => onJoinChange(event.target.value as IndicatorJoin)}><option>AND</option><option>OR</option></select> conditions</label>}
      {conditions.map((condition, index) => {
        const kind = fieldKind(condition.field);
        return <div className="technical-filter-condition" key={condition.id}>
          <span className="technical-filter-index">{index + 1}</span>
          <select aria-label={`Condition ${index + 1} indicator`} value={condition.field} onChange={event => {
            const field = event.target.value as IndicatorField;
            const nextKind = fieldKind(field);
            update(condition.id, { field, operator: nextKind === 'number' ? '<' : 'equals', value: nextKind === 'number' ? 30 : nextKind === 'signal' ? 'up' : true, secondValue: undefined });
          }}>{indicatorFields.map(field => <option key={field.value} value={field.value}>{field.label}</option>)}</select>
          <select aria-label={`Condition ${index + 1} timeframe`} value={condition.timeframe} onChange={event => update(condition.id, { timeframe: event.target.value })}>{timeframes.map(timeframe => <option key={timeframe}>{timeframe}</option>)}</select>
          {kind === 'number' ? <>
            <select aria-label={`Condition ${index + 1} operator`} value={condition.operator} onChange={event => update(condition.id, { operator: event.target.value as IndicatorCondition['operator'] })}>
              <option value="<">&lt;</option><option value="<=">≤</option><option value=">">&gt;</option><option value=">=">≥</option><option value="between">Between</option>
            </select>
            <input aria-label={`Condition ${index + 1} value`} type="number" step="any" value={Number(condition.value)} onChange={event => update(condition.id, { value: event.target.value === '' ? 0 : Number(event.target.value) })} />
            {condition.operator === 'between' && <input aria-label={`Condition ${index + 1} upper value`} type="number" step="any" value={condition.secondValue ?? 70} onChange={event => update(condition.id, { secondValue: Number(event.target.value) })} />}
          </> : <select aria-label={`Condition ${index + 1} value`} value={String(condition.value)} onChange={event => update(condition.id, { value: kind === 'boolean' ? event.target.value === 'true' : event.target.value })}>
            {kind === 'signal' ? <><option value="up">Cross up</option><option value="down">Cross down</option></> : <><option value="true">True</option><option value="false">False</option></>}
          </select>}
          <button type="button" className="technical-filter-remove" onClick={() => onConditionsChange(conditions.filter(item => item.id !== condition.id))} aria-label={`Remove condition ${index + 1}`}><X size={14} /></button>
        </div>;
      })}
      <footer><button type="button" className="technical-filter-add" onClick={add}><Plus size={13} /> Add condition</button><button type="button" className="technical-filter-clear" onClick={() => onConditionsChange([])}>Clear</button></footer>
      <p className="technical-filter-hint">Indicators are calculated from closed candles. Filters exclude markets while their indicator data is loading.</p>
    </section>}
  </div>;
};
