import React from 'react';
import { CryptoCardItem } from '../config';
import { Plus, Wifi } from 'lucide-react';

interface BankCardVisualProps {
  card: CryptoCardItem;
  onOpenInfo?: (e?: React.MouseEvent) => void;
  size?: 'normal' | 'large' | 'small';
  interactive?: boolean;
}

// Check if color is bright to adjust text contrast
export function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165;
}

// Slightly darken/lighten color for clean diagonal gradient
function getGradientEnd(hex: string, isLight: boolean): string {
  if (isLight) {
    return 'rgba(0, 0, 0, 0.15)';
  }
  return 'rgba(0, 0, 0, 0.45)';
}

export const BankCardVisual: React.FC<BankCardVisualProps> = ({
  card,
  onOpenInfo,
  size = 'normal',
  interactive = true,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const cardColor = card.brandColor || card.color || (card.id === 'redotpay' ? '#8F221E' : card.id === 'tevau' ? '#143522' : '#0B1430');
  const isLight = isLightColor(cardColor);
  const textColor = isLight ? '#02124A' : '#FFFFFF';
  const subTextColor = isLight ? 'rgba(2, 18, 74, 0.65)' : 'rgba(255, 255, 255, 0.65)';
  const borderColor = isLight ? 'rgba(2, 18, 74, 0.15)' : 'rgba(255, 255, 255, 0.18)';
  const gradientEnd = getGradientEnd(cardColor, isLight);

  const initial = card.name.charAt(0).toUpperCase();

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const destinationLink = card.link || card.affiliateLink || card.officialLink;

  const hasStats = Boolean(card.cashback || card.fx || card.fxFee || card.reward);

  const handleCardClick = () => {
    if (!interactive) return;

    if (destinationLink) {
      window.open(destinationLink, '_blank', 'noopener,noreferrer');
    } else {
      onOpenInfo?.();
    }
  };

  const logoSrc = card.iconWhite || card.iconColor || card.logoUrl;

  return (
    <div
      onClick={handleCardClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`group relative w-full aspect-[1.586/1] rounded-[20px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden select-none transition-all duration-300 ${
        interactive
          ? 'cursor-pointer hover:-translate-y-1.5 hover:rotate-[0.5deg] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#5CF2C0]'
          : ''
      } ${isSmall ? 'p-3 rounded-xl' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor} 50%, ${gradientEnd} 100%)`,
        boxShadow: isLight
          ? '0 12px 28px -6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
          : '0 14px 32px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Glossy sheen overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'linear-gradient(115deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 45%, transparent 60%)',
        }}
      />

      {/* TOP ROW: Brand initial logo + Card Name + ("+" Info Button) */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Brand Logo */}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden bg-white/10 backdrop-blur-sm p-1.5 border border-white/20"
          >
            {logoSrc && !imgError ? (
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
                  } else if (card.logoFallbackUrl && target.src !== card.logoFallbackUrl) {
                    target.src = card.logoFallbackUrl;
                  } else {
                    setImgError(true);
                  }
                }}
              />
            ) : (
              <span
                className="font-heading font-extrabold text-sm text-white"
              >
                {initial}
              </span>
            )}
          </div>

          <div className="truncate">
            <div
              className={`font-heading font-bold truncate leading-tight ${
                isSmall ? 'text-xs' : isLarge ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
              }`}
              style={{ color: textColor }}
            >
              {card.name}
            </div>
          </div>
        </div>

        {/* Action icons in top right: "+" info button */}
        {interactive && (
          <div className="flex items-center gap-1.5 shrink-0 z-20">
            {/* "+" Button = Info Popup */}
            {onOpenInfo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInfo(e);
                }}
                title={`Maklumat lengkap ${card.name}`}
                aria-label={`Maklumat lengkap ${card.name}`}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shrink-0 bg-black/35 hover:bg-black/60 text-white backdrop-blur-sm border border-white/20 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* MIDDLE ROW: Realistic EMV Gold Smart Chip Graphic */}
      <div className="relative z-10 flex items-center justify-between my-auto py-1">
        {/* EMV Chip */}
        <div
          className={`rounded-md p-0.5 flex flex-col justify-between shadow-sm ${
            isSmall ? 'w-8 h-6' : isLarge ? 'w-14 h-10' : 'w-11 h-8 sm:w-12 sm:h-9'
          }`}
          style={{
            background: 'linear-gradient(135deg, #FFE58F 0%, #D48800 60%, #874D00 100%)',
            border: '1px solid #AD6800',
          }}
        >
          <div className="h-full w-full rounded-[3px] border border-[#874D00]/50 relative overflow-hidden flex flex-col justify-between p-1">
            <div className="w-full h-px bg-[#874D00]/60" />
            <div className="flex justify-between w-full">
              <div className="h-3 w-px bg-[#874D00]/60" />
              <div className="h-3 w-px bg-[#874D00]/60" />
            </div>
            <div className="w-full h-px bg-[#874D00]/60" />
          </div>
        </div>

        {/* Contactless Wave Icon */}
        <div
          className="opacity-70 rotate-90"
          style={{ color: textColor }}
        >
          <Wifi className={isSmall ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        </div>
      </div>

      {/* BOTTOM ROW: 3 Key Stats (CB · FX · Reward) */}
      <div className="relative z-10 flex items-end justify-between gap-2">
        {hasStats ? (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Stat 1: CB */}
            <div className="flex flex-col">
              <span
                className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 opacity-60"
                style={{ color: textColor }}
              >
                CB
              </span>
              <span className="text-xs sm:text-sm font-semibold leading-none text-[#5CF2C0]">
                {card.cashback || '-'}
              </span>
            </div>

            <span className="text-xs opacity-30 select-none pb-0.5" style={{ color: textColor }}>
              ·
            </span>

            {/* Stat 2: FX */}
            <div className="flex flex-col">
              <span
                className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 opacity-60"
                style={{ color: textColor }}
              >
                FX
              </span>
              <span
                className="text-xs sm:text-sm font-semibold leading-none"
                style={{ color: textColor }}
              >
                {card.fx || card.fxFee || '-'}
              </span>
            </div>

            <span className="text-xs opacity-30 select-none pb-0.5" style={{ color: textColor }}>
              ·
            </span>

            {/* Stat 3: Reward */}
            <div className="flex flex-col">
              <span
                className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider leading-none mb-1 opacity-60"
                style={{ color: textColor }}
              >
                Reward
              </span>
              <span
                className="text-xs sm:text-sm font-semibold leading-none"
                style={{ color: textColor }}
              >
                {card.reward || '-'}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div
              className={`font-mono font-medium tracking-widest ${
                isSmall ? 'text-[10px]' : isLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}
              style={{ color: textColor }}
            >
              •••• 8842
            </div>
            <div
              className="text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold mt-0.5"
              style={{ color: subTextColor }}
            >
              PEMEGANG KAD
            </div>
          </div>
        )}

        {/* Network Name in Bold Italic */}
        {card.network && (
          <div className="text-right shrink-0">
            <span
              className={`font-heading font-black italic tracking-wider ${
                isSmall ? 'text-xs' : isLarge ? 'text-xl sm:text-2xl' : 'text-sm sm:text-lg'
              }`}
              style={{
                color: textColor,
                textShadow: isLight
                  ? '0 1px 1px rgba(255,255,255,0.4)'
                  : '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              {card.network}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
