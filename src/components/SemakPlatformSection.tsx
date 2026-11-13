import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Search, X, ExternalLink, ChevronDown, AlertTriangle } from 'lucide-react';
import { CONFIG } from '../config';

export interface SemakPlatformRow {
  id: string;
  name: string;
  company: string;
  status: 'Berdaftar' | 'Senarai Amaran' | 'Tiada dalam senarai' | string;
  category: string;
  yearAdded: string;
  tags: string;
  scReason: string;
  website: string;
  search: string;
  note: string;
  coingecko: string;
  source: string;
}

export interface SemakPlatformSettings {
  updated: string;
  registeredCount: string;
  scAlertListUrl: string;
  scRegisteredUrl: string;
  scCheckerUrl: string;
}

const DEFAULT_SETTINGS: SemakPlatformSettings = {
  updated: '—',
  registeredCount: '',
  scAlertListUrl: 'https://www.sc.com.my/regulation/enforcement/investor-alerts/sc-investor-alert-list',
  scRegisteredUrl: 'https://www.sc.com.my/regulation/guidelines/recognizedmarkets/list-of-registered-digital-asset-exchanges',
  scCheckerUrl: 'https://www.sc.com.my/investment-checker',
};

const QUICK_CHIPS = ['Luno', 'Binance', 'Bybit', 'MEXC', 'HATA'];

// In-memory session cache
let cachedSessionData: {
  rows: SemakPlatformRow[];
  settings: SemakPlatformSettings;
} | null = null;
let pendingSessionPromise: Promise<{
  rows: SemakPlatformRow[];
  settings: SemakPlatformSettings;
}> | null = null;

async function fetchAndParseCsv<T extends Record<string, string>>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());
    }
    const rawText = await res.text();
    const text = rawText.replace(/^\uFEFF/, '');
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      throw new Error('Response is not a valid CSV');
    }
    const parsed = Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      transform: (value) => value.trim(),
    });
    if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
      throw new Error(parsed.errors[0].message || 'CSV parse error');
    }
    return parsed.data || [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SemakPlatform] Failed to load CSV:', msg, 'URL:', url);
    throw new Error(msg);
  }
}

async function loadSemakPlatformData(): Promise<{
  rows: SemakPlatformRow[];
  settings: SemakPlatformSettings;
}> {
  if (cachedSessionData) {
    return cachedSessionData;
  }
  if (pendingSessionPromise) {
    return pendingSessionPromise;
  }

  pendingSessionPromise = (async () => {
    const dataUrl = CONFIG.semakPlatform?.dataCsvUrl?.trim() || '';
    const settingsUrl = CONFIG.semakPlatform?.settingsCsvUrl?.trim() || '';

    if (!dataUrl) {
      throw new Error('CONFIG.semakPlatform.dataCsvUrl is empty');
    }

    const dataPromise = fetchAndParseCsv<Record<string, string>>(dataUrl);
    const settingsPromise = settingsUrl
      ? fetchAndParseCsv<Record<string, string>>(settingsUrl).catch(() => [])
      : Promise.resolve([]);

    const [rawRows, rawSettings] = await Promise.all([dataPromise, settingsPromise]);

    const rows: SemakPlatformRow[] = rawRows
      .map((raw) => {
        const r: Record<string, string> = {};
        for (const [key, val] of Object.entries(raw)) {
          r[key.replace(/^\uFEFF/, '').trim()] = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
        }
        return {
          id: r.id || '',
          name: r.name || '',
          company: r.company || '',
          status: r.status || '',
          category: r.category || '',
          yearAdded: r.yearAdded || '',
          tags: r.tags || '',
          scReason: r.scReason || '',
          website: r.website || '',
          search: r.search || '',
          note: r.note || '',
          coingecko: r.coingecko || '',
          source: r.source || '',
        };
      })
      .filter((r) => Boolean(r.name));

    const settings: SemakPlatformSettings = { ...DEFAULT_SETTINGS };
    for (const rawItem of rawSettings) {
      const item: Record<string, string> = {};
      for (const [key, val] of Object.entries(rawItem)) {
        item[key.replace(/^\uFEFF/, '').trim()] = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
      }
      const k = item.key || '';
      const v = item.value || '';
      if (!k || !v) continue;
      if (k === 'updated') settings.updated = v;
      else if (k === 'registeredCount') settings.registeredCount = v;
      else if (k === 'scAlertListUrl') settings.scAlertListUrl = v;
      else if (k === 'scRegisteredUrl') settings.scRegisteredUrl = v;
      else if (k === 'scCheckerUrl') settings.scCheckerUrl = v;
    }

    const result = { rows, settings };
    cachedSessionData = result;
    return result;
  })();

  try {
    return await pendingSessionPromise;
  } finally {
    pendingSessionPromise = null;
  }
}

