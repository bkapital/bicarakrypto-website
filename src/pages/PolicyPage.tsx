import React from 'react';
import { CONFIG } from '../config';
import { Link } from '../router';
import { LEGAL_POLICIES } from '../data/legalPolicies';
import { ShieldCheck, RefreshCw, FileText } from 'lucide-react';

interface PolicyPageProps {
  type: 'privasi' | 'refund' | 'terma';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type }) => {
  const policy = LEGAL_POLICIES[type] || LEGAL_POLICIES.privasi;

  const tabs: { id: 'privasi' | 'refund' | 'terma'; label: string; url: string; icon: any }[] = [
    { id: 'privasi', label: '1. Privacy Policy', url: '/polisi-privasi', icon: ShieldCheck },
    { id: 'refund', label: '2. Refund Policy', url: '/polisi-refund', icon: RefreshCw },
    { id: 'terma', label: '3. Terms & Condition', url: '/terma-syarat', icon: FileText },
  ];

  return (
    <div className="space-y-8 pb-20 pt-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Link to="/" className="hover:text-white transition-colors">Utama</Link>
        <span>/</span>
        <span className="text-white/80 font-medium">{policy.title}</span>
      </div>

      {/* Policy Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/[0.08]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === type;
          return (
            <Link
              key={tab.id}
              to={tab.url}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#5CF2C0] text-[#060B1E] shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content Card */}
      <div className="p-6 sm:p-10 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[#5CF2C0] font-semibold">
            Bahagian {policy.number}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em] mt-1">
            {policy.title}
          </h1>
          <p className="text-sm text-white/60 mt-1">
            {policy.subtitle}
          </p>
        </div>

        <div className="pt-6 border-t border-white/[0.08]">
          {policy.content}
        </div>
      </div>

      {/* Route back to classes */}
      <div className="p-6 rounded-xl bg-[#0B1430] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-white text-base">
            Ingin mendaftar kelas Bicara Krypto?
          </div>
          <div className="text-xs text-white/60 mt-0.5">
            Sertai komuniti pelabur berilmu bagi intake {CONFIG.intakeMonth}.
          </div>
        </div>
        <Link
          to="/#kelas"
          className="px-6 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs shrink-0 flex items-center hover:opacity-95 transition-opacity"
        >
          <span>Pilih kelas anda</span>
        </Link>
      </div>
    </div>
  );
};
