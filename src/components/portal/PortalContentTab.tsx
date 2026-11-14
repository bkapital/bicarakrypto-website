import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ContentPost,
  MediaItem,
  StudentRecord,
  extractYouTubeId,
  formatKLDate,
  getSafeHttpUrl,
  SafeTextWithLinks,
} from './portalUtils';
import { ExternalLink, FileText, X, ZoomIn } from 'lucide-react';

interface PortalContentTabProps {
  student: StudentRecord;
}

type AudienceFilter = 'semua' | 'cab' | 'kita';

const PAGE_SIZE = 20;

const SignedImageMedia: React.FC<{
  path: string;
  onOpenLightbox: (url: string) => void;
}> = ({ path, onOpenLightbox }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('content')
          .createSignedUrl(path, 3600);
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setFailed(true);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (failed) {
    return (
      <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-6 text-center text-xs text-white/45">
        Gambar tidak dapat dimuatkan.
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="w-full h-52 rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenLightbox(signedUrl)}
      className="relative group w-full rounded-xl overflow-hidden border border-white/[0.08] bg-[#060B1E] block cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#5CF2C0]"
      title="Klik untuk lihat saiz penuh"
    >
      <img
        src={signedUrl}
        alt=""
        loading="lazy"
        className="w-full h-auto max-h-[520px] object-contain mx-auto"
      />
      <span className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-[#060B1E]/85 border border-white/15 text-white/80 text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-3.5 h-3.5 text-[#5CF2C0]" />
        <span>Saiz penuh</span>
      </span>
    </button>
  );
};

const PostCard: React.FC<{
  post: ContentPost;
  onOpenLightbox: (url: string) => void;
}> = ({ post, onOpenLightbox }) => {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || expanded) return;
    const check = () => {
      setIsClamped(el.scrollHeight > el.clientHeight + 2);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [post.body, expanded]);

  const audienceNorm = (post.audience || '').toLowerCase();
  const audienceBadge =
    audienceNorm === 'cab'
      ? {
          label: 'CAB',
          className: 'bg-[#5CF2C0]/15 text-[#5CF2C0] border-[#5CF2C0]/30',
        }
      : audienceNorm === 'kita'
      ? {
          label: 'KITA',
          className: 'bg-[#F2B417]/15 text-[#F2B417] border-[#F2B417]/30',
        }
      : {
          label: 'SEMUA',
          className: 'bg-white/[0.06] text-white/70 border-white/15',
        };

  const formattedDate = formatKLDate(post.published_at);
  const mediaList: MediaItem[] = Array.isArray(post.media) ? post.media : [];

  return (
    <article className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-7 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${audienceBadge.className}`}
        >
          {audienceBadge.label}
        </span>

        <div className="text-xs text-white/50">
          {formattedDate}
          {post.edited_at ? ' · disunting' : ''}
        </div>
      </div>

      {post.title && post.title.trim() && (
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-[-0.02em] leading-snug">
          {post.title}
        </h3>
      )}

      {post.body && post.body.trim() && (
        <div className="space-y-2">
          <div
            ref={bodyRef}
            className={`text-sm text-white/80 leading-relaxed whitespace-pre-line break-words ${
              expanded ? '' : 'line-clamp-6'
            }`}
          >
            <SafeTextWithLinks text={post.body} />
          </div>
          {(isClamped || expanded) && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-xs font-semibold text-[#5CF2C0] hover:underline cursor-pointer"
            >
              {expanded ? 'Tutup' : 'Baca lagi'}
            </button>
          )}
        </div>
      )}

      {mediaList.length > 0 && (
        <div className="space-y-3 pt-1">
          {mediaList.map((item, idx) => {
            if (!item || typeof item !== 'object') return null;

            if (item.type === 'image' && typeof item.path === 'string' && item.path.trim()) {
              return (
                <SignedImageMedia
                  key={`img-${idx}-${item.path}`}
                  path={item.path}
                  onOpenLightbox={onOpenLightbox}
                />
              );
            }

            if (item.type === 'youtube' && typeof item.url === 'string') {
              const videoId = extractYouTubeId(item.url);
              if (!videoId) return null;
              return (
                <div
                  key={`yt-${idx}-${videoId}`}
                  className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-[#060B1E]"
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title={post.title || 'Video YouTube'}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              );
            }

            if (item.type === 'link' && typeof item.url === 'string') {
              const safeUrl = getSafeHttpUrl(item.url);
              if (!safeUrl) return null;
              let domain = '';
              try {
                domain = new URL(safeUrl).hostname.replace(/^www\./, '');
              } catch {
                domain = safeUrl;
              }
              return (
                <a
                  key={`lnk-${idx}-${safeUrl}`}
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#060B1E] border border-white/[0.08] hover:border-[#5CF2C0]/40 transition-colors group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-semibold text-white group-hover:text-[#5CF2C0] transition-colors truncate">
                      {item.title && item.title.trim() ? item.title : safeUrl}
                    </div>
                    <div className="text-xs text-white/45 truncate">{domain}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-[#5CF2C0] shrink-0 transition-colors" />
                </a>
              );
            }

            return null;
          })}
        </div>
      )}
    </article>
  );
};

export const PortalContentTab: React.FC<PortalContentTabProps> = ({ student }) => {
  const [filter, setFilter] = useState<AudienceFilter>('semua');
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (offset: number, append: boolean, activeFilter: AudienceFilter) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        let query = supabase
          .from('content_posts')
          .select('id, audience, title, body, media, published_at, edited_at')
          .order('published_at', { ascending: false });

        if (activeFilter === 'cab') {
          query = query.in('audience', ['cab', 'all']);
        } else if (activeFilter === 'kita') {
          query = query.in('audience', ['kita', 'all']);
        }

        const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          setErrorMsg('Kandungan tidak dapat dimuatkan buat masa ini. Sila cuba lagi.');
          return;
        }

        const rows = (data || []) as ContentPost[];
        setHasMore(rows.length === PAGE_SIZE);
        if (append) {
          setPosts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            const next = rows.filter((r) => !seen.has(r.id));
            return [...prev, ...next];
          });
        } else {
          setPosts(rows);
        }
      } catch {
        setErrorMsg('Kandungan tidak dapat dimuatkan buat masa ini. Sila cuba lagi.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPosts(0, false, filter);
  }, [filter, fetchPosts]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxUrl]);

  const filterChips: Array<{ key: AudienceFilter; label: string }> = [
    { key: 'semua', label: 'Semua' },
  ];
  if (student.has_cab) {
    filterChips.push({ key: 'cab', label: 'CAB' });
  }
  if (student.has_kita) {
    filterChips.push({ key: 'kita', label: 'KITA' });
  }

  return (
    <div className="space-y-6">
      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1">
        {filterChips.map((chip) => {
          const isActive = filter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0]'
                  : 'bg-[#0B1430] text-white/70 border-white/[0.08] hover:border-white/25 hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Content states */}
      {loading ? (
        <div className="space-y-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-16 rounded-full bg-white/[0.08]" />
                <div className="h-4 w-32 rounded bg-white/[0.06]" />
              </div>
              <div className="h-6 w-2/3 rounded bg-white/[0.08]" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-white/[0.05]" />
                <div className="h-4 w-5/6 rounded bg-white/[0.05]" />
                <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="rounded-[20px] bg-[#0B1430] border border-[#E5484D]/30 p-6 text-center space-y-3">
          <p className="text-sm text-white/80">{errorMsg}</p>
          <button
            type="button"
            onClick={() => fetchPosts(0, false, filter)}
            className="px-4 py-2 rounded-lg bg-[#5CF2C0] text-[#060B1E] text-xs font-semibold cursor-pointer"
          >
            Cuba lagi
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-[#5CF2C0]/80" />
          </div>
          <p className="text-sm text-white/65 max-w-sm mx-auto leading-relaxed">
            Belum ada kandungan lagi. Kandungan eksklusif akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenLightbox={(url) => setLightboxUrl(url)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchPosts(posts.length, true, filter)}
                disabled={loadingMore}
                className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0B1430] border border-white/[0.12] hover:border-[#5CF2C0]/50 text-white hover:text-[#5CF2C0] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? 'Memuatkan...' : 'Muat lagi'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Tutup gambar"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
