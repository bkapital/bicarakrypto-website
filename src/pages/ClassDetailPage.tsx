import React, { useState } from 'react';
import { 
  CONFIG, 
  ProductItem, 
  TUAN_ASYRAF_PHOTO_URL, 
  TUAN_ASYRAF_LOCAL_PHOTO 
} from '../config';
import { Link, useRouter } from '../router';
import { ClassPoster } from '../components/ClassPoster';
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Video, 
  ExternalLink, 
  ChevronDown, 
  MessageCircle, 
  Share2 
} from 'lucide-react';

interface ClassDetailPageProps {
  slug: 'cab' | 'kita' | 'combo';
}

export const ClassDetailPage: React.FC<ClassDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();

  // Selected Option Pills
  const [selectedClass, setSelectedClass] = useState<'CAB' | 'KITA'>(() => {
    return slug === 'kita' ? 'KITA' : 'CAB';
  });
  
  const [selectedAddon, setSelectedAddon] = useState<boolean>(() => {
    return slug === 'combo';
  });

  // Terms and Conditions Collapsible state
  const [termsOpen, setTermsOpen] = useState(false);

  // Accordion state for FAQ
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Copy share message feedback
  const [copiedShare, setCopiedShare] = useState(false);

  // Determine current effective product, price and link based on pills
  const isComboSelected = selectedAddon;
  const isKita = selectedClass === 'KITA';
  
  let currentPrice = 299;
  let currentLink = CONFIG.cab.link;
  let currentProductName = 'Crypto Alpha Bootcamp (CAB)';
  let currentPoster = CONFIG.cab.poster;

  if (isComboSelected) {
    currentPrice = CONFIG.combo.price;
    currentLink = CONFIG.combo.link;
    currentProductName = 'Combo CAB + KITA';
    currentPoster = CONFIG.cab.poster;
  } else if (isKita) {
    currentPrice = CONFIG.kita.price;
    currentLink = CONFIG.kita.link;
    currentProductName = 'Kursus Impak Teknikal Analisis (KITA)';
    currentPoster = CONFIG.kita.poster;
  } else {
    currentPrice = CONFIG.cab.price;
    currentLink = CONFIG.cab.link;
    currentProductName = 'Crypto Alpha Bootcamp (CAB)';
    currentPoster = CONFIG.cab.poster;
  }

  // Find product object for Poster
  const posterProduct: ProductItem = (() => {
    if (isComboSelected) {
      return CONFIG.products.find((p) => p.id === 'combo') || CONFIG.products[0];
    }
    if (isKita) {
      return CONFIG.products.find((p) => p.id === 'kita') || CONFIG.products[2];
    }
    return CONFIG.products.find((p) => p.id === 'cab') || CONFIG.products[1];
  })();

  // Other products for "Anda mungkin juga suka" (4 items)
  const otherProducts = CONFIG.products
    .filter((p) => p.id !== posterProduct.id && p.status !== 'hidden')
    .slice(0, 4);

  // Copy share link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  // Check if real gallery images exist
  const galleryImages: string[] = (isKita ? (CONFIG.kita as any)?.gallery : (CONFIG.cab as any)?.gallery) || [];

  return (
    <div className="space-y-16 sm:space-y-24 pb-24 pt-6">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Link to="/" className="hover:text-white transition-colors">Utama</Link>
          <span>/</span>
          <Link to="/#kelas" className="hover:text-white transition-colors">Kelas</Link>
          <span>/</span>
          <span className="text-white/80 font-medium">{currentProductName}</span>
        </div>
      </div>

      {/* Main Product Layout: 2 Columns */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* ================================================== */}
          {/* LEFT COLUMN (Sticky on desktop): Clean Visual Card */}
          {/* ================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            {/* Clean Course Card Visual */}
            <div className="rounded-xl bg-[#0B1430] border border-white/[0.08] p-5 space-y-4">
              <div 
                style={{ aspectRatio: '4 / 5', width: '100%', height: 'auto', overflow: 'hidden', borderRadius: '16px' }}
                className="relative bg-[#060B1E] border border-white/[0.06] flex items-center justify-center shadow-lg"
              >
                <img
                  src={currentPoster}
                  alt={currentProductName}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  className="transition-transform duration-500 hover:scale-[1.02]"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.dataset.retried) {
                      img.dataset.retried = '1';
                      img.src = img.src.replace('https://googleusercontent.com', 'https://lh3.googleusercontent.com').replace(/\/$/, '');
                    } else if (img.src !== TUAN_ASYRAF_LOCAL_PHOTO) {
                      img.src = TUAN_ASYRAF_LOCAL_PHOTO;
                    }
                  }}
                />
              </div>

              <div className="space-y-1 text-center">
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-semibold">
                  {isKita ? 'LEVEL 2 · TRADER · LIVE ZOOM' : 'LEVEL 1 · PEMULA · LIVE ZOOM'}
                </div>
                <div className="text-base font-semibold text-white">
                  {currentProductName}
                </div>
              </div>
            </div>

            {/* Gallery (ONLY rendered if real images exist in config) */}
            {galleryImages.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] uppercase tracking-[0.08em] text-white/50 font-medium mb-2.5">
                  Galeri pembelajaran:
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {galleryImages.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-[#0B1430] border border-white/[0.08] overflow-hidden"
                    >
                      <img src={imgUrl} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* RIGHT COLUMN: Details, Pills, CTA, Description */}
          {/* ================================================== */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header info */}
            <div className="space-y-2 border-b border-white/[0.08] pb-6">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-semibold">
                {isKita ? 'LEVEL 2 · TRADER · LIVE ZOOM' : 'LEVEL 1 · PEMULA · LIVE ZOOM'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em] leading-tight">
                {currentProductName}
              </h1>

              {/* Price & Badge */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-3xl sm:text-4xl font-bold text-[#5CF2C0] tracking-[-0.01em]">
                  RM{currentPrice}
                </span>
                {isComboSelected && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-[#5CF2C0]/30 bg-[#5CF2C0]/12 text-[#5CF2C0]">
                    Paling popular
                  </span>
                )}
              </div>
            </div>

            {/* OPTION PILLS (Clean rectangular 8px buttons) */}
            <div className="p-6 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-5">
              {/* Pill 1: Pilihan Kelas */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
                  Pilihan kelas:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClass('CAB');
                      if (slug === 'kita') navigate('/kelas/cab');
                    }}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      !isKita && !selectedAddon
                        ? 'bg-white text-[#060B1E] border-white font-semibold'
                        : 'bg-transparent text-white/80 border-white/10 hover:border-white/25'
                    }`}
                  >
                    Crypto Alpha Bootcamp (CAB)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClass('KITA');
                      if (slug === 'cab') navigate('/kelas/kita');
                    }}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      isKita && !selectedAddon
                        ? 'bg-white text-[#060B1E] border-white font-semibold'
                        : 'bg-transparent text-white/80 border-white/10 hover:border-white/25'
                    }`}
                  >
                    Kursus Impak Teknikal Analisis (KITA)
                  </button>
                </div>
              </div>

              {/* Pill 2: Pilihan Add-on */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
                  Pakej lengkap (Add-on):
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAddon(false)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      !selectedAddon
                        ? 'bg-white text-[#060B1E] border-white font-semibold'
                        : 'bg-transparent text-white/80 border-white/10 hover:border-white/25'
                    }`}
                  >
                    Tiada
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAddon(true)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      selectedAddon
                        ? 'bg-white text-[#060B1E] border-white font-semibold'
                        : 'bg-transparent text-white/80 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {!isKita
                      ? 'Tambah KITA → Jadi Combo RM699 (Jimat RM99)'
                      : 'Tambah CAB → Jadi Combo RM699 (Jimat RM99)'}
                  </button>
                </div>
              </div>

              {/* Dynamic Note */}
              <div className="text-xs text-white/50 pt-0.5">
                {isComboSelected
                  ? 'Pakej Combo: Sertai kedua-dua kelas CAB & KITA bulan ini dengan harga jimat RM99.'
                  : `Kelas tunggal: ${currentProductName} (RM${currentPrice}).`}
              </div>
            </div>

            {/* CTAs: Big Mint Button & WhatsApp Outline Button */}
            <div className="space-y-2.5">
              <a
                href={currentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all text-center cursor-pointer shadow-md"
              >
                <span>Daftar sekarang (RM{currentPrice})</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-2.5">
                <a
                  href={CONFIG.brand.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-lg border border-white/15 text-white/80 text-xs font-medium hover:border-white/30 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#5CF2C0]" />
                  <span>Tanya di WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 py-2.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedShare ? 'Disalin' : 'Kongsi'}</span>
                </button>
              </div>
            </div>

            {/* ================================================== */}
            {/* SECTIONS IN EXACT REQUESTED ORDER (BELOW BUTTONS) */}
            {/* ================================================== */}

            {!isKita ? (
              /* ========================================== */
              /* CAB COPY (/kelas/cab)                      */
              /* ========================================== */
              <div className="space-y-12 pt-2">
                {/* A. HOOK */}
                <div className="space-y-5">
                  <h2 className="text-[24px] font-bold text-white tracking-[-0.02em] leading-snug">
                    Beli crypto sebab ikut orang? Masa untuk faham apa yang anda beli.
                  </h2>
                  <div className="text-[16px] leading-[1.7] text-white/75 max-w-[640px] space-y-4">
                    <p>
                      Ramai orang masuk crypto sebab kawan beli, sebab nampak di Telegram,X,FB, TikTok, atau sebab &ldquo;orang kata coin ni akan naik&rdquo;.
                    </p>
                    <p>
                      Bila harga jatuh, mereka tak tahu nak hold atau jual. Bila ada projek baru, mereka tak tahu nak percaya atau tidak. Bila wallet kena hack, semuanya sudah terlambat.
                    </p>
                    <p>
                      Masalahnya bukan crypto. <strong className="text-white font-semibold">Masalahnya ialah membeli tanpa cara untuk menilai.</strong>
                    </p>
                    <p>
                      Dalam Crypto Alpha Bootcamp, anda akan belajar cara menilai projek crypto sendiri: dari fundamental, ke tokenomik, ke data on-chain, sampai cara menyimpan aset dengan selamat.
                    </p>
                  </div>

                  <div className="pt-1 text-white font-semibold text-[15px]">
                    Anda akan diajar cara berfikir yang anda boleh guna untuk setiap projek, setiap kitaran pasaran.
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-[14px] text-white/60 border-t border-white/[0.08]">
                    <span>💻 Live di Zoom</span>
                    <span>·</span>
                    <span>🗓 2 hari, 9 pagi – 5 petang</span>
                    <span>·</span>
                    <span>🎥 Rakaman disediakan</span>
                  </div>
                </div>

                {/* B. APA YANG KITA AKAN BUAT BERSAMA */}
                <div className="space-y-5">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Apa yang kita akan buat bersama
                  </h2>
                  <div className="space-y-4 max-w-[640px]">
                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">1.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Tapis projek dalam 10 minit</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Guna kerangka fundamental yang sama untuk setiap projek: masalah apa yang diselesaikan, siapa pasukannya, siapa pelaburnya, dan adakah ada pengguna sebenar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">2.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Baca tokenomik sebelum beli</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Faham supply, jadual unlock dan inflasi, supaya anda tak beli token yang bakal &ldquo;dibanjiri&rdquo; penjual.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">3.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Semak sendiri di on-chain</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Lihat pergerakan wallet besar, taburan pemegang token dan aliran keluar masuk exchange. Data, bukan khabar angin.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">4.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Lindungi aset anda</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Setup wallet dengan betul, simpan seed phrase dengan selamat, dan kenal pasti phishing, link palsu serta approval berbahaya sebelum terlambat.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">5.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Bina Portfolio Sendiri dengan strategi yang betul</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Keluar dari kelas dengan senarai semak dan pelan anda sendiri, supaya tak perlu ikut orang lagi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. APA YANG ANDA DAPAT */}
                <div className="space-y-4">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Apa yang anda dapat
                  </h2>
                  <ul className="space-y-3 text-[15px] text-white/80 max-w-[640px]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#5CF2C0] mt-1">•</span>
                      <span>
                        <strong className="text-white font-semibold">Sesi live 2 hari bersama Tuan Asyraf</strong> – tanya terus, dapat jawapan terus.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5CF2C0] mt-1">•</span>
                      <span>
                        <strong className="text-white font-semibold">Rakaman & slide kelas</strong> – ulang tonton bila-bila masa jika ada yang terlepas.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5CF2C0] mt-1">•</span>
                      <span>
                        <strong className="text-white font-semibold">Group Telegram peserta</strong> – terus berbincang dengan Tuan Asyraf dan alumni selepas kelas tamat.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* D. BONUS EKSKLUSIF */}
                <div className="p-6 sm:p-7 rounded-xl bg-[#0B1430] border border-white/[0.08] border-l-4 border-l-[#5CF2C0] space-y-4 shadow-lg max-w-[640px]">
                  <h2 className="text-[20px] font-semibold text-white tracking-[-0.02em]">
                    Bonus eksklusif untuk peserta
                  </h2>
                  <ul className="space-y-3 text-[14px] text-white/80">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">CAB Research Template</strong> – template analisis fundamental, isi dan terus nampak sama ada projek tu layak dikaji lagi.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">Kalkulator Tokenomik</strong> – masukkan data supply dan unlock, nampak tekanan jualan akan datang.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">Senarai Tools On-chain Pilihan</strong> – tools yang digunakan dalam kelas, siap dengan cara guna.</span>
                    </li>
                  </ul>
                </div>

                {/* E. SILIBUS (Hidden as requested) */}

                {/* F. SIAPA SESUAI / TIDAK SESUAI */}
                <div className="space-y-4 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Kesesuaian program
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3">
                      <div className="text-xs uppercase tracking-[0.08em] text-white font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-[#5CF2C0]" />
                        <span>Siapa sesuai:</span>
                      </div>
                      <ul className="space-y-2 text-[13px] text-white/75 leading-relaxed">
                        <li>• Anda yang beli crypto sebab ikut orang, dan nak faham apa yang anda beli</li>
                        <li>• Anda yang baru nak mula dan tak mahu buat kesilapan mahal</li>
                        <li>• Anda yang pernah rugi sebab projek rugpull atau scam</li>
                        <li>• Anda yang bekerja dan mahu pelaburan jangka panjang</li>
                        <li>• Anda yang takut wallet kena hack dan nak simpan aset dengan selamat</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3">
                      <div className="text-xs uppercase tracking-[0.08em] text-white/60 font-semibold flex items-center gap-1.5">
                        <X className="w-4 h-4 text-white/40" />
                        <span>Siapa tidak sesuai:</span>
                      </div>
                      <ul className="space-y-2 text-[13px] text-white/60 leading-relaxed">
                        <li>• Anda yang cari cara kaya cepat tanpa belajar</li>
                        <li>• Anda yang hanya mahu &ldquo;signal&rdquo; coin tanpa mahu faham</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* G. KENAPA BELAJAR DENGAN SAYA */}
                <div className="p-6 sm:p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-5 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Kenapa belajar dengan saya?
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#5CF2C0]/40 shrink-0">
                      <img
                        src={TUAN_ASYRAF_PHOTO_URL}
                        alt="Tuan Asyraf"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = TUAN_ASYRAF_LOCAL_PHOTO;
                        }}
                      />
                    </div>
                    <div className="space-y-3 text-[15px] leading-[1.7] text-white/75">
                      <p>
                        Saya mula membeli Bitcoin pada 2015, ketika kebanyakan orang masih belum pernah dengar namanya. Saya sudah melalui beberapa kitaran bull dan bear, dan saya juga pernah buat kesilapan yang sama yang anda mungkin sedang buat sekarang.
                      </p>
                      <p>
                        Pada 2018 saya mulakan Bicara Krypto untuk kongsi ilmu ini dalam Bahasa Melayu yang mudah difahami. Hari ini lebih 100,000 orang mengikuti perkongsian kami.
                      </p>
                      <p>
                        Saya tak akan janji anda kaya. <strong className="text-white font-semibold">Saya akan ajar anda cara menilai, supaya setiap keputusan pelaburan adalah keputusan anda sendiri.</strong>
                      </p>
                      <div className="text-sm font-semibold text-white pt-1">
                        – Tuan Asyraf Ahamed, Pengasas Bicara Krypto
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-around text-center text-xs sm:text-sm text-white/70">
                    <div>
                      <span className="font-bold text-white block">Sejak 2015</span>
                      <span className="text-[11px] text-white/40">Pengalaman Kripto</span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="font-bold text-[#5CF2C0] block">100K+</span>
                      <span className="text-[11px] text-white/40">Komuniti</span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="font-bold text-white block">1000+</span>
                      <span className="text-[11px] text-white/40">Alumni Kelas</span>
                    </div>
                  </div>
                </div>

                {/* H. BUTIRAN KELAS (Single icon per item, no duplicate emoji) */}
                <div className="p-5 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-2.5 max-w-[640px]">
                  <h3 className="text-sm font-semibold text-white">
                    Butiran kelas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/75">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5CF2C0] shrink-0" />
                      <span>{CONFIG.cab.dates} (Sabtu & Ahad)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5CF2C0] shrink-0" />
                      <span>9:00 pagi – 5:00 petang</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#5CF2C0] shrink-0" />
                      <span>Live di Zoom</span>
                    </div>
                  </div>
                </div>

                {/* I. LEPAS DAFTAR, APA JADI? */}
                <div className="space-y-4 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Lepas daftar, apa jadi?
                  </h2>
                  <div className="space-y-3 text-[15px] text-white/80">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#5CF2C0]/20 text-[#5CF2C0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <strong className="text-white font-semibold">Semak email anda</strong> – resit dan maklumat kelas dihantar terus (semak juga folder spam).
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#5CF2C0]/20 text-[#5CF2C0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <strong className="text-white font-semibold">Terima WhatsApp dalam 5–10 minit</strong> – dengan link group kelas.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#5CF2C0]/20 text-[#5CF2C0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <strong className="text-white font-semibold">Sertai kelas di Zoom</strong> – link dikongsi dalam group sebelum kelas bermula.
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-white/60">
                      Ada masalah? WhatsApp kami di {CONFIG.brand.whatsappPhone}, kami bantu sampai selesai.
                    </div>
                  </div>
                </div>

                {/* J. SOALAN LAZIM (Accordion) */}
                <div className="space-y-4 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Soalan lazim
                  </h2>
                  <div className="space-y-2.5">
                    {[
                      {
                        q: "Saya langsung tak tahu apa-apa tentang crypto. Sesuai ke?",
                        a: "Sangat sesuai. CAB bermula dari asas, dan Tuan Asyraf akan terangkan setiap istilah dalam Bahasa Melayu yang mudah."
                      },
                      {
                        q: "Saya bekerja. Kalau tak dapat hadir live?",
                        a: "Semua peserta dapat rakaman dan slide kelas. Anda boleh tonton semula ikut masa sendiri."
                      },
                      {
                        q: "Berapa modal yang saya perlukan untuk mula melabur?",
                        a: "Kelas ini fokus kepada ilmu. Anda boleh mula dengan jumlah kecil yang anda mampu, dan kami tak akan paksa anda melabur."
                      },
                      {
                        q: "Apa beza CAB dan KITA?",
                        a: "CAB untuk pelaburan jangka panjang. KITA untuk trading aktif. Ramai peserta ambil Combo dan sertai kedua-duanya dalam bulan yang sama."
                      },
                      {
                        q: "Boleh dapat refund?",
                        a: "Bayaran tidak dipulangkan, tetapi tiket boleh dipindahkan kepada orang lain dengan makluman sekurang-kurangnya 3 hari sebelum kelas."
                      }
                    ].map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#0B1430] border border-white/[0.08] overflow-hidden transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(idx)}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-semibold text-white hover:text-[#5CF2C0] transition-colors cursor-pointer"
                          >
                            <span>{item.q}</span>
                            <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#5CF2C0]' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-sm text-white/70 leading-relaxed border-t border-white/[0.06] pt-3">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* K. FINAL CTA */}
                <div className="p-8 sm:p-10 rounded-2xl bg-[#0B1430] border border-white/[0.08] space-y-5 shadow-xl max-w-[640px]">
                  <h3 className="text-2xl font-bold text-white tracking-[-0.02em]">
                    Sedia untuk berhenti ikut orang?
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Intake {CONFIG.cab.dates}. Daftar sekarang dan mula buat keputusan crypto dengan ilmu, bukan teka-teki.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                    <a
                      href={CONFIG.cab.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-bold text-sm text-center hover:opacity-95 transition-opacity"
                    >
                      Daftar CAB – RM{CONFIG.cab.price}
                    </a>
                    <a
                      href={CONFIG.combo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-lg border border-white/20 text-white font-semibold text-sm text-center hover:border-white/40 transition-colors"
                    >
                      Ambil Combo – RM{CONFIG.combo.price}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================== */
              /* KITA COPY (/kelas/kita)                    */
              /* ========================================== */
              <div className="space-y-12 pt-2">
                {/* A. HOOK */}
                <div className="space-y-5">
                  <h2 className="text-[24px] font-bold text-white tracking-[-0.02em] leading-snug">
                    Lepas beli, harga turun. Lepas jual, harga naik. Kenal situasi ni?
                  </h2>
                  <div className="text-[16px] leading-[1.7] text-white/75 max-w-[640px] space-y-4">
                    <p>
                      Ramai yang mula trading dengan semangat. Belajar sendiri di YouTube dan TikTok, ikut signal dalam group, lepas tu CUBA trade.
                    </p>
                    <p>
                      Ada minggu untung. Ada minggu rugi. Tapi bila dikira semula, <strong className="text-white font-semibold">rugi lebih banyak daripada untung</strong>.
                    </p>
                    <p>
                      Bukan sebab anda tak rajin. Masalahnya ialah trading tanpa pelan: tak tahu bila masuk, bila keluar, berapa nak risiko, dan tiada disiplin bila emosi mengambil alih.
                    </p>
                    <p>
                      Dalam KITA, anda akan belajar membaca carta, merancang setiap trade sebelum masuk, dan mengawal risiko seperti trader sebenar.
                    </p>
                  </div>

                  <div className="pt-1 text-white font-semibold text-[15px]">
                    Ini sistem trading yang anda faham dan boleh guna sendiri.
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-[14px] text-white/60 border-t border-white/[0.08]">
                    <span>💻 Live di Zoom</span>
                    <span>·</span>
                    <span>🗓 2 hari, 9 pagi – 5 petang</span>
                    <span>·</span>
                    <span>📈 Analisis carta secara live</span>
                    <span>·</span>
                    <span>🎥 Rakaman disediakan</span>
                  </div>
                </div>

                {/* B. APA YANG KITA AKAN BUAT BERSAMA */}
                <div className="space-y-5">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Apa yang kita akan buat bersama
                  </h2>
                  <div className="space-y-4 max-w-[640px]">
                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">1.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Baca carta dengan yakin</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Faham candlestick, struktur pasaran, support & resistance, supaya carta bukan lagi &ldquo;garisan yang menakutkan&rdquo;.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">2.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Pilih coin yang layak di-trade</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Guna crypto screener untuk tapis coin ikut volum dan momentum, bukan ikut hype atau group.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">3.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Rancang entry, stop loss dan take profit sebelum masuk</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Setiap trade ada pelan. Anda tahu di mana salah, berapa boleh rugi, dan di mana ambil untung.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">4.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Kawal risiko dan emosi</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Formula risk-to-reward, saiz posisi yang betul, dan cara elak FOMO serta revenge trade.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">5.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Faham bagaimana pasaran digerakkan</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Kenali corak pergerakan market maker dan liquidity, supaya anda tak jadi &ldquo;exit liquidity&rdquo; orang lain.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <span className="text-[#5CF2C0] font-bold text-base mt-0.5">6.</span>
                      <div>
                        <div className="font-bold text-white text-[15px]">Praktikal di pasaran sebenar</div>
                        <p className="text-[14px] leading-relaxed text-white/60 mt-0.5">
                          Analisis carta secara live bersama Tuan Asyraf menggunakan keadaan pasaran semasa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. GAYA TRADING YANG DIAJAR (Removed as requested) */}

                {/* D. APA YANG ANDA DAPAT */}
                <div className="space-y-4">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Apa yang anda dapat
                  </h2>
                  <ul className="space-y-3 text-[15px] text-white/80 max-w-[640px]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#5CF2C0] mt-1">•</span>
                      <span>
                        <strong className="text-white font-semibold">Sesi live 2 hari bersama Tuan Asyraf</strong> – tanya terus, dapat jawapan terus. Bukan rakaman e-video.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5CF2C0] mt-1">•</span>
                      <span>
                        <strong className="text-white font-semibold">Rakaman & slide kelas</strong> – ulang tonton bila-bila masa jika ada yang terlepas.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5CF2C0] mt-1">•</span>
                      <span>
                        <strong className="text-white font-semibold">Group perbincangan pasaran peserta</strong> – bincang setup dan keadaan pasaran bersama alumni selepas kelas tamat.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* E. BONUS EKSKLUSIF */}
                <div className="p-6 sm:p-7 rounded-xl bg-[#0B1430] border border-white/[0.08] border-l-4 border-l-[#5CF2C0] space-y-4 shadow-lg max-w-[640px]">
                  <h2 className="text-[20px] font-semibold text-white tracking-[-0.02em]">
                    Bonus eksklusif untuk peserta
                  </h2>
                  <ul className="space-y-3 text-[14px] text-white/80">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">Trading Journal</strong> – rekod setiap trade, nampak corak kesilapan anda sendiri.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">Template Trading Plan</strong> – senarai semak sebelum, semasa dan selepas trade.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">Kalkulator Risk-Reward & Saiz Posisi</strong> – tahu berapa nak masuk sebelum tekan butang beli.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#5CF2C0] mt-0.5">•</span>
                      <span><strong className="text-white font-semibold">Setup Crypto Screener</strong> – tetapan screener yang digunakan dalam kelas.</span>
                    </li>
                  </ul>
                </div>

                {/* F. SILIBUS (Hidden as requested) */}

                {/* G. SIAPA SESUAI / TIDAK SESUAI */}
                <div className="space-y-4 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Kesesuaian program
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3">
                      <div className="text-xs uppercase tracking-[0.08em] text-white font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-[#5CF2C0]" />
                        <span>Siapa sesuai:</span>
                      </div>
                      <ul className="space-y-2 text-[13px] text-white/75 leading-relaxed">
                        <li>• Anda yang selalu beli di puncak dan jual di lantai</li>
                        <li>• Anda yang dah trade sendiri tapi hasilnya masih tak konsisten</li>
                        <li>• Anda yang selama ini DCA/HODL sahaja dan nak mula belajar trading</li>
                        <li>• Anda yang nak kawal emosi dan disiplin dalam setiap trade</li>
                        <li>• Anda yang dah ada modal dalam crypto dan mahu guna dengan lebih terancang</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3">
                      <div className="text-xs uppercase tracking-[0.08em] text-white/60 font-semibold flex items-center gap-1.5">
                        <X className="w-4 h-4 text-white/40" />
                        <span>Siapa tidak sesuai:</span>
                      </div>
                      <ul className="space-y-2 text-[13px] text-white/60 leading-relaxed">
                        <li>• Anda yang nak jaminan untung dalam setiap trade</li>
                        <li>• Anda yang hanya mahu &ldquo;signal&rdquo; tanpa mahu faham</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* H. KENAPA BELAJAR DENGAN SAYA */}
                <div className="p-6 sm:p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-5 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Kenapa belajar dengan saya?
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#5CF2C0]/40 shrink-0">
                      <img
                        src={TUAN_ASYRAF_PHOTO_URL}
                        alt="Tuan Asyraf"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = TUAN_ASYRAF_LOCAL_PHOTO;
                        }}
                      />
                    </div>
                    <div className="space-y-3 text-[15px] leading-[1.7] text-white/75">
                      <p>
                        Saya mula dalam crypto pada 2015 dan sudah melalui beberapa kitaran bull dan bear. Saya pernah rugi, pernah FOMO, dan pernah buat keputusan ikut emosi. Dari situ saya belajar bahawa trading yang konsisten datang daripada pelan dan disiplin, bukan nasib.
                      </p>
                      <p>
                        Ramai peserta KITA beritahu saya mereka sudah cuba banyak kelas, tapi semuanya &ldquo;campur aduk&rdquo; dan terlalu laju. Sebab itu KITA diajar topik demi topik, dalam Bahasa Melayu yang mudah, dengan contoh carta sebenar.
                      </p>
                      <p>
                        Saya tak akan janji anda untung setiap hari. <strong className="text-white font-semibold">Saya akan ajar anda cara merancang setiap trade, supaya bila anda rugi, rugi itu kecil dan terkawal. Jika kerugian berjaya dikawal, fasa seterusnya adalah membuat keuntungan dan grow akaun trading hingga 6 angka.</strong>
                      </p>
                      <div className="text-sm font-semibold text-white pt-1">
                        – Tuan Asyraf Ahamed, Pengasas Bicara Krypto
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-around text-center text-xs sm:text-sm text-white/70">
                    <div>
                      <span className="font-bold text-white block">Sejak 2015</span>
                      <span className="text-[11px] text-white/40">Pengalaman Kripto</span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="font-bold text-[#5CF2C0] block">100K+</span>
                      <span className="text-[11px] text-white/40">Komuniti</span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="font-bold text-white block">1000+</span>
                      <span className="text-[11px] text-white/40">Alumni Kelas</span>
                    </div>
                  </div>
                </div>

                {/* I. BUTIRAN KELAS (Single icon per item, no duplicate emoji) */}
                <div className="p-5 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-2.5 max-w-[640px]">
                  <h3 className="text-sm font-semibold text-white">
                    Butiran kelas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/75">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5CF2C0] shrink-0" />
                      <span>{CONFIG.kita.dates} (Sabtu & Ahad)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5CF2C0] shrink-0" />
                      <span>9:00 pagi – 5:00 petang</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#5CF2C0] shrink-0" />
                      <span>Live di Zoom</span>
                    </div>
                  </div>
                </div>

                {/* J. BELUM KUAT ASAS? (Removed as requested) */}

                {/* K. LEPAS DAFTAR, APA JADI? */}
                <div className="space-y-4 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Lepas daftar, apa jadi?
                  </h2>
                  <div className="space-y-3 text-[15px] text-white/80">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#5CF2C0]/20 text-[#5CF2C0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <strong className="text-white font-semibold">Semak email anda</strong> – resit dan maklumat kelas dihantar terus (semak juga folder spam).
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#5CF2C0]/20 text-[#5CF2C0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <strong className="text-white font-semibold">Terima WhatsApp dalam 5–10 minit</strong> – dengan link group kelas.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#5CF2C0]/20 text-[#5CF2C0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <strong className="text-white font-semibold">Sertai kelas di Zoom</strong> – link dikongsi dalam group sebelum kelas bermula.
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-white/60">
                      Ada masalah? WhatsApp kami di {CONFIG.brand.whatsappPhone}, kami bantu sampai selesai.
                    </div>
                  </div>
                </div>

                {/* L. SOALAN LAZIM (Accordion) */}
                <div className="space-y-4 max-w-[640px]">
                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                    Soalan lazim
                  </h2>
                  <div className="space-y-2.5">
                    {[
                      {
                        q: "Saya tak pernah trade langsung. Sesuai ke?",
                        a: "Sesuai jika anda sudah pernah beli crypto dan faham cara guna exchange. Jika belum, mulakan dengan CAB atau ambil Combo."
                      },
                      {
                        q: "Saya bekerja sepenuh masa. Boleh ke trading?",
                        a: "Boleh. Dalam kelas, anda akan belajar memilih gaya trading yang sesuai dengan masa anda."
                      },
                      {
                        q: "Kalau tak dapat hadir live?",
                        a: "Semua peserta dapat rakaman dan slide kelas untuk tonton semula."
                      },
                      {
                        q: "Adakah kelas ini beri signal?",
                        a: "Signal hanyalah bonus tapi yang lebih penting, Kami ajar cara membaca pasaran dan merancang trade supaya anda boleh buat keputusan sendiri."
                      },
                      {
                        q: "Berapa modal yang saya perlukan untuk mula trading?",
                        a: "Kelas ini fokus kepada ilmu dan pengurusan risiko. Mulakan dengan jumlah kecil yang anda sanggup rugi, dan naikkan secara berperingkat bila sudah konsisten."
                      },
                      {
                        q: "Boleh dapat refund?",
                        a: "Bayaran tidak dipulangkan, tetapi tiket boleh dipindahkan kepada orang lain dengan makluman sekurang-kurangnya 3 hari sebelum kelas."
                      }
                    ].map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#0B1430] border border-white/[0.08] overflow-hidden transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(idx)}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-semibold text-white hover:text-[#5CF2C0] transition-colors cursor-pointer"
                          >
                            <span>{item.q}</span>
                            <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#5CF2C0]' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-sm text-white/70 leading-relaxed border-t border-white/[0.06] pt-3">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* M. FINAL CTA */}
                <div className="p-8 sm:p-10 rounded-2xl bg-[#0B1430] border border-white/[0.08] space-y-5 shadow-xl max-w-[640px]">
                  <h3 className="text-2xl font-bold text-white tracking-[-0.02em]">
                    Sedia untuk trade dengan pelan, bukan perasaan?
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Intake {CONFIG.kita.dates}. Daftar sekarang dan mula setiap trade dengan entry, stop loss dan target yang jelas.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                    <a
                      href={CONFIG.kita.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-bold text-sm text-center hover:opacity-95 transition-opacity"
                    >
                      Daftar KITA – RM{CONFIG.kita.price}
                    </a>
                    <a
                      href={CONFIG.combo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-lg border border-white/20 text-white font-semibold text-sm text-center hover:border-white/40 transition-colors"
                    >
                      Ambil Combo – RM{CONFIG.combo.price}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Terma & syarat (Collapsible) */}
            <div className="rounded-lg bg-[#0B1430] border border-white/[0.08] overflow-hidden max-w-[640px]">
              <button
                type="button"
                onClick={() => setTermsOpen(!termsOpen)}
                className="w-full py-3.5 px-4 text-left flex items-center justify-between text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <span>Terma & syarat program</span>
                <ChevronDown
                  className={`w-4 h-4 text-white/40 transition-transform ${
                    termsOpen ? 'rotate-180 text-[#5CF2C0]' : ''
                  }`}
                />
              </button>
              {termsOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-white/70 space-y-1.5 border-t border-white/[0.06] leading-relaxed">
                  <p>a) Tiket hanya sah untuk tarikh kelas yang dipilih dan tidak boleh digunakan untuk program akan datang.</p>
                  <p>b) Tiket boleh dipindahkan kepada orang lain dengan makluman kepada Khidmat Pelanggan sekurang-kurangnya 3 hari sebelum program. Jika tidak, penalti RM50 dikenakan bagi setiap pertukaran nama.</p>
                  <p className="font-semibold text-white">c) Bayaran yang telah dibuat tidak akan dipulangkan.</p>
                  <p>d) Kandungan kursus adalah 100% hak milik Bitzar Ventures Sdn Bhd. Peserta dilarang merakam atau mengulang siar kandungan kursus.</p>
                  <p>e) Kehadiran pada tarikh yang ditetapkan adalah tanggungjawab peserta.</p>
                  <p>f) Hanya rakaman online akan diberikan kepada peserta.</p>
                  <p className="text-[11px] text-white/50 pt-1">
                    Dengan klik butang pendaftaran, anda bersetuju dengan terma & syarat di atas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* PERBANDINGAN KELAS (CAB vs KITA vs Combo) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-12 border-t border-white/[0.08]">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
            Panduan Pemilihan Program
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
            Perbandingan kelas
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Kaji perbezaan fokus, tahap kemahiran dan silibus bagi setiap sesi latihan Bicara Krypto.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0B1430] shadow-xl">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#060B1E]">
                <th className="py-4 px-5 text-xs uppercase tracking-wider text-white/50 font-medium w-1/4">
                  Ciri-ciri
                </th>
                <th className={`py-4 px-5 w-1/4 ${!isComboSelected && !isKita ? 'bg-[#5CF2C0]/[0.05] border-t-2 border-[#5CF2C0]' : ''}`}>
                  <div className="text-sm font-semibold text-white">Crypto Alpha Bootcamp (CAB)</div>
                  <div className="text-xs text-[#5CF2C0] font-medium mt-0.5">RM299 · Live Zoom</div>
                </th>
                <th className={`py-4 px-5 w-1/4 ${!isComboSelected && isKita ? 'bg-[#5CF2C0]/[0.05] border-t-2 border-[#5CF2C0]' : ''}`}>
                  <div className="text-sm font-semibold text-white">KITA Masterclass</div>
                  <div className="text-xs text-[#5CF2C0] font-medium mt-0.5">RM499 · Live Zoom</div>
                </th>
                <th className={`py-4 px-5 w-1/4 bg-[#5CF2C0]/[0.04] ${isComboSelected ? 'bg-[#5CF2C0]/[0.08] border-t-2 border-[#5CF2C0]' : ''}`}>
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
                <td className="py-3.5 px-5 text-white/60 font-medium">Fokus</td>
                <td className="py-3.5 px-5 text-[#5CF2C0] font-medium">
                  Fundamental, on-chain, keselamatan
                </td>
                <td className="py-3.5 px-5 text-white/80">
                  Teknikal analisis, carta candlestick & kawal risiko
                </td>
                <td className="py-3.5 px-5 text-[#5CF2C0] font-medium bg-[#5CF2C0]/[0.04]">
                  Fundamental, on-chain, keselamatan & teknikal trading
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 text-white/60 font-medium">Tahap Sesuai</td>
                <td className="py-3.5 px-5 text-white/80">
                  Pemula & pelabur jangka panjang (pasif)
                </td>
                <td className="py-3.5 px-5 text-white/80">
                  Level 2 · Trader & trader aktif
                </td>
                <td className="py-3.5 px-5 text-white/80 bg-[#5CF2C0]/[0.04]">
                  Semua tahap (dari kosong hingga berdikari trade)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 text-white/60 font-medium">Bahan & Alatan</td>
                <td className="py-3.5 px-5 text-white/80">
                  Template analisis fundamental, kalkulator tokenomik, senarai tools on-chain & checklist keselamatan wallet
                </td>
                <td className="py-3.5 px-5 text-white/80">
                  Trading journal, template Stop Loss/Take Profit, formula risk-reward & pelan trading
                </td>
                <td className="py-3.5 px-5 text-white/80 bg-[#5CF2C0]/[0.04]">
                  Akses penuh kepada semua template & alatan kedua-dua kelas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ================================================== */}
      {/* ANDA MUNGKIN JUGA SUKA (3 clean product cards) */}
      {/* ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-12 border-t border-white/[0.08]">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/50 font-medium">
            Katalog Berkaitan
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em]">
            Anda mungkin juga suka
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherProducts.map((p) => (
            <ClassPoster
              key={p.id}
              product={p}
              onClick={() => {
                if (p.status === 'akanDatang') {
                  window.open(`https://wa.me/60103394725?text=${encodeURIComponent(`Saya nak join waitlist ${p.name}`)}`, '_blank');
                } else {
                  navigate(p.route);
                }
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
