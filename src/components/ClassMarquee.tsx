import React, { useState } from 'react';

export interface MarqueePlatformItem {
  id: string;
  name: string;
  icon: string;
  fallback: string;
  bg?: boolean;
}

const CAB_PLATFORMS: MarqueePlatformItem[] = [
  { id: 'luno', name: 'Luno', icon: 'https://googleusercontent.com/d/1ULvTumhsUJduuX3U7fVJaDrwfmK4evoI/', fallback: 'https://lh3.googleusercontent.com/d/1ULvTumhsUJduuX3U7fVJaDrwfmK4evoI', bg: true },
  { id: 'hata', name: 'HATA', icon: 'https://googleusercontent.com/d/1Pi5zw2Nei8OYfVK4kGG9nZQ5MF5NuHx1/', fallback: 'https://lh3.googleusercontent.com/d/1Pi5zw2Nei8OYfVK4kGG9nZQ5MF5NuHx1', bg: false },
  { id: 'binance', name: 'Binance', icon: 'https://googleusercontent.com/d/1LkvVC6dvuwADoIG7uZB0Y7Jawx3zAc4U/', fallback: 'https://lh3.googleusercontent.com/d/1LkvVC6dvuwADoIG7uZB0Y7Jawx3zAc4U', bg: true },
  { id: 'bybit', name: 'Bybit', icon: 'https://googleusercontent.com/d/1c_lDg-rckRYX0BcqhlaVhPjGcQ86Z97G/', fallback: 'https://lh3.googleusercontent.com/d/1c_lDg-rckRYX0BcqhlaVhPjGcQ86Z97G', bg: true },
];

const KITA_PLATFORMS: MarqueePlatformItem[] = [
  { id: 'tradingview', name: 'TradingView', icon: 'https://googleusercontent.com/d/1gNJD9WAEjZJMuuyUJCk6DB7NHzFxJf5M/', fallback: 'https://lh3.googleusercontent.com/d/1gNJD9WAEjZJMuuyUJCk6DB7NHzFxJf5M', bg: true },
  { id: 'binance', name: 'Binance', icon: 'https://googleusercontent.com/d/1LkvVC6dvuwADoIG7uZB0Y7Jawx3zAc4U/', fallback: 'https://lh3.googleusercontent.com/d/1LkvVC6dvuwADoIG7uZB0Y7Jawx3zAc4U', bg: true },
  { id: 'bybit', name: 'Bybit', icon: 'https://googleusercontent.com/d/1c_lDg-rckRYX0BcqhlaVhPjGcQ86Z97G/', fallback: 'https://lh3.googleusercontent.com/d/1c_lDg-rckRYX0BcqhlaVhPjGcQ86Z97G', bg: true },
  { id: 'hyperliquid', name: 'Hyperliquid', icon: 'https://googleusercontent.com/d/1-Y5AUnLTxZN9NLwr37ill43aUpq_FpRD/', fallback: 'https://lh3.googleusercontent.com/d/1-Y5AUnLTxZN9NLwr37ill43aUpq_FpRD', bg: true },
];

const LogoPill: React.FC<{ item: MarqueePlatformItem }> = ({ item }) => {
  const [src, setSrc] = useState(item.icon);

  const handleError = () => {
    if (src === item.icon) {
      setSrc(item.fallback);
    }
  };

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#0B1430] border border-white/[0.08] hover:border-white/20 shrink-0 transition-colors">
      <div className={`w-7 h-7 rounded-full overflow-hidden ${item.bg ? 'bg-white p-1' : ''} flex items-center justify-center shrink-0`}>
        <img
          src={src}
          alt={item.name}
          onError={handleError}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-contain"
        />
      </div>
      <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
        {item.name}
      </span>
    </div>
  );
};

export const ClassMarquee: React.FC<{ className?: string; classType?: 'cab' | 'kita' | 'combo' }> = ({
  className = '',
  classType = 'cab',
}) => {
  const baseItems = classType === 'kita' ? KITA_PLATFORMS : CAB_PLATFORMS;
  
  // Multiply so that the track seamlessly fills any screen
  const track = [...baseItems, ...baseItems, ...baseItems, ...baseItems, ...baseItems, ...baseItems];

  return (
    <section 
      aria-label="Platform yang digunakan dalam kelas"
      className={`w-full bg-[#060B1E] border-y border-white/[0.08] py-6 sm:py-7 space-y-3.5 overflow-hidden ${className}`}
    >
      <div className="text-[11px] uppercase tracking-[0.1em] text-white/50 font-medium text-center">
        Platform yang digunakan dalam kelas
      </div>
      <div className="animate-marquee flex items-center gap-6 sm:gap-8">
        {track.map((item, idx) => (
          <LogoPill key={`${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </section>
  );
};
