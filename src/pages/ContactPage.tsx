import React from 'react';
import { CONFIG } from '../config';
import { 
  Phone, 
  Mail, 
  Briefcase, 
  ArrowRight
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="space-y-12 sm:space-y-16 pb-20 pt-6">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.02em] leading-tight">
          Hubungi Kami
        </h1>
      </section>

      {/* Direct Contacts & Collab (Centered) */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Saluran Terus */}
        <div className="p-8 sm:p-10 rounded-[20px] bg-[#0B1430] border border-white/[0.08] space-y-6 shadow-xl">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-medium">
              Saluran Rasmi
            </div>
            <h2 className="text-2xl font-bold text-white tracking-[-0.02em] mt-1">
              Saluran terus
            </h2>
          </div>

          <div className="space-y-3.5">
            <a
              href={CONFIG.brand.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:p-5 rounded-xl bg-[#060B1E] border border-white/[0.06] hover:border-white/20 flex items-center gap-4 transition-all group hover:bg-[#070E28]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0B1430] border border-white/10 flex items-center justify-center text-[#5CF2C0] shrink-0 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-[#5CF2C0] transition-colors">
                  WhatsApp Rasmi Team
                </div>
                <div className="text-sm text-white/70 font-mono mt-0.5">
                  {CONFIG.brand.whatsappPhone}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#5CF2C0] group-hover:translate-x-1 transition-all" />
            </a>

            <a
              href={`mailto:${CONFIG.brand.email}`}
              className="p-4 sm:p-5 rounded-xl bg-[#060B1E] border border-white/[0.06] hover:border-white/20 flex items-center gap-4 transition-all group hover:bg-[#070E28]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0B1430] border border-white/10 flex items-center justify-center text-[#5CF2C0] shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-[#5CF2C0] transition-colors">
                  Email Rasmi
                </div>
                <div className="text-sm text-white/70 font-mono mt-0.5 truncate">
                  {CONFIG.brand.email}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#5CF2C0] group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </div>

        {/* Kolaborasi & Projek */}
        <div className="p-8 sm:p-10 rounded-[20px] bg-[#0B1430] border border-white/[0.08] space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
            <Briefcase className="w-5 h-5 text-[#5CF2C0]" />
            <h3>Kolaborasi jenama & jemputan seminar</h3>
          </div>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            Untuk kerjasama media, ulasan projek blockchain, jemputan penceramah jemputan atau bimbingan korporat, sila hubungi kami terus melalui email rasmi.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${CONFIG.brand.email}?subject=Permohonan%20Kolaborasi%20Bicara%20Krypto`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-xs font-semibold text-white hover:bg-[#5CF2C0] hover:text-[#060B1E] hover:border-[#5CF2C0] transition-all"
            >
              <span>Hantar permohonan kolaborasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
