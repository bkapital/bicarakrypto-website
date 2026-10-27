import React, { useState } from "react";

type Platform = {
  id: string;
  name: string;
  categoryLabel: string;          // e.g. "BERLESEN MALAYSIA"
  level: "pemula" | "berpengalaman" | "risikoTinggi";
  brandColor: string;
  reward?: string;                // e.g. "Beli RM250 kripto, dapat RM50 Bitcoin"
  description?: string;           // used if no reward
  conditions?: string[];
  code?: string;
  affiliateLink: string;
  iconColor: string;
  iconWhite: string;
  avatarStyle?: "tile";
  featured?: boolean;
  onOpenDetails?: () => void;     // "Cara claim · Syarat · FAQ"
};

const LEVEL_LABEL = { pemula: "PEMULA", berpengalaman: "BERPENGALAMAN", risikoTinggi: "RISIKO TINGGI" };

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
    try { await navigator.clipboard.writeText(p.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className="pc-card" style={{ ["--b" as any]: p.brandColor }}>
      <div className="pc-hero">
        <div className="pc-coin">
          <div className="pc-inner">
            <img src={p.iconWhite} alt="" referrerPolicy="no-referrer" loading="lazy" onError={fallback} />
          </div>
        </div>
        <div className="pc-top">
          <span className={"pc-pill" + (p.level === "risikoTinggi" ? " risk" : "")}>{LEVEL_LABEL[p.level]}</span>
        </div>
        <div className="pc-txt">
          <div className={"pc-av" + (p.avatarStyle === "tile" ? " tile" : "")}>
            <img src={p.iconColor} alt={p.name} referrerPolicy="no-referrer" loading="lazy" onError={fallback} />
          </div>
          <div className="pc-cat">{p.categoryLabel}</div>
          <div className="pc-name">{p.name}</div>
          <div className="pc-rw">{p.reward || p.description}</div>
        </div>
      </div>
      <div className="pc-det">
        {(p.conditions || []).slice(0, 2).map((c, i) => <div key={i} className="pc-li">✓ {c}</div>)}
        {p.code && (
          <button className="pc-code" onClick={copy}>
            <span className="k">KOD</span><span className="v">{p.code}</span>
            <span className="c">{copied ? "Disalin!" : "⧉ Salin"}</span>
          </button>
        )}
        <a className={"pc-btn" + (p.featured ? " feat" : "")} href={p.affiliateLink} target="_blank" rel="sponsored noopener">
          Daftar {p.name}
        </a>
        <button className="pc-foot" onClick={p.onOpenDetails}><span>Cara claim · Syarat · FAQ</span></button>
      </div>
    </div>
  );
}
