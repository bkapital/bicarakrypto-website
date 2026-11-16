import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Link } from '../router';

// Data is exported by scripts/stage7_export_site.py into public/datasets/mp-crypto-index/.
const DATA_URL = '/datasets/mp-crypto-index';
const LANG_KEY = 'bk-mp-index-lang';

type Lang = 'ms' | 'en';
type MP = {
  constituency_code: string; constituency: string; name: string; party: string; coalition: string;
  state: string; status: string; role: string;
};
type Evidence = {
  evidence_id: string; constituency_code: string; mp_name: string; date: string; type: string;
  source_name: string; link: string; page: string; text: string; text_ms: string; stance: string;
  stance_source: string; stance_reason: string; stance_reason_ms: string; draft: string; flagged: string;
};
type Meta = { exported_at: string; reviewed_stances: number };
type Stance = 'supportive' | 'cautious' | 'opposed';

const STANCES: Stance[] = ['supportive', 'cautious', 'opposed'];
const STANCE_COLOR: Record<Stance, string> = { supportive: '#5CF2C0', cautious: '#F5B94A', opposed: '#FF6B6B' };
const NO_PARTY = '__none';
const OTHER = '__other';
const PAGE_SIZE = 40;

// ---------- all page text, in both languages ----------
const T = {
  ms: {
    pageTitle: 'Indeks Kripto Ahli Parlimen | Bicara Krypto',
    eyebrow: 'Data · Parlimen ke-15',
    title: 'Indeks Kripto Ahli Parlimen',
    lede1: (a: string, b: string, c: string) => [a, ' daripada ', b, ' Ahli Parlimen yang sedang berkhidmat telah menyentuh kripto, blockchain, aset digital atau penipuan pelaburan di Dewan Rakyat atau media sejak Parlimen ke-15 mula bersidang pada 19 Disember 2022. ', c, ' belum mempunyai sebarang rekod.'],
    lede2: (a: string, b: string) => [a, ' pernah membuat kenyataan yang menyokong, manakala ', b, ' membuat kenyataan yang berhati-hati atau menentang.'],
    warnA: 'Label pendirian di halaman ini ',
    warnB: 'dicadangkan oleh AI',
    warnC: (reviewed: number) => ` berdasarkan petikan sahaja dan ${reviewed > 0 ? `hanya ${reviewed} telah disemak` : 'belum disemak'} oleh pasukan Bicara Krypto. Ia menunjukkan penglibatan dan kecenderungan, bukan penilaian muktamad. `,
    warnLink: 'Lihat kaedah',
    updated: 'Data dikemas kini', sources: 'Sumber: Penyata Rasmi Dewan Rakyat dan media Malaysia',
    loading: 'Memuatkan data', loadError: 'Data tidak dapat dimuatkan. Sila muat semula halaman.',
    figures: 'Angka utama',
    tWith: 'Ahli Parlimen dengan rekod', tWithNote: (n: number) => `daripada ${n} Ahli Parlimen (4 kerusi kosong)`,
    tHansard: 'Sebutan di Hansard', tHansardNote: 'ucapan dan soalan lisan',
    tPq: 'Soalan dan jawapan lisan', tPqNote: 'sebahagian daripada sebutan Hansard',
    tPress: 'Artikel berita', tPressNote: 'carian media Malaysia',
    stanceTitle: 'Di mana pendirian Ahli Parlimen',
    stanceDesc: 'Kenyataan menyokong, berhati-hati dan menentang bagi setiap Ahli Parlimen (25 teratas). Sebutan neutral seperti angka, prosedur dan penguatkuasaan terhadap perlombongan haram tidak ditunjukkan. Klik nama untuk membaca kenyataannya.',
    stanceAria: (n: string, c: string, p: string, s: number, ca: number, o: number) => `${n}, ${c}, ${p}: ${s} menyokong, ${ca} berhati-hati, ${o} menentang`,
    stance: { supportive: 'Menyokong', cautious: 'Berhati-hati', opposed: 'Menentang', neutral: 'Neutral' } as Record<string, string>,
    qTitle: 'Sebutan setiap suku tahun', qDesc: 'Perenggan Hansard dan artikel berita yang menyebut kata kunci, mengikut tarikh. Berita tanpa tarikh tidak dikira.',
    qPrefix: 'S', qAria: 'Carta bar bertindan sebutan setiap suku tahun dari S4 2022 hingga S4 2026',
    qTip: (q: string, t: number, s: number, p: number, n: number) => `${q}: ${t} sebutan (ucapan ${s}, soalan ${p}, berita ${n})`,
    pTitle: 'Ahli Parlimen dengan rekod, mengikut parti', pDesc: 'Parti semasa jika diketahui, selain itu parti semasa dipilih. Parti dengan kurang daripada 3 Ahli Parlimen digabungkan sebagai Lain-lain.',
    pHas: 'Ada rekod', pAll: 'Semua Ahli Parlimen', noParty: 'Tiada parti', other: 'Lain-lain',
    tableTitle: 'Ahli Parlimen mengikut bilangan sebutan',
    tableDesc: 'Hanya Ahli Parlimen yang mempunyai sekurang-kurangnya satu rekod disenaraikan. Klik tajuk lajur untuk menyusun, dan klik sekali lagi untuk menterbalikkan. Klik baris untuk melihat bukti Ahli Parlimen itu.',
    cols: { constituency_code: 'Kerusi', name: 'Ahli Parlimen', party: 'Parti', role: 'Peranan', total: 'Jumlah', speech: 'Ucapan', pq: 'Soalan', press: 'Berita', supportive: 'Menyokong', cautious: 'Berhati-hati', opposed: 'Menentang' } as Record<string, string>,
    role: { minister: 'Menteri', 'deputy minister': 'Timbalan Menteri', backbencher: 'Ahli Parlimen', former: 'Bekas Ahli Parlimen' } as Record<string, string>,
    evTitle: 'Bukti',
    evDesc: 'Petikan Hansard adalah verbatim (sehingga 80 patah perkataan) dan dipautkan ke muka surat PDF rasmi. Berita menunjukkan tajuk dan ringkasan satu baris, bukan teks artikel. Setiap rekod disertakan pendirian dan sebabnya.',
    type: { speech: 'Ucapan', parliamentary_question: 'Soalan / jawapan lisan', press: 'Berita' } as Record<string, string>,
    fType: 'Jenis', fTypeAll: 'Semua jenis', fStance: 'Pendirian', fStanceAll: 'Semua pendirian',
    fParty: 'Parti', fPartyAll: 'Semua parti', fMp: 'Ahli Parlimen', fMpAll: 'Semua Ahli Parlimen', fMpAllParty: 'Semua Ahli Parlimen parti ini',
    records: (n: string) => `${n} rekod`, none: 'Tiada rekod untuk pilihan ini.', more: (n: number) => `Tunjuk ${n} lagi`,
    reviewed: 'disemak', suggested: 'cadangan AI', draft: 'Hansard draf', flagged: 'perlu semakan',
    source: 'Sumber', page: (p: string) => `Hansard m/s ${p}`, noDate: 'Tiada tarikh',
    langNote: '',
    mTitle: 'Kaedah dan had data',
    mSources: 'Sumber',
    mSources1: 'Semua 288 persidangan Dewan Rakyat Parlimen ke-15 (19 Dis 2022 hingga Nov 2026) daripada portal Hansard Parlimen Malaysia dan PDF Penyata Rasmi. Banyak persidangan sejak pertengahan 2024 masih dalam bentuk draf. Berita dicari di media Malaysia bagi Ahli Parlimen yang muncul dalam Hansard.',
    mSources2: 'Kata kunci: kripto, mata wang kripto, mata wang digital, aset digital, blockchain, rantaian blok, bitcoin, ethereum, stablecoin, CBDC, token digital, penipuan pelaburan, pertukaran aset digital, crypto, cryptocurrency, digital asset, digital currency, investment scam, Web3. "Kriptologi" tidak dikira.',
    mSources3: 'Menteri dipadankan mengikut nama, jadi setiap sebutan dikira untuk orang yang bercakap, apa pun jawatannya sekarang. Senator yang menjawab sebagai menteri bukan Ahli Parlimen dan tidak dikira.',
    mStance: 'Label pendirian (cadangan AI)',
    mDef: {
      supportive: 'menyokong kripto, blockchain atau aset digital, atau mahu penggunaan atau rangka kerja yang membolehkannya.',
      cautious: 'terbuka tetapi menekankan risiko, perlindungan pengguna atau kawalan ketat.',
      opposed: 'mahu ia disekat atau diharamkan.',
      neutral: 'angka, prosedur, sebutan sepintas lalu, atau penguatkuasaan terhadap penipuan dan perlombongan haram tanpa pandangan tentang kripto itu sendiri.',
    } as Record<string, string>,
    mStanceNote: 'Setiap label dicadangkan oleh AI berdasarkan petikan sahaja, bukan keseluruhan ucapan, dan ditandakan "cadangan AI" sehingga disemak. Kebanyakan sokongan adalah terhadap blockchain, bukan mata wang kripto.',
    mGaps: 'Tidak diliputi',
    mGaps1: 'Jawapan bertulis (tidak tersedia daripada parlimen.gov.my), Kamar Khas, dan media sosial. Ketiadaan rekod tidak bermakna Ahli Parlimen tidak pernah bercakap tentang kripto di tempat lain. P.100 Pandan, P.104 Subang, P.105 Petaling Jaya dan P.118 Setiawangsa kosong selepas Ahli Parlimennya meletak jawatan. Rekod semasa mereka masih Ahli Parlimen dikekalkan.',
    mCorrA: 'Ahli Parlimen atau pejabat mereka boleh memohon pembetulan melalui ', mCorrLink: 'halaman Hubungi', mCorrB: '.',
    months: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'],
    locale: 'ms-MY', switchLabel: 'Bahasa',
  },
  en: {
    pageTitle: 'MP Crypto Index | Bicara Krypto',
    eyebrow: 'Data · 15th Parliament',
    title: 'MP Crypto Index',
    lede1: (a: string, b: string, c: string) => [a, ' of ', b, ' sitting MPs have raised crypto, blockchain, digital assets or investment scams in the Dewan Rakyat or the media since the 15th Parliament first sat on 19 December 2022. ', c, ' have no record yet.'],
    lede2: (a: string, b: string) => [a, ' have made supportive statements, and ', b, ' have made cautious or opposed ones.'],
    warnA: 'The stance labels on this page are ',
    warnB: 'suggested by AI',
    warnC: (reviewed: number) => ` from the excerpts alone and ${reviewed > 0 ? `only ${reviewed} have been reviewed` : 'have not yet been reviewed'} by the Bicara Krypto team. They show engagement and leaning, not a final assessment. `,
    warnLink: 'See the method',
    updated: 'Data updated', sources: 'Sources: Dewan Rakyat Hansard (Penyata Rasmi) and Malaysian media',
    loading: 'Loading data', loadError: 'The data could not be loaded. Please reload the page.',
    figures: 'Headline figures',
    tWith: 'MPs with a record', tWithNote: (n: number) => `of ${n} sitting MPs (4 seats vacant)`,
    tHansard: 'Hansard mentions', tHansardNote: 'speeches and oral questions',
    tPq: 'Oral questions and answers', tPqNote: 'part of the Hansard mentions',
    tPress: 'News articles', tPressNote: 'Malaysian media search',
    stanceTitle: 'Where MPs stand',
    stanceDesc: 'Supportive, cautious and opposed statements per MP (top 25). Neutral mentions such as figures, procedure and enforcement against illegal mining are not shown. Select a name to read their statements.',
    stanceAria: (n: string, c: string, p: string, s: number, ca: number, o: number) => `${n}, ${c}, ${p}: ${s} supportive, ${ca} cautious, ${o} opposed`,
    stance: { supportive: 'Supportive', cautious: 'Cautious', opposed: 'Opposed', neutral: 'Neutral' } as Record<string, string>,
    qTitle: 'Mentions per quarter', qDesc: 'Hansard paragraphs and news articles that mention a keyword, by date. Undated news items are left out.',
    qPrefix: 'Q', qAria: 'Stacked bar chart of mentions per quarter from Q4 2022 to Q4 2026',
    qTip: (q: string, t: number, s: number, p: number, n: number) => `${q}: ${t} mentions (speeches ${s}, questions ${p}, news ${n})`,
    pTitle: 'MPs with a record, by party', pDesc: 'Current party where known, otherwise the party the MP was elected under. Parties with fewer than 3 MPs are grouped as Other.',
    pHas: 'Has a record', pAll: 'All sitting MPs', noParty: 'No party listed', other: 'Other',
    tableTitle: 'MPs by number of mentions',
    tableDesc: 'Only MPs with at least one record are listed. Select a column heading to sort by it, and again to reverse. Select a row to see that MP’s evidence.',
    cols: { constituency_code: 'Seat', name: 'MP', party: 'Party', role: 'Role', total: 'Total', speech: 'Speeches', pq: 'Questions', press: 'News', supportive: 'Supportive', cautious: 'Cautious', opposed: 'Opposed' } as Record<string, string>,
    role: { minister: 'Minister', 'deputy minister': 'Deputy Minister', backbencher: 'MP', former: 'Former MP' } as Record<string, string>,
    evTitle: 'Evidence',
    evDesc: 'Hansard excerpts are verbatim (up to 80 words) and link to the page of the official PDF. News rows show the headline and a one-line summary, never article text. Each record shows its stance and the reason for it.',
    type: { speech: 'Speech', parliamentary_question: 'Oral question / answer', press: 'News' } as Record<string, string>,
    fType: 'Type', fTypeAll: 'All types', fStance: 'Stance', fStanceAll: 'All stances',
    fParty: 'Party', fPartyAll: 'All parties', fMp: 'MP', fMpAll: 'All MPs', fMpAllParty: 'All MPs in this party',
    records: (n: string) => `${n} records`, none: 'No records for this selection.', more: (n: number) => `Show ${n} more`,
    reviewed: 'reviewed', suggested: 'AI suggestion', draft: 'Draft Hansard', flagged: 'needs checking',
    source: 'Source', page: (p: string) => `Hansard p. ${p}`, noDate: 'No date',
    langNote: 'Hansard excerpts and news headlines are quoted as published, mostly in Bahasa Malaysia.',
    mTitle: 'Method and limits',
    mSources: 'Sources',
    mSources1: 'All 288 Dewan Rakyat sittings of the 15th Parliament (19 Dec 2022 to Nov 2026), from the Parliament of Malaysia Hansard portal and the official Penyata Rasmi PDFs. Many sittings since mid-2024 are still drafts. News was searched in Malaysian media for the MPs who appear in Hansard.',
    mSources2: 'Keywords: kripto, mata wang kripto, mata wang digital, aset digital, blockchain, rantaian blok, bitcoin, ethereum, stablecoin, CBDC, token digital, penipuan pelaburan, pertukaran aset digital, crypto, cryptocurrency, digital asset, digital currency, investment scam, Web3. "Kriptologi" (cryptology) is not counted.',
    mSources3: 'Ministers are matched by name, so each mention counts for the person who spoke, whatever post they hold today. Senators who answer as ministers are not MPs and are not counted.',
    mStance: 'Stance labels (AI suggestions)',
    mDef: {
      supportive: 'favours crypto, blockchain or digital assets, or wants more adoption or an enabling framework.',
      cautious: 'open to it, but stresses risk, consumer protection or tight control.',
      opposed: 'wants it restricted or banned.',
      neutral: 'figures, procedure, passing mentions, or enforcement against scams and illegal mining with no view on crypto itself.',
    } as Record<string, string>,
    mStanceNote: 'Each label is suggested by AI from the excerpt alone, not the whole speech, and is marked "AI suggestion" until reviewed. Most support is for blockchain, not cryptocurrency.',
    mGaps: 'Not covered',
    mGaps1: 'Written answers (not available from parlimen.gov.my), the Kamar Khas special chamber, and social media. No record does not mean an MP has never spoken about crypto elsewhere. P.100 Pandan, P.104 Subang, P.105 Petaling Jaya and P.118 Setiawangsa are vacant after their MPs resigned. Records from their time as MPs are kept.',
    mCorrA: 'MPs or their offices can request a correction through our ', mCorrLink: 'Contact page', mCorrB: '.',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    locale: 'en-MY', switchLabel: 'Language',
  },
};
type Strings = typeof T.ms;

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const partyOf = (m?: MP) => (m ? m.party || m.coalition || '' : '');
const partyKey = (p: string) => p || NO_PARTY;

function initialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'ms') return q;
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ms') return saved;
  } catch { /* storage blocked: fall back to Malay */ }
  return 'ms';
}

function loadCsv<R>(url: string): Promise<R[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<R>(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => resolve(r.data), error: (e) => reject(e),
    });
  });
}

type MpRow = {
  constituency_code: string; name: string; party: string; role: string; status: string;
  total: number; speech: number; pq: number; press: number; supportive: number; cautious: number; opposed: number;
};
type SortKey = 'constituency_code' | 'name' | 'party' | 'role' | 'total' | 'speech' | 'pq' | 'press' | 'supportive' | 'cautious' | 'opposed';
const NUMERIC: SortKey[] = ['total', 'speech', 'pq', 'press', 'supportive', 'cautious', 'opposed'];
const COLS: SortKey[] = ['constituency_code', 'name', 'party', 'role', 'total', 'speech', 'pq', 'press', 'supportive', 'cautious', 'opposed'];

export const MPCryptoIndexPage: React.FC = () => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t: Strings = T[lang] as Strings;

  const [mps, setMps] = useState<MP[] | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [fType, setFType] = useState('');
  const [fStance, setFStance] = useState('');
  const [fParty, setFParty] = useState('');
  const [fMp, setFMp] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  const chooseLang = (l: Lang) => {
    setLang(l);
    try { window.localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', l);
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch { /* ignore */ }
  };

  useEffect(() => { document.title = t.pageTitle; }, [t]);

  useEffect(() => {
    Promise.all([
      loadCsv<MP>(`${DATA_URL}/mps.csv`),
      loadCsv<Evidence>(`${DATA_URL}/evidence.csv`),
      fetch(`${DATA_URL}/meta.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([m, e, mt]) => { setMps(m.filter((x) => x.name)); setEvidence(e); setMeta(mt); })
      .catch(() => setError(true));
  }, []);

  const fmt = (n: number) => n.toLocaleString(t.locale);
  const fmtDate = (s: string) => (isDate(s) ? `${+s.slice(8, 10)} ${t.months[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : t.noDate);
  const partyLabel = (key: string) => (key === NO_PARTY || key === '' ? t.noParty : key === OTHER ? t.other : key);

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

    const quarters: { y: string; q: number; speech: number; pq: number; press: number }[] = [];
    for (let y = 2022; y <= 2026; y++) for (let q = 1; q <= 4; q++) if (y > 2022 || q === 4) quarters.push({ y: String(y), q, speech: 0, pq: 0, press: 0 });
    const qIdx = new Map(quarters.map((x) => [`${x.y}-${x.q}`, x]));
    for (const e of ev) {
      if (!isDate(e.date) || e.date < '2022-12-19') continue;
      const b = qIdx.get(`${e.date.slice(0, 4)}-${Math.floor((+e.date.slice(5, 7) - 1) / 3) + 1}`);
      if (!b) continue;
      if (e.type === 'speech') b.speech += 1; else if (e.type === 'parliamentary_question') b.pq += 1; else if (e.type === 'press') b.press += 1;
    }

    const evCodes = new Set(ev.map((e) => e.constituency_code));
    const size = new Map<string, number>();
    sitting.forEach((m) => { const k = partyKey(partyOf(m)); size.set(k, (size.get(k) || 0) + 1); });
    const groups = new Map<string, { party: string; mps: number; withEv: number }>();
    for (const m of sitting) {
      const k0 = partyKey(partyOf(m));
      const k = (size.get(k0) || 0) < 3 ? OTHER : k0;
      const g = groups.get(k) || { party: k, mps: 0, withEv: 0 };
      g.mps += 1; if (evCodes.has(m.constituency_code)) g.withEv += 1;
      groups.set(k, g);
    }
    const byParty = [...groups.values()].sort((a, b) => Number(a.party === OTHER) - Number(b.party === OTHER) || b.mps - a.mps);

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
    if (next && fParty && d && partyKey(partyOf(d.byCode.get(code))) !== fParty) setFParty('');
    if (next) setTimeout(() => document.getElementById('bukti')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(NUMERIC.includes(k) ? 'desc' : 'asc'); }
  };

  const sortedMps = useMemo(() => {
    if (!d) return [];
    const dir = sortDir === 'asc' ? 1 : -1;
    const roleText = (r: MpRow) => (r.status !== 'sitting' ? t.role.former : t.role[r.role] || r.role);
    return d.perMp.slice().sort((a, b) => {
      let c: number;
      if (NUMERIC.includes(sortKey)) c = (a[sortKey] as number) - (b[sortKey] as number);
      else if (sortKey === 'role') c = roleText(a).localeCompare(roleText(b));
      else c = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return c * dir || b.total - a.total || a.name.localeCompare(b.name);
    });
  }, [d, sortKey, sortDir, t]);

  const parties = useMemo(() => {
    if (!d) return [] as [string, number][];
    const c = new Map<string, number>();
    d.perMp.forEach((r) => { const k = partyKey(r.party); c.set(k, (c.get(k) || 0) + 1); });
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [d]);

  const filtered = useMemo(() => {
    if (!d) return [];
    return d.ev
      .filter((e) => (!fType || e.type === fType) && (!fStance || e.stance === fStance) && (!fMp || e.constituency_code === fMp)
        && (!fParty || (!!e.constituency_code && partyKey(partyOf(d.byCode.get(e.constituency_code))) === fParty)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [d, fType, fStance, fParty, fMp]);

  const stanceTop = useMemo(() => (d ? d.perMp.filter((r) => r.supportive + r.cautious + r.opposed > 0)
    .sort((a, b) => (b.supportive + b.cautious + b.opposed) - (a.supportive + a.cautious + a.opposed) || a.name.localeCompare(b.name))
    .slice(0, 25) : []), [d]);

  const toggle = <LangToggle lang={lang} onChange={chooseLang} label={t.switchLabel} />;

  if (error) return <Shell lang={lang}>{toggle}<p className="text-[#FF6B6B]">{t.loadError}</p></Shell>;
  if (!d) return <Shell lang={lang}>{toggle}<div className="h-64 rounded-2xl bg-white/5 animate-pulse" aria-label={t.loading} /></Shell>;

  const maxStance = Math.max(1, ...stanceTop.map((r) => r.supportive + r.cautious + r.opposed));
  const maxQ = Math.max(1, ...d.quarters.map((q) => q.speech + q.pq + q.press));
  const maxParty = Math.max(1, ...d.byParty.map((p) => p.mps));
  const qLabel = (q: { y: string; q: number }) => `${q.y} ${t.qPrefix}${q.q}`;
  const [l1a, l1b, l1c, l1d, l1e, l1f] = t.lede1(fmt(d.kpi.withEv), fmt(d.kpi.sitting), fmt(d.kpi.zero));
  const [l2a, l2b, l2c, l2d] = t.lede2(fmt(d.kpi.sup), fmt(d.kpi.crit));

  return (
    <Shell lang={lang}>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[#5CF2C0]">{t.eyebrow}</p>
          {toggle}
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-balance">{t.title}</h1>
        <p className="text-lg text-white/85 max-w-3xl leading-relaxed">
          <b className="text-white">{l1a}</b>{l1b}<b className="text-white">{l1c}</b>{l1d}<b className="text-white">{l1e}</b>{l1f}
        </p>
        <p className="text-lg text-white/85 max-w-3xl leading-relaxed">
          <b className="text-[#5CF2C0]">{l2a}</b>{l2b}<b className="text-[#F5B94A]">{l2c}</b>{l2d}
        </p>
        <div className="flex gap-3 items-start rounded-xl border border-[#F5B94A]/40 bg-[#F5B94A]/10 p-4 max-w-3xl text-sm text-white/85">
          <AlertTriangle className="w-5 h-5 text-[#F5B94A] shrink-0 mt-0.5" aria-hidden />
          <p>{t.warnA}<b>{t.warnB}</b>{t.warnC(meta?.reviewed_stances ?? 0)}<a href="#kaedah" className="underline text-white">{t.warnLink}</a>.</p>
        </div>
        <p className="text-xs text-white/50">{t.updated} {meta ? fmtDate(meta.exported_at) : '—'} · {t.sources}</p>
      </header>

      <section aria-label={t.figures} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label={t.tWith} value={fmt(d.kpi.withEv)} note={t.tWithNote(d.kpi.sitting)} />
        <Tile label={t.tHansard} value={fmt(d.kpi.hansard)} note={t.tHansardNote} />
        <Tile label={t.tPq} value={fmt(d.kpi.pq)} note={t.tPqNote} />
        <Tile label={t.tPress} value={fmt(d.kpi.press)} note={t.tPressNote} />
      </section>

      <Section id="pendirian" title={t.stanceTitle} desc={t.stanceDesc}>
        <Legend items={STANCES.map((s) => [t.stance[s], STANCE_COLOR[s]])} />
        <ul className="flex flex-col gap-1.5">
          {stanceTop.map((r) => {
            const total = r.supportive + r.cautious + r.opposed;
            return (
              <li key={r.constituency_code}>
                <button type="button" onClick={() => pickMp(r.constituency_code)}
                  className={`w-full grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] gap-3 items-center text-left rounded-lg px-2 py-1 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5CF2C0] ${fMp === r.constituency_code ? 'bg-white/10' : ''}`}
                  aria-label={t.stanceAria(r.name, r.constituency_code, partyLabel(r.party), r.supportive, r.cautious, r.opposed)}>
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
        <Section id="masa" title={t.qTitle} desc={t.qDesc}>
          <Legend items={[[t.type.speech, '#5CF2C0'], [t.type.parliamentary_question, '#7AA2FF'], [t.type.press, '#C792EA']]} />
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-56 min-w-[480px] border-b border-white/15" role="img" aria-label={t.qAria}>
              {d.quarters.map((q) => {
                const tot = q.speech + q.pq + q.press;
                return (
                  <div key={`${q.y}-${q.q}`} className="flex-1 h-full flex flex-col justify-end" title={t.qTip(qLabel(q), tot, q.speech, q.pq, q.press)}>
                    <span className="text-[10px] text-white/60 text-center tabular-nums mb-0.5">{tot || ''}</span>
                    <div className="flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${(tot / maxQ) * 85}%` }}>
                      <span style={{ flexGrow: q.speech, background: '#5CF2C0' }} />
                      <span style={{ flexGrow: q.pq, background: '#7AA2FF' }} />
                      <span style={{ flexGrow: q.press, background: '#C792EA' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 min-w-[480px] mt-1">
              {d.quarters.map((q, i) => (
                <span key={`${q.y}-${q.q}`} className="flex-1 text-[10px] text-white/50 text-center">
                  {i % 4 === 0 || i === d.quarters.length - 1 ? qLabel(q).replace(' ', ' ') : ''}
                </span>
              ))}
            </div>
          </div>
        </Section>

        <Section id="parti" title={t.pTitle} desc={t.pDesc}>
          <Legend items={[[t.pHas, '#5CF2C0'], [t.pAll, 'rgba(255,255,255,0.15)']]} />
          <ul className="flex flex-col gap-1.5">
            {d.byParty.map((p) => (
              <li key={p.party} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 items-center text-sm">
                <span className="truncate text-white/85">{partyLabel(p.party)}</span>
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

      <Section id="senarai" title={t.tableTitle} desc={t.tableDesc}>
        <div className="overflow-auto max-h-[560px] rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0B1330] text-white/60 text-xs">
              <tr>
                {COLS.map((k) => {
                  const active = sortKey === k;
                  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return (
                    <th key={k} scope="col" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-3 py-2 font-medium whitespace-nowrap ${NUMERIC.includes(k) ? 'text-right' : 'text-left'}`}>
                      <button type="button" onClick={() => sortBy(k)}
                        className={`inline-flex items-center gap-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5CF2C0] rounded ${active ? 'text-white' : ''}`}>
                        {t.cols[k]}<Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} aria-hidden />
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
                  <td className="px-3 py-2 whitespace-nowrap"><RoleChip role={r.role} status={r.status} t={t} /></td>
                  {(['total', 'speech', 'pq', 'press'] as const).map((k) => <td key={k} className="px-3 py-2 text-right tabular-nums">{r[k]}</td>)}
                  {STANCES.map((s) => <td key={s} className="px-3 py-2 text-right tabular-nums" style={{ color: r[s] ? STANCE_COLOR[s] : undefined }}>{r[s]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="bukti" title={t.evTitle} desc={t.evDesc}>
        {t.langNote && <p className="text-xs text-white/50 -mt-2">{t.langNote}</p>}
        <div className="flex flex-wrap gap-2 items-center">
          <Select label={t.fType} value={fType} onChange={(v) => { setFType(v); setShown(PAGE_SIZE); }}
            options={[['', t.fTypeAll], ['speech', t.type.speech], ['parliamentary_question', t.type.parliamentary_question], ['press', t.type.press]]} />
          <Select label={t.fStance} value={fStance} onChange={(v) => { setFStance(v); setShown(PAGE_SIZE); }}
            options={[['', t.fStanceAll], ...(['supportive', 'cautious', 'opposed', 'neutral'] as const).map((s) => [s, t.stance[s]] as [string, string])]} />
          <Select label={t.fParty} value={fParty} onChange={(v) => {
            setFParty(v); setShown(PAGE_SIZE);
            if (v && fMp && partyKey(partyOf(d.byCode.get(fMp))) !== v) setFMp('');
          }} options={[['', t.fPartyAll], ...parties.map(([p, n]) => [p, `${partyLabel(p)} (${n})`] as [string, string])]} />
          <Select label={t.fMp} value={fMp} onChange={(v) => { setFMp(v); setShown(PAGE_SIZE); }}
            options={[['', fParty ? t.fMpAllParty : t.fMpAll],
              ...d.perMp.filter((r) => !fParty || partyKey(r.party) === fParty).sort((a, b) => a.name.localeCompare(b.name))
                .map((r) => [r.constituency_code, `${r.name} (${r.constituency_code}${r.party ? ', ' + r.party : ''})`] as [string, string])]} />
          <span className="text-xs text-white/50">{t.records(fmt(filtered.length))}</span>
        </div>

        <ul className="flex flex-col gap-3">
          {filtered.slice(0, shown).map((e) => {
            const m = d.byCode.get(e.constituency_code);
            const st = e.stance as Stance;
            const reason = lang === 'ms' ? e.stance_reason_ms || e.stance_reason : e.stance_reason;
            const text = lang === 'ms' ? e.text_ms || e.text : e.text;
            return (
              <li key={e.evidence_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)_11rem]">
                <div className="text-sm">
                  <div className="text-white/50 text-xs">{fmtDate(e.date)}</div>
                  <div className="text-white font-medium">{e.mp_name || '—'}</div>
                  {e.constituency_code && <div className="text-xs text-white/50">{e.constituency_code}{partyOf(m) ? ` · ${partyOf(m)}` : ''}</div>}
                </div>
                <div className="min-w-0">
                  <p className="text-white/90 leading-relaxed" lang={e.type === 'press' ? undefined : 'ms'}>{text || '—'}</p>
                  {t.stance[e.stance] && (
                    <p className="mt-2 text-xs text-white/60 leading-relaxed">
                      <b style={{ color: STANCE_COLOR[st] || '#FFFFFF' }}>{t.stance[e.stance]}</b>
                      <span className="text-white/40"> ({e.stance_source === 'reviewed' ? t.reviewed : t.suggested})</span>
                      {reason ? `: ${reason}` : ''}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>{t.type[e.type] || e.type}</Chip>
                    {e.draft === 'yes' && <Chip>{t.draft}</Chip>}
                    {e.flagged === 'yes' && <Chip warn>{t.flagged}</Chip>}
                  </div>
                </div>
                <div className="text-sm">
                  {/^https?:\/\//.test(e.link) ? (
                    <a href={e.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-[#5CF2C0] hover:underline">
                      <span>{e.source_name || t.source}</span><ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
                    </a>
                  ) : <span className="text-white/70">{e.source_name}</span>}
                  {e.page && <div className="text-xs text-white/50">{t.page(e.page)}</div>}
                </div>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 && <p className="text-white/60 text-sm">{t.none}</p>}
        {filtered.length > shown && (
          <button type="button" onClick={() => setShown(shown + PAGE_SIZE)}
            className="self-start rounded-full border border-white/20 px-5 py-2 text-sm hover:border-[#5CF2C0] hover:text-[#5CF2C0]">
            {t.more(Math.min(PAGE_SIZE, filtered.length - shown))}
          </button>
        )}
      </Section>

      <section id="kaedah" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4 scroll-mt-24">
        <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Info className="w-5 h-5 text-[#5CF2C0]" aria-hidden />{t.mTitle}</h2>
        <div className="grid gap-6 md:grid-cols-2 text-sm text-white/80 leading-relaxed">
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold">{t.mSources}</h3>
            <p>{t.mSources1}</p>
            <p>{t.mSources2}</p>
            <p>{t.mSources3}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold">{t.mStance}</h3>
            <ul className="flex flex-col gap-1.5">
              {(['supportive', 'cautious', 'opposed', 'neutral'] as const).map((s) => (
                <li key={s}><b style={{ color: s === 'neutral' ? '#FFFFFF' : STANCE_COLOR[s] }}>{t.stance[s]}</b>: {t.mDef[s]}</li>
              ))}
            </ul>
            <p>{t.mStanceNote}</p>
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <h3 className="text-white font-semibold">{t.mGaps}</h3>
            <p>{t.mGaps1}</p>
            <p>{t.mCorrA}<Link to="/hubungi" className="text-[#5CF2C0] underline">{t.mCorrLink}</Link>{t.mCorrB}</p>
          </div>
        </div>
      </section>
    </Shell>
  );
};

const Shell: React.FC<{ lang: Lang; children: React.ReactNode }> = ({ lang, children }) => (
  <div lang={lang} className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-12 font-body">{children}</div>
);

const LangToggle: React.FC<{ lang: Lang; onChange: (l: Lang) => void; label: string }> = ({ lang, onChange, label }) => (
  <div role="group" aria-label={label} className="inline-flex self-end rounded-full border border-white/15 p-1 text-sm">
    {([['ms', 'BM', 'Bahasa Malaysia'], ['en', 'EN', 'English']] as const).map(([code, short, full]) => (
      <button key={code} type="button" onClick={() => onChange(code)} aria-pressed={lang === code} title={full} lang={code}
        className={`px-3 py-1 rounded-full font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5CF2C0] ${lang === code ? 'bg-[#5CF2C0] text-[#060B1E]' : 'text-white/70 hover:text-white'}`}>
        {short}
      </button>
    ))}
  </div>
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

const Tile: React.FC<{ label: string; value: string; note: string }> = ({ label, value, note }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-1 min-w-0">
    <span className="text-xs text-white/60">{label}</span>
    <span className="font-heading text-4xl font-semibold tabular-nums text-white">{value}</span>
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

const RoleChip: React.FC<{ role: string; status: string; t: Strings }> = ({ role, status, t }) => {
  const former = status !== 'sitting';
  const label = former ? t.role.former : t.role[role] || role;
  const cls = former ? 'border-[#F5B94A]/60 text-[#F5B94A]'
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
