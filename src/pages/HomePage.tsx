import React, { useState, useMemo } from 'react';
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
  Star, 
  ExternalLink, 
  Video, 
  User,
  X
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  // Category Filter in Poster Grid
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Live Zoom' | 'Coaching'>('Semua');

  // Waitlist Modal State
  const [waitlistProduct, setWaitlistProduct] = useState<ProductItem | null>(null);

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hero Headline: sentence case, white, -0.02em tracking */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-[-0.02em] leading-[1.1]">
              Penat belajar kripto sendiri tapi masih rugi?
            </h1>

            {/* List with small thin × line icon in rgba(255,255,255,0.4) */}
            <div className="space-y-2.5 py-1">
              {[
                'Lepas beli, harga turun. Lepas jual, harga naik.',
                'Tak tahu nak pilih coin yang mana.',
                'Beli crypto sebab ikut orang, tapi tak faham apa yang dibeli.',
                'Dah trade bertahun, tapi rugi lebih dari untung.',
                'Tak tahu nak semak projek tu betul atau scam.',
                'Takut kena scam, tak tahu platform mana yang selamat.',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-white/80 text-sm sm:text-base leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-white/40" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Subheadline kecil */}
            <p className="text-white/60 text-sm sm:text-base leading-relaxed pt-1 max-w-xl">
              Belajar dengan Tuan Asyraf: Pakar Crypto sejak 2015 · Pengasas Bicara Krypto & SentysisLab.
            </p>

            {/* Actions: Primary button "Lihat Kelas" (mint, navy text, 8px radius) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/#kelas"
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm hover:opacity-95 transition-all shadow-md min-h-[46px] flex items-center justify-center text-center"
              >
                Lihat Kelas
              </Link>
            </div>
          </div>

          {/* Right Column: Tall, photo-style card with Tuan Asyraf and caption card overlay */}
          <div className="lg:col-span-5">
            <div className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-xl overflow-hidden bg-[#0B1430] border border-white/[0.08] shadow-2xl flex flex-col justify-between p-6 group">
              {/* Tuan Asyraf Photo */}
              <img
                src={TUAN_ASYRAF_PHOTO_URL}
                alt="Tuan Asyraf Ahamed"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== TUAN_ASYRAF_LOCAL_PHOTO) {
                    target.src = TUAN_ASYRAF_LOCAL_PHOTO;
                  }
                }}
              />

              {/* Atmospheric Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060B1E] via-[#060B1E]/30 to-[#060B1E]/60 pointer-events-none z-10" />

              {/* Top tag */}
              <div className="relative z-20 flex justify-between items-center">
                <span className="px-2.5 py-1 rounded bg-[#060B1E]/80 backdrop-blur-md border border-white/10 text-[11px] uppercase tracking-[0.08em] text-white font-medium">
                  Pengajar Utama
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#5CF2C0] shadow-[0_0_8px_#5CF2C0]" />
              </div>

              {/* Caption Card Overlay at the bottom */}
              <div className="relative z-20 p-4 rounded-lg bg-[#060B1E]/90 backdrop-blur-md border border-white/[0.12] shadow-xl">
                <div className="text-sm font-semibold text-white">
                  Tuan Asyraf Ahamed
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  Pakar Crypto sejak 2015 · Pengasas Bicara Krypto & SentysisLab
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <ClassPoster
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
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
            <a
              href={CONFIG.combo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm hover:opacity-95 transition-all text-center shrink-0"
            >
              Daftar Combo RM{CONFIG.combo.price}
            </a>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-xl bg-[#0B1430] border border-white/[0.08]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Photo Left */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative w-full aspect-[4/3] rounded-lg bg-[#060B1E] border border-white/[0.08] overflow-hidden flex flex-col justify-end p-6 group shadow-lg">
                <img
                  src={TUAN_ASYRAF_PHOTO_URL}
                  alt="Tuan Asyraf Ahamed"
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== TUAN_ASYRAF_LOCAL_PHOTO) {
                      target.src = TUAN_ASYRAF_LOCAL_PHOTO;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060B1E] via-[#060B1E]/40 to-transparent pointer-events-none z-10" />
                <div className="relative z-20">
                  <div className="text-base font-semibold text-white">
                    Tuan Asyraf Ahamed
                  </div>
                  <div className="text-xs text-white/75 mt-0.5">
                    Pakar Crypto sejak 2015 · Pengasas Bicara Krypto & SentysisLab
                  </div>
                </div>
              </div>

              {/* YouTube Thumbnail Card */}
              <a
                href={CONFIG.youtubeVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3.5 rounded-lg bg-[#060B1E] border border-white/[0.08] hover:border-white/20 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-[#5CF2C0]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#5CF2C0] transition-colors">
                      YouTube Rasmi Bicara Krypto
                    </div>
                    <div className="text-[11px] text-white/50">
                      Tonton video penerangan & analisa pasaran
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-[#5CF2C0]" />
              </a>
            </div>

            {/* Text Right */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
                Pengasas & Pengajar
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
                Kenali pengajar anda
              </h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                Tuan Asyraf mula melabur dalam Bitcoin sejak 2015 dan mengasaskan Bicara Krypto pada 2018. Hari ini, Bicara Krypto mempunyai lebih 100,000 pengikut dan ahli komuniti di pelbagai media sosial. Beliau dikenali kerana penerangan yang mudah difahami, jujur dan tidak menjual hype, dalam Bahasa Melayu.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.08]">
                  <div className="text-xl font-bold text-white">2015</div>
                  <div className="text-xs text-white/50 mt-0.5">Pelabur Crypto aktif</div>
                </div>
                <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.08]">
                  <div className="text-xl font-bold text-white">100,000+</div>
                  <div className="text-xs text-white/50 mt-0.5">Pengikut & ahli komuniti</div>
                </div>
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
                  <a
                    href={recommendation.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs hover:opacity-95 transition-opacity flex items-center justify-center text-center"
                  >
                    Daftar (RM{recommendation.product.price})
                  </a>
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
    </div>
  );
};
