import React, { useEffect, useState } from 'react';
import { ChevronDown, Plus, Save, X } from 'lucide-react';
import { TechnicalFilters, indicatorFields, validateCondition, type IndicatorCondition, type IndicatorJoin } from './TechnicalFilters';
import { STRATEGY_THRESHOLDS, type StrategyTimeframe } from '../../lib/strategyConfig';

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
  quickSort?: 'volume:1d' | 'oiPct' | 'chgPct' | 'funding';
};

const cond = (field: IndicatorCondition['field'], timeframe: string, operator: IndicatorCondition['operator'], value: number|string|boolean, secondValue?: number): IndicatorCondition => ({ id: crypto.randomUUID(), field, timeframe, operator, value, secondValue });
export const migrateCondition = (condition: IndicatorCondition): IndicatorCondition => {
  const next={...condition};
  const merged:Partial<Record<IndicatorCondition['field'],[IndicatorCondition['field'],string|number]>>={
    priceVsEma20:['priceVsEma','20'],priceVsEma50:['priceVsEma','50'],priceVsEma100:['priceVsEma','100'],priceVsEma200:['priceVsEma','200'],
    priceVsTrendEma:['priceVsEma','trend'],
    ema9_21Cross:['emaCross','9/21:cross'],ema20_50Cross:['emaCross','20/50:cross'],ema50_200Cross:['emaCross','50/200:cross'],ema50_200State:['emaCross','50/200:state'],
    'stochRsi.k':['stochRsi','k'],'stochRsi.d':['stochRsi','d'],'stochRsi.kdCross':['stochRsi','cross'],rsi50Cross:['rsi14','cross'],
    'macd.histogram':['macd','state'],'macd.histogramCross':['macd','cross'],'bollinger.squeeze':['bollinger','squeeze'],
    breakout:['rangeBreakout','20-up'],breakdown:['rangeBreakout','20-down'],dailyVwapDistancePct:['dailyVwap','distance'],priceVsVwap:['dailyVwap','state'],
  };
  const mapping=merged[condition.field];
  if(mapping){next.field=mapping[0];next.setting=mapping[1];if(condition.field==='rsi50Cross')next.crossLevel=50;if(condition.field==='breakout'||condition.field==='breakdown')next.value=true;}
  return next;
};
export const resolveStrategy = (strategy: Strategy, timeframe: StrategyTimeframe): Strategy => {
  const settings = STRATEGY_THRESHOLDS[timeframe];
  const conditions = strategy.conditions.map(condition => ({ ...condition, timeframe: condition.timeframe === 'selected' ? timeframe : condition.timeframe }));
  for (const condition of conditions) {
    if (condition.field === 'priceVsEma' && condition.setting === 'trend') condition.setting = String(settings.trendEmaPeriod);
    if (strategy.id === 'quick-big-movers' && condition.field === 'changePct') condition.value = settings.bigMovePct;
    if (strategy.id === 'quick-oi-spike' && condition.field === 'oiChangePct1h') condition.value = settings.oiLargeRisePct;
    if (condition.field === 'changePct' && condition.preset?.startsWith('big')) condition.value = settings.bigMovePct;
    if (condition.field === 'changePct' && condition.preset === 'priceJump') condition.value = settings.priceJumpPct;
    if (condition.field === 'oiChangePct1h') {
      if (condition.preset === 'rising') condition.value = settings.oiSmallRisePct;
      if (condition.preset === 'medium') condition.value = settings.oiMediumRisePct;
      if (condition.preset === 'spike') condition.value = settings.oiLargeRisePct;
      if (condition.preset === 'falling') condition.value = settings.oiDropPct;
    }
  }
  return { ...strategy, conditions };
};
const presetCond = (field: IndicatorCondition['field'], timeframe: string, operator: IndicatorCondition['operator'], value: number|string|boolean, preset: string, setting?: string, secondValue?: number): IndicatorCondition => ({ ...cond(field,timeframe,operator,value,secondValue), preset, ...(setting ? {setting} : {}) });
const preset = (name:string,field:IndicatorCondition['field'],operator:IndicatorCondition['operator'],value:number|string|boolean,setting?:string,secondValue?:number) => presetCond(field,'selected',operator,value,name,setting,secondValue);
export const quickStrategies: Strategy[] = [
  { id:'quick-high-volume', name:'High Volume', group:'Quick filters', type:'Watch', explanation:'Top 20% of markets by 24h quote volume.', marketScope:'All markets', conditions:[cond('quoteVolume','1d','>',0)], join:'AND', quickSort:'volume:1d' },
  { id:'quick-oi-spike', name:'OI Spike', group:'Quick filters', type:'Watch', explanation:'Open interest rose sharply on the selected timeframe.', marketScope:'Futures', conditions:[cond('oiChangePct1h','selected','>',4)], join:'AND', quickSort:'oiPct' },
  { id:'quick-big-movers', name:'Big Movers', group:'Quick filters', type:'Watch', explanation:'Price moved beyond the selected timeframe threshold.', marketScope:'All markets', conditions:[cond('changePct','selected','beyond',3)], join:'AND', quickSort:'chgPct' },
  { id:'quick-high-funding', name:'High Funding', group:'Quick filters', type:'Watch', explanation:'Live funding is beyond ±0.005% per hour.', marketScope:'Futures', conditions:[cond('fundingPerHour','selected','beyond',0.005)], join:'AND', quickSort:'funding' },
];

