import React, { useState } from "react";

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
  onOpenDetails?: () => void;
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
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!p.code) return;
    try {
      await navigator.clipboard.writeText(p.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const brandColor = p.brandColor || "#1F5BFF";

  const levelLabel =
    p.level === "pemula"
      ? "PEMULA"
      : p.level === "risikoTinggi"
      ? "RISIKO TINGGI"
      : "BERPENGALAMAN";

  const steps =
    p.conditions && p.conditions.length > 0
      ? p.conditions.slice(0, 3)
      : ["Daftar akaun", "Sahkan identiti (KYC)"];

  return (
    <div className="pc-card group" style={{ ["--b" as any]: brandColor }}>
      {/* Top Hero Panel */}
      <div className="pc-hero">
        {/* Large Faded Logo in Background */}
        <div className="pc-coin">
          <div className="pc-inner">
            <img
              src={p.iconColor}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={fallback}
            />
          </div>
        </div>

        {/* Level Badge in top right */}
        <div className="pc-top">
          <span className={"pc-pill" + (p.level === "risikoTinggi" ? " risk" : "")}>
            {levelLabel}
          </span>
        </div>

        {/* Brand Avatar, Category Label, Name & Offer */}
        <div className="pc-txt">
          <div className={"pc-av" + (p.avatarStyle === "tile" ? " tile" : "")}>
            <img
              src={p.iconColor}
              alt={p.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={fallback}
            />
          </div>
          {p.categoryLabel && <div className="pc-cat">{p.categoryLabel}</div>}
          <div className="pc-name">{p.name}</div>
          <div className="pc-rw">{p.reward || p.description}</div>
        </div>
      </div>

      {/* Bottom Details Panel */}
      <div className="pc-det">
        {/* Checkmark steps */}
        <div className="space-y-1.5">
          {steps.map((st, i) => (
            <div key={i} className="pc-li">
              ✓ {st}
            </div>
          ))}
        </div>

        {/* Referral Code Box */}
        {Boolean(p.code && p.code.trim()) && (
          <button
            type="button"
            className="pc-code"
            onClick={copy}
            title="Salin kod rujukan"
          >
            <span className="k">KOD</span>
            <span className="v">{p.code}</span>
            <span className="c">{copied ? "Disalin!" : "⧉ Salin"}</span>
          </button>
        )}

        {/* Register CTA Button */}
        <a
          className={"pc-btn" + (p.featured ? " feat" : "")}
          href={p.affiliateLink}
          target="_blank"
          rel="sponsored noopener"
        >
          <span>Daftar {p.name}</span>
        </a>

        {/* Modal trigger: Cara claim · Syarat · FAQ */}
        <button
          type="button"
          className="pc-foot"
          onClick={p.onOpenDetails}
        >
          <span>Cara claim · Syarat · FAQ</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
