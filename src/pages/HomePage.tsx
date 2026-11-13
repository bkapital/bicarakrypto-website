import React, { useState, useMemo, useEffect } from 'react';
import { 
  CONFIG, 
  ProductItem, 
  TUAN_ASYRAF_PHOTO_URL, 
  TUAN_ASYRAF_PHOTO_FALLBACK, 
  TUAN_ASYRAF_LOCAL_PHOTO 
} from '../config';
import { Link, useRouter } from '../router';
import { ClassPoster } from '../components/ClassPoster';
import { WaitlistModal } from '../components/WaitlistModal';
import { 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Star, 
  ExternalLink, 
  User,
  X,
  Check
} from 'lucide-react';

const getGoogleDriveFallback = (url: string) => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
};

const CANDLE_DATA = [
  { high: 30, low: 220, open: 80, close: 170, isMint: false },
  { high: 70, low: 260, open: 160, close: 100, isMint: true },
  { high: 50, low: 200, open: 110, close: 180, isMint: false },
  { high: 100, low: 290, open: 190, close: 120, isMint: true },
  { high: 80, low: 240, open: 130, close: 90, isMint: true },
  { high: 60, low: 210, open: 90, close: 160, isMint: false },
  { high: 110, low: 270, open: 170, close: 110, isMint: true },
  { high: 70, low: 230, open: 120, close: 70, isMint: true },
  { high: 40, low: 190, open: 70, close: 140, isMint: false },
  { high: 90, low: 250, open: 150, close: 190, isMint: false },
  { high: 120, low: 280, open: 190, close: 130, isMint: true },
  { high: 80, low: 230, open: 140, close: 90, isMint: true },
  { high: 60, low: 200, open: 100, close: 160, isMint: false },
  { high: 100, low: 260, open: 160, close: 110, isMint: true },
  { high: 70, low: 220, open: 110, close: 60, isMint: true },
  { high: 30, low: 180, open: 70, close: 130, isMint: false },
  { high: 80, low: 240, open: 140, close: 80, isMint: true },
  { high: 60, low: 210, open: 90, close: 150, isMint: false },
  { high: 110, low: 270, open: 160, close: 100, isMint: true },
  { high: 70, low: 230, open: 110, close: 70, isMint: true },
  { high: 40, low: 190, open: 70, close: 130, isMint: false },
  { high: 90, low: 250, open: 140, close: 190, isMint: false },
  { high: 130, low: 300, open: 200, close: 140, isMint: true },
  { high: 100, low: 260, open: 150, close: 100, isMint: true },
  { high: 70, low: 220, open: 110, close: 60, isMint: true },
  { high: 40, low: 180, open: 70, close: 140, isMint: false },
  { high: 90, low: 240, open: 150, close: 90, isMint: true },
  { high: 60, low: 210, open: 100, close: 160, isMint: false },
  { high: 110, low: 280, open: 170, close: 110, isMint: true },
  { high: 80, low: 230, open: 120, close: 70, isMint: true },
];