export const defaultStrategies: Strategy[] = [
  { id:'beginner-trend', name:'Ride the trend', group:'Beginner strategies', type:'Buy / Long idea', explanation:'Price is above the timeframe trend EMA, ADX is strong, buyers lead, and RSI is between 50 and 70.', marketScope:'All markets', conditions:[preset('above','priceVsEma','equals','above','trend'),preset('strong','adx14','>',25),preset('buyers','diDirection','equals','above'),preset('custom','rsi14','between',50,undefined,70)], join:'AND' },
  { id:'beginner-buy-dip', name:'Buy the dip', group:'Beginner strategies', type:'Buy / Long idea', explanation:'Price is above the timeframe trend EMA while RSI has pulled back below 40.', marketScope:'All markets', conditions:[preset('above','priceVsEma','equals','above','trend'),preset('pulledBack','rsi14','<',40)], join:'AND' },
  { id:'beginner-oversold', name:'Oversold bounce', group:'Beginner strategies', type:'Buy / Long idea', explanation:'RSI is oversold and Stoch RSI is turning up.', marketScope:'All markets', conditions:[preset('oversold','rsi14','<',30),preset('turningUp','stochRsi','equals','up','cross')], join:'AND' },
  { id:'beginner-volume-breakout', name:'Volume breakout', group:'Beginner strategies', type:'Buy / Long idea', explanation:'A 20-candle high breakout has unusual relative volume and, on Binance, dominant taker buying.', marketScope:'All markets', conditions:[preset('newHigh','rangeBreakout','equals',true,'20-up'),preset('unusual','rvol','>=',2),preset('buyers','takerBuyRatio','>',55)], join:'AND' },
  { id:'beginner-calm', name:'Calm before the move', group:'Beginner strategies', type:'Watch', explanation:'Bollinger Bands are squeezed while ADX indicates a choppy market.', marketScope:'All markets', conditions:[preset('squeeze','bollinger','equals',true,'squeeze'),preset('choppy','adx14','<',20)], join:'AND' },
  { id:'beginner-downturn', name:'Trend turning down', group:'Beginner strategies', type:'Sell / Short idea', explanation:'Price is below the timeframe trend EMA and EMA 20/50 just crossed down.', marketScope:'Futures', conditions:[preset('below','priceVsEma','equals','below','trend'),preset('crossDown','emaCross','equals','down','20/50:cross')], join:'AND' },
  { id:'inter-breakout-money', name:'Breakout with new money', group:'Intermediate strategies', type:'Buy / Long idea', explanation:'A 20-candle breakout has unusual volume and rising OI, with price above the trend EMA.', marketScope:'Futures', conditions:[preset('newHigh','rangeBreakout','equals',true,'20-up'),preset('unusual','rvol','>=',2),preset('medium','oiChangePct1h','>',3),preset('above','priceVsEma','equals','above','trend')], join:'AND' },
  { id:'inter-squeeze', name:'Short squeeze watch', group:'Intermediate strategies', type:'Buy / Long idea', explanation:'Funding is crowded short, OI is rising, and RSI just crossed above 50.', marketScope:'Futures', conditions:[preset('crowdedShorts','fundingPerHour','<',-0.002),preset('medium','oiChangePct1h','>',3),preset('crossUp50','rsi14','equals','up','cross')], join:'AND' },
  { id:'inter-overheated', name:'Overheated longs', group:'Intermediate strategies', type:'Sell / Short idea', explanation:'RSI is above 75, funding is crowded long, and OI is spiking.', marketScope:'Futures', conditions:[preset('custom','rsi14','>',75),preset('crowdedLongs','fundingPerHour','>',0.005),preset('spike','oiChangePct1h','>',4)], join:'AND' },
  { id:'inter-fake-pump', name:'Fake pump warning', group:'Intermediate strategies', type:'Avoid', explanation:'A sharp price jump and extreme volume coincide with falling open interest.', marketScope:'Futures', conditions:[preset('priceJump','changePct','>',5),preset('extreme','rvol','>=',3),preset('falling','oiChangePct1h','<',-2)], join:'AND' },
  { id:'inter-healthy-trend', name:'Strong trend, healthy leverage', group:'Intermediate strategies', type:'Buy / Long idea', explanation:'SuperTrend is bullish, OI is rising, and hourly funding is moderate.', marketScope:'Futures', conditions:[preset('bullish','supertrend','equals','above'),preset('rising','oiChangePct1h','>',2),preset('custom','fundingPerHour','between',0,undefined,0.003)], join:'AND' },
];