function normalizeTerm(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function getStatusOrder(status: string): number {
  if (status === 'Berdaftar') return 0;
  if (status === 'Senarai Amaran') return 1;
  return 2;
}

function getMatchRank(row: SemakPlatformRow, qNorm: string): number {
  if (!qNorm) return 99;

  const terms = [row.name, ...(row.search ? row.search.split(',') : [])]
    .map((t) => normalizeTerm(t))
    .filter(Boolean);

  let bestRank = 99;
  const maxFuzzy = qNorm.length >= 7 ? 2 : qNorm.length >= 4 ? 1 : 0;

  for (const term of terms) {
    if (term === qNorm) {
      return 0; // exact match
    }
    if (term.startsWith(qNorm)) {
      if (bestRank > 1) bestRank = 1;
    } else if (term.includes(qNorm)) {
      if (bestRank > 2) bestRank = 2;
    } else if (maxFuzzy > 0 && Math.abs(term.length - qNorm.length) <= maxFuzzy) {
      const dist = levenshtein(qNorm, term);
      if (dist <= maxFuzzy && bestRank > 3) {
        bestRank = 3;
      }
    }
  }

  return bestRank;
}

function formatOfficialWebsiteUrl(website: string): string {
  const trimmed = website.trim();
  if (!trimmed) return '#';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isCloneCategory(category: string): boolean {
  return category.trim().toLowerCase() === 'klon entiti berdaftar';
}

interface SemakPlatformSectionProps {
  externalSearch?: { query: string; nonce: number } | null;
}

export const SemakPlatformSection: React.FC<SemakPlatformSectionProps> = ({ externalSearch }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<SemakPlatformRow[]>(() => cachedSessionData?.rows || []);
  const [settings, setSettings] = useState<SemakPlatformSettings>(
    () => cachedSessionData?.settings || DEFAULT_SETTINGS
  );
  const [loading, setLoading] = useState<boolean>(() => !cachedSessionData);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [clonesExpanded, setClonesExpanded] = useState<boolean>(false);

  // Fetch both CSVs on page load and cache for session
  useEffect(() => {
    let active = true;
    if (cachedSessionData) {
      setRows(cachedSessionData.rows);
      setSettings(cachedSessionData.settings);
      setLoading(false);
      setFetchError(null);
      return;
    }

    if (!CONFIG.semakPlatform?.dataCsvUrl?.trim()) {
      setLoading(false);
      setFetchError('CONFIG.semakPlatform.dataCsvUrl belum diisi.');
      return;
    }

    setLoading(true);
    loadSemakPlatformData()
      .then((data) => {
        if (!active) return;
        setRows(data.rows);
        setSettings(data.settings);
        setFetchError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        setFetchError(msg || 'Unknown error');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Debounce search input by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryInput);
      setClonesExpanded(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [queryInput]);

  // Handle external search triggers (e.g. clicking pill on Platform Kripto cards)
  useEffect(() => {
    if (externalSearch && externalSearch.query) {
      setQueryInput(externalSearch.query);
      setDebouncedQuery(externalSearch.query);
      setClonesExpanded(false);
    }
  }, [externalSearch]);

  const handleChipClick = (chip: string) => {
    setQueryInput(chip);
    setDebouncedQuery(chip);
    setClonesExpanded(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQueryInput('');
    setDebouncedQuery('');
    setClonesExpanded(false);
    inputRef.current?.focus();
  };

  // Stats for empty state
  const stats = useMemo(() => {
    const berdaftarRowsCount = rows.filter((r) => r.status === 'Berdaftar').length;
    const alertRowsCount = rows.filter((r) => r.status === 'Senarai Amaran').length;
    const totalRowsCount = rows.length;
    const registeredDisplay =
      settings.registeredCount && settings.registeredCount !== '—'
        ? settings.registeredCount
        : String(berdaftarRowsCount);
    return {
      registeredDisplay,
      alertRowsCount,
      totalRowsCount,
    };
  }, [rows, settings.registeredCount]);

  // Compute search results
  const isSearchActive = debouncedQuery.trim().length >= 2 && normalizeTerm(debouncedQuery).length >= 1;

  const { displayCards, cloneEntries } = useMemo(() => {
    if (!isSearchActive || rows.length === 0) {
      return { displayCards: [] as SemakPlatformRow[], cloneEntries: [] as SemakPlatformRow[] };
    }

    const qNorm = normalizeTerm(debouncedQuery);
    const ranked = rows
      .map((row) => ({
        row,
        rank: getMatchRank(row, qNorm),
      }))
      .filter((item) => item.rank < 99)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return getStatusOrder(a.row.status) - getStatusOrder(b.row.status);
      })
      .map((item) => item.row);

    const hasRegistered = ranked.some((r) => r.status === 'Berdaftar');
    const clones = ranked.filter((r) => isCloneCategory(r.category));

    if (hasRegistered && clones.length > 0) {
      const nonClones = ranked.filter((r) => !isCloneCategory(r.category)).slice(0, 5);
      return {
        displayCards: nonClones,
        cloneEntries: clones,
      };
    }

    return {
      displayCards: ranked.slice(0, 5),
      cloneEntries: [],
    };
  }, [isSearchActive, rows, debouncedQuery]);

  const renderStatusBadge = (status: string) => {
    if (status === 'Berdaftar') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#5CF2C0] text-[#060B1E] shrink-0">
          ✓ Berdaftar dengan SC
        </span>
      );
    }
    if (status === 'Senarai Amaran') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E5484D] text-white shrink-0">
          ⛔ Dalam Senarai Amaran SC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/15 shrink-0">
        Tiada dalam senarai amaran
      </span>
    );
  };

  const renderResultCard = (row: SemakPlatformRow, keyPrefix = 'card') => {
    const tagList = row.tags
      ? row.tags
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const hasFooter = Boolean(row.coingecko || row.source);

    return (
      <div
        key={`${keyPrefix}-${row.id || row.name}`}
        className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-sm"
      >
        {/* Top Row: Platform Name (bold) + Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-[-0.01em] break-words">
            {row.name}
          </h3>
          {renderStatusBadge(row.status)}
        </div>

        {/* Body by Status */}
        {row.status === 'Berdaftar' && (
          <div className="space-y-2.5 text-sm text-white/75 leading-relaxed">
            {row.company && (
              <div className="font-semibold text-white">{row.company}</div>
            )}
            <p>Bursa aset digital (DAX) berdaftar dengan SC.</p>
            {row.note && <p className="text-white/65">{row.note}</p>}
            {row.website && (
              <div className="pt-1">
                <a
                  href={formatOfficialWebsiteUrl(row.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#5CF2C0] hover:underline"
                >
                  <span>Laman rasmi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {row.status === 'Senarai Amaran' && (
          <div className="space-y-3 text-sm text-white/75 leading-relaxed">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs sm:text-sm text-white/70">
              {row.yearAdded && (
                <div>
                  Ditambah ke Senarai Amaran: <span className="font-semibold text-white">{row.yearAdded}</span>
                </div>
              )}
              {row.category && (
                <div>
                  Kategori: <span className="font-semibold text-white">{row.category}</span>
                </div>
              )}
            </div>

            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tagList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E5484D]/15 text-[#FF8A8D] border border-[#E5484D]/35"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {row.scReason && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-white/60">Sebab (kenyataan SC):</div>
                <blockquote className="border-l-2 border-[#E5484D]/60 bg-[#060B1E]/70 px-3.5 py-2.5 rounded-r-lg text-xs sm:text-sm text-white/70 italic leading-relaxed">
                  {row.scReason}
                </blockquote>
              </div>
            )}

            {row.website && (
              <div className="text-xs sm:text-sm text-white/65 break-all">
                <span className="text-white/50">Laman yang dilaporkan: </span>
                <span className="font-mono text-white/80 select-all">{row.website}</span>
              </div>
            )}

            {row.note && <p className="text-white/70">{row.note}</p>}
          </div>
        )}

        {row.status !== 'Berdaftar' && row.status !== 'Senarai Amaran' && (
          <div className="space-y-2.5 text-sm leading-relaxed">
            <p className="font-bold text-white">
              Tiada dalam Senarai Amaran SC
            </p>
            {row.note && <p className="text-white/70">{row.note}</p>}
          </div>
        )}

        {/* Footer of every card */}
        {hasFooter && (
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
            {row.coingecko && <span>CoinGecko: {row.coingecko}</span>}
            {row.coingecko && row.source && <span>·</span>}
            {row.source && <span>Sumber: {row.source}</span>}
          </div>
        )}
      </div>
    );
  };

  // Determine where to place the collapsible clone box:
  // "show the registered card first, then one collapsible red box: ⚠ {n} klon palsu pernah menyamar sebagai nama ini"
  const lastRegisteredIndex = displayCards.reduce(
    (acc, card, idx) => (card.status === 'Berdaftar' ? idx : acc),
    -1
  );

  return (
    <section
      id="semak-platform"
      className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-8"
    >
      {/* Header + Search Container */}
      <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-10 space-y-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
            SEMAK SEBELUM DEPOSIT
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em]">
            Platform ni berdaftar dengan SC atau tak?
          </h2>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            Taip nama platform crypto. Kami semak dengan Senarai Amaran Pelabur SC dan senarai bursa berdaftar.
          </p>
        </div>

        {/* Large Search Input */}
        <div className="space-y-3.5">
          <div className="relative w-full">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Contoh: Binance, Luno, MEXC…"
              aria-label="Semak nama platform crypto"
              className="w-full min-h-[54px] pl-12 pr-12 py-3.5 rounded-2xl bg-[#060B1E] border border-white/15 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:border-[#5CF2C0] focus:ring-2 focus:ring-[#5CF2C0]/25 transition-all"
            />
            {queryInput && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Kosongkan carian"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_CHIPS.map((chip) => {
              const isSelected = queryInput.trim().toLowerCase() === chip.toLowerCase();
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0] font-semibold'
                      : 'bg-white/[0.04] text-white/75 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Updated & Source Line */}
          <div className="text-xs text-white/45">
            Data dikemas kini: {settings.updated} · Sumber: Suruhanjaya Sekuriti Malaysia (SC)
          </div>
        </div>
      </div>

      {/* Results / Loading / Error / Empty Area */}
      <div className="space-y-4">
        {loading ? (
          /* Loading Skeleton Shimmer */
          <div className="space-y-4" aria-busy="true" aria-label="Memuatkan data semakan">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-6 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="h-5 w-44 rounded bg-white/10" />
                  <div className="h-6 w-36 rounded-full bg-white/10" />
                </div>
                <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : fetchError !== null ? (
          /* Fetch Error State */
          <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 text-center space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm sm:text-base text-white/80 font-medium">
                Data tidak dapat dimuatkan. Sila semak terus di laman SC.
              </p>
              <p className="text-xs text-white/45 font-mono break-all">
                {fetchError}
              </p>
            </div>
            <div>
              <a
                href={settings.scCheckerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity"
              >
                <span>Semak di SC Investment Checker</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : !isSearchActive ? (
          /* Empty State (before typing) — 3 stat tiles */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 space-y-1">
              <div className="text-2xl sm:text-3xl font-bold text-[#5CF2C0] tracking-tight">
                {stats.registeredDisplay}
              </div>
              <div className="text-xs sm:text-sm text-white/60">
                Bursa berdaftar dengan SC
              </div>
            </div>

            <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 space-y-1">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.alertRowsCount}
              </div>
              <div className="text-xs sm:text-sm text-white/60">
                Platform dalam senarai amaran
              </div>
            </div>

            <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 space-y-1">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.totalRowsCount}
              </div>
              <div className="text-xs sm:text-sm text-white/60">
                Platform dalam pangkalan data
              </div>
            </div>
          </div>
        ) : displayCards.length === 0 ? (
          /* No Result State */
          <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Tiada rekod untuk &ldquo;{debouncedQuery.trim()}&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
                Platform ini tiada dalam pangkalan data kami. Ini TIDAK bermaksud ia selamat. Ia mungkin platform baru atau ejaan berbeza.
              </p>
            </div>

            <div>
              <a
                href={settings.scCheckerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity"
              >
                <span>Semak di SC Investment Checker</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#060B1E] border border-white/[0.06] space-y-2">
              <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E5484D] shrink-0" />
                <span>Tanda bahaya biasa:</span>
              </div>
              <ul className="space-y-1 text-xs sm:text-sm text-white/65 list-disc list-inside">
                <li>Janji pulangan tetap atau terlalu tinggi</li>
                <li>Diajak masuk melalui Telegram / WhatsApp</li>
                <li>Diminta deposit ke akaun bank peribadi</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Result Cards + Collapsible Clone Box if applicable */
          <div className="space-y-4">
            {displayCards.map((row, idx) => (
              <React.Fragment key={`wrap-${row.id || row.name}-${idx}`}>
                {renderResultCard(row, `res-${idx}`)}
                {idx === lastRegisteredIndex && cloneEntries.length > 0 && (
                  <div className="rounded-[20px] bg-[#E5484D]/10 border border-[#E5484D]/35 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setClonesExpanded((prev) => !prev)}
                      aria-expanded={clonesExpanded}
                      className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-[#E5484D]/15 transition-colors cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-[#FF8A8D]">
                        ⚠ {cloneEntries.length} klon palsu pernah menyamar sebagai nama ini
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#FF8A8D] shrink-0 transition-transform duration-200 ${
                          clonesExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {clonesExpanded && (
                      <div className="px-5 pb-5 pt-2 space-y-3 border-t border-[#E5484D]/25">
                        {cloneEntries.map((clone, cIdx) =>
                          renderResultCard(clone, `clone-${cIdx}`)
                        )}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer (always visible, bottom of section) */}
      <div className="pt-2 space-y-2 text-xs text-white/45 leading-relaxed">
        <p>
          Semakan ini adalah rujukan, disusun daripada senarai rasmi SC dan CoinGecko. Ia bukan nasihat kewangan atau undang-undang. Sentiasa sahkan di laman rasmi SC sebelum membuat sebarang deposit.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href={settings.scAlertListUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5CF2C0]/80 hover:text-[#5CF2C0] hover:underline transition-colors"
          >
            Senarai Amaran SC
          </a>
          <span className="text-white/20">·</span>
          <a
            href={settings.scRegisteredUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5CF2C0]/80 hover:text-[#5CF2C0] hover:underline transition-colors"
          >
            Senarai DAX berdaftar
          </a>
        </div>
      </div>
    </section>
  );
};
