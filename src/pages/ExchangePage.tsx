import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CONFIG, ExchangePlatformItem } from '../config';
import { Link, useRouter } from '../router';
import { 
  Search, 
  Check, 
  Copy, 
  ExternalLink, 
  MoreVertical, 
  Share2, 
  Play, 
  Zap, 
  AlertTriangle, 
  X, 
  ArrowRight,
  HelpCircle,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';

import PlatformCard from '../components/PlatformCard';

type CategoryFilterKey = 'Semua' | 'berdaftar' | 'antarabangsa' | 'bot' | 'copytrade' | 'perpdex' | 'terminal' | 'tools';
type SortOption = 'semua' | 'az' | 'ganjaran';

const CATEGORY_MAP: Record<
  Exclude<CategoryFilterKey, 'Semua'>,
  { num: string; label: string; sectionName: string; desc: string }
> = {
  berdaftar: {
    num: '01',
    label: 'Exchange Malaysia (Berlesen)',
    sectionName: 'EXCHANGE MALAYSIA (BERLESEN)',
    desc: 'Exchange berdaftar dengan Suruhanjaya Sekuriti Malaysia. Deposit dan keluar wang terus dalam RM. Paling sesuai untuk pemula.',
  },
  antarabangsa: {
    num: '02',
    label: 'Exchange Antarabangsa',
    sectionName: 'EXCHANGE ANTARABANGSA',
    desc: 'Pilihan Coin yang banyak dengan pelbagai fungsi trading. Sesuai untuk yang mempunyai asas trading atau yang berpengalaman.',
  },
  bot: {
    num: '03',
    label: 'Bot Trading',
    sectionName: 'BOT TRADING',
    desc: 'Automasikan trading dengan menggunakan Bot mengikut strategi',
  },
  copytrade: {
    num: '04',
    label: 'Copy Trade',
    sectionName: 'COPY TRADE',
    desc: 'Cari dan tiru posisi trader berpengalaman secara automatik',
  },
  perpdex: {
    num: '05',
    label: 'Perp DEX',
    sectionName: 'PERP DEX',
    desc: 'Trading Kontrak Crypto Perpetual terus di atas Blockchain tanpa perantara/broker. Hanya perlu gunakan wallet Kripto',
  },
  terminal: {
    num: '06',
    label: 'Terminal Trading',
    sectionName: 'TERMINAL TRADING',
    desc: 'Trading Crypto terus di atas Blockchain tanpa perantara/broker. Hanya perlu gunakan wallet Kripto',
  },
  tools: {
    num: '07',
    label: 'Tools',
    sectionName: 'TOOLS',
    desc: 'Perisian yang berkaitan dengan Trading Kripto',
  },
};

export const ExchangePage: React.FC = () => {
  const { navigate } = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterKey>('Semua');
  const [filterPemula, setFilterPemula] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('semua');

  // Mobile Filter Sheet State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active Menu / Dropdown per card
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Detail Modal (Cara Claim, Syarat, FAQ)
  const [activeModalPlatform, setActiveModalPlatform] = useState<ExchangePlatformItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        toolbarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close card 3-dot menus on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      Semua: CONFIG.platforms.length,
      berdaftar: CONFIG.platforms.filter((p) => p.category === 'berdaftar').length,
      antarabangsa: CONFIG.platforms.filter((p) => p.category === 'antarabangsa').length,
      bot: CONFIG.platforms.filter((p) => p.category === 'bot').length,
      copytrade: CONFIG.platforms.filter((p) => p.category === 'copytrade').length,
      perpdex: CONFIG.platforms.filter((p) => p.category === 'perpdex').length,
      terminal: CONFIG.platforms.filter((p) => p.category === 'terminal').length,
      tools: CONFIG.platforms.filter((p) => p.category === 'tools').length,
    };
  }, []);

  // Filtered & Sorted Platforms
  const filteredPlatforms = useMemo(() => {
    return CONFIG.platforms.filter((p) => {
      // 1. Search query (name, category label, description, reward)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const catInfo = CATEGORY_MAP[p.category];
        const match =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (catInfo && catInfo.label.toLowerCase().includes(q)) ||
          (catInfo && catInfo.sectionName.toLowerCase().includes(q)) ||
          (p.reward && p.reward.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Category Chip
      if (selectedCategory !== 'Semua' && p.category !== selectedCategory) {
        return false;
      }

      // 3. Toggle Sesuai Pemula
      if (filterPemula && p.level !== 'pemula') {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'ganjaran') {
        const aHasReward = Boolean(a.reward);
        const bHasReward = Boolean(b.reward);
        if (aHasReward && !bHasReward) return -1;
        if (!aHasReward && bHasReward) return 1;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'az') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, filterPemula, sortBy]);

  // Copy referral code
  const handleCopyCode = (code: string) => {
    if (!code) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast('Kod disalin!');
    }
  };

  // Copy link from 3-dot menu
  const handleCopyLink = (p: ExchangePlatformItem) => {
    const link = p.affiliateLink || (CONFIG.exchanges as Record<string, string>)[p.id] || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      showToast('Pautan disalin!');
    }
    setActiveMenuId(null);
  };

  // Share
  const handleShare = async (p: ExchangePlatformItem) => {
    const link = p.affiliateLink || (CONFIG.exchanges as Record<string, string>)[p.id] || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Daftar ${p.name} - Bicara Krypto`,
          text: `Daftar ${p.name} dengan rujukan Bicara Krypto:`,
          url: link,
        });
      } catch {
        handleCopyLink(p);
      }
    } else {
      handleCopyLink(p);
    }
    setActiveMenuId(null);
  };

  // Banner 1 action: filter berlesen Malaysia and scroll to toolbar
  const handleBannerPemula = () => {
    setSelectedCategory('berdaftar');
    setFilterPemula(false);
    setSearchQuery('');
    toolbarRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset filters
  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setFilterPemula(false);
    setSortBy('semua');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'Semua' ||
    filterPemula ||
    sortBy !== 'semua';

  // Grouping for "Semua" mode (when no search and no extra level toggles)
  const isDefaultGroupedMode =
    selectedCategory === 'Semua' &&
    searchQuery.trim() === '' &&
    !filterPemula &&
    sortBy === 'semua';

  const categoryOrder: Array<Exclude<CategoryFilterKey, 'Semua'>> = [
    'berdaftar',
    'antarabangsa',
    'bot',
    'copytrade',
    'perpdex',
    'terminal',
    'tools',
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-28 pt-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#0B1430] border border-[#5CF2C0]/50 text-white font-medium text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-[#5CF2C0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================== */}
      {/* A. PAGE HEADER */}
      {/* ================================================== */}
      <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-center pt-2 pb-1">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.02em] leading-tight">
          Direktori Platform & Exchange Kripto
        </h1>
      </section>

      {/* ================================================== */}
      {/* B. TWO FEATURED BANNER CARDS (side by side, long.xyz style) */}
      {/* ================================================== */}
      <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Banner 1 */}
          <div className="relative rounded-[20px] bg-gradient-to-br from-[#082220] via-[#0B1630] to-[#0B1430] border border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-lg group">
            <div className="relative z-10 space-y-3 max-w-md">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
                BARU NAK MULA?
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em] leading-snug">
                Mula dengan platform berlesen di Malaysia.
              </h2>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Deposit terus Ringgit Malaysia melalui akaun bank tempatan secara selamat dan diiktiraf SC.
              </p>
            </div>

            <div className="relative z-10 pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBannerPemula}
                className="px-5 py-2.5 rounded-full bg-white text-[#060B1E] font-semibold text-xs hover:bg-white/90 transition-all cursor-pointer shadow-sm"
              >
                Lihat platform →
              </button>

              {/* 3 Overlapping round logo placeholders: Luno, HATA, Bybit */}
              <div className="flex items-center -space-x-2.5">
                <div
                  className="w-9 h-9 rounded-full border-2 border-[#0B1430] flex items-center justify-center p-1.5 shadow overflow-hidden bg-white"
                  title="Luno"
                >
                  <img
                    src="https://lh3.googleusercontent.com/d/1ULvTumhsUJduuX3U7fVJaDrwfmK4evoI"
                    alt="Luno"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div
                  className="w-9 h-9 rounded-full border-2 border-[#0B1430] flex items-center justify-center shadow overflow-hidden"
                  style={{ backgroundColor: '#2F5FE8' }}
                  title="HATA"
                >
                  <img
                    src="https://lh3.googleusercontent.com/d/1Pi5zw2Nei8OYfVK4kGG9nZQ5MF5NuHx1"
                    alt="HATA"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="w-9 h-9 rounded-full border-2 border-[#0B1430] flex items-center justify-center p-1.5 shadow overflow-hidden bg-white"
                  title="Bybit"
                >
                  <img
                    src="https://lh3.googleusercontent.com/d/1c_lDg-rckRYX0BcqhlaVhPjGcQ86Z97G"
                    alt="Bybit"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Subtle glow circle */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#5CF2C0]/5 pointer-events-none blur-2xl" />
          </div>

          {/* Banner 2 */}
          <div className="relative rounded-[20px] bg-gradient-to-br from-[#121B3D] via-[#0B1430] to-[#080E24] border border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-lg group">
            <div className="relative z-10 space-y-3 max-w-md">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em] leading-snug">
                Nak trade dengan betul dan santai?
              </h2>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Belajar Trading secara santai tapi profit walaupun sibuk dengan kerja hakiki atau perniagaan
              </p>
            </div>

            <div className="relative z-10 pt-6 flex items-center justify-between">
              <Link
                to="/kelas/kita"
                className="px-5 py-2.5 rounded-full bg-white text-[#060B1E] font-semibold text-xs hover:bg-white/90 transition-all shadow-sm"
              >
                Sertai KITA →
              </Link>
            </div>

            {/* Large faded outline chart/candlestick graphic on the right */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none text-white flex items-end gap-1.5 h-28">
              <div className="w-2.5 h-14 bg-white/40 rounded-sm relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-white" />
              </div>
              <div className="w-2.5 h-20 bg-white/60 rounded-sm relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-28 bg-white" />
              </div>
              <div className="w-2.5 h-10 bg-white/30 rounded-sm relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[1px] h-16 bg-white" />
              </div>
              <div className="w-2.5 h-24 bg-white/80 rounded-sm relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* C. TOOLBAR (Sticky, pill-shaped controls) */}
      {/* ================================================== */}
      <section
        ref={toolbarRef}
        id="platform-toolbar"
        className="sticky top-20 z-30 w-full bg-[#060B1E]/95 backdrop-blur-md border-y border-white/[0.08] py-4 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-[1280px] w-full mx-auto space-y-3.5">
          {/* Top row: Pill search bar + Toggles + Sort */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Pill Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari: luno, binance, ETF, DEX, bot..."
                className="w-full pl-11 pr-14 py-2.5 rounded-full bg-[#0B1430] border border-white/[0.08] text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#5CF2C0] transition-colors"
              />
              {/* Keyboard Shortcut Hint / Clear button */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-white/40 bg-white/[0.06] border border-white/10">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Right side controls: Toggles + Segmented Sort */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {/* Toggle: Sesuai Pemula */}
              <button
                type="button"
                onClick={() => setFilterPemula(!filterPemula)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  filterPemula
                    ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0]'
                    : 'bg-[#0B1430] text-white/70 border-white/[0.08] hover:border-white/20 hover:text-white'
                }`}
              >
                Sesuai Pemula
              </button>

              {/* Segmented Pill Sort Control */}
              <div className="flex items-center p-0.5 rounded-full bg-[#0B1430] border border-white/[0.08] text-xs">
                {(
                  [
                    { key: 'semua', label: 'Semua' },
                    { key: 'az', label: 'A–Z' },
                    { key: 'ganjaran', label: 'Ganjaran' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortBy(opt.key)}
                    className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-medium ${
                      sortBy === opt.key
                        ? 'bg-white text-[#060B1E]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row: Category Chips with auto-calculated counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('Semua')}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer font-medium border ${
                selectedCategory === 'Semua'
                  ? 'bg-white text-[#060B1E] border-white'
                  : 'bg-[#0B1430] text-white/60 border-white/[0.08] hover:border-white/20 hover:text-white'
              }`}
            >
              Semua ({categoryCounts.Semua})
            </button>

            {categoryOrder.map((catKey) => {
              const info = CATEGORY_MAP[catKey];
              const count = categoryCounts[catKey] || 0;
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer font-medium border ${
                    isSelected
                      ? 'bg-white text-[#060B1E] border-white'
                      : 'bg-[#0B1430] text-white/60 border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Small status line under toolbar */}
          <div className="flex items-center justify-between text-xs text-white/50 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#5CF2C0]">◆</span>
              <span>
                {filteredPlatforms.length} / {CONFIG.platforms.length} platform
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[#5CF2C0] hover:underline cursor-pointer"
              >
                Reset penapis
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* D. CATEGORY SECTIONS / PLATFORM GRID (3 columns desktop, gap 24px, max-w-[1280px]) */}
      {/* ================================================== */}
      <section id="platform-list" className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {filteredPlatforms.length === 0 ? (
          <div className="p-12 rounded-[20px] bg-[#0B1430] border border-white/[0.08] text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-white/30 mx-auto" />
            <h3 className="text-base font-semibold text-white">
              Tiada platform dijumpai
            </h3>
            <p className="text-xs text-white/60">
              Tiada padanan platform untuk carian atau penapis yang dipilih.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-[#5CF2C0] text-[#060B1E] text-xs font-semibold cursor-pointer"
            >
              Reset semua penapis
            </button>
          </div>
        ) : isDefaultGroupedMode ? (
          // Grouped by Category (dausdk style)
          <div className="space-y-16">
            {categoryOrder.map((catKey) => {
              const catInfo = CATEGORY_MAP[catKey];
              const groupItems = filteredPlatforms.filter((p) => p.category === catKey);
              if (groupItems.length === 0) return null;

              return (
                <div key={catKey} className="space-y-6">
                  {/* Category Header (dausdk style) */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-white/[0.08] pb-4">
                    <div>
                      <div className="text-[11px] font-semibold text-[#5CF2C0] uppercase tracking-[0.08em]">
                        — KATEGORI {catInfo.num}
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-[-0.02em] mt-0.5">
                        {catInfo.label}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-white/60 max-w-md leading-relaxed md:text-right">
                      {catInfo.desc}
                    </p>
                  </div>

                  {/* pc-grid */}
                  <div className="pc-grid">
                    {groupItems.map((platform) => (
                      <PlatformCard
                        key={platform.id}
                        id={platform.id}
                        name={platform.name}
                        categoryLabel={catInfo.sectionName}
                        level={platform.level}
                        brandColor={platform.brandColor}
                        reward={platform.reward}
                        description={platform.description}
                        conditions={platform.conditions}
                        code={platform.code}
                        affiliateLink={platform.affiliateLink || (CONFIG.exchanges as Record<string, string>)[platform.id] || '#'}
                        iconColor={platform.iconColor}
                        iconWhite={platform.iconWhite}
                        avatarStyle={platform.avatarStyle}
                        featured={platform.id === 'luno' || platform.featured}
                        onOpenDetails={() => setActiveModalPlatform(platform)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Flat Filtered / Searched Grid
          <div className="space-y-6">
            {selectedCategory !== 'Semua' && (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="text-[11px] font-semibold text-[#5CF2C0] uppercase tracking-[0.08em]">
                    — KATEGORI {CATEGORY_MAP[selectedCategory].num}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-[-0.02em] mt-0.5">
                    {CATEGORY_MAP[selectedCategory].label}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-white/60 max-w-md leading-relaxed md:text-right">
                  {CATEGORY_MAP[selectedCategory].desc}
                </p>
              </div>
            )}

            <div className="pc-grid">
              {filteredPlatforms.map((platform) => {
                const catInfo = CATEGORY_MAP[platform.category];
                return (
                  <PlatformCard
                    key={platform.id}
                    id={platform.id}
                    name={platform.name}
                    categoryLabel={catInfo?.sectionName || platform.category.toUpperCase()}
                    level={platform.level}
                    brandColor={platform.brandColor}
                    reward={platform.reward}
                    description={platform.description}
                    conditions={platform.conditions}
                    code={platform.code}
                    affiliateLink={platform.affiliateLink || (CONFIG.exchanges as Record<string, string>)[platform.id] || '#'}
                    iconColor={platform.iconColor}
                    iconWhite={platform.iconWhite}
                    avatarStyle={platform.avatarStyle}
                    featured={platform.id === 'luno' || platform.featured}
                    onOpenDetails={() => setActiveModalPlatform(platform)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ================================================== */}
      {/* F. CTA BAND (bottom - two dark cards side by side) */}
      {/* ================================================== */}
      <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="p-8 sm:p-10 rounded-[20px] bg-[#0B1430] border border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-medium">
                Pendidikan Asas Pelaburan
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
                Baru bermula? Belajar asas dalam CAB.
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Kuasai cara memilih koin berpotensi tinggi, membaca tokenomik projek dan mengurus wallet sendiri tanpa risiko scam.
              </p>
            </div>
            <div>
              <Link
                to="/kelas/cab"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity"
              >
                <span>Sertai CAB</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 sm:p-10 rounded-[20px] bg-[#0B1430] border border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-medium">
                Masterclass Analisis Teknikal
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
                Nak trading? Kuasai teknikal dalam KITA.
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Pelajari kaedah entry & exit tepat menggunakan indikator terbukti, membaca kitaran pasaran dan kawalan psikologi profesional.
              </p>
            </div>
            <div>
              <Link
                to="/kelas/kita"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity"
              >
                <span>Sertai KITA</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* G. RISK & DISCLOSURE */}
      {/* ================================================== */}
      <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Risk Box */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#0B1430] border border-red-500/20 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            Trading Kripto adalah aktiviti yang berisiko. Jangan guna wang yang anda tidak mampu hilang. Platform yang tidak berlesen di Malaysia tidak dilindungi oleh undang-undang sekuriti Malaysia.
          </p>
        </div>

        {/* Small Affiliate Text */}
        <p className="text-center text-xs text-white/40 max-w-xl mx-auto leading-relaxed">
          Sesetengah pautan adalah pautan affiliate. Bicara Krypto mungkin menerima komisen tanpa kos tambahan kepada anda. Senarai ini bukan nasihat kewangan.
        </p>
      </section>

      {/* ================================================== */}
      {/* I. MOBILE FLOATING BOTTOM BAR (long.xyz style) */}
      {/* ================================================== */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 max-w-sm mx-auto">
        <div className="bg-[#0B1430]/90 backdrop-blur-md border border-white/[0.12] rounded-full shadow-2xl px-6 py-2.5 flex items-center justify-around gap-6">
          {/* Cari */}
          <button
            type="button"
            onClick={() => {
              searchInputRef.current?.focus();
              toolbarRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px] font-medium">Cari</span>
          </button>

          {/* Penapis */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-medium">Penapis</span>
          </button>

          {/* Kelas */}
          <Link
            to="/#kelas"
            className="flex flex-col items-center gap-0.5 text-[#5CF2C0] hover:text-[#5CF2C0]/90 transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[10px] font-medium">Kelas</span>
          </Link>
        </div>
      </div>

      {/* Mobile Filter Sheet Modal */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[#0B1430] border-t sm:border border-white/[0.12] rounded-t-2xl sm:rounded-2xl p-6 space-y-5 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-base font-semibold text-white">
                Penapis Platform
              </h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 mb-2 font-medium">
                  Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('Semua')}
                    className={`p-2 rounded-lg border text-left ${
                      selectedCategory === 'Semua'
                        ? 'bg-white text-[#060B1E] border-white font-semibold'
                        : 'bg-[#060B1E] text-white/70 border-white/[0.08]'
                    }`}
                  >
                    Semua ({categoryCounts.Semua})
                  </button>
                  {categoryOrder.map((catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      className={`p-2 rounded-lg border text-left truncate ${
                        selectedCategory === catKey
                          ? 'bg-white text-[#060B1E] border-white font-semibold'
                          : 'bg-[#060B1E] text-white/70 border-white/[0.08]'
                      }`}
                    >
                      {CATEGORY_MAP[catKey].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <label className="block text-white/60 font-medium">
                  Pilihan Pantas
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterPemula(!filterPemula)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between ${
                      filterPemula
                        ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0] font-semibold'
                        : 'bg-[#060B1E] text-white/70 border-white/[0.08]'
                    }`}
                  >
                    <span>Sesuai untuk Pemula</span>
                    {filterPemula && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-white/60 hover:text-white cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold cursor-pointer"
                >
                  Guna Penapis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal: Cara Claim · Syarat · FAQ */}
      {activeModalPlatform && (
        <PlatformDetailModal
          platform={activeModalPlatform}
          onClose={() => setActiveModalPlatform(null)}
          onCopyCode={handleCopyCode}
        />
      )}
    </div>
  );
};

/* ================================================== */
/* DETAIL MODAL: Cara Claim · Syarat · FAQ */
/* ================================================== */
interface PlatformDetailModalProps {
  platform: ExchangePlatformItem;
  onClose: () => void;
  onCopyCode: (code: string) => void;
}

const PlatformDetailModal: React.FC<PlatformDetailModalProps> = ({
  platform,
  onClose,
  onCopyCode,
}) => {
  const [activeTab, setActiveTab] = useState<'claim' | 'syarat' | 'faq'>('claim');

  const targetLink =
    platform.affiliateLink || (CONFIG.exchanges as Record<string, string>)[platform.id] || '#';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-[#060B1E] text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full border border-white/10 ${platform.avatarStyle === 'tile' ? 'p-0 overflow-hidden' : 'p-2 bg-white'} flex items-center justify-center shrink-0 shadow-inner`}
            style={{
              boxShadow: `0 0 16px ${platform.brandColor}25`,
            }}
          >
            <img
              src={platform.iconColor}
              alt={platform.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.retried) {
                  img.dataset.retried = '1';
                  img.src = img.src.replace('https://googleusercontent.com', 'https://lh3.googleusercontent.com').replace(/\/$/, '');
                } else {
                  img.style.display = 'none';
                }
              }}
              className={`w-full h-full ${platform.avatarStyle === 'tile' ? 'object-cover' : 'object-contain'}`}
            />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-white/50 font-medium">
              Panduan & Soalan Lazim
            </div>
            <h3 className="text-xl font-bold text-white tracking-[-0.02em]">
              {platform.name}
            </h3>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('claim')}
            className={`pb-1.5 font-medium transition-colors cursor-pointer ${
              activeTab === 'claim'
                ? 'border-b-2 border-[#5CF2C0] text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Cara Claim
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('syarat')}
            className={`pb-1.5 font-medium transition-colors cursor-pointer ${
              activeTab === 'syarat'
                ? 'border-b-2 border-[#5CF2C0] text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Syarat & Terma
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`pb-1.5 font-medium transition-colors cursor-pointer ${
              activeTab === 'faq'
                ? 'border-b-2 border-[#5CF2C0] text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            FAQ
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 text-xs text-white/70 leading-relaxed min-h-[140px]">
          {activeTab === 'claim' && (
            <div className="space-y-3">
              {platform.claimSteps && platform.claimSteps.length > 0 ? (
                <ol className="space-y-2 list-decimal list-inside text-white/80">
                  {platform.claimSteps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.06] space-y-2">
                  <p className="font-semibold text-white">Langkah Permulaan:</p>
                  <ol className="space-y-1.5 list-decimal list-inside text-white/70">
                    <li>Tekan butang pendaftaran rasmi di bawah.</li>
                    <li>
                      {platform.code ? `Gunakan kod rujukan ${platform.code} semasa mendaftar.` : 'Lengkapkan pendaftaran akaun melalui pautan rasmi.'}
                    </li>
                    <li>Selesaikan pengesahan identiti (KYC) jika diperlukan.</li>
                    <li>Deposit atau mulakan dagangan pertama mengikut terma promosi.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'syarat' && (
            <div className="space-y-3">
              {platform.terms && platform.terms.length > 0 ? (
                <ul className="space-y-2 list-disc list-inside text-white/80">
                  {platform.terms.map((t, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.06] space-y-1.5">
                  <p className="font-semibold text-white">Terma Umum:</p>
                  <p>
                    Ganjaran dan promosi tertakluk kepada budi bicara pihak {platform.name}. Syarat kelayakan mungkin memerlukan deposit minimum atau volum dagangan tertentu dalam tempoh terhad. Sila rujuk laman terma rasmi platform sebelum membuat transaksi.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              {platform.faq && platform.faq.length > 0 ? (
                platform.faq.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#060B1E] border border-white/[0.06] space-y-1">
                    <p className="font-semibold text-white">{item.q}</p>
                    <p className="text-white/60">{item.a}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.06] space-y-1.5">
                  <p className="font-semibold text-white">Soalan Lazim:</p>
                  <p className="text-white/60">
                    Ada pertanyaan lanjut mengenai pendaftaran {platform.name}? Anda boleh bertanyakan terus dalam komuniti Telegram Bicara Krypto atau hubungi sokongan teknikal platform.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code & CTA button */}
        <div className="pt-2 border-t border-white/[0.08] space-y-3">
          {platform.code && (
            <div
              onClick={() => platform.code && onCopyCode(platform.code)}
              className="p-3 rounded-[12px] bg-[#060B1E] border border-white/[0.08] flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors"
            >
              <div>
                <span className="text-[10px] text-white/40 block">KOD RUJUKAN:</span>
                <span className="font-mono text-sm font-bold text-white">{platform.code}</span>
              </div>
              <span className="text-xs font-semibold text-[#5CF2C0]">⧉ SALIN KOD</span>
            </div>
          )}

          <a
            href={targetLink}
            target="_blank"
            rel="sponsored noopener"
            className="w-full h-[48px] rounded-full bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
          >
            <span>Buka Laman Rasmi {platform.name}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
