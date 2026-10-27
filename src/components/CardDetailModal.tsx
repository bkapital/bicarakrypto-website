import React, { useState, useEffect } from 'react';
import { CryptoCardItem } from '../config';
import { 
  X, 
  Check, 
  Copy, 
  CreditCard, 
  Calendar, 
  Coins, 
  DollarSign, 
  Smartphone, 
  CheckCircle2,
  FileText
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

  const destinationLink = card.link || card.affiliateLink || card.officialLink;

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

  // Build spec sheet rows with exact Malay labels (hide empty fields)
  const specRows: {
    label: string;
    icon: React.ReactNode;
    value: string;
  }[] = [];

  if (card.network && card.network.trim()) {
    specRows.push({
      label: 'Rangkaian',
      icon: <CreditCard className="w-3.5 h-3.5 text-white/50" />,
      value: card.network,
    });
  }

  if (card.cardType && card.cardType.trim()) {
    specRows.push({
      label: 'Jenis Kad',
      icon: <CreditCard className="w-3.5 h-3.5 text-white/50" />,
      value: card.cardType,
    });
  }

  if (card.physical && card.physical.trim()) {
    specRows.push({
      label: 'Kad Fizikal',
      icon: <CreditCard className="w-3.5 h-3.5 text-white/50" />,
      value: card.physical,
    });
  }

  if (card.virtual && card.virtual.trim()) {
    specRows.push({
      label: 'Kad Virtual',
      icon: <Smartphone className="w-3.5 h-3.5 text-white/50" />,
      value: card.virtual,
    });
  }

  if (card.issueFee && card.issueFee.trim()) {
    specRows.push({
      label: 'Yuran Kad',
      icon: <DollarSign className="w-3.5 h-3.5 text-white/50" />,
      value: card.issueFee,
    });
  }

  if (card.annualFee && card.annualFee.trim()) {
    specRows.push({
      label: 'Yuran Tahunan',
      icon: <Calendar className="w-3.5 h-3.5 text-white/50" />,
      value: card.annualFee,
    });
  }

  if (card.topup && card.topup.trim()) {
    specRows.push({
      label: 'Top-up Crypto',
      icon: <Coins className="w-3.5 h-3.5 text-white/50" />,
      value: card.topup,
    });
  }

  if (card.mobilePay && card.mobilePay.trim()) {
    specRows.push({
      label: 'Apple / Google Pay',
      icon: <Smartphone className="w-3.5 h-3.5 text-white/50" />,
      value: card.mobilePay,
    });
  }

  if (card.malaysia && card.malaysia.trim()) {
    specRows.push({
      label: 'Guna di Malaysia',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-white/50" />,
      value: card.malaysia,
    });
  }

  if (card.summary && card.summary.trim()) {
    specRows.push({
      label: 'Ringkasan',
      icon: <FileText className="w-3.5 h-3.5 text-white/50" />,
      value: card.summary,
    });
  }

  // Pros and Cons bullet lists
  const prosList = card.pros ? card.pros.split(';').map((s) => s.trim()).filter(Boolean) : [];
  const consList = card.cons ? card.cons.split(';').map((s) => s.trim()).filter(Boolean) : [];

  const initial = card.name.charAt(0).toUpperCase();
  const logoSrc = card.iconWhite || card.iconColor || card.logoUrl;

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

      {/* Modal Dialog */}
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
        {/* HEADER: Logo, Name, Company, Main Button */}
        {/* ================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 sm:pt-0 pr-8 sm:pr-10 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            {/* Round Card Logo */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md border border-white/20 overflow-hidden bg-white/10 backdrop-blur-sm p-2"
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.retried) {
                      target.dataset.retried = '1';
                      target.src = target.src.replace('https://googleusercontent.com', 'https://lh3.googleusercontent.com').replace(/\/$/, '');
                    } else if (card.iconColor && target.src !== card.iconColor) {
                      target.src = card.iconColor;
                    }
                  }}
                />
              ) : (
                <span
                  className="font-heading font-extrabold text-lg text-white"
                >
                  {initial}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
                {card.name}
              </h3>
              <div className="flex items-center gap-2">
                {card.company && (
                  <span className="text-[11px] text-white/60 font-medium">
                    {card.company}
                  </span>
                )}
                {card.network && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.08] border border-white/10 text-white/70 font-semibold">
                    {card.network}
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
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer shrink-0 bg-[#5CF2C0] text-[#060B1E] hover:opacity-95 shadow-md"
            >
              <span>Mohon Kad {card.name}</span>
            </a>
          )}
        </div>

        {/* ================================================== */}
        {/* SPEC SHEET TABLE (with exact Malay labels) */}
        {/* ================================================== */}
        {specRows.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#060B1E]">
            <div className="px-4 py-2.5 bg-[#081026] border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              Spesifikasi Kad
            </div>
            <div className="divide-y divide-white/[0.05]">
              {specRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 text-xs sm:text-sm gap-1 sm:gap-4 ${
                    idx % 2 === 1 ? 'bg-white/[0.02]' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 text-white/60 font-medium shrink-0">
                    {row.icon}
                    <span>{row.label}</span>
                  </div>
                  <div className="sm:text-right text-white font-medium sm:pl-3 break-words">
                    {row.label === 'Guna di Malaysia' && row.value.toLowerCase() === 'ya' ? (
                      <span className="text-[#5CF2C0] font-semibold flex items-center gap-1 sm:justify-end">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Ya</span>
                      </span>
                    ) : (
                      <span>{row.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* PROS & CONS (Kelebihan & Kekurangan) */}
        {/* ================================================== */}
        {(prosList.length > 0 || consList.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kelebihan */}
            {prosList.length > 0 && (
              <div className="p-4 rounded-xl bg-[#060B1E] border border-[#5CF2C0]/20 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5CF2C0]">
                  Kelebihan
                </div>
                <ul className="space-y-2 text-xs text-white/80">
                  {prosList.map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#5CF2C0]/15 text-[#5CF2C0] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </span>
                      <span className="leading-relaxed">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Kekurangan */}
            {consList.length > 0 && (
              <div className="p-4 rounded-xl bg-[#060B1E] border border-red-500/20 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-400">
                  Kekurangan
                </div>
                <ul className="space-y-2 text-xs text-white/80">
                  {consList.map((con, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-red-400/15 text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✕
                      </span>
                      <span className="leading-relaxed">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* REFERRAL CODE BOX (if code exists) */}
        {/* ================================================== */}
        {Boolean(card.code && card.code.trim()) && (
          <div className="p-4 rounded-xl bg-[#08132B] border border-[#5CF2C0]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#5CF2C0]">
                Kod Rujukan / Referral Code
              </div>
              <div className="text-xs text-white/60">
                Gunakan kod ini semasa pendaftaran.
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="font-mono text-base font-bold text-white px-3 py-1.5 rounded-lg bg-[#060B1E] border border-white/10 tracking-wider">
                {card.code}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(card.code)}
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
        {/* FOOTER: Checked Date & Dynamic Note */}
        {/* ================================================== */}
        <div className="pt-3 border-t border-white/[0.08] text-center space-y-1">
          {card.checked && (
            <div className="text-xs text-white/50 font-medium">
              Maklumat disemak: {card.checked}
            </div>
          )}
          <div className="text-[11px] text-white/40 leading-relaxed">
            Yuran boleh berubah. Sahkan dalam app sebelum mendaftar.
          </div>
        </div>
      </div>
    </div>
  );
};
