import React from 'react';

export interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  has_cab: boolean;
  has_kita: boolean;
  status: string;
  nickname: string | null;
  leaderboard_opt_in: boolean;
}

export type PortalTab = 'kandungan' | 'leaderboard' | 'akaun';

export type MediaItem =
  | { type: 'image'; path: string }
  | { type: 'youtube'; url: string }
  | { type: 'link'; url: string; title?: string };

export interface ContentPost {
  id: string;
  audience: 'cab' | 'kita' | 'all' | string;
  title: string | null;
  body: string | null;
  media: MediaItem[] | null;
  published_at: string;
  edited_at: string | null;
}

export type LeaderboardPlatform = 'bybit' | 'gateio' | 'hata' | 'fomo';

export interface LeaderboardRow {
  rank: number;
  nickname: string;
  platform: string | null;
  account_masked: string | null;
  volume_usd: number | null;
  pnl_usd: number | null;
  winrate: number | null;
  is_me: boolean;
}

export interface PlatformAccount {
  id: string;
  platform: LeaderboardPlatform;
  account_ref: string;
  verified: boolean;
  created_at: string;
}

export const PORTAL_PLATFORMS: Array<{
  id: LeaderboardPlatform;
  label: string;
  isFomo?: boolean;
}> = [
  { id: 'bybit', label: 'Bybit' },
  { id: 'gateio', label: 'Gate.io' },
  { id: 'hata', label: 'HATA' },
  { id: 'fomo', label: 'FOMO', isFomo: true },
];

export function getPlatformLabel(id: string | null | undefined): string {
  const found = PORTAL_PLATFORMS.find((p) => p.id === id);
  return found ? found.label : id || '—';
}

export function getSafeHttpUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function extractYouTubeId(rawUrl: string | null | undefined): string | null {
  const safe = getSafeHttpUrl(rawUrl);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    let candidate = '';
    if (host === 'youtu.be') {
      candidate = u.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') {
        candidate = u.searchParams.get('v') || '';
      } else if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/live/')) {
        candidate = u.pathname.split('/')[2] || '';
      }
    }
    if (/^[A-Za-z0-9_-]{11}$/.test(candidate)) {
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

const KL_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis',
];

const KL_MONTHS_FULL = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];

export function formatKLDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const day = map.day || '';
  const monthIdx = Math.max(0, Math.min(11, Number(map.month || 1) - 1));
  const monthShort = KL_MONTHS_SHORT[monthIdx] || '';
  const year = map.year || '';
  const hour = map.hour || '';
  const minute = map.minute || '00';
  const dayPeriod = (map.dayPeriod || '').toLowerCase();

  return `${day} ${monthShort} ${year}, ${hour}:${minute} ${dayPeriod}`.trim();
}

export function getLastSixMonthsKL(): Array<{ value: string; label: string }> {
  const nowParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());

  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  for (const p of nowParts) {
    if (p.type === 'year') year = Number(p.value);
    if (p.type === 'month') month = Number(p.value);
  }

  const items: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 6; i++) {
    let m = month - i;
    let y = year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const mm = String(m).padStart(2, '0');
    items.push({
      value: `${y}-${mm}-01`,
      label: `${KL_MONTHS_FULL[m - 1]} ${y}`,
    });
  }
  return items;
}

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

export const SafeTextWithLinks: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(URL_REGEX);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (/^https?:\/\//i.test(part)) {
          // Strip trailing punctuation often attached to sentences
          let clean = part;
          let trailing = '';
          while (/[.,);!?]$/.test(clean)) {
            trailing = clean.slice(-1) + trailing;
            clean = clean.slice(0, -1);
          }
          const safe = getSafeHttpUrl(clean);
          if (safe) {
            return (
              <React.Fragment key={idx}>
                <a
                  href={safe}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5CF2C0] underline decoration-[#5CF2C0]/40 underline-offset-2 hover:decoration-[#5CF2C0] break-all"
                >
                  {clean}
                </a>
                {trailing}
              </React.Fragment>
            );
          }
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};
