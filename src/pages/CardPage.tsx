import React, { useState, useMemo, useEffect } from 'react';
import { CARDS, CryptoCardItem } from '../config';
import { Link } from '../router';
import { BankCardVisual } from '../components/BankCardVisual';
import { CardDetailModal } from '../components/CardDetailModal';
import { 
  Search, 
  X, 
  RotateCcw, 
  ArrowRight, 
  CreditCard,
  Check
} from 'lucide-react';

export const CardPage: React.FC = () => {
  // Dynamic page title & meta description
  useEffect(() => {
    document.title = 'Kad Kripto - Bicara Krypto';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Pilihan kad kripto Visa & Mastercard yang dipautkan kepada akaun kripto anda untuk berbelanja terus daripada wallet dan exchange.'
      );
    }
  }, []);
  // If there are 6 or more cards, show toolbar automatically
  const showToolbar = CARDS.length >= 6;

  // Filters State (active when showToolbar is true)
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<'Semua' | 'Visa' | 'Mastercard'>('Semua');
  const [filterMalaysia, setFilterMalaysia] = useState<boolean | null>(null);

  // Detail Modal State
  const [selectedCard, setSelectedCard] = useState<CryptoCardItem | null>(null);

  // Filter & Sort Logic
  const filteredCards = useMemo(() => {
    if (!showToolbar) {
      // Keep exact order: RedotPay first, Bybit second
      return CARDS;
    }

    return CARDS.filter((card) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        if (!card.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Network Filter
      if (networkFilter !== 'Semua') {
        if (!card.network || !card.network.includes(networkFilter)) {
          return false;
        }
      }

      // 3. Malaysia Filter
      if (filterMalaysia === true) {
        if (card.malaysia !== 'ya') {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [showToolbar, searchQuery, networkFilter, filterMalaysia]);

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    networkFilter !== 'Semua' ||
    filterMalaysia !== null;

  const resetFilters = () => {
    setSearchQuery('');
    setNetworkFilter('Semua');
    setFilterMalaysia(null);
  };

  return (
    <div className="space-y-16 pb-28">
      {/* ================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.02em] leading-tight">
          Direktori Kad Kripto
        </h1>
      </section>

      {/* ================================================== */}
      {/* 2. OPTIONAL TOOLBAR (Only shown if CARDS >= 6) */}
      {/* ================================================== */}
      {showToolbar && (
        <section className="sticky top-20 z-30 w-full bg-[#060B1E]/95 backdrop-blur-md border-y border-white/[0.08] py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kad..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-[#0B1430] border border-white/[0.08] text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#5CF2C0] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    aria-label="Padam carian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Rangkaian + Tersedia di Malaysia */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 bg-[#0B1430] border border-white/[0.08] rounded-lg px-3 py-2 text-xs">
                  <span className="text-white/50">Rangkaian:</span>
                  <select
                    value={networkFilter}
                    onChange={(e) => setNetworkFilter(e.target.value as any)}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Semua" className="bg-[#0B1430] text-white">Semua</option>
                    <option value="Visa" className="bg-[#0B1430] text-white">Visa</option>
                    <option value="Mastercard" className="bg-[#0B1430] text-white">Mastercard</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setFilterMalaysia(filterMalaysia === true ? null : true)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    filterMalaysia === true
                      ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0]'
                      : 'bg-[#0B1430] text-white/70 border-white/[0.08] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {filterMalaysia === true && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>Tersedia di Malaysia</span>
                </button>
              </div>
            </div>

            {/* Counts & Reset */}
            <div className="flex items-center justify-between text-xs text-white/60 pt-0.5">
              <div>
                {hasActiveFilters
                  ? `Memaparkan ${filteredCards.length} kad daripada ${CARDS.length}`
                  : `Memaparkan semua ${CARDS.length} kad`}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[#5CF2C0] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset penapis</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* 3. CARD GRID */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredCards.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#0B1430] border border-white/[0.08] text-center space-y-3">
            <CreditCard className="w-10 h-10 text-white/30 mx-auto" />
            <h3 className="text-base font-semibold text-white">
              Tiada kad dijumpai
            </h3>
            <p className="text-xs text-white/60">
              Tiada padanan kad untuk carian atau penapis yang dipilih.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-[#5CF2C0] text-[#060B1E] text-xs font-semibold cursor-pointer"
            >
              Reset semua penapis
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* When 2 cards: side by side on desktop (centred, max-width 900px), stacked on mobile */}
            <div
              className={
                filteredCards.length <= 2
                  ? 'max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-9'
                  : 'max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8'
              }
            >
              {filteredCards.map((card) => {
                return (
                  <div key={card.id} className="flex flex-col group">
                    {/* Card Visual with 3 key stats: clicking anywhere opens company link (or popup if no link); clicking "+" opens popup */}
                    <BankCardVisual
                      card={card}
                      onOpenInfo={() => setSelectedCard(card)}
                      size={filteredCards.length <= 3 ? 'large' : 'normal'}
                    />

                    {/* Card Caption Row */}
                    <div className="mt-3 flex items-center justify-between px-1 text-xs text-white/50">
                      <div className="flex items-center gap-2">
                        {card.logoUrl && (
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-white p-0.5 shrink-0 border border-white/20 flex items-center justify-center">
                            <img
                              src={card.logoFallbackUrl || card.logoUrl}
                              alt={card.name}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <span className="font-semibold text-white text-sm">{card.name}</span>
                        {card.network && (
                          <span className="text-[11px] text-white/50">· {card.network}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCard(card)}
                        className="text-[#5CF2C0] hover:underline font-medium shrink-0 cursor-pointer flex items-center gap-1 py-1 px-2 rounded-md hover:bg-[#5CF2C0]/10 transition-colors"
                        title={`Maklumat lengkap ${card.name}`}
                      >
                        <span>Info</span>
                        <span className="text-sm font-bold leading-none">+</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Small line under cards */}
            <p className="text-center text-xs text-white/45 pt-3">
              Lebih banyak kad akan ditambah tidak lama lagi.
            </p>
          </div>
        )}
      </section>

      {/* ================================================== */}
      {/* 4. DETAIL MODAL (Spec Sheet Table Popup) */}
      {/* ================================================== */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* ================================================== */}
      {/* 5. EDUCATION SECTION (below the grid) */}
      {/* ================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-8 sm:p-10 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-4">
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
            Pengenalan
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em]">
            Apa itu kad kripto?
          </h2>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed">
            Kad Visa atau Mastercard yang dipautkan kepada akaun kripto anda. Bila anda membuat bayaran, kripto atau stablecoin (seperti USDT) dalam akaun anda ditukar secara automatik kepada mata wang tempatan. Anda boleh berbelanja di kedai, laman web dan mesin ATM yang menerima Visa atau Mastercard, sama seperti kad bank biasa.
          </p>

          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <p className="text-sm font-semibold text-white">
              Ada dua jenis utama:
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-white/40 mt-0.5">•</span>
                <span>
                  <strong className="text-white font-medium">Kad debit</strong> – bayaran dibuat terus daripada baki kripto anda.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/40 mt-0.5">•</span>
                <span>
                  <strong className="text-white font-medium">Kad prabayar</strong> – anda top up baki terlebih dahulu, kemudian berbelanja menggunakan baki tersebut.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 6. CTA BAND */}
      {/* ================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-xl bg-[#0B1430] border border-white/[0.08] text-center space-y-4">
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
            Langkah Bijak
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em]">
            Nak faham crypto dengan betul sebelum guna kad kripto?
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
            Pelajari asas fundamental, pemilihan stablecoin selamat, dan pengurusan wallet yang betul dalam Crypto Alpha Bootcamp.
          </p>
          <div className="pt-2">
            <Link
              to="/kelas/cab"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm hover:opacity-95 transition-all shadow-md"
            >
              <span>Sertai CAB</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* DISCLOSURE (small text) */}
        <p className="text-center text-xs text-white/40 mt-6 max-w-xl mx-auto">
          Sesetengah pautan adalah pautan affiliate. Bicara Krypto mungkin menerima komisen tanpa kos tambahan kepada anda. Senarai ini bukan nasihat kewangan.
        </p>
      </section>
    </div>
  );
};
