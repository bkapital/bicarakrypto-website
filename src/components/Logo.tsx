import React, { useState } from 'react';

export const BICARA_KRYPTO_LOGO_URL = 'https://googleusercontent.com/d/18AU0n1KUM-8jbAMPu1yU0t5LAMPZVL7Z/';
const BICARA_KRYPTO_LOGO_FALLBACK = 'https://lh3.googleusercontent.com/d/18AU0n1KUM-8jbAMPu1yU0t5LAMPZVL7Z';
const BICARA_KRYPTO_LOGO_LOCAL = '/bicara-krypto-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showTagline = false, 
  iconOnly = false,
  className = '' 
}) => {
  const [logoSrc, setLogoSrc] = useState(BICARA_KRYPTO_LOGO_URL);

  const iconDimensions = {
    sm: { box: 34, text: 'text-lg', tag: 'text-[10px]' },
    md: { box: 42, text: 'text-xl', tag: 'text-[11px]' },
    lg: { box: 50, text: 'text-2xl', tag: 'text-xs' },
    xl: { box: 64, text: 'text-3xl', tag: 'text-sm' },
  }[size];

  const handleLogoError = () => {
    if (logoSrc === BICARA_KRYPTO_LOGO_URL) {
      setLogoSrc(BICARA_KRYPTO_LOGO_FALLBACK);
    } else if (logoSrc === BICARA_KRYPTO_LOGO_FALLBACK) {
      setLogoSrc(BICARA_KRYPTO_LOGO_LOCAL);
    }
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Bicara Krypto Logo Image */}
      <div 
        className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: iconDimensions.box, height: iconDimensions.box }}
      >
        <img
          src={logoSrc}
          alt="Bicara Krypto"
          className="w-full h-full object-contain"
          onError={handleLogoError}
          loading="eager"
        />
      </div>

      {/* Brand Wordmark (hidden if iconOnly) */}
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-[-0.02em] leading-tight">
            <span className={`font-heading font-bold text-white ${iconDimensions.text}`}>
              Bicara
            </span>
            <span className={`font-heading font-bold text-[#5CF2C0] ml-1.5 ${iconDimensions.text}`}>
              Krypto
            </span>
          </div>
          {showTagline && (
            <span className={`${iconDimensions.tag} text-white/60 tracking-[0.04em] font-medium leading-none mt-1`}>
              Perintis Crypto & Blockchain Malaysia
            </span>
          )}
        </div>
      )}
    </div>
  );
};