const CandlestickTrack: React.FC = () => {
  const candleWidth = 12;
  const candleGap = 42;
  const totalCandles = CANDLE_DATA.length;
  const trackWidth = totalCandles * candleGap;

  return (
    <svg
      width={trackWidth}
      height="340"
      viewBox={`0 0 ${trackWidth} 340`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d={CANDLE_DATA.map((c, i) => `${i === 0 ? 'M' : 'L'} ${i * candleGap + candleWidth / 2} ${(c.high + c.low) / 2}`).join(' ')}
        stroke="#5CF2C0"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        strokeDasharray="4 4"
        fill="none"
      />
      {CANDLE_DATA.map((c, i) => {
        const x = i * candleGap;
        const wickX = x + candleWidth / 2;
        const topY = Math.min(c.open, c.close);
        const bodyHeight = Math.max(Math.abs(c.close - c.open), 8);
        const strokeColor = c.isMint ? '#5CF2C0' : 'rgba(255, 255, 255, 0.3)';
        const fillColor = c.isMint ? 'rgba(92, 242, 192, 0.85)' : 'rgba(255, 255, 255, 0.15)';

        return (
          <g key={i}>
            <line
              x1={wickX}
              y1={c.high}
              x2={wickX}
              y2={c.low}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeOpacity={c.isMint ? '0.7' : '0.4'}
            />
            <rect
              x={x}
              y={topY}
              width={candleWidth}
              height={bodyHeight}
              rx="1.5"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  // Category Filter in Poster Grid
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Live Zoom' | 'Coaching'>('Semua');

  // Waitlist Modal State
  const [waitlistProduct, setWaitlistProduct] = useState<ProductItem | null>(null);

  // Masalah Section Tab ("Saya nak melabur" vs "Saya nak trade")
  const [masalahTab, setMasalahTab] = useState<'melabur' | 'trade'>('melabur');

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Gallery Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Close lightbox on Escape, navigate with Left / Right arrow keys
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % CONFIG.gallery.length : null));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + CONFIG.gallery.length) % CONFIG.gallery.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  const handleNextPhoto = () => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % CONFIG.gallery.length : null));
  };

  const handlePrevPhoto = () => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + CONFIG.gallery.length) % CONFIG.gallery.length : null));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    if (diff > minSwipeDistance) {
      handleNextPhoto();
    } else if (diff < -minSwipeDistance) {
      handlePrevPhoto();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Interactive Quiz state
  const [q1, setQ1] = useState<'Ya' | 'Belum' | null>(null);
  const [q2, setQ2] = useState<'Ya' | 'Belum' | null>(null);
  const [q3, setQ3] = useState<'Simpan jangka panjang' | 'Trading aktif' | 'Dua-dua' | null>(null);

  // Dynamic categories from unhidden products
  const availableCategories = useMemo(() => {
    const cats = Array.from(
      new Set(CONFIG.products.filter((p) => p.status !== 'hidden').map((p) => p.category))
    );
    return cats.length > 1 ? ['Semua', ...cats] : [];
  }, []);

  // Filtered Products (exclude status: "hidden")
  const displayedProducts = useMemo(() => {
    return CONFIG.products.filter((p) => {
      if (p.status === 'hidden') return false;
      if (activeCategory === 'Semua') return true;
      return p.category === activeCategory;
    });
  }, [activeCategory]);

  // Quiz Recommendation Calculation
  const recommendation = useMemo(() => {
    if (!q1 || !q2 || !q3) return null;

    if (q1 === 'Belum' || q2 === 'Belum') {
      const p = CONFIG.products.find((item) => item.id === 'cab') || CONFIG.products[1];
      return {
        product: p,
        reason: 'Mulakan dengan CAB. Kelas ini bermula dari asas, pemilihan coin berkualiti, tokenomik dan on-chain & keselamatan.',
        link: CONFIG.cab.link,
      };
    }

    if (q1 === 'Ya' && q2 === 'Ya' && q3 === 'Trading aktif') {
      const p = CONFIG.products.find((item) => item.id === 'kita') || CONFIG.products[2];
      return {
        product: p,
        reason: 'KITA paling sesuai untuk anda mengasah kemahiran analisis teknikal, membaca carta dengan yakin, dan mengurus risiko.',
        link: CONFIG.kita.link,
      };
    }

    if (q3 === 'Dua-dua') {
      const p = CONFIG.products.find((item) => item.id === 'combo') || CONFIG.products[0];
      return {
        product: p,
        reason: 'Pakej Combo adalah pilihan lengkap: kuasai fundamental pelaburan dan kemahiran trading aktif serentak dengan penjimatan RM99.',
        link: CONFIG.combo.link,
      };
    }

    // Default to CAB
    const p = CONFIG.products.find((item) => item.id === 'cab') || CONFIG.products[1];
    return {
      product: p,
      reason: 'CAB memfokuskan kepada analisis fundamental dan pemilihan projek bernilai tinggi untuk pelaburan pasif jangka panjang.',
      link: CONFIG.cab.link,
    };
  }, [q1, q2, q3]);

  const handleProductClick = (product: ProductItem) => {
    if (product.status === 'akanDatang') {
      setWaitlistProduct(product);
    } else {
      navigate(product.route);
    }
  };

  const scrollToClass = (classId: string) => {
    setActiveCategory('Semua');
    setTimeout(() => {
      const el = document.getElementById(`kelas-${classId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const sec = document.getElementById('kelas');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const faqItems = [
    {
      q: 'Saya baru dalam kripto, sesuai ke?',
      a: 'Sangat sesuai. Mulakan dengan CAB, yang bermula dari asas hingga strategi sebenar.',
    },
    {
      q: 'Apa beza CAB dan KITA?',
      a: 'CAB untuk pelaburan jangka panjang (pasif). KITA untuk trading aktif. Combo sesuai jika anda mahu kedua-duanya.',
    },
    {
      q: 'Kenapa CAB pertengahan bulan dan KITA hujung bulan?',
      a: 'Supaya anda faham asas dahulu melalui CAB, kemudian terus belajar trading dalam KITA dua minggu selepas itu.',
    },
    {
      q: 'Kelas dibuat di mana?',
      a: 'Live melalui Zoom. Anda boleh sertai dari mana-mana sahaja.',
    },
    {
      q: 'Saya tak dapat hadir live. Ada rakaman?',
      a: 'Ya, semua peserta akan dapat rakaman video untuk tontonan semula.',
    },
    {
      q: 'Bahasa pengajaran?',
      a: '100% Bahasa Melayu. Istilah kripto dikekalkan dalam English untuk ketepatan.',
    },
    {
      q: 'Berapa modal saya perlukan untuk mula?',
      a: 'Kelas ini fokus kepada ilmu dan strategi. Anda boleh mula dengan jumlah kecil yang anda mampu.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-28 pb-16">
      {/* ================================================== */}
      {/* A. HERO */}
      {/* ================================================== */}
      {/* ================================================== */}
      {/* A. HERO (Full width, ~85vh, rounded bottom corners, bold editorial) */}
      {/* ================================================== */}
      <section className="relative w-full bg-[#060B1E] rounded-b-3xl sm:rounded-b-[40px] border-b border-white/[0.08] overflow-hidden min-h-[80vh] lg:min-h-[85vh] flex flex-col justify-between pt-8 sm:pt-14 pb-10 sm:pb-14">
        {/* Background Candlestick Animation or CONFIG.heroImage */}
        {CONFIG.heroImage ? (
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <img
              src={CONFIG.heroImage}
              alt="Hero Background"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#060B1E]/85 backdrop-blur-[1px]" />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-20 flex items-center">
            <div className="animate-chart-drift flex">
              <CandlestickTrack />
              <CandlestickTrack />
            </div>
          </div>
        )}

        {/* Dark gradient from the left so the text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060B1E] via-[#060B1E]/95 md:via-[#060B1E]/85 to-transparent pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B1E] via-transparent to-[#060B1E]/40 pointer-events-none z-[1]" />

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-between relative z-10 space-y-10 sm:space-y-14">
          {/* Top & Middle Block */}
          <div className="space-y-6 sm:space-y-8 pt-4 sm:pt-6">
            {/* 2. Small pill above the headline */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs sm:text-sm text-white/80 font-medium tracking-wide">
                <span className="text-[#5CF2C0]">✱</span>
                <span>Kelas Crypto Live · Malaysia</span>
              </div>
            </div>

            {/* 3. Headline (very large, bold, tight line-height, up to 4 lines) */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[5.75rem] font-black text-white tracking-[-0.03em] leading-[1.05] sm:leading-[1.02] max-w-5xl">
              Penat belajar kripto sendiri tapi masih{' '}
              <span className="font-serif italic font-normal text-[#5CF2C0] tracking-normal">
                rugi?
              </span>
            </h1>

            {/* 4. Under headline, an outlined pill */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/[0.02] text-xs sm:text-sm text-white/80 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#5CF2C0] shadow-[0_0_8px_#5CF2C0]" />
                <span>Dikendalikan oleh</span>
                <span className="font-semibold text-[#5CF2C0]">HRD Corp Certified Trainer</span>
              </div>
            </div>
          </div>

          {/* 5. Bottom of the hero, two columns */}
          <div className="pt-8 sm:pt-12 border-t border-white/[0.08] flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
            {/* Left Column */}
            <div className="max-w-md">
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                Belajar dengan pelan, bukan ikut orang.
              </p>
            </div>

            {/* Right Column */}
            <div className="space-y-4 max-w-lg lg:text-right flex flex-col lg:items-end">
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Kelas live 2 hari melalui Zoom. Mula dari kosong pun boleh.
              </p>
              <div className="flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('kelas');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm hover:opacity-95 transition-all shadow-md min-h-[46px] flex items-center justify-center cursor-pointer"
                >
                  Lihat Kelas
                </button>
                <a
                  href={CONFIG.whatsappLink || CONFIG.brand.whatsappLink || 'https://wa.me/60103394725'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-lg border border-white/20 hover:border-[#5CF2C0] bg-white/[0.02] hover:bg-[#5CF2C0]/10 text-white hover:text-[#5CF2C0] font-semibold text-sm transition-all min-h-[46px] flex items-center justify-center"
                >
                  WhatsApp Kami
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* B. NEW "MASALAH" SECTION (directly after the hero) */}
      {/* ================================================== */}
      {/* ================================================== */}
      {/* B. NEW "MASALAH" SECTION (directly after the hero) */}
      {/* ================================================== */}
      <section id="masalah" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-8">
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
              CABARAN & PENYELESAIAN
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Kenal situasi ini?
            </h2>
          </div>

          {/* 1. Tab Switch: Pill Toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setMasalahTab('melabur')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                masalahTab === 'melabur'
                  ? 'bg-[#5CF2C0] text-[#060B1E] shadow-sm'
                  : 'border border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-white/[0.02]'
              }`}
            >
              Saya nak melabur
            </button>
            <button
              type="button"
              onClick={() => setMasalahTab('trade')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                masalahTab === 'trade'
                  ? 'bg-[#5CF2C0] text-[#060B1E] shadow-sm'
                  : 'border border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-white/[0.02]'
              }`}
            >
              Saya nak trade
            </button>
          </div>
        </div>

        {/* Tab Content with fade animation */}
        {masalahTab === 'melabur' ? (
          <div key="melabur" className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-fadeIn">
            {/* Left Card: Pelabur */}
            <div className="rounded-2xl bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                  SEBELUM: KESILAPAN BIASA PELABUR
                </div>
                <div className="space-y-3">
                  {[
                    'Beli crypto sebab ikut orang, tapi tak faham apa yang dibeli.',
                    'Tak tahu nak pilih coin yang mana.',
                    'Lepas beli, harga turun. Lepas jual, harga naik.',
                    'Portfolio jatuh teruk setiap kali pasaran crash.',
                    'Tak tahu nak semak projek tu betul atau scam.',
                    'Takut kena scam, tak tahu platform mana yang selamat.',
                    'Terlepas airdrop, atau buat banyak tugasan tapi tak dapat apa-apa.',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 text-white/80 text-sm sm:text-base leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-white/40" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Selepas CAB */}
            <div className="relative rounded-2xl bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl overflow-hidden">
              {/* Faint mint glow in top-right corner */}
              <div
                className="pointer-events-none absolute -top-16 -right-16 w-52 h-52 bg-[#5CF2C0]/10 rounded-full blur-3xl"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
                  SELEPAS CRYPTO ALPHA BOOTCAMP (CAB)
                </div>
                <div className="space-y-3">
                  {[
                    'Faham apa yang dibeli, tak perlu ikut orang',
                    'Tahu cara cari & nilai projek sendiri',
                    'Ada pelan DCA & bila nak ambil untung',
                    'Portfolio yang tahan bull & bear market',
                    'Boleh semak projek guna data onchain',
                    'Tahu platform selamat & cara jaga wallet',
                    'Tahu cara cari & layak untuk airdrop dengan selamat',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 text-white text-sm sm:text-base leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-[#5CF2C0]/10 border border-[#5CF2C0]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#5CF2C0]" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom: Chip + Mint Button */}
              <div className="relative z-10 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/20 bg-white/[0.02] text-white/80 text-xs font-medium">
                  Level 1 · Pemula
                </div>
                <button
                  type="button"
                  onClick={() => scrollToClass('cab')}
                  className="px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
                >
                  Lihat kelas CAB
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key="trade" className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-fadeIn">
            {/* Left Card: Trader */}
            <div className="rounded-2xl bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                  SEBELUM: KESILAPAN BIASA TRADER
                </div>
                <div className="space-y-3">
                  {[
                    'Masuk trade ikut perasaan dan FOMO.',
                    'Stop loss kena, lepas tu harga naik balik.',
                    'Satu trade rugi besar habiskan untung sebulan.',
                    'Tengok carta tapi tak tahu bila nak masuk.',
                    'Bila rugi, terus revenge trade.',
                    'Dah lama trade, tapi akaun tak membesar.',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 text-white/80 text-sm sm:text-base leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-white/40" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Selepas KITA */}
            <div className="relative rounded-2xl bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl overflow-hidden">
              {/* Faint mint glow in top-right corner */}
              <div
                className="pointer-events-none absolute -top-16 -right-16 w-52 h-52 bg-[#5CF2C0]/10 rounded-full blur-3xl"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
                  SELEPAS KITA
                </div>
                <div className="space-y-3">
                  {[
                    'Ada Trading Plan S-R-P sendiri',
                    'Faham perangkap market maker & cara elak',
                    'Saiz posisi & risk:reward yang betul',
                    'Baca carta guna 4 alat teras',
                    'Kawal emosi dengan rutin & trading journal',
                    'Framework untuk grow akaun secara konsisten',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 text-white text-sm sm:text-base leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-[#5CF2C0]/10 border border-[#5CF2C0]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#5CF2C0]" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom: Chip + Mint Button */}
              <div className="relative z-10 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/20 bg-white/[0.02] text-white/80 text-xs font-medium">
                  Level 2 · Trader
                </div>
                <button
                  type="button"
                  onClick={() => scrollToClass('kita')}
                  className="px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
                >
                  Lihat kelas KITA
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================================================== */}
      {/* C. CLASS CARDS GRID (id="kelas") */}
      {/* ================================================== */}
      <section id="kelas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-8">
        {/* Section Header: Sentence Case */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
              Pilih kelas anda
            </h2>
            <p className="text-sm text-white/60">
              Program mengikut tahap kemahiran anda.
            </p>
          </div>

          {/* Simple Text Tabs with Mint Underline on Active Tab */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-6 overflow-x-auto text-sm pt-2 sm:pt-0">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat as any)}
                  className={`pb-2 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium ${
                    activeCategory === cat
                      ? 'border-b-2 border-[#5CF2C0] text-white'
                      : 'text-white/50 hover:text-white border-b-2 border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Cards Grid: 3 columns desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
            <div key={product.id} id={`kelas-${product.id}`} className="scroll-mt-28">
              <ClassPoster
                product={product}
                onClick={() => handleProductClick(product)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ================================================== */}
      {/* GALLERY BENTO GRID SECTION ("DI SEBALIK TABIR") */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Scoped Desktop Grid Template Areas */}
        <style>{`
          @media (min-width: 1024px) {
            .bento-full-grid {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              grid-template-rows: repeat(5, 200px) !important;
              grid-template-areas:
                "F F a s1"
                "F F t b"
                "w w t c"
                "d s2 x x"
                "g h i i" !important;
            }
            .bento-area-F  { grid-area: F !important; }
            .bento-area-a  { grid-area: a !important; }
            .bento-area-t  { grid-area: t !important; }
            .bento-area-b  { grid-area: b !important; }
            .bento-area-w  { grid-area: w !important; }
            .bento-area-c  { grid-area: c !important; }
            .bento-area-d  { grid-area: d !important; }
            .bento-area-x  { grid-area: x !important; }
            .bento-area-g  { grid-area: g !important; }
            .bento-area-h  { grid-area: h !important; }
            .bento-area-i  { grid-area: i !important; }
            .bento-area-s1 { grid-area: s1 !important; }
            .bento-area-s2 { grid-area: s2 !important; }
          }
        `}</style>

        {/* Header */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
            DI SEBALIK TABIR
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-[-0.02em]">
            Bersama alumni & pemain industri
          </h2>
          <p className="text-sm text-white/60">
            500+ alumni di Kuala Lumpur, dan kehadiran di persidangan crypto hingga ke Dubai.
          </p>
        </div>

        {/* Bento Grid: Mobile (2 cols), Tablet (3 cols), Desktop (4 cols with grid-template-areas) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px] grid-flow-dense bento-full-grid">
          {/* F = gallery[0] (feature, 2×2 on desktop, full width on mobile/tablet) */}
          <div
            onClick={() => setLightboxIndex(0)}
            className="group col-span-2 md:col-span-3 row-span-2 bento-area-F rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[0]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[0]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* a = gallery[1] (1×1) */}
          <div
            onClick={() => setLightboxIndex(1)}
            className="group col-span-1 row-span-1 bento-area-a rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[1]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[1]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* s1 = stat tile "500+" / "alumni kelas CAB & KITA" (1×1) */}
          <div className="col-span-1 row-span-1 bento-area-s1 rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-6 flex flex-col justify-center relative overflow-hidden shadow-sm">
            <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 bg-[#5CF2C0]/10 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#5CF2C0] tracking-tight">
                500+
              </div>
              <div className="text-xs sm:text-sm text-white/60 font-medium leading-snug">
                alumni kelas CAB & KITA
              </div>
            </div>
          </div>

          {/* t = gallery[2] (tall, 1×2) */}
          <div
            onClick={() => setLightboxIndex(2)}
            className="group col-span-1 row-span-2 bento-area-t rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[2]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[2]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* b = gallery[3] (1×1) */}
          <div
            onClick={() => setLightboxIndex(3)}
            className="group col-span-1 row-span-1 bento-area-b rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[3]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[3]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* w = gallery[4] (wide, 2×1) */}
          <div
            onClick={() => setLightboxIndex(4)}
            className="group col-span-2 md:col-span-2 row-span-1 bento-area-w rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[4]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[4]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* c = gallery[5] (1×1) */}
          <div
            onClick={() => setLightboxIndex(5)}
            className="group col-span-1 row-span-1 bento-area-c rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[5]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[5]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* d = gallery[6] (1×1) */}
          <div
            onClick={() => setLightboxIndex(6)}
            className="group col-span-1 row-span-1 bento-area-d rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[6]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[6]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* s2 = stat tile "2018" / "kekal mengajar sejak" (1×1) */}
          <div className="col-span-1 row-span-1 bento-area-s2 rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-6 flex flex-col justify-center relative overflow-hidden shadow-sm">
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 bg-[#5CF2C0]/10 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#5CF2C0] tracking-tight">
                2018
              </div>
              <div className="text-xs sm:text-sm text-white/60 font-medium leading-snug">
                kekal mengajar sejak
              </div>
            </div>
          </div>

          {/* x = gallery[7] (wide, 2×1) */}
          <div
            onClick={() => setLightboxIndex(7)}
            className="group col-span-2 md:col-span-2 row-span-1 bento-area-x rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[7]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[7]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* g = gallery[8] (1×1) */}
          <div
            onClick={() => setLightboxIndex(8)}
            className="group col-span-1 row-span-1 bento-area-g rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[8]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[8]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* h = gallery[9] (1×1) */}
          <div
            onClick={() => setLightboxIndex(9)}
            className="group col-span-1 row-span-1 bento-area-h rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[9]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[9]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* i = gallery[10] (wide on mobile/desktop, 1x1 on tablet) */}
          <div
            onClick={() => setLightboxIndex(10)}
            className="group col-span-2 md:col-span-1 lg:col-span-2 row-span-1 bento-area-i rounded-[20px] overflow-hidden bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer relative shadow-sm"
          >
            <img
              src={CONFIG.gallery[10]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              loading="lazy"
              className="w-full h-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[10]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* D. JADUAL INTAKE STRIP (Dark Card, Sentence Case) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-[#0B1430] border border-white/[0.08] p-8 sm:p-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
                Jadual Bulanan
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
                Intake {CONFIG.intakeMonth}
              </h2>
            </div>
          </div>

          {/* Timeline Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg bg-[#060B1E] border border-white/[0.08] space-y-1.5">
              <div className="text-base sm:text-lg font-semibold text-white">
                {CONFIG.cab.dates}
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Fundamental Analysis, saringan tokenomik serta modul on-chain & keselamatan.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#060B1E] border border-white/[0.08] space-y-1.5">
              <div className="text-base sm:text-lg font-semibold text-white">
                {CONFIG.kita.dates}
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Teknikal analisis candlestick, entry & exit positions, dan disiplin risiko.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.08]">
            <p className="text-sm text-white/60">
              Faham dulu, kemudian trade. Laluan 2 minggu dari pemula ke trader.
            </p>
            <button
              type="button"
              disabled
              className="px-6 py-3 rounded-lg bg-[#5CF2C0]/60 text-[#060B1E]/80 font-semibold text-sm text-center shrink-0 cursor-not-allowed select-none shadow-sm"
            >
              Daftar Combo RM{CONFIG.combo.price}
            </button>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* COMPARISON TABLE: CAB vs KITA vs Combo */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
              Perbandingan kelas
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Bandingkan fokus, tahap kemahiran dan manfaat setiap program sebelum mendaftar.
            </p>
          </div>
          {/* Mobile Swipe Hint */}
          <div className="sm:hidden text-[11px] text-[#5CF2C0] font-medium flex items-center gap-1 self-start">
            <span>← Tatal ke tepi untuk perbandingan penuh →</span>
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll rounded-xl border border-white/[0.08] bg-[#0B1430] shadow-xl">
          <table className="w-full text-left border-collapse min-w-[620px] sm:min-w-[680px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060B1E]">
                <th className="sticky left-0 z-20 bg-[#060B1E] py-4 px-4 sm:px-5 text-xs uppercase tracking-wider text-white/50 font-medium w-[140px] sm:w-1/4 shadow-[2px_0_8px_rgba(0,0,0,0.4)]">
                  Ciri-ciri
                </th>
                <th className="py-4 px-4 sm:px-5 w-1/4 min-w-[160px]">
                  <div className="text-sm font-semibold text-white">Crypto Alpha Bootcamp (CAB)</div>
                  <div className="text-xs text-[#5CF2C0] font-medium mt-0.5">RM299 · Live Zoom</div>
                </th>
                <th className="py-4 px-4 sm:px-5 w-1/4 min-w-[160px]">
                  <div className="text-sm font-semibold text-white">KITA Masterclass</div>
                  <div className="text-xs text-[#5CF2C0] font-medium mt-0.5">RM499 · Live Zoom</div>
                </th>
                <th className="py-4 px-4 sm:px-5 w-1/4 min-w-[160px] bg-[#5CF2C0]/[0.04]">
                  <div className="text-sm font-semibold text-[#5CF2C0] flex items-center gap-1.5">
                    <span>Combo CAB + KITA</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5CF2C0]/20 text-[#5CF2C0] font-bold">
                      Jimat RM99
                    </span>
                  </div>
                  <div className="text-xs text-white/70 font-medium mt-0.5">RM699 · Pakej Lengkap</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
              <tr>
                <td className="sticky left-0 z-10 bg-[#0B1430] py-3.5 px-4 sm:px-5 text-white/70 font-semibold shadow-[2px_0_8px_rgba(0,0,0,0.4)]">Fokus</td>
                <td className="py-3.5 px-4 sm:px-5 text-[#5CF2C0] font-medium">
                  Fundamental, on-chain, keselamatan
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80">
                  Teknikal analisis, carta candlestick & kawal risiko
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-[#5CF2C0] font-medium bg-[#5CF2C0]/[0.04]">
                  Fundamental, on-chain, keselamatan & teknikal trading
                </td>
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-[#0B1430] py-3.5 px-4 sm:px-5 text-white/70 font-semibold shadow-[2px_0_8px_rgba(0,0,0,0.4)]">Tahap Sesuai</td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80">
                  Pemula & pelabur jangka panjang (pasif)
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80">
                  Level 2 · Trader & trader aktif
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80 bg-[#5CF2C0]/[0.04]">
                  Semua tahap (dari kosong hingga berdikari trade)
                </td>
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-[#0B1430] py-3.5 px-4 sm:px-5 text-white/70 font-semibold shadow-[2px_0_8px_rgba(0,0,0,0.4)]">Bahan & Alatan</td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80">
                  Template analisis fundamental, kalkulator tokenomik, tools on-chain & checklist keselamatan wallet
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80">
                  Trading journal, template Stop Loss/Take Profit, formula risk-reward & pelan trading
                </td>
                <td className="py-3.5 px-4 sm:px-5 text-white/80 bg-[#5CF2C0]/[0.04]">
                  Akses penuh kepada semua template & alatan kedua-dua kelas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ================================================== */}
      {/* E. TESTIMONI WALL (Dark Cards, Sentence Case) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
            Baca dulu maklum balas
          </h2>
          <p className="text-sm text-white/60">
            Pengalaman sebenar peserta yang telah mengikuti sesi latihan bersama Tuan Asyraf.
          </p>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {CONFIG.testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3.5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-1 text-[#5CF2C0]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-white/75 leading-relaxed">
                "{t.text}"
              </p>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">
                    {t.name}
                  </div>
                  {t.role && (
                    <div className="text-[11px] text-white/50">
                      {t.role}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-white/50">
                  {t.kelas}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link
            to="/#kelas"
            className="inline-flex items-center px-6 py-3 rounded-lg border border-white/20 text-white font-medium text-xs sm:text-sm hover:border-[#5CF2C0] hover:text-[#5CF2C0] transition-colors"
          >
            <span>Lihat semua kelas</span>
          </Link>
        </div>
      </section>

      {/* ================================================== */}
      {/* F. KENALI TUAN ASYRAF */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* 1. Section heading (centred, large) */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-[-0.02em]">
            Belajar dengan pelan, bukan ikut orang
          </h2>
        </div>

        {/* Card wrapper: Photo & Follow Saya on the left, text on the right (stacked on mobile) */}
        <div className="p-6 sm:p-10 lg:p-12 rounded-2xl bg-[#0B1430] border border-white/[0.08]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Photo & Follow Saya Block */}
            <div className="lg:col-span-5 space-y-6 max-w-md mx-auto w-full">
              {/* Photo */}
              <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#060B1E] border border-white/[0.08] shadow-2xl">
                <img
                  src={TUAN_ASYRAF_PHOTO_URL}
                  alt="Tuan Asyraf Ahamed"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== TUAN_ASYRAF_LOCAL_PHOTO) {
                      target.src = TUAN_ASYRAF_LOCAL_PHOTO;
                    }
                  }}
                />
              </div>

              {/* Follow Saya Block */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
                  FOLLOW SAYA
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* YouTube */}
                  <a
                    href={CONFIG.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="YouTube"
                    aria-label="YouTube"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#060B1E] border border-white/[0.08] flex items-center justify-center text-[#5CF2C0] hover:text-white hover:border-[#5CF2C0]/60 hover:bg-white/[0.04] transition-all duration-200 shrink-0 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    href={CONFIG.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TikTok"
                    aria-label="TikTok"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#060B1E] border border-white/[0.08] flex items-center justify-center text-[#5CF2C0] hover:text-white hover:border-[#5CF2C0]/60 hover:bg-white/[0.04] transition-all duration-200 shrink-0 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href={CONFIG.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                    aria-label="Facebook"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#060B1E] border border-white/[0.08] flex items-center justify-center text-[#5CF2C0] hover:text-white hover:border-[#5CF2C0]/60 hover:bg-white/[0.04] transition-all duration-200 shrink-0 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.52-.14-2.73-.14-2.83 0-4.77 1.73-4.77 4.9v2.6H7v4h3.1v10.5h3.9V13.5z"/>
                    </svg>
                  </a>

                  {/* Threads */}
                  <a
                    href={CONFIG.socials.threads}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Threads"
                    aria-label="Threads"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#060B1E] border border-white/[0.08] flex items-center justify-center text-[#5CF2C0] hover:text-white hover:border-[#5CF2C0]/60 hover:bg-white/[0.04] transition-all duration-200 shrink-0 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.001 2c-5.523 0-10 4.477-10 10s4.477 10 10 10c2.81 0 5.344-1.157 7.168-3.023l-1.428-1.428C16.19 19.123 14.214 20 12.001 20c-4.411 0-8-3.589-8-8s3.589-8 8-8c4.27 0 7.766 3.354 7.986 7.568.012.24.014.453.014.632 0 2.213-.895 3.51-2.43 3.51-.976 0-1.705-.624-1.921-1.571.93-.475 1.554-1.42 1.554-2.639 0-1.654-1.346-3-3-3-1.654 0-3 1.346-3 3s1.346 3 3 3c.691 0 1.328-.235 1.838-.631.332.969 1.258 1.631 2.399 1.631 2.502 0 4.19-2.028 4.19-5.11 0-.214-.002-.457-.015-.729C20.354 6.002 16.592 2 12.001 2zm.203 12.2c-.663 0-1.203-.54-1.203-1.2 0-.661.54-1.2 1.203-1.2.662 0 1.202.539 1.202 1.2 0 .66-.54 1.2-1.202 1.2z" />
                    </svg>
                  </a>

                  {/* X */}
                  <a
                    href={CONFIG.socials.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="X"
                    aria-label="X"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#060B1E] border border-white/[0.08] flex items-center justify-center text-[#5CF2C0] hover:text-white hover:border-[#5CF2C0]/60 hover:bg-white/[0.04] transition-all duration-200 shrink-0 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={CONFIG.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    aria-label="LinkedIn"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#060B1E] border border-white/[0.08] flex items-center justify-center text-[#5CF2C0] hover:text-white hover:border-[#5CF2C0]/60 hover:bg-white/[0.04] transition-all duration-200 shrink-0 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Text Right */}
            <div className="lg:col-span-7 space-y-6">
              {/* 2. Name & 3. Subtitle in mint */}
              <div className="space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Tuan Asyraf Ahamed
                </h3>
                <div className="text-sm sm:text-base font-semibold text-[#5CF2C0]">
                  Pengasas Bicara Krypto & Sentysis | HRD Corp Certified Trainer
                </div>
              </div>

              {/* 4. Two paragraphs (muted text) */}
              <div className="space-y-3.5 text-sm sm:text-base text-white/70 leading-relaxed">
                <p>
                  Tuan Asyraf Ahamed antara pencipta kandungan crypto terawal di Malaysia. Sebagai pengguna awal DeFi, beliau antara segelintir yang menerima airdrop Uniswap pada 2020, dan sejak itu konsisten menemui trend, naratif dan peluang baru lebih awal untuk komuniti Malaysia.
                </p>
                <p>
                  Beliau mengasaskan Bicara Krypto pada 2018, kini dengan lebih 100,000 pengikut, dan{' '}
                  <a
                    href="https://sentysis.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5CF2C0] hover:underline font-semibold"
                  >
                    Sentysis
                  </a>
                  , platform Web3 Media Intelligence onchain di blockchain Base. Sebelum itu, beliau membina lebih 10 tahun pengalaman dalam ekonomi digital dan fintech di MDEC dan Kiplepay, serta menerajui pemasaran exchange crypto Bitflex. Beliau memegang Ijazah Sarjana Pengurusan dari UIAM.
                </p>
              </div>

              {/* 5. REKOD DALAM CRYPTO checklist */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
                  REKOD DALAM CRYPTO
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Pengguna awal DeFi: ganjaran airdrop bernilai 6 angka',
                    'Grow akaun trading dari USD 1,000 ke USD 100,000*',
                    'Portfolio yang terus berkembang dalam bull & bear market',
                    'Melancarkan dApp sendiri: Sentysis di Base',
                    '500+ alumni kelas CAB & KITA',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80">
                      <Check className="w-4 h-4 text-[#5CF2C0] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs italic text-white/50 pt-0.5">
                  *Pengalaman peribadi, bukan jaminan hasil.
                </p>
              </div>

              {/* 6. Highlighted Block */}
              <div className="rounded-xl bg-[#060B1E] border border-white/[0.08] border-l-4 border-l-[#5CF2C0] p-5 sm:p-6 space-y-3 shadow-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
                  KEKAL SEBAGAI FIGURA KRIPTO SEJAK 2018
                </div>
                <blockquote className="text-base sm:text-lg font-semibold text-white leading-snug">
                  &ldquo;Ramai &lsquo;sifu crypto&rsquo; muncul bila pasaran naik, dan hilang bila pasaran jatuh. Saya kekal, dan terus membina.&rdquo;
                </blockquote>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Sejak 2018, Tuan Asyraf telah melalui beberapa kitaran bull dan bear market, termasuk kejatuhan pasaran 2018, 2022 dan 10 Oktober 2025. Ketika ramai berhenti, beliau terus mengajar, membina portfolio, dan menyumbang kepada industri melalui Bicara Krypto dan Sentysis. Ketahanan inilah yang beliau ajar dalam setiap kelas: bukan sekadar masuk bila semua orang teruja, tetapi kekal dan berkembang dalam apa jua keadaan pasaran.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* G. TAK PASTI KELAS MANA? (QUIZ) */}
      {/* ================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-6">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
              Panduan Pemilihan
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em]">
              Tak pasti kelas mana yang sesuai?
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Jawab 3 soalan di bawah untuk menerima cadangan kelas yang bersesuaian.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Q1 */}
            <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.08] space-y-2.5">
              <div className="text-sm font-medium text-white">
                1. Pernah beli crypto sebelum ini?
              </div>
              <div className="flex gap-2.5">
                {(['Ya', 'Belum'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQ1(opt)}
                    className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center justify-center ${
                      q1 === opt
                        ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0] font-semibold'
                        : 'bg-transparent text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.08] space-y-2.5">
              <div className="text-sm font-medium text-white">
                2. Faham cara guna exchange dan wallet?
              </div>
              <div className="flex gap-2.5">
                {(['Ya', 'Belum'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQ2(opt)}
                    className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center justify-center ${
                      q2 === opt
                        ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0] font-semibold'
                        : 'bg-transparent text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3 */}
            <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.08] space-y-2.5">
              <div className="text-sm font-medium text-white">
                3. Matlamat anda?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 'Simpan jangka panjang', label: 'Simpanan Jangka Panjang' },
                  { value: 'Trading aktif', label: 'Trading Aktif' },
                  { value: 'Dua-dua', label: 'Dua-dua' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ3(opt.value as any)}
                    className={`min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-medium transition-all border text-center cursor-pointer flex items-center justify-center ${
                      q3 === opt.value
                        ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0] font-semibold'
                        : 'bg-transparent text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quiz Result */}
          {recommendation ? (
            <div className="p-5 rounded-lg bg-[#060B1E] border border-[#5CF2C0]/40 space-y-3 animate-fadeIn">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-medium">
                Cadangan untuk anda:
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {recommendation.product.name}
                  </h3>
                  <p className="text-xs text-white/60 mt-1 max-w-lg leading-relaxed">
                    {recommendation.reason}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    disabled
                    className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#5CF2C0]/60 text-[#060B1E]/80 font-semibold text-xs flex items-center justify-center text-center cursor-not-allowed select-none shadow-sm"
                  >
                    Daftar (RM{recommendation.product.price})
                  </button>
                  <Link
                    to={recommendation.product.route}
                    className="min-h-[44px] px-3 text-xs text-white/70 hover:text-[#5CF2C0] flex items-center justify-center text-center font-medium"
                  >
                    Butiran
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-white/40 pt-1">
              Sila jawab 3 soalan di atas untuk melihat cadangan.
            </div>
          )}
        </div>
      </section>

      {/* ================================================== */}
      {/* H. SOALAN LAZIM (ACCORDION) */}
      {/* ================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
            FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
            Soalan lazim
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-lg bg-[#0B1430] border border-white/[0.08] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 text-sm font-medium text-white hover:text-[#5CF2C0] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#5CF2C0]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-white/70 leading-relaxed border-t border-white/[0.04]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Waitlist Modal */}
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}

      {/* Gallery Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#060B1E]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Galeri Gambar"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-[#0B1430] border border-white/20 text-white hover:text-[#5CF2C0] hover:border-[#5CF2C0] flex items-center justify-center transition-all cursor-pointer z-50 shadow-lg"
            aria-label="Tutup Galeri"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-4 sm:top-7 sm:left-6 px-3.5 py-1.5 rounded-full bg-[#0B1430]/90 border border-white/10 text-xs font-mono text-white/70 z-50 shadow-md">
            {lightboxIndex + 1} / {CONFIG.gallery.length}
          </div>

          {/* Navigation: Prev */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevPhoto();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0B1430]/80 hover:bg-[#0B1430] border border-white/20 hover:border-[#5CF2C0] text-white hover:text-[#5CF2C0] flex items-center justify-center transition-all cursor-pointer z-50 shadow-xl"
            aria-label="Gambar Sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Navigation: Next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextPhoto();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0B1430]/80 hover:bg-[#0B1430] border border-white/20 hover:border-[#5CF2C0] text-white hover:text-[#5CF2C0] flex items-center justify-center transition-all cursor-pointer z-50 shadow-xl"
            aria-label="Gambar Seterusnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main Image Container with Touch Swipe */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={CONFIG.gallery[lightboxIndex]}
              alt="Tuan Asyraf bersama alumni dan pemain industri crypto"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getGoogleDriveFallback(CONFIG.gallery[lightboxIndex]);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
