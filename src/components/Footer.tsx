import React from 'react';
import { CONFIG } from '../config';
import { Logo } from './Logo';
import { Link } from '../router';
import { 
  Send, 
  Youtube, 
  Facebook, 
  Instagram, 
  Twitter, 
  Video,
  CreditCard,
  Building2,
  Wallet
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#060B1E] border-t border-white/[0.08] pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Grid: Brand & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block focus:outline-none">
              <Logo size="md" showTagline={true} />
            </Link>
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Platform pendidikan rasmi Bicara Krypto. Belajar pelaburan dan trading kripto berlandaskan ilmu asas fundamental, analisis teknikal dan pengurusan risiko tanpa sebarang janji keuntungan.
            </p>

            {/* Social Media Links */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <a
                href={CONFIG.brand.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-[#0B1430] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-[#5CF2C0] hover:border-white/20 transition-colors"
                aria-label="TikTok"
              >
                <Video className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.brand.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-[#0B1430] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-[#5CF2C0] hover:border-white/20 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.brand.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-[#0B1430] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-[#5CF2C0] hover:border-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.brand.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-[#0B1430] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-[#5CF2C0] hover:border-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.brand.socials.x}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-[#0B1430] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-[#5CF2C0] hover:border-white/20 transition-colors"
                aria-label="X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={CONFIG.brand.socials.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-[#0B1430] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-[#5CF2C0] hover:border-white/20 transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">
              Pautan laman
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <Link to="/#kelas" className="hover:text-white transition-colors">
                  Senarai kelas
                </Link>
              </li>
              <li>
                <Link to="/kelas/cab" className="hover:text-white transition-colors">
                  Crypto Alpha Bootcamp (CAB)
                </Link>
              </li>
              <li>
                <Link to="/kelas/kita" className="hover:text-white transition-colors">
                  Kursus Impak Teknikal Analisis (KITA)
                </Link>
              </li>
              <li>
                <Link to="/kelas/combo" className="hover:text-white transition-colors">
                  Pakej Combo CAB + KITA
                </Link>
              </li>
              <li>
                <Link to="/kad-kripto" className="hover:text-white transition-colors">
                  Direktori kad kripto
                </Link>
              </li>
              <li>
                <Link to="/beli-jual-kripto" className="hover:text-white transition-colors">
                  Platform Kripto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">
              Bantuan
            </h3>
            <div className="space-y-2.5 text-sm text-white/60">
              <div>
                <span className="text-white/40 block text-xs">WhatsApp khidmat pelanggan:</span>
                <a
                  href={CONFIG.brand.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white hover:text-[#5CF2C0] transition-colors"
                >
                  {CONFIG.brand.whatsappPhone}
                </a>
              </div>
              <div>
                <span className="text-white/40 block text-xs">Email rasmi:</span>
                <a
                  href={`mailto:${CONFIG.brand.email}`}
                  className="hover:text-white transition-colors"
                >
                  {CONFIG.brand.email}
                </a>
              </div>
              <div className="pt-1">
                <Link
                  to="/hubungi"
                  className="inline-flex items-center text-xs text-[#5CF2C0] hover:underline"
                >
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Policy Links Row */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>
            Hak cipta terpelihara © Bitzar Ventures Sdn Bhd ({CONFIG.brand.registrationNo})
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/polisi-privasi" className="hover:text-white transition-colors">
              Polisi Privasi
            </Link>
            <span className="text-white/20">·</span>
            <Link to="/terma-syarat" className="hover:text-white transition-colors">
              Terma & Syarat
            </Link>
          </div>
        </div>

        {/* Small Risk & Affiliate Disclaimer */}
        <div className="p-4 rounded-xl bg-[#0B1430] border border-white/[0.08] text-[11px] text-white/50 leading-relaxed text-center sm:text-left">
          Kandungan laman ini adalah untuk tujuan pendidikan sahaja dan bukan nasihat kewangan. Pelaburan dan trading kripto berisiko tinggi dan anda boleh kehilangan sebahagian atau keseluruhan modal. Sesetengah pautan di laman ini adalah pautan affiliate.
        </div>
      </div>
    </footer>
  );
};
