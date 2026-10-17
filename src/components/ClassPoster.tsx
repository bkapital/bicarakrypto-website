import { ProductItem, CONFIG, TUAN_ASYRAF_PHOTO_URL, TUAN_ASYRAF_LOCAL_PHOTO } from '../config';
import { ArrowRight, Calendar, User, Sparkles, ShieldCheck } from 'lucide-react';

interface ClassPosterProps {
  product: ProductItem;
  className?: string;
  onClick?: () => void;
  showDetailsBelow?: boolean;
}

export const ClassPoster: React.FC<ClassPosterProps> = ({
  product,
  className = '',
  onClick,
}) => {
  const { id, name, price, badge, category, poster } = product;

  const isCombo = id === 'combo';
  const isAkanDatang = product.status === 'akanDatang';

  // Subtitle / one-line description based on product
  const getSubDesc = () => {
    switch (id) {
      case 'combo':
        return 'Laluan lengkap 2 minggu dari asas fundamental hingga mahir analisis teknikal.';
      case 'cab':
        return 'Pelaburan jangka panjang dengan yakin. Belajar pilih projek berkualiti, baca data on-chain dan lindungi aset anda.';
      case 'kita':
        return 'Masterclass trading aktif: baca candlestick, entry & exit, serta kawal risiko.';
      case 'cab-evideo':
        return 'Rakaman penuh modul CAB untuk pembelajaran kendiri mengikut masa anda.';
      case 'kita-evideo':
        return 'Rakaman penuh modul analisis teknikal KITA untuk rujukan berterusan.';
      case 'keselamatan-wallet':
        return 'Panduan langkah demi langkah amankan wallet dan lindungi aset daripada scam.';
      case 'risk-mgmt':
        return 'Kawal psikologi, kawal emosi dan bina pelan pengurusan risiko berdisiplin.';
      case 'mentoring-1to1':
        return 'Bimbingan peribadi eksklusif dan semakan portfolio bersama Tuan Asyraf.';
      default:
        return 'Program bimbingan pendidikan kripto komprehensif.';
    }
  };

  // Subtitle headline
  const getSubTitle = () => {
    switch (id) {
      case 'cab':
        return '3 dalam 1: Fundamental, On-chain & Keselamatan';
      case 'kita':
        return 'Teknikal Analisis & Disiplin Trading';
      case 'combo':
        return 'Lengkap: Fundamental, On-chain & Analisis Teknikal';
      case 'keselamatan-wallet':
        return 'Crash Course Keselamatan Wallet';
      default:
        return null;
    }
  };

  // Fokus points
  const getFocus = () => {
    switch (id) {
      case 'cab':
        return 'Pasif • Jangka panjang • Fundamental • On-chain • Keselamatan';
      case 'kita':
        return 'Aktif • Candlestick • Entry & Exit • Stop Loss • Risk/Reward';
      case 'combo':
        return 'Lengkap • Fundamental • On-chain • Keselamatan • Teknikal';
      default:
        return null;
    }
  };

  // Dates display
  const getDates = () => {
    if (id === 'cab') return CONFIG.cab.dates;
    if (id === 'kita') return CONFIG.kita.dates;
    if (id === 'combo') return `${CONFIG.cab.dates} · ${CONFIG.kita.dates}`;
    return 'Akses fleksibel / Akan datang';
  };

  // Label (e.g. "LEVEL 1 · PEMULA · LIVE ZOOM")
  const getLabel = () => {
    if (id === 'cab') return 'LEVEL 1 · PEMULA · LIVE ZOOM';
    if (id === 'kita') return 'LEVEL 2 · TRADER · LIVE ZOOM';
    if (id === 'combo') return 'LENGKAP · LIVE ZOOM';
    if (category === 'E-Video') return 'BELAJAR KENDIRI · E-VIDEO';
    if (category === 'Coaching') return 'EKSKLUSIF · COACHING';
    return `${category.toUpperCase()}`;
  };

  // Badge styling: small, rectangular, 1px border, 11px text
  const renderBadge = () => {
    if (badge === 'Paling Popular') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-[#5CF2C0]/30 bg-[#5CF2C0]/12 text-[#5CF2C0] flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 fill-current" />
          <span>Paling popular</span>
        </span>
      );
    }
    if (badge === 'Akan Datang') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-white/15 text-white/50">
          Akan datang
        </span>
      );
    }
    return null;
  };

  const subTitle = getSubTitle();
  const focusText = getFocus();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group flex flex-col justify-between rounded-xl bg-[#0B1430] p-5 cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 ${
        isCombo
          ? 'border border-[#5CF2C0]'
          : 'border border-white/[0.08] hover:border-white/20'
      } ${className}`}
    >
      {/* Top Image Area: Aspect Ratio 4:5, FULL poster image, never cropped, no overlays */}
      <div 
        style={{ aspectRatio: '4 / 5', width: '100%', height: 'auto', overflow: 'hidden', borderRadius: '16px' }}
        className="relative bg-[#060B1E] border border-white/[0.06] mb-4 flex items-center justify-center group-hover:border-white/15 transition-colors"
      >
        {poster?.image && poster.image !== TUAN_ASYRAF_PHOTO_URL ? (
          <img
            src={poster.image}
            alt={name}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            className="transition-transform duration-300 group-hover:scale-[1.02]"
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
        ) : (
          <div className="w-full h-full flex flex-col justify-between p-4">
            {/* Top Badge */}
            <div className="flex items-center justify-between z-10">
              {renderBadge()}
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">
                Bicara Krypto
              </span>
            </div>

            {/* Center Minimal Icon & Stickers */}
            <div className="my-auto flex flex-col items-center justify-center text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-[#0B1430] border border-white/10 flex items-center justify-center text-white/60 group-hover:border-[#5CF2C0]/50 transition-colors shadow-inner overflow-hidden">
                {id === 'keselamatan-wallet' ? (
                  <ShieldCheck className="w-6 h-6 text-[#5CF2C0]" />
                ) : (
                  <img
                    src={TUAN_ASYRAF_PHOTO_URL}
                    alt="Tuan Asyraf"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== TUAN_ASYRAF_LOCAL_PHOTO) {
                        target.src = TUAN_ASYRAF_LOCAL_PHOTO;
                      }
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-white/60 mt-2 font-medium">
                {poster?.headline || 'Tuan Asyraf'}
              </span>

              {/* Stickers */}
              {poster?.sticker1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#5CF2C0]/15 text-[#5CF2C0] border border-[#5CF2C0]/30 shadow-sm">
                    {poster.sticker1}
                  </span>
                  {poster.sticker2 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/90 border border-white/20 shadow-sm">
                      {poster.sticker2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom subtle bar */}
            <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/[0.06] pt-1.5 z-10">
              <span>{category}</span>
              <span>{category === 'Live Zoom' ? 'Zoom Live' : 'Sesi Personal'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Small Label: 11px uppercase, 60% white */}
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
            {getLabel()}
          </div>

          {/* Class Name: White 20px semibold, sentence case */}
          <h3 className="text-[20px] font-semibold text-white tracking-[-0.02em] leading-snug group-hover:text-[#5CF2C0] transition-colors">
            {name}
          </h3>

          {/* Subtitle / Headline */}
          {subTitle && (
            <div className="text-xs font-semibold text-[#5CF2C0] pt-0.5">
              {subTitle}
            </div>
          )}

          {/* Description */}
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            {getSubDesc()}
          </p>

          {/* Fokus tags */}
          {focusText && (
            <div className="text-[11px] text-white/50 pt-1 leading-normal border-t border-white/[0.04]">
              <span className="font-medium text-white/70">Fokus:</span> {focusText}
            </div>
          )}
        </div>

        {/* Dates & Price Row */}
        <div className="pt-3 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span className="truncate">{getDates()}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xl font-bold text-[#5CF2C0] tracking-[-0.01em]">
              {typeof price === 'number' ? `RM${price}` : price}
            </div>

            <div className="text-xs font-semibold text-[#5CF2C0] group-hover:underline flex items-center gap-1">
              <span>{isAkanDatang ? 'Waitlist' : 'Lihat butiran'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
