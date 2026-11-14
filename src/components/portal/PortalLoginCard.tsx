import React, { useState } from 'react';
import { CONFIG } from '../../config';
import { supabase } from '../../lib/supabase';
import { Link } from '../../router';
import { AlertCircle, MessageCircle, ArrowRight } from 'lucide-react';

interface PortalLoginCardProps {
  hasAuthError: boolean;
}

export const PortalLoginCard: React.FC<PortalLoginCardProps> = ({ hasAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthInvokeError, setOauthInvokeError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setOauthInvokeError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal`,
        },
      });
      if (error) {
        setOauthInvokeError(error.message || 'Gagal memulakan log masuk Google.');
        setIsLoading(false);
      }
    } catch {
      setOauthInvokeError('Gagal menyambung ke perkhidmatan log masuk. Sila cuba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5CF2C0]">
            PORTAL PELAJAR
          </div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-white tracking-[-0.02em] leading-snug">
            Log masuk untuk pelajar Bicara Krypto
          </h1>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            Guna akaun Google yang sama dengan email semasa anda mendaftar kelas.
          </p>
        </div>

        {hasAuthError && (
          <div className="rounded-xl bg-[#E5484D]/10 border border-[#E5484D]/35 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#E5484D] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white">Akses ditolak</h2>
                <p className="text-xs text-white/75 leading-relaxed">
                  Email ini tidak berdaftar sebagai pelajar Bicara Krypto. Pastikan anda guna Gmail yang sama semasa mendaftar kelas.
                </p>
              </div>
            </div>
            <a
              href={CONFIG.portal.whatsappHelp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#E5484D] hover:bg-[#E5484D]/90 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi kami di WhatsApp</span>
            </a>
          </div>
        )}

        {oauthInvokeError && (
          <div className="rounded-xl bg-[#E5484D]/10 border border-[#E5484D]/35 p-3 text-xs text-white/80 text-center">
            {oauthInvokeError}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-white hover:bg-white/95 text-[#060B1E] font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{isLoading ? 'Menghubungkan ke Google...' : 'Log masuk dengan Google'}</span>
          </button>

          <div className="text-center pt-1">
            <Link
              to="/#kelas"
              className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-[#5CF2C0] transition-colors"
            >
              <span>Bukan pelajar lagi? Lihat kelas CAB &amp; KITA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
