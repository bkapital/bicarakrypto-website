import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Link } from '../router';

// Data is exported by scripts/stage7_export_site.py into public/datasets/mp-crypto-index/.
const DATA_URL = '/datasets/mp-crypto-index';

type MP = {
  constituency_code: string; constituency: string; name: string; party: string; coalition: string;
  state: string; status: string; role: string;
};
type Evidence = {
  evidence_id: string; constituency_code: string; mp_name: string; date: string; type: string;
  source_name: string; link: string; page: string; text: string; stance: string; stance_source: string;
  stance_reason: string; draft: string; flagged: string;
};
type Meta = { exported_at: string; reviewed_stances: number };
type Stance = 'supportive' | 'cautious' | 'opposed';

const STANCES: Stance[] = ['supportive', 'cautious', 'opposed'];
const STANCE_LABEL: Record<string, string> = {
  supportive: 'Menyokong', cautious: 'Berhati-hati', opposed: 'Menentang', neutral: 'Neutral',
};
const STANCE_COLOR: Record<Stance, string> = { supportive: '#5CF2C0', cautious: '#F5B94A', opposed: '#FF6B6B' };
const TYPE_LABEL: Record<string, string> = {
  speech: 'Ucapan', parliamentary_question: 'Soalan / jawapan lisan', press: 'Berita',
};
const ROLE_LABEL: Record<string, string> = {
  minister: 'Menteri', 'deputy minister': 'Timbalan Menteri', backbencher: 'Ahli Parlimen', 'former MP': 'Bekas Ahli Parlimen',
};
const MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
const PAGE_SIZE = 40;

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const fmtDate = (s: string) => (isDate(s) ? `${+s.slice(8, 10)} ${MONTHS[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : 'Tiada tarikh');
const fmt = (n: number) => n.toLocaleString('ms-MY');
const partyOf = (m?: MP) => (m ? m.party || m.coalition || '' : '');

function loadCsv<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => resolve(r.data), error: (e) => reject(e),
    });
  });
}

type MpRow = {
  constituency_code: string; name: string; party: string; role: string; status: string;
  total: number; speech: number; pq: number; press: number; supportive: number; cautious: number; opposed: number;
};
type SortKey = keyof Pick<MpRow, 'constituency_code' | 'name' | 'party' | 'role' | 'total' | 'speech' | 'pq' | 'press' | 'supportive' | 'cautious' | 'opposed'>;
const NUMERIC: SortKey[] = ['total', 'speech', 'pq', 'press', 'supportive', 'cautious', 'opposed'];

export const MPCryptoIndexPage: React.FC = () => {
  const [mps, setMps] = useState<MP[] | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [fType, setFType] = useState('');
  const [fStance, setFStance] = useState('');
  const [fParty, setFParty] = useState('');
  const [fMp, setFMp] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    document.title = 'Indeks Kripto Ahli Parlimen | Bicara Krypto';
    Promise.all([
      loadCsv<MP>(`${DATA_URL}/mps.csv`),
      loadCsv<Evidence>(`${DATA_URL}/evidence.csv`),
      fetch(`${DATA_URL}/meta.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([m, e, mt]) => { setMps(m.filter((x) => x.name)); setEvidence(e); setMeta(mt); })
      .catch(() => setError('Data tidak dapat dimuatkan. Sila muat semula halaman.'));
  }, []);

  const d = useMemo(() => {
    if (!mps || !evidence) return null;
    const byCode = new Map(mps.map((m) => [m.constituency_code, m]));
    const ev = evidence.filter((e) => e.stance !== 'off-topic');
    const sitting = mps.filter((m) => m.status === 'sitting');
    const sittingCodes = new Set(sitting.map((m) => m.constituency_code));

    const rows = new Map<string, MpRow>();
    for (const e of ev) {
      const m = byCode.get(e.constituency_code);
      if (!m) continue;
      let r = rows.get(m.constituency_code);
      if (!r) {
        r = { constituency_code: m.constituency_code, name: m.name, party: partyOf(m), role: m.role, status: m.status,
          total: 0, speech: 0, pq: 0, press: 0, supportive: 0, cautious: 0, opposed: 0 };
        rows.set(m.constituency_code, r);
      }
      r.total += 1;
      if (e.type === 'speech') r.speech += 1;
      else if (e.type === 'parliamentary_question') r.pq += 1;
      else if (e.type === 'press') r.press += 1;
      if ((STANCES as string[]).includes(e.stance)) r[e.stance as Stance] += 1;
    }
    const perMp = [...rows.values()];
    const withEv = perMp.filter((r) => sittingCodes.has(r.constituency_code));
    const mpsWith = (s: string[]) => new Set(ev.filter((e) => s.includes(e.stance) && sittingCodes.has(e.constituency_code)).map((e) => e.constituency_code)).size;

    const quarters: { q: string; speech: number; pq: number; press: number }[] = [];
    for (let y = 2022; y <= 2026; y++) for (let q = 1; q <= 4; q++) if (y > 2022 || q === 4) quarters.push({ q: `${y} S${q}`, speech: 0, pq: 0, press: 0 });
    const qIdx = new Map(quarters.map((x) => [x.q, x]));
    for (const e of ev) {
      if (!isDate(e.date) || e.date < '2022-12-19') continue;
      const key = `${e.date.slice(0, 4)} S${Math.floor((+e.date.slice(5, 7) - 1) / 3) + 1}`;
      const b = qIdx.get(key);
      if (!b) continue;
      if (e.type === 'speech') b.speech += 1; else if (e.type === 'parliamentary_question') b.pq += 1; else if (e.type === 'press') b.press += 1;
    }

    const evCodes = new Set(ev.map((e) => e.constituency_code));
    const size = new Map<string, number>();
    sitting.forEach((m) => size.set(partyOf(m) || 'Tiada parti', (size.get(partyOf(m) || 'Tiada parti') || 0) + 1));
    const groups = new Map<string, { party: string; mps: number; withEv: number }>();
    for (const m of sitting) {
      const p0 = partyOf(m) || 'Tiada parti';
      const p = (size.get(p0) || 0) < 3 ? 'Lain-lain' : p0;
      const g = groups.get(p) || { party: p, mps: 0, withEv: 0 };
      g.mps += 1; if (evCodes.has(m.constituency_code)) g.withEv += 1;
      groups.set(p, g);
    }
    const byParty = [...groups.values()].sort((a, b) => Number(a.party === 'Lain-lain') - Number(b.party === 'Lain-lain') || b.mps - a.mps);

    return {
      byCode, ev, perMp, quarters, byParty,
      kpi: {
        sitting: sitting.length, withEv: withEv.length, zero: sitting.length - withEv.length,
        hansard: ev.filter((e) => e.type !== 'press').length, pq: ev.filter((e) => e.type === 'parliamentary_question').length,
        press: ev.filter((e) => e.type === 'press').length, sup: mpsWith(['supportive']), crit: mpsWith(['cautious', 'opposed']),
      },
    };
  }, [mps, evidence]);

  const pickMp = (code: string) => {
    const next = fMp === code ? '' : code;
    setFMp(next);
    setShown(PAGE_SIZE);
    if (next && fParty && d && partyOf(d.byCode.get(code)) !== fParty) setFParty('');
    if (next) setTimeout(() => document.getElementById('bukti')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(NUMERIC.includes(k) ? 'desc' : 'asc'); }
  };

  const sortedMps = useMemo(() => {
    if (!d) return [];
    const dir = sortDir === 'asc' ? 1 : -1;
    return d.perMp.slice().sort((a, b) => {
      const c = NUMERIC.includes(sortKey) ? (a[sortKey] as number) - (b[sortKey] as number) : String(a[sortKey]).localeCompare(String(b[sortKey]));
      return c * dir || b.total - a.total || a.name.localeCompare(b.name);
    });
  }, [d, sortKey, sortDir]);

  const parties = useMemo(() => {
    if (!d) return [];
    const c = new Map<string, number>();
    d.perMp.forEach((r) => c.set(r.party || 'Tiada parti', (c.get(r.party || 'Tiada parti') || 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [d]);

  const filtered = useMemo(() => {
    if (!d) return [];
    return d.ev
      .filter((e) => (!fType || e.type === fType) && (!fStance || e.stance === fStance) && (!fMp || e.constituency_code === fMp)
        && (!fParty || (e.constituency_code && (partyOf(d.byCode.get(e.constituency_code)) || 'Tiada parti') === fParty)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [d, fType, fStance, fParty, fMp]);

  const stanceTop = useMemo(() => (d ? d.perMp.filter((r) => r.supportive + r.cautious + r.opposed > 0)
    .sort((a, b) => (b.supportive + b.cautious + b.opposed) - (a.supportive + a.cautious + a.opposed) || a.name.localeCompare(b.name))
    .slice(0, 25) : []), [d]);

  if (error) return <Shell><p className="text-[#FF6B6B]">{error}</p></Shell>;
  if (!d) return <Shell><div className="h-64 rounded-2xl bg-white/5 animate-pulse" aria-label="Memuatkan data" /></Shell>;

  const maxStance = Math.max(1, ...stanceTop.map((r) => r.supportive + r.cautious + r.opposed));
  const maxQ = Math.max(1, ...d.quarters.map((q) => q.speech + q.pq + q.press));
  const maxParty = Math.max(1, ...d.byParty.map((p) => p.mps));

  return (
    <Shell>
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#5CF2C0]">Data · Parlimen ke-15</p>
        <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-balance">Indeks Kripto Ahli Parlimen</h1>
        <p className="text-lg text-white/85 max-w-3xl leading-relaxed">
          <b className="text-white">{fmt(d.kpi.withEv)}</b> daripada <b className="text-white">{fmt(d.kpi.sitting)}</b> Ahli Parlimen yang sedang berkhidmat telah menyentuh kripto, blockchain, aset digital atau penipuan pelaburan di Dewan Rakyat atau media sejak Parlimen ke-15 mula bersidang pada 19 Disember 2022. <b className="text-white">{fmt(d.kpi.zero)}</b> belum mempunyai sebarang rekod.
        </p>
        <p className="text-lg text-white/85 max-w-3xl leading-relaxed">
          <b className="text-[#5CF2C0]">{fmt(d.kpi.sup)}</b> pernah membuat kenyataan yang menyokong, manakala <b className="text-[#F5B94A]">{fmt(d.kpi.crit)}</b> membuat kenyataan yang berhati-hati atau menentang.
        </p>
        <div className="flex gap-3 items-start rounded-xl border border-[#F5B94A]/40 bg-[#F5B94A]/10 p-4 max-w-3xl text-sm text-white/85">
          <AlertTriangle className="w-5 h-5 text-[#F5B94A] shrink-0 mt-0.5" aria-hidden />
          <p>
            Label pendirian di halaman ini <b>dicadangkan oleh AI</b> berdasarkan petikan sahaja dan{' '}
            {meta && meta.reviewed_stances > 0 ? `hanya ${fmt(meta.reviewed_stances)} telah disemak` : 'belum disemak'} oleh pasukan Bicara Krypto.
            Ia menunjukkan penglibatan dan kecenderungan, bukan penilaian muktamad. <a href="#kaedah" className="underline text-white">Lihat kaedah</a>.
          </p>
        </div>
        <p className="text-xs text-white/50">Data dikemas kini {meta ? fmtDate(meta.exported_at) : '—'} · Sumber: Penyata Rasmi Dewan Rakyat dan media Malaysia</p>
      </header>

      <section aria-label="Angka utama" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Ahli Parlimen dengan rekod" value={d.kpi.withEv} note={`daripada ${d.kpi.sitting} Ahli Parlimen (4 kerusi kosong)`} />
        <Tile label="Sebutan di Hansard" value={d.kpi.hansard} note="ucapan dan soalan lisan" />
        <Tile label="Soalan dan jawapan lisan" value={d.kpi.pq} note="sebahagian daripada sebutan Hansard" />
        <Tile label="Artikel berita" value={d.kpi.press} note="carian media Malaysia" />
      </section>

      <Section id="pendirian" title="Di mana pendirian Ahli Parlimen"
        desc="Kenyataan menyokong, berhati-hati dan menentang bagi setiap Ahli Parlimen (25 teratas). Sebutan neutral seperti angka, prosedur dan penguatkuasaan terhadap perlombongan haram tidak ditunjukkan. Klik nama untuk membaca kenyataannya.">
        <Legend items={STANCES.map((s) => [STANCE_LABEL[s], STANCE_COLOR[s]])} />
        <ul className="flex flex-col gap-1.5">
          {stanceTop.map((r) => {
            const total = r.supportive + r.cautious + r.opposed;
            return (
              <li key={r.constituency_code}>
                <button type="button" onClick={() => pickMp(r.constituency_code)}
                  className={`w-full grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] gap-3 items-center text-left rounded-lg px-2 py-1 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5CF2C0] ${fMp === r.constituency_code ? 'bg-white/10' : ''}`}
                  aria-label={`${r.name}, ${r.constituency_code}, ${r.party || 'tiada parti'}: ${r.supportive} menyokong, ${r.cautious} berhati-hati, ${r.opposed} menentang`}>
                  <span className="min-w-0 text-sm">
                    <span className="block truncate text-white">{r.name}</span>
                    <span className="block text-xs text-white/50">{r.constituency_code}{r.party ? ` · ${r.party}` : ''}</span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="flex h-4 rounded overflow-hidden bg-white/5" style={{ width: `${(total / maxStance) * 100}%`, minWidth: '6px' }}>
                      {STANCES.map((s) => r[s] > 0 && <span key={s} style={{ width: `${(r[s] / total) * 100}%`, background: STANCE_COLOR[s] }} />)}
                    </span>
                    <span className="text-xs text-white/60 tabular-nums shrink-0">{total}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section id="masa" title="Sebutan setiap suku tahun" desc="Perenggan Hansard dan artikel berita yang menyebut kata kunci, mengikut tarikh. Berita tanpa tarikh tidak dikira.">
          <Legend items={[['Ucapan', '#5CF2C0'], ['Soalan / jawapan lisan', '#7AA2FF'], ['Berita', '#C792EA']]} />
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-56 min-w-[480px] border-b border-white/15 pb-0" role="img"
              aria-label="Carta bar bertindan sebutan setiap suku tahun dari S4 2022 hingga S4 2026">
              {d.quarters.map((q) => {
                const t = q.speech + q.pq + q.press;
                return (
                  <div key={q.q} className="flex-1 h-full flex flex-col justify-end group relative" title={`${q.q}: ${t} sebutan (ucapan ${q.speech}, soalan ${q.pq}, berita ${q.press})`}>
                    <span className="text-[10px] text-white/60 text-center tabular-nums mb-0.5">{t || ''}</span>
                    <div className="flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${(t / maxQ) * 85}%` }}>
                      <span style={{ flexGrow: q.speech, background: '#5CF2C0' }} />
                      <span style={{ flexGrow: q.pq, background: '#7AA2FF' }} />
                      <span style={{ flexGrow: q.press, background: '#C792EA' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 min-w-[480px] mt-1">
              {d.quarters.map((q, i) => <span key={q.q} className="flex-1 text-[10px] text-white/50 text-center">{i % 4 === 0 || i === d.quarters.length - 1 ? q.q.replace(' ', ' ') : ''}</span>)}
            </div>
          </div>
        </Section>

        <Section id="parti" title="Ahli Parlimen dengan rekod, mengikut parti" desc="Parti semasa jika diketahui, selain itu parti semasa dipilih. Parti dengan kurang daripada 3 Ahli Parlimen digabungkan sebagai Lain-lain.">
          <Legend items={[['Ada rekod', '#5CF2C0'], ['Semua Ahli Parlimen', 'rgba(255,255,255,0.15)']]} />
          <ul className="flex flex-col gap-1.5">
            {d.byParty.map((p) => (
              <li key={p.party} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 items-center text-sm">
                <span className="truncate text-white/85">{p.party}</span>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="relative h-4 rounded bg-white/15" style={{ width: `${(p.mps / maxParty) * 100}%` }}>
                    <span className="absolute inset-y-0 left-0 rounded bg-[#5CF2C0]" style={{ width: `${(p.withEv / p.mps) * 100}%` }} />
                  </span>
                  <span className="text-xs text-white/60 tabular-nums shrink-0">{p.withEv} / {p.mps}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section id="senarai" title="Ahli Parlimen mengikut bilangan sebutan"
        desc="Hanya Ahli Parlimen yang mempunyai sekurang-kurangnya satu rekod disenaraikan. Klik tajuk lajur untuk menyusun, dan klik sekali lagi untuk menterbalikkan. Klik baris untuk melihat bukti Ahli Parlimen itu.">
        <div className="overflow-auto max-h-[560px] rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0B1330] text-white/60 text-xs">
              <tr>
                {([
                  ['constituency_code', 'Kerusi'], ['name', 'Ahli Parlimen'], ['party', 'Parti'], ['role', 'Peranan'],
                  ['total', 'Jumlah'], ['speech', 'Ucapan'], ['pq', 'Soalan'], ['press', 'Berita'],
                  ['supportive', 'Menyokong'], ['cautious', 'Berhati-hati'], ['opposed', 'Menentang'],
                ] as [SortKey, string][]).map(([k, label]) => {
                  const active = sortKey === k;
                  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return (
                    <th key={k} scope="col" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-3 py-2 font-medium whitespace-nowrap ${NUMERIC.includes(k) ? 'text-right' : 'text-left'}`}>
                      <button type="button" onClick={() => sortBy(k)}
                        className={`inline-flex items-center gap-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5CF2C0] rounded ${active ? 'text-white' : ''}`}>
                        {label}<Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} aria-hidden />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedMps.map((r) => (
                <tr key={r.constituency_code} tabIndex={0} onClick={() => pickMp(r.constituency_code)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickMp(r.constituency_code); } }}
                  className={`border-t border-white/5 cursor-pointer hover:bg-white/5 focus-visible:bg-white/10 outline-none ${fMp === r.constituency_code ? 'bg-white/10' : ''}`}>
                  <td className="px-3 py-2 whitespace-nowrap text-white/70">{r.constituency_code}</td>
                  <td className="px-3 py-2 min-w-[12rem]">{r.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-white/80">{r.party || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><RoleChip role={r.role} status={r.status} /></td>
                  {(['total', 'speech', 'pq', 'press'] as SortKey[]).map((k) => <td key={k} className="px-3 py-2 text-right tabular-nums">{r[k]}</td>)}
                  {STANCES.map((s) => <td key={s} className="px-3 py-2 text-right tabular-nums" style={{ color: r[s] ? STANCE_COLOR[s] : undefined }}>{r[s]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="bukti" title="Bukti"
        desc="Petikan Hansard adalah verbatim (sehingga 80 patah perkataan) dan dipautkan ke muka surat PDF rasmi. Berita menunjukkan tajuk dan ringkasan satu baris, bukan teks artikel. Setiap rekod disertakan pendirian dan sebabnya.">
        <div className="flex flex-wrap gap-2 items-center">
          <Select label="Jenis" value={fType} onChange={(v) => { setFType(v); setShown(PAGE_SIZE); }}
            options={[['', 'Semua jenis'], ['speech', 'Ucapan'], ['parliamentary_question', 'Soalan / jawapan lisan'], ['press', 'Berita']]} />
          <Select label="Pendirian" value={fStance} onChange={(v) => { setFStance(v); setShown(PAGE_SIZE); }}
            options={[['', 'Semua pendirian'], ['supportive', 'Menyokong'], ['cautious', 'Berhati-hati'], ['opposed', 'Menentang'], ['neutral', 'Neutral']]} />
          <Select label="Parti" value={fParty} onChange={(v) => {
            setFParty(v); setShown(PAGE_SIZE);
            if (v && fMp && (partyOf(d.byCode.get(fMp)) || 'Tiada parti') !== v) setFMp('');
          }} options={[['', 'Semua parti'], ...parties.map(([p, n]) => [p, `${p} (${n})`] as [string, string])]} />
          <Select label="Ahli Parlimen" value={fMp} onChange={(v) => { setFMp(v); setShown(PAGE_SIZE); }}
            options={[['', fParty ? 'Semua Ahli Parlimen parti ini' : 'Semua Ahli Parlimen'],
              ...d.perMp.filter((r) => !fParty || (r.party || 'Tiada parti') === fParty).sort((a, b) => a.name.localeCompare(b.name))
                .map((r) => [r.constituency_code, `${r.name} (${r.constituency_code}${r.party ? ', ' + r.party : ''})`] as [string, string])]} />
          <span className="text-xs text-white/50">{fmt(filtered.length)} rekod</span>
        </div>

        <ul className="flex flex-col gap-3">
          {filtered.slice(0, shown).map((e) => {
            const m = d.byCode.get(e.constituency_code);
            const st = e.stance as Stance;
            return (
              <li key={e.evidence_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)_11rem]">
                <div className="text-sm">
                  <div className="text-white/50 text-xs">{fmtDate(e.date)}</div>
                  <div className="text-white font-medium">{e.mp_name || '—'}</div>
                  {e.constituency_code && <div className="text-xs text-white/50">{e.constituency_code}{partyOf(m) ? ` · ${partyOf(m)}` : ''}</div>}
                </div>
                <div className="min-w-0">
                  <p className="text-white/90 leading-relaxed">{e.text || '—'}</p>
                  {STANCE_LABEL[e.stance] && (
                    <p className="mt-2 text-xs text-white/60 leading-relaxed">
                      <b style={{ color: STANCE_COLOR[st] || '#FFFFFF' }}>{STANCE_LABEL[e.stance]}</b>
                      <span className="text-white/40"> ({e.stance_source === 'reviewed' ? 'disemak' : 'cadangan AI'})</span>
                      {e.stance_reason ? `: ${e.stance_reason}` : ''}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>{TYPE_LABEL[e.type] || e.type}</Chip>
                    {e.draft === 'yes' && <Chip>Hansard draf</Chip>}
                    {e.flagged === 'yes' && <Chip warn>perlu semakan</Chip>}
                  </div>
                </div>
                <div className="text-sm">
                  {/^https?:\/\//.test(e.link) ? (
                    <a href={e.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-[#5CF2C0] hover:underline">
                      <span>{e.source_name || 'Sumber'}</span><ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
                    </a>
                  ) : <span className="text-white/70">{e.source_name}</span>}
                  {e.page && <div className="text-xs text-white/50">Hansard m/s {e.page}</div>}
                </div>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 && <p className="text-white/60 text-sm">Tiada rekod untuk pilihan ini.</p>}
        {filtered.length > shown && (
          <button type="button" onClick={() => setShown(shown + PAGE_SIZE)}
            className="self-start rounded-full border border-white/20 px-5 py-2 text-sm hover:border-[#5CF2C0] hover:text-[#5CF2C0]">
            Tunjuk {Math.min(PAGE_SIZE, filtered.length - shown)} lagi
          </button>
        )}
      </Section>

      <section id="kaedah" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Info className="w-5 h-5 text-[#5CF2C0]" aria-hidden />Kaedah dan had data</h2>
        <div className="grid gap-6 md:grid-cols-2 text-sm text-white/80 leading-relaxed">
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold">Sumber</h3>
            <p>Semua 288 persidangan Dewan Rakyat Parlimen ke-15 (19 Dis 2022 hingga Nov 2026) daripada portal Hansard Parlimen Malaysia dan PDF Penyata Rasmi. Banyak persidangan sejak pertengahan 2024 masih dalam bentuk draf. Berita dicari di media Malaysia bagi Ahli Parlimen yang muncul dalam Hansard.</p>
            <p>Kata kunci: kripto, mata wang kripto, mata wang digital, aset digital, blockchain, rantaian blok, bitcoin, ethereum, stablecoin, CBDC, token digital, penipuan pelaburan, pertukaran aset digital, crypto, cryptocurrency, digital asset, digital currency, investment scam, Web3. "Kriptologi" tidak dikira.</p>
            <p>Menteri dipadankan mengikut nama, jadi setiap sebutan dikira untuk orang yang bercakap, apa pun jawatannya sekarang. Senator yang menjawab sebagai menteri bukan Ahli Parlimen dan tidak dikira.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold">Label pendirian (cadangan AI)</h3>
            <ul className="flex flex-col gap-1.5">
              <li><b style={{ color: STANCE_COLOR.supportive }}>Menyokong</b>: menyokong kripto, blockchain atau aset digital, atau mahu penggunaan atau rangka kerja yang membolehkannya.</li>
              <li><b style={{ color: STANCE_COLOR.cautious }}>Berhati-hati</b>: terbuka tetapi menekankan risiko, perlindungan pengguna atau kawalan ketat.</li>
              <li><b style={{ color: STANCE_COLOR.opposed }}>Menentang</b>: mahu ia disekat atau diharamkan.</li>
              <li><b className="text-white">Neutral</b>: angka, prosedur, sebutan sepintas lalu, atau penguatkuasaan terhadap penipuan dan perlombongan haram tanpa pandangan tentang kripto itu sendiri.</li>
            </ul>
            <p>Setiap label dicadangkan oleh AI berdasarkan petikan sahaja, bukan keseluruhan ucapan, dan ditandakan "cadangan AI" sehingga disemak. Kebanyakan sokongan adalah terhadap blockchain, bukan mata wang kripto.</p>
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <h3 className="text-white font-semibold">Tidak diliputi</h3>
            <p>Jawapan bertulis (tidak tersedia daripada parlimen.gov.my), Kamar Khas, dan media sosial. Ketiadaan rekod tidak bermakna Ahli Parlimen tidak pernah bercakap tentang kripto di tempat lain. P.100 Pandan, P.104 Subang, P.105 Petaling Jaya dan P.118 Setiawangsa kosong selepas Ahli Parlimennya meletak jawatan. Rekod semasa mereka masih Ahli Parlimen dikekalkan.</p>
            <p>Ahli Parlimen atau pejabat mereka boleh memohon pembetulan melalui <Link to="/hubungi" className="text-[#5CF2C0] underline">halaman Hubungi</Link>.</p>
          </div>
        </div>
      </section>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-12 font-body">{children}</div>
);

const Section: React.FC<{ id: string; title: string; desc: string; children: React.ReactNode }> = ({ id, title, desc, children }) => (
  <section id={id} className="flex flex-col gap-4 min-w-0 scroll-mt-24">
    <div className="flex flex-col gap-1">
      <h2 className="font-heading text-2xl font-semibold text-balance">{title}</h2>
      <p className="text-sm text-white/60 max-w-3xl leading-relaxed">{desc}</p>
    </div>
    {children}
  </section>
);

const Tile: React.FC<{ label: string; value: number; note: string }> = ({ label, value, note }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-1 min-w-0">
    <span className="text-xs text-white/60">{label}</span>
    <span className="font-heading text-4xl font-semibold tabular-nums text-white">{fmt(value)}</span>
    <span className="text-xs text-white/50">{note}</span>
  </div>
);

const Legend: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <div className="flex flex-wrap gap-4 text-xs text-white/60" aria-hidden>
    {items.map(([label, color]) => (
      <span key={label} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />{label}</span>
    ))}
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; warn?: boolean }> = ({ children, warn }) => (
  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${warn ? 'border-[#F5B94A]/60 text-[#F5B94A]' : 'border-white/15 text-white/60'}`}>{children}</span>
);

const RoleChip: React.FC<{ role: string; status: string }> = ({ role, status }) => {
  const label = status !== 'sitting' ? 'Bekas Ahli Parlimen' : ROLE_LABEL[role] || role;
  const cls = status !== 'sitting' ? 'border-[#F5B94A]/60 text-[#F5B94A]'
    : role === 'minister' || role === 'deputy minister' ? 'border-[#5CF2C0]/50 text-[#5CF2C0]' : 'border-white/15 text-white/60';
  return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
};

const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: [string, string][] }> = ({ label, value, onChange, options }) => (
  <label className="flex flex-col text-xs text-white/50 gap-1">
    <span className="sr-only">{label}</span>
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className="max-w-[18rem] rounded-full bg-[#0B1330] border border-white/15 px-4 py-2 text-sm text-white focus:outline-none focus:border-[#5CF2C0]">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>
);

export default MPCryptoIndexPage;
