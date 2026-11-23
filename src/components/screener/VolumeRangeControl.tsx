import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  minVolumeUsd: number | null;
  maxVolumeUsd: number | null;
  onChange: (min: number | null, max: number | null) => void;
  count: { included: number; total: number };
};

const presets = [1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000];
const label = (value: number) => value >= 1_000_000_000 ? `$${value / 1_000_000_000}B` : `$${value / 1_000_000}M`;
const parse = (input: string): number | null => {
  const match = input.trim().replace(/[$,\s]/g, '').match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!match) return null;
  const multiplier = ({ K: 1_000, M: 1_000_000, B: 1_000_000_000 } as Record<string, number>)[(match[2] || '').toUpperCase()] || 1;
  const value = Number(match[1]) * multiplier;
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const VolumeRangeControl: React.FC<Props> = ({ minVolumeUsd, maxVolumeUsd, onChange, count }) => {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(minVolumeUsd);
  const [max, setMax] = useState(maxVolumeUsd);
  const [minInput, setMinInput] = useState(minVolumeUsd ? String(minVolumeUsd) : '');
  const [maxInput, setMaxInput] = useState(maxVolumeUsd ? String(maxVolumeUsd) : '');
  const [minCustom, setMinCustom] = useState(false);
  const [maxCustom, setMaxCustom] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!open) { setMin(minVolumeUsd); setMax(maxVolumeUsd); } }, [minVolumeUsd, maxVolumeUsd, open]);

  const minMode = minCustom ? 'custom' : min === null ? 'off' : presets.includes(min) ? String(min) : 'custom';
  const maxMode = maxCustom ? 'custom' : max === null ? 'off' : presets.includes(max) ? String(max) : 'custom';
  const rangeError = min !== null && max !== null && max <= min ? 'Maximum 24h volume must be greater than the minimum.' : '';
  const commitInput = (which: 'min' | 'max') => {
    const parsed = parse(which === 'min' ? minInput : maxInput);
    if (parsed === null) { setError('Enter a volume above zero, such as 500K, 2.5M or 1B.'); return; }
    const nextMin = which === 'min' ? parsed : min;
    const nextMax = which === 'max' ? parsed : max;
    if (nextMin !== null && nextMax !== null && nextMax <= nextMin) { setError('Maximum 24h volume must be greater than the minimum.'); return; }
    if (which === 'min') setMin(parsed); else setMax(parsed);
    setError('');
  };
  const setBound = (which: 'min' | 'max', value: number | null) => {
    if (which === 'min') { setMin(value); setMinCustom(false); }
    else { setMax(value); setMaxCustom(false); }
    setError('');
  };
  const valueLabel = min === null && max === null ? 'Any' : `${min === null ? 'Any' : label(min)} – ${max === null ? 'No max' : label(max)}`;

  return <div className="strategy-volume-wrap">
    <button type="button" className={`strategy-volume-trigger ${open ? 'is-open' : ''}`} aria-expanded={open} onClick={() => { setMin(minVolumeUsd); setMax(maxVolumeUsd); setMinInput(minVolumeUsd ? String(minVolumeUsd) : ''); setMaxInput(maxVolumeUsd ? String(maxVolumeUsd) : ''); setMinCustom(false); setMaxCustom(false); setError(''); setOpen(value => !value); }}>
      <small>24H VOLUME</small><span>{valueLabel}</span><ChevronDown size={13}/>
    </button>
    {open && <div className="strategy-volume-popover">
      <section><b>Minimum</b><div className="strategy-volume-presets">
        <button type="button" className={min === null ? 'selected' : ''} onClick={() => setBound('min', null)}>Off</button>
        {presets.map(value => <button type="button" key={value} className={min === value ? 'selected' : ''} onClick={() => setBound('min', value)}>{label(value)}</button>)}
        <button type="button" className={minMode === 'custom' ? 'selected' : ''} onClick={() => { setMinCustom(true); setMinInput(min ? String(min) : ''); }}>Custom</button>
      </div>{minMode === 'custom' && <input className="strategy-volume-input" aria-label="Custom minimum 24 hour volume" placeholder="e.g. 2.5M" value={minInput} onChange={event => setMinInput(event.target.value)} onBlur={() => commitInput('min')} onKeyDown={event => { if (event.key === 'Enter') commitInput('min'); }}/>}</section>
      <section><b>Maximum</b><div className="strategy-volume-presets">
        <button type="button" className={max === null ? 'selected' : ''} onClick={() => setBound('max', null)}>No limit</button>
        {presets.slice(2).map(value => <button type="button" key={value} className={max === value ? 'selected' : ''} onClick={() => setBound('max', value)}>{label(value)}</button>)}
        <button type="button" className={maxMode === 'custom' ? 'selected' : ''} onClick={() => { setMaxCustom(true); setMaxInput(max ? String(max) : ''); }}>Custom</button>
      </div>{maxMode === 'custom' && <input className="strategy-volume-input" aria-label="Custom maximum 24 hour volume" placeholder="e.g. 100M" value={maxInput} onChange={event => setMaxInput(event.target.value)} onBlur={() => commitInput('max')} onKeyDown={event => { if (event.key === 'Enter') commitInput('max'); }}/>}</section>
      {(error || rangeError) && <span className="strategy-volume-note strategy-volume-error">{error || rangeError}</span>}
      {min !== null && min < 5_000_000 && <span className="strategy-volume-note">Low-volume coins can move sharply and may be hard to exit.</span>}
      <footer><span>{count.included} of {count.total} markets in this range</span><button type="button" disabled={Boolean(error || rangeError)} onClick={() => { onChange(min, max); setOpen(false); }}>Apply</button></footer>
    </div>}
  </div>;
};