type Props = {
  exchange: 'Binance'|'Bybit'|'Gate';
  customStrategies: Strategy[];
  active: Strategy[];
  onSelect: (strategy: Strategy|null) => void;
  onSave: (strategy: Strategy) => void;
  onCustomStrategiesChange: (strategies: Strategy[]) => void;
  onPreview: (strategy: Strategy) => void;
  ready: boolean;
  selectedTimeframe: StrategyTimeframe;
  updatedAt: string;
  insufficientHistoryCount: number;
};

const tagClass = (type: StrategyType) => type.startsWith('Buy') ? 'strategy-tag-buy' : type.startsWith('Sell') ? 'strategy-tag-sell' : type === 'Avoid' ? 'strategy-tag-avoid' : 'strategy-tag-watch';

export const StrategyControls: React.FC<Props> = ({ exchange, customStrategies, active, onSelect, onSave, onCustomStrategiesChange, onPreview, ready, selectedTimeframe, updatedAt, insufficientHistoryCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [builderStep, setBuilderStep] = useState<'conditions'|'details'>('conditions');
  const [draft, setDraft] = useState<Strategy|null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<StrategyType>('Watch');
  const [draftScope, setDraftScope] = useState<Strategy['marketScope']>('All markets');
  const [draftConditions, setDraftConditions] = useState<IndicatorCondition[]>([]);
  const [draftJoin, setDraftJoin] = useState<IndicatorJoin>('AND');
  const [draftTakerUnavailable,setDraftTakerUnavailable]=useState(false);
  const draftRequiresFutures=draftConditions.some(condition=>['oiChangePct1h','fundingPerHour','marketPositioning','longShortRatio','premiumBasisPct'].includes(condition.field));
  const draftHasInvalidCondition=draftConditions.some(validateCondition);
  const available = [...quickStrategies, ...defaultStrategies, ...customStrategies];
  const primaryActive=active[0];
  const startDraft = (source?: Strategy) => {
    const base = source || active[0];
    const resolvedBase = base && base.group !== 'My strategies' ? resolveStrategy(base,selectedTimeframe) : base;
    setDraftTakerUnavailable(Boolean(resolvedBase?.id==='beginner-volume-breakout'&&exchange!=='Binance'));
    const sourceConditions=resolvedBase?.id==='beginner-volume-breakout'&&exchange!=='Binance'?resolvedBase.conditions.filter(condition=>condition.field!=='takerBuyRatio'):resolvedBase?.conditions||[];
    const newDraft: Strategy = resolvedBase ? { ...resolvedBase, id: resolvedBase.group === 'My strategies' ? resolvedBase.id : `custom-${crypto.randomUUID()}`, name:resolvedBase.group==='My strategies'?resolvedBase.name:`${resolvedBase.name} (my version)`, group: 'My strategies', conditions: sourceConditions.map(c => ({ ...migrateCondition(c), id: crypto.randomUUID() })) } : { id:`custom-${crypto.randomUUID()}`,name:'My strategy',group:'My strategies',type:'Watch',explanation:'Custom strategy',marketScope:'All markets',conditions:[],join:'AND' };
    setDraft(newDraft); setDraftName(newDraft.name); setDraftType(newDraft.type); setDraftScope(newDraft.marketScope); setDraftConditions(newDraft.conditions); setDraftJoin(newDraft.join); setBuilderStep('conditions'); setEditing(true);
    onPreview({ ...newDraft, name:newDraft.name, type:newDraft.type, marketScope:newDraft.marketScope, conditions:newDraft.conditions, join:newDraft.join });
    setMenuOpen(false);
  };
  useEffect(() => {
    if (!editing || !draft) return;
    onPreview({ ...draft, name:draftName.trim() || 'Untitled strategy', type:draftType, marketScope:draftRequiresFutures?'Futures':draftScope, conditions:draftConditions, join:draftJoin });
  }, [editing, draft, draftName, draftType, draftScope, draftConditions, draftJoin]);
  const save = () => {
    if (!draft || !draftName.trim() || draftConditions.length === 0 || draftHasInvalidCondition) return;
    const saved = { ...draft, name:draftName.trim(), type:draftType, marketScope:draftRequiresFutures?'Futures':draftScope, explanation:'Custom strategy', conditions:draftConditions, join:draftJoin };
    const remaining = customStrategies.filter(item => item.id !== saved.id);
    const next = [...remaining, saved]; onCustomStrategiesChange(next); onSave(saved); setEditing(false); setDraft(null);
  };
  const saveConditions = () => {
    if (draftConditions.length === 0 || draftHasInvalidCondition) return;
    setBuilderStep('details');
  };
  const deleteActive = () => {
    const selected=active[0];
    if (!selected || selected.group !== 'My strategies') return;
    onCustomStrategiesChange(customStrategies.filter(item => item.id !== selected.id)); onSelect(selected); setEditing(false); setDraft(null);
  };
  const grouped: Array<[StrategyGroup, Strategy[]]> = [['Quick filters',quickStrategies],['Beginner strategies',defaultStrategies.filter(s=>s.group==='Beginner strategies')],['Intermediate strategies',defaultStrategies.filter(s=>s.group==='Intermediate strategies')],['My strategies',customStrategies]];
  return <div className="strategy-controls">
    <div className="strategy-toolbar">
      <div className="strategy-select-wrap">
        <button className={`strategy-select ${active.length?'selected':''}`} type="button" onClick={()=>setMenuOpen(value=>!value)} aria-expanded={menuOpen}>
          <span><small>STRATEGY</small>{active.length?`${active.length} strateg${active.length===1?'y':'ies'}`:'All markets · Pick a strategy to filter'}</span><ChevronDown size={14}/>
        </button>
        {menuOpen && <div className="strategy-menu" role="listbox" aria-label="Strategies">
          {grouped.map(([group,items])=><section key={group}><h3>{group}</h3>{items.length===0&&<p className="strategy-empty-group">No saved strategies yet.</p>}{items.map(strategy=><button type="button" role="option" aria-selected={active.some(item=>item.id===strategy.id)} className="strategy-option" key={strategy.id} onClick={()=>{onSelect(strategy);setEditing(false)}}><span className="strategy-option-top"><b>{strategy.name}</b><i className={tagClass(strategy.type)}>{strategy.type}</i></span><small>{strategy.explanation}</small></button>)}</section>)}
        </div>}
      </div>
      <span className="strategy-updated-at">Updated {updatedAt}</span>
      {insufficientHistoryCount > 0 && <span className="strategy-updated-at">{insufficientHistoryCount} {insufficientHistoryCount === 1 ? 'coin' : 'coins'} excluded: not enough history</span>}
      {active.length>0&&<button type="button" className="strategy-action" onClick={()=>startDraft(primaryActive)}><Plus size={12}/> Customize</button>}
      {primaryActive?.group==='My strategies'&&<><button type="button" className="strategy-action" onClick={()=>startDraft(primaryActive)}>Edit</button><button type="button" className="strategy-action strategy-delete" onClick={deleteActive}>Delete</button></>}
      {active.map(strategy=><span className="active-strategy-chip" key={strategy.id}><i className={tagClass(strategy.type)}/>{strategy.name}<small>{strategy.conditions[0]?.timeframe==='selected'?selectedTimeframe:strategy.conditions[0]?.timeframe||selectedTimeframe}</small><button type="button" aria-label={`Remove ${strategy.name}`} onClick={()=>onSelect(strategy)}><X size={12}/></button></span>)}
      {active.length>0&&<button type="button" className="strategy-action strategy-clear-all" onClick={()=>{onSelect(null);setEditing(false);setDraft(null)}}>Clear all</button>}
      {!editing&&<button type="button" className="strategy-action strategy-create" onClick={()=>startDraft()}><Plus size={12}/> Create strategy</button>}
    </div>
    {editing && draft && <section className="strategy-builder" aria-label="Create your own strategy">
      <header><div><b>Create your own strategy</b><span>Step {builderStep==='conditions'?'1 of 2 · Choose conditions':'2 of 2 · Name your strategy'}</span><span className="strategy-risk-note">Strategies find coins that fit a pattern. They are not trade signals.</span></div><div className="strategy-builder-header-actions"><button type="button" aria-label="Close strategy builder" onClick={()=>{setEditing(false);setDraft(null)}}><X size={18}/></button></div></header>
      {builderStep==='conditions' ? <>
        {draftTakerUnavailable&&<p className="technical-filter-hint">Taker data not available on this exchange.</p>}
        <TechnicalFilters inline open onToggle={()=>{}} conditions={draftConditions} onConditionsChange={setDraftConditions} join={draftJoin} onJoinChange={setDraftJoin} ready={ready} exchange={exchange} selectedTimeframe={selectedTimeframe} onSaveConditions={saveConditions} saveConditionsDisabled={draftConditions.length===0||draftHasInvalidCondition}/>
      </> : <>
        <div className="strategy-saved-condition-list" aria-label="Saved conditions">
          <b>{draftConditions.length} saved {draftConditions.length===1?'condition':'conditions'}</b>
          {draftConditions.map((condition,index)=>{
            const field=indicatorFields.find(item=>item.value===condition.field);
            const timeframe=condition.timeframe==='selected'?`Selected (${selectedTimeframe})`:condition.timeframe;
            const setting=condition.setting?` ${String(condition.setting).replace(':state','').replace(':cross','').replace('-up','').replace('-down','')}`:'';
            return <span key={condition.id}>{index+1}. {field?.label||condition.field}{setting} · {timeframe}</span>;
          })}
        </div>
        <div className="strategy-builder-fields">
          <label>Strategy name<input value={draftName} maxLength={48} onChange={event=>setDraftName(event.target.value)} placeholder="Name your strategy"/></label>
          <label>Match<select value={draftJoin} onChange={event=>setDraftJoin(event.target.value as IndicatorJoin)}><option value="AND">All conditions</option><option value="OR">Any condition</option></select></label>
        </div>
        <footer><button type="button" className="strategy-cancel" onClick={()=>setBuilderStep('conditions')}>Back to conditions</button><button type="button" className="strategy-save" disabled={!draftName.trim()||draftConditions.length===0||draftHasInvalidCondition} onClick={save}><Save size={13}/> Save strategy</button><button type="button" className="strategy-cancel" onClick={()=>{setEditing(false);setDraft(null)}}>Cancel</button></footer>
      </>}
    </section>}
  </div>;
};
