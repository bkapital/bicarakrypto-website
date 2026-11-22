import React, { useEffect, useState } from 'react';
import { ChevronDown, Plus, Save, X } from 'lucide-react';
import { TechnicalFilters, type IndicatorCondition, type IndicatorJoin } from './TechnicalFilters';

export type StrategyType = 'Buy / Long idea' | 'Sell / Short idea' | 'Watch' | 'Avoid';
export type StrategyGroup = 'Quick filters' | 'Beginner strategies' | 'Intermediate strategies' | 'My strategies';
export type Strategy = {
  id: string;
  name: string;
  group: StrategyGroup;
  type: StrategyType;
  explanation: string;
  marketScope: 'All markets' | 'Futures';
  conditions: IndicatorCondition[];
  join: IndicatorJoin;
  quickSort?: 'volume:1d' | 'oiPct:1h' | 'chgPct:1h' | 'funding';
};

const cond = (field: IndicatorCondition['field'], timeframe: string, operator: IndicatorCondition['operator'], value: number|string|boolean, secondValue?: number): IndicatorCondition => ({ id: crypto.randomUUID(), field, timeframe, operator, value, secondValue });
export const quickStrategies: Strategy[] = [
  { id:'quick-high-volume', name:'High Volume', group:'Quick filters', type:'Watch', explanation:'24h quote volume above $300M.', marketScope:'All markets', conditions:[cond('quoteVolume','1d','>',300_000_000)], join:'AND', quickSort:'volume:1d' },
  { id:'quick-oi-spike', name:'OI Spike', group:'Quick filters', type:'Watch', explanation:'Open interest increased more than 4% in 1h.', marketScope:'Futures', conditions:[cond('oiChangePct1h','1h','>',4)], join:'AND', quickSort:'oiPct:1h' },
  { id:'quick-big-movers', name:'Big Movers', group:'Quick filters', type:'Watch', explanation:'Price moved more than 3% in either direction over 1h.', marketScope:'All markets', conditions:[cond('changePct','1h','beyond',3)], join:'AND', quickSort:'chgPct:1h' },
  { id:'quick-high-funding', name:'High Funding', group:'Quick filters', type:'Avoid', explanation:'Funding is more extreme than ±0.01% per hour.', marketScope:'Futures', conditions:[cond('fundingPerHour','1h','beyond',0.01)], join:'AND', quickSort:'funding' },
];

export const defaultStrategies: Strategy[] = [
  { id:'beginner-trend', name:'Ride the trend', group:'Beginner strategies', type:'Buy / Long idea', explanation:'Price is above the 200 EMA and the 50 EMA is above the 200 EMA on 4h.', marketScope:'All markets', conditions:[cond('priceVsEma200','4h','equals','above'),cond('ema50_200State','4h','equals','above')], join:'AND' },
  { id:'beginner-buy-dip', name:'Buy the dip', group:'Beginner strategies', type:'Buy / Long idea', explanation:'Longer trend remains up while 1h RSI is below 40.', marketScope:'All markets', conditions:[cond('priceVsEma200','4h','equals','above'),cond('rsi14','1h','<',40)], join:'AND' },
  { id:'beginner-oversold', name:'Oversold bounce', group:'Beginner strategies', type:'Watch', explanation:'RSI is oversold and MACD histogram has crossed upward.', marketScope:'All markets', conditions:[cond('rsi14','1h','<',30),cond('macd.histogramCross','1h','equals','up')], join:'AND' },
  { id:'beginner-volume-breakout', name:'Volume breakout', group:'Beginner strategies', type:'Buy / Long idea', explanation:'Price breaks the prior 20 candle high with above-average volume.', marketScope:'All markets', conditions:[cond('breakout','15m','equals',true),cond('rvol','15m','>',1.5)], join:'AND' },
  { id:'beginner-calm', name:'Calm before the move', group:'Beginner strategies', type:'Watch', explanation:'Bollinger Bands are squeezed and ATR is subdued on 1h.', marketScope:'All markets', conditions:[cond('bollinger.squeeze','1h','equals',true),cond('atr14Percent','1h','<',2)], join:'AND' },
  { id:'beginner-downturn', name:'Trend turning down', group:'Beginner strategies', type:'Sell / Short idea', explanation:'EMA 20/50 crossed down and price is below EMA 20 on 1h.', marketScope:'Futures', conditions:[cond('ema20_50Cross','1h','equals','down'),cond('priceVsEma20','1h','equals','below')], join:'AND' },
  { id:'inter-breakout-money', name:'Breakout with new money', group:'Intermediate strategies', type:'Buy / Long idea', explanation:'A 1h breakout is supported by rising volume and open interest.', marketScope:'Futures', conditions:[cond('breakout','1h','equals',true),cond('rvol','1h','>',1.5),cond('oiChangePct1h','1h','>',0.5)], join:'AND' },
  { id:'inter-squeeze', name:'Short squeeze watch', group:'Intermediate strategies', type:'Watch', explanation:'Price is rising while open interest falls on 1h.', marketScope:'Futures', conditions:[cond('changePct','1h','>',2),cond('oiChangePct1h','1h','<',0)], join:'AND' },
  { id:'inter-overheated', name:'Overheated longs', group:'Intermediate strategies', type:'Avoid', explanation:'High positive funding and elevated RSI can indicate crowded longs.', marketScope:'Futures', conditions:[cond('fundingPerHour','1h','>',0.01),cond('rsi14','1h','>',70)], join:'AND' },
  { id:'inter-fake-pump', name:'Fake pump warning', group:'Intermediate strategies', type:'Avoid', explanation:'Price rises sharply while open interest contracts.', marketScope:'Futures', conditions:[cond('changePct','1h','>',3),cond('oiChangePct1h','1h','<',-2)], join:'AND' },
  { id:'inter-healthy-trend', name:'Strong trend, healthy leverage', group:'Intermediate strategies', type:'Buy / Long idea', explanation:'ADX confirms a trend while price and open interest rise.', marketScope:'Futures', conditions:[cond('adx14','4h','>',25),cond('priceVsEma50','4h','equals','above'),cond('oiChangePct1h','1h','>',0)], join:'AND' },
];

