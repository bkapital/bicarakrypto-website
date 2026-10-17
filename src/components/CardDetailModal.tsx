import React, { useState, useEffect } from 'react';
import { CryptoCardItem } from '../config';
import { 
  X, 
  ExternalLink, 
  Check, 
  Copy, 
  CreditCard, 
  Shield, 
  Percent, 
  Calendar, 
  Globe, 
  Coins, 
  DollarSign, 
  Smartphone, 
  Wallet, 
  Sparkles, 
  Gift, 
  MapPin, 
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CardDetailModalProps {
  card: CryptoCardItem | null;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const destinationLink = card.affiliateLink || card.officialLink;
  const isAffiliate = Boolean(card.affiliateLink);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(true);
    setToastMessage('Kod disalin!');
    setTimeout(() => {
      setCopiedCode(false);
      setToastMessage(null);
    }, 2500);
  };

  // Build spec sheet rows, hiding any row that is empty/null/undefined
  const specRows: {
    label: string;
    icon: React.ReactNode;
    valueNode: React.ReactNode;
  }[] = [];

  // 1. Jenis
  if (card.type) {
    specRows.push({
      label: 'Jenis',
      icon: <CreditCard className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.type}</span>,
    });
  }

  // 2. Rangkaian
  if (card.network) {
    specRows.push({
      label: 'Rangkaian',
      icon: <CreditCard className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.network}</span>,
    });
  }

  // 3. Custody
  if (card.custody) {
    specRows.push({
      label: 'Custody',
      icon: <Shield className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.custody}</span>,
    });
  }

  // 4. Cashback
  if (card.cashback) {
    specRows.push({
      label: 'Cashback',
      icon: <Percent className="w-3.5 h-3.5 text-[#5CF2C0]" />,
      valueNode: <span className="font-semibold text-[#5CF2C0]">{card.cashback}</span>,
    });
  }

  // 5. Yuran Tahunan
  if (card.annualFee) {
    specRows.push({
      label: 'Yuran Tahunan',
      icon: <Calendar className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.annualFee}</span>,
    });
  }

  // 6. Yuran FX
  if (card.fxFee) {
    specRows.push({
      label: 'Yuran FX',
      icon: <Globe className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.fxFee}</span>,
    });
  }

  // 7. Staking
  if (card.staking) {
    specRows.push({
      label: 'Staking',
      icon: <Coins className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.staking}</span>,
    });
  }

  // 8. ATM
  if (card.atm) {
    specRows.push({
      label: 'ATM',
      icon: <DollarSign className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.atm}</span>,
    });
  }

  // 9. Mobile Pay
  if (card.mobilePay !== undefined && card.mobilePay !== null) {
    specRows.push({
      label: 'Mobile Pay',
      icon: <Smartphone className="w-3.5 h-3.5 text-white/50" />,
      valueNode: card.mobilePay ? (
        <span className="inline-flex items-center gap-1 text-[#5CF2C0] font-medium">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Ya (Apple/Google Pay)</span>
        </span>
      ) : (
        <span className="text-white/40">–</span>
      ),
    });
  }

  // 10. Aset Disokong
  if (card.assets) {
    specRows.push({
      label: 'Aset Disokong',
      icon: <Wallet className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.assets}</span>,
    });
  }

  // 11. Kad Metal
  if (card.metal !== undefined && card.metal !== null) {
    specRows.push({
      label: 'Kad Metal',
      icon: <Sparkles className="w-3.5 h-3.5 text-white/50" />,
      valueNode: card.metal ? (
        <span className="inline-flex items-center gap-1 text-[#5CF2C0] font-medium">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Ya</span>
        </span>
      ) : (
        <span className="text-white/40">–</span>
      ),
    });
  }

  // 12. Bonus Daftar
  if (card.bonus) {
    specRows.push({
      label: 'Bonus Daftar',
      icon: <Gift className="w-3.5 h-3.5 text-[#5CF2C0]" />,
      valueNode: <span className="font-semibold text-white">{card.bonus}</span>,
    });
  }

  // 13. Wilayah
  if (card.regions) {
    specRows.push({
      label: 'Wilayah',
      icon: <MapPin className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span>{card.regions}</span>,
    });
  }

  // 14. Tersedia di Malaysia
  if (card.malaysia !== undefined) {
    const malaysiaLabel =
      card.malaysia === 'ya'
        ? { text: 'Ya', color: 'text-[#5CF2C0]' }
        : card.malaysia === 'tidak'
        ? { text: 'Tidak', color: 'text-red-400' }
        : { text: 'Belum disahkan', color: 'text-white/60' };

    specRows.push({
      label: 'Tersedia di Malaysia',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-white/50" />,
      valueNode: <span className={`font-semibold ${malaysiaLabel.color}`}>{malaysiaLabel.text}</span>,
    });
  }

  const initial = card.name.charAt(0).toUpperCase();

  // Features count
  const allFeatures = card.features || [];
  const visibleFeatures = featuresExpanded ? allFeatures : allFeatures.slice(0, 4);
  const remainingCount = allFeatures.length - 4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#0B1430] border border-[#5CF2C0]/50 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-[#5CF2C0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Dialog (max 640px, radius 16px, bottom sheet on mobile) */}
      <div
        className="relative w-full sm:max-w-[640px] max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-[#0B1430] border-t sm:border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 animate-slideUp sm:animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-lg bg-[#060B1E] text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer z-10"
          aria-label="Tutup Paparan"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ================================================== */}
        {/* HEADER: Logo, Name, Issuer Tag, Main Button */}
        {/* ================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 sm:pt-0 pr-8 sm:pr-10 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            {/* Round Card Logo */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md border border-white/20 overflow-hidden bg-white p-1.5"
            >
              {card.logoUrl ? (
                <img
                  src={card.logoFallbackUrl || card.logoUrl}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (card.logoFallbackUrl && e.currentTarget.src !== card.logoFallbackUrl) {
                      e.currentTarget.src = card.logoFallbackUrl;
                    }
                  }}
                />
              ) : (
                <span
                  className="font-heading font-extrabold text-lg"
                  style={{ color: card.color || '#060B1E' }}
                >
                  {initial}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
                {card.name} Card
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/60 uppercase tracking-wider font-medium">
                  {card.network ? `${card.network} · Kad Kripto` : 'Kad Kripto'}
                </span>
                {card.featured && (
                  <span className="px-2 py-0.5 rounded-full bg-[#5CF2C0]/15 text-[#5CF2C0] font-bold text-[9px] uppercase tracking-wider border border-[#5CF2C0]/30">
                    Pilihan Bicara Krypto
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Action Button */}
          {destinationLink && (
            <a
              href={destinationLink}
              target="_blank"
              rel={isAffiliate ? 'sponsored noopener' : 'noopener noreferrer'}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                card.featured
                  ? 'bg-[#5CF2C0] text-[#060B1E] hover:bg-[#4ee0b0] shadow-md shadow-[#5CF2C0]/20'
                  : 'bg-[#152238] border border-white/10 hover:border-[#5CF2C0]/50 text-white hover:text-[#5CF2C0]'
              }`}
            >
              <span>Mohon Kad {card.name} ↗</span>
            </a>
          )}
        </div>

        {/* ================================================== */}
        {/* 2-COLUMN SPEC SHEET TABLE */}
        {/* ================================================== */}
        {specRows.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#060B1E]">
            <div className="px-4 py-2.5 bg-[#081026] border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              Spesifikasi Lengkap
            </div>
            <div className="divide-y divide-white/[0.05]">
              {specRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm ${
                    idx % 2 === 1 ? 'bg-white/[0.02]' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 text-white/60 font-medium">
                    {row.icon}
                    <span>{row.label}</span>
                  </div>
                  <div className="text-right text-white font-medium pl-3">
                    {row.valueNode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* CIRI-CIRI CHECKLIST SECTION */}
        {/* ================================================== */}
        {allFeatures.length > 0 && (
          <div className="p-4 rounded-xl bg-[#060B1E] border border-white/[0.08] space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50 flex items-center justify-between">
              <span>Ciri-ciri</span>
              <span className="text-[10px] text-white/40">{allFeatures.length} ciri utama</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-white/80">
              {visibleFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#5CF2C0]/15 text-[#5CF2C0] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span className="leading-relaxed">{feat}</span>
                </li>
              ))}
            </ul>

            {/* "+X lagi" expansion button */}
            {remainingCount > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setFeaturesExpanded(!featuresExpanded)}
                  className="text-xs font-semibold text-[#5CF2C0] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {featuresExpanded ? (
                    <>
                      <span>Tunjuk kurang</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>+{remainingCount} ciri lagi</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* REFERRAL CODE BOX (if code exists) */}
        {/* ================================================== */}
        {Boolean(card.code) && (
          <div className="p-4 rounded-xl bg-[#08132B] border border-[#5CF2C0]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#5CF2C0]">
                Kod Rujukan / Referral Code
              </div>
              <div className="text-xs text-white/60">
                Gunakan kod ini semasa pendaftaran untuk dapatkan bonus/rebat.
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="font-mono text-base font-bold text-white px-3 py-1.5 rounded-lg bg-[#060B1E] border border-white/10 tracking-wider">
                {card.code}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(card.code!)}
                className="px-3 py-2 rounded-lg bg-[#5CF2C0] hover:bg-[#4ee0b0] text-[#060B1E] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Salin kod"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* FOOTER NOTE */}
        {/* ================================================== */}
        <div className="text-center text-[11px] text-white/40 pt-1 leading-relaxed">
          Maklumat boleh berubah. Sila semak laman rasmi sebelum memohon.
        </div>
      </div>
    </div>
  );
};
