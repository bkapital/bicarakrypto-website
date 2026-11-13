import React from "react";

type Platform = {
  id: string;
  name: string;
  categoryLabel?: string;
  level: "pemula" | "berpengalaman" | "risikoTinggi";
  brandColor: string;
  reward?: string;
  description?: string;
  conditions?: string[];
  code?: string;
  affiliateLink: string;
  iconColor: string;
  iconWhite?: string;
  avatarStyle?: "tile";
  featured?: boolean;
  showLevelBadge?: boolean;
  scBadge?: { text: string; variant: 'mint' | 'muted' };
  onScBadgeClick?: () => void;
};

function fallback(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (!img.dataset.retried) {
    img.dataset.retried = "1";
    img.src = img.src.replace("https://googleusercontent.com", "https://lh3.googleusercontent.com").replace(/\/$/, "");
  } else {
    img.style.display = "none";
  }
}

export default function PlatformCard(p: Platform) {
  const brandColor = p.brandColor || "#1F5BFF";

  const showPemulaBadge =
    p.showLevelBadge ?? (p.id === "luno" || p.id === "hata");

  const useWhiteBgLogo =
    p.id === "hata" || p.id === "fomo" || p.id === "tradingview" || p.id === "bybit";
  const bgLogoSrc = useWhiteBgLogo && p.iconWhite ? p.iconWhite : p.iconColor;

  return (
    <div className="pc-card group" style={{ ["--b" as any]: brandColor }}>
      {/* Top Hero Panel */}
      <div className="pc-hero">
        {/* Large Faded Logo in Background */}
        <div className="pc-coin">
          <div className="pc-inner">
            <img
              src={bgLogoSrc}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={fallback}
            />
          </div>
        </div>

        {/* Level Badge in top right (PEMULA on Luno & HATA only) */}
        {showPemulaBadge && (
          <div className="pc-top">
            <span className="pc-pill">
              PEMULA
            </span>
          </div>
        )}

        {/* Brand Avatar, Category Label, Name & Offer */}
        <div className="pc-txt">
          <div
            className="pc-av"
            role="img"
            aria-label={p.name}
            style={{
              backgroundColor: "#FFFFFF",
              backgroundImage: `url('${p.iconColor}')`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: p.id === "hata" || p.id === "fomo" ? "100%" : "68%",
            }}
          />
          {p.categoryLabel && <div className="pc-cat">{p.categoryLabel}</div>}
          <div className="pc-name">{p.name}</div>
          {p.scBadge && (
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  p.onScBadgeClick?.();
                }}
                className={
                  p.scBadge.variant === "mint"
                    ? "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#5CF2C0]/15 text-[#5CF2C0] border border-[#5CF2C0]/30 hover:bg-[#5CF2C0]/25 transition-colors mb-1.5 cursor-pointer text-left"
                    : "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white/[0.06] text-white/60 border border-white/10 hover:border-white/25 hover:text-white/85 transition-colors mb-1.5 cursor-pointer text-left"
                }
              >
                {p.scBadge.text}
              </button>
            </div>
          )}
          {p.reward ? <div className="pc-rw">{p.reward}</div> : null}
        </div>
      </div>

      {/* Bottom Details Panel */}
      <div className="pc-det">
        {/* Register CTA Button */}
        <a
          className={"pc-btn" + (p.featured ? " feat" : "")}
          href={p.affiliateLink}
          target="_blank"
          rel="sponsored noopener"
        >
          <span>Daftar {p.name}</span>
        </a>
      </div>
    </div>
  );
}