type Props = {
  exchange: 'Binance'|'Bybit'|'Gate';
  customStrategies: Strategy[];
  active: Strategy|null;
  onSelect: (strategy: Strategy|null) => void;
  onCustomStrategiesChange: (strategies: Strategy[]) => void;
  onPreview: (strategy: Strategy) => void;
  ready: boolean;
};

const tagClass = (type: StrategyType) => type.startsWith('Buy') ? 'strategy-tag-buy' : type.startsWith('Sell') ? 'strategy-tag-sell' : type === 'Avoid' ? 'strategy-tag-avoid' : 'strategy-tag-watch';

export const StrategyControls: React.FC<Props> = ({ exchange, customStrategies, active, onSelect, onCustomStrategiesChange, onPreview, ready }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Strategy|null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<StrategyType>('Watch');
  const [draftScope, setDraftScope] = useState<Strategy['marketScope']>('All markets');
  const [draftConditions, setDraftConditions] = useState<IndicatorCondition[]>([]);
  const [draftJoin, setDraftJoin] = useState<IndicatorJoin>('AND');
  const draftRequiresFutures=draftConditions.some(condition=>condition.field==='oiChangePct1h'||condition.field==='fundingPerHour');
  const available = [...quickStrategies, ...defaultStrategies, ...customStrategies];
  const startDraft = (source?: Strategy) => {
    const base = source || active;
    const newDraft: Strategy = base ? { ...base, id: base.group === 'My strategies' ? base.id : `custom-${crypto.randomUUID()}`, group: 'My strategies', conditions: base.conditions.map(c => ({ ...c, id: crypto.randomUUID() })) } : { id:`custom-${crypto.randomUUID()}`,name:'My strategy',group:'My strategies',type:'Watch',explanation:'Custom strategy',marketScope:'All markets',conditions:[],join:'AND' };
    setDraft(newDraft); setDraftName(newDraft.name); setDraftType(newDraft.type); setDraftScope(newDraft.marketScope); setDraftConditions(newDraft.conditions); setDraftJoin(newDraft.join); setEditing(true);
    onPreview({ ...newDraft, name:newDraft.name, type:newDraft.type, marketScope:newDraft.marketScope, conditions:newDraft.conditions, join:newDraft.join });
    setMenuOpen(false);
  };
  useEffect(() => {
    if (!editing || !draft) return;
    onPreview({ ...draft, name:draftName.trim() || 'Untitled strategy', type:draftType, marketScope:draftRequiresFutures?'Futures':draftScope, conditions:draftConditions, join:draftJoin });
  }, [editing, draft, draftName, draftType, draftScope, draftConditions, draftJoin]);
  const save = () => {
    if (!draft || !draftName.trim() || draftConditions.length === 0) return;
    const saved = { ...draft, name:draftName.trim(), type:draftType, marketScope:draftRequiresFutures?'Futures':draftScope, explanation:'Custom strategy', conditions:draftConditions, join:draftJoin };
    const remaining = customStrategies.filter(item => item.id !== saved.id);
    const next = [...remaining, saved]; onCustomStrategiesChange(next); onSelect(saved); setEditing(false); setDraft(null);
  };
  const deleteActive = () => {
    if (!active || active.group !== 'My strategies') return;
    onCustomStrategiesChange(customStrategies.filter(item => item.id !== active.id)); onSelect(null); setEditing(false); setDraft(null);
  };
  const grouped: Array<[StrategyGroup, Strategy[]]> = [['Quick filters',quickStrategies],['Beginner strategies',defaultStrategies.filter(s=>s.group==='Beginner strategies')],['Intermediate strategies',defaultStrategies.filter(s=>s.group==='Intermediate strategies')],['My strategies',customStrategies]];
  return <div className="strategy-controls">
    <div className="strategy-toolbar">
      <div className="strategy-select-wrap">
        <button className={`strategy-select ${active?'selected':''}`} type="button" onClick={()=>setMenuOpen(value=>!value)} aria-expanded={menuOpen}>
          <span><small>STRATEGY</small>{active?.name || 'Choose a strategy'}</span><ChevronDown size={14}/>
        </button>
        {menuOpen && <div className="strategy-menu" role="listbox" aria-label="Strategies">
          {grouped.map(([group,items])=><section key={group}><h3>{group}</h3>{items.length===0&&<p className="strategy-empty-group">No saved strategies yet.</p>}{items.map(strategy=><button type="button" role="option" aria-selected={active?.id===strategy.id} className="strategy-option" key={strategy.id} onClick={()=>{onSelect(strategy);setMenuOpen(false);setEditing(false)}}><span className="strategy-option-top"><b>{strategy.name}</b><i className={tagClass(strategy.type)}>{strategy.type}</i></span><small>{strategy.explanation}</small></button>)}</section>)}
        </div>}
      </div>
      <button type="button" className="strategy-action" onClick={()=>startDraft(active||undefined)}><Plus size={12}/> Customize</button>
      {active?.group==='My strategies'&&<><button type="button" className="strategy-action" onClick={()=>startDraft(active)}>Edit</button><button type="button" className="strategy-action strategy-delete" onClick={deleteActive}>Delete</button></>}
      <button type="button" className="strategy-action" onClick={()=>{onSelect(null);setEditing(false);setDraft(null)}}>Clear</button>
      {!editing&&<button type="button" className="strategy-action strategy-create" onClick={()=>startDraft()}><Plus size={12}/> Create strategy</button>}
    </div>
    {editing && draft && <section className="strategy-builder" aria-label="Create your own strategy">
      <header><div><b>Create your own strategy</b><span>Preview rows update as conditions change. This strategy is saved in this browser.</span></div><button type="button" aria-label="Close strategy builder" onClick={()=>{setEditing(false);setDraft(null);onSelect(active)}}><X size={15}/></button></header>
      <div className="strategy-builder-fields">
        <label>Strategy name<input value={draftName} maxLength={48} onChange={event=>setDraftName(event.target.value)} placeholder="Name your strategy"/></label>
        <label>Type<select value={draftType} onChange={event=>setDraftType(event.target.value as StrategyType)}><option>Buy / Long idea</option><option>Sell / Short idea</option><option>Watch</option><option>Avoid</option></select></label>
        <label>Market<select value={draftRequiresFutures?'Futures':draftScope} onChange={event=>setDraftScope(event.target.value as Strategy['marketScope'])}><option disabled={draftRequiresFutures}>All markets</option><option>Futures</option></select></label>
        <label>Match<select value={draftJoin} onChange={event=>setDraftJoin(event.target.value as IndicatorJoin)}><option value="AND">All conditions</option><option value="OR">Any condition</option></select></label>
      </div>
      <TechnicalFilters inline open onToggle={()=>{}} conditions={draftConditions} onConditionsChange={setDraftConditions} join={draftJoin} onJoinChange={setDraftJoin} ready={ready} exchange={exchange}/>
      <footer><button type="button" className="strategy-save" disabled={!draftName.trim()||draftConditions.length===0} onClick={save}><Save size={13}/> Save strategy</button><button type="button" className="strategy-cancel" onClick={()=>{setEditing(false);setDraft(null);onSelect(active)}}>Cancel</button></footer>
    </section>}
  </div>;
};
