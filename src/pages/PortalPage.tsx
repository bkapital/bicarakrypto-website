import React, { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { useRouter } from '../router';
import { PortalTab, StudentRecord } from '../components/portal/portalUtils';
import { PortalLoginCard } from '../components/portal/PortalLoginCard';
import { PortalContentTab } from '../components/portal/PortalContentTab';
import { PortalLeaderboardTab } from '../components/portal/PortalLeaderboardTab';
import { PortalAccountTab } from '../components/portal/PortalAccountTab';
import { LogOut, MessageCircle, ShieldAlert } from 'lucide-react';

function readTabFromHash(hasKita: boolean): PortalTab {
  if (typeof window === 'undefined') return 'kandungan';
  const raw = window.location.hash.replace(/^#/, '').toLowerCase();
  if (raw === 'akaun') return 'akaun';
  if (raw === 'leaderboard' && hasKita) return 'leaderboard';
  return 'kandungan';
}

function detectAndCleanOAuthError(): boolean {
  if (typeof window === 'undefined') return false;

  const searchParams = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(rawHash.includes('=') ? rawHash : '');

  const hasError =
    searchParams.has('error') ||
    searchParams.has('error_description') ||
    hashParams.has('error') ||
    hashParams.has('error_description');

  if (hasError) {
    searchParams.delete('error');
    searchParams.delete('error_code');
    searchParams.delete('error_description');

    const remainingSearch = searchParams.toString();
    const keepHash =
      rawHash && !rawHash.includes('error') ? `#${rawHash}` : '';
    const nextUrl = `${window.location.pathname}${remainingSearch ? `?${remainingSearch}` : ''}${keepHash}`;
    window.history.replaceState({}, '', nextUrl);
  }

  return hasError;
}

export const PortalPage: React.FC = () => {
  const { navigate } = useRouter();

  const [hasAuthError, setHasAuthError] = useState<boolean>(() =>
    detectAndCleanOAuthError()
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentChecked, setStudentChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTab>(() =>
    readTabFromHash(true)
  );

  // Add <meta name="robots" content="noindex"> while on /portal
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const previousContent = existing ? existing.getAttribute('content') : null;
    let created = false;

    let meta = existing;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    meta.content = 'noindex';

    return () => {
      if (created && meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta && previousContent !== null) {
        meta.setAttribute('content', previousContent);
      }
    };
  }, []);

  // Load student row from Supabase when authenticated
  const loadStudent = useCallback(async (userId: string) => {
    setStudentLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(
          'id, full_name, email, has_cab, has_kita, status, nickname, leaderboard_opt_in'
        )
        .maybeSingle();

      if (error || !data) {
        setStudent(null);
      } else {
        const record = data as StudentRecord;
        setStudent(record);
        // Ensure activeTab respects student's has_kita entitlement
        setActiveTab(readTabFromHash(Boolean(record.has_kita)));
      }
    } catch {
      setStudent(null);
    } finally {
      setStudentLoading(false);
      setStudentChecked(true);
    }
  }, [/* userId passed via call */]);

  // Initialize session & subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Re-check URL errors in case SPA navigated with query/hash
      if (detectAndCleanOAuthError() && mounted) {
        setHasAuthError(true);
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const currentSession = data.session;
      setSession(currentSession);
      setAuthReady(true);

      if (currentSession?.user) {
        await loadStudent(currentSession.user.id);
      } else {
        setStudent(null);
        setStudentChecked(true);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setAuthReady(true);

        if (event === 'SIGNED_IN') {
          setHasAuthError(false);
        }

        if (nextSession?.user) {
          await loadStudent(nextSession.user.id);
        } else {
          setStudent(null);
          setStudentChecked(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadStudent]);

  // Sync tab with URL hash changes
  useEffect(() => {
    const onHashChange = () => {
      if (student) {
        setActiveTab(readTabFromHash(Boolean(student.has_kita)));
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [student]);

  const handleSelectTab = (tab: PortalTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/portal#${tab}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signOut errors and reset local view
    }
    setSession(null);
    setStudent(null);
    setHasAuthError(false);
    navigate('/portal');
  };

  const handleStudentUpdated = (updated: Partial<StudentRecord>) => {
    setStudent((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  // Loading state
  if (!authReady || (session?.user && (!studentChecked || studentLoading))) {
    return (
      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-white/[0.08]" />
            <div className="h-4 w-72 rounded bg-white/[0.05]" />
            <div className="h-24 w-full rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      </section>
    );
  }

  // Not logged in -> Login screen
  if (!session?.user) {
    return (
      <section className="py-14 sm:py-24">
        <PortalLoginCard hasAuthError={hasAuthError} />
      </section>
    );
  }

  // Logged in, but no student record or status is suspended
  if (!student || student.status === 'suspended') {
    return (
      <section className="py-14 sm:py-24">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#E5484D]/15 border border-[#E5484D]/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-[#E5484D]" />
            </div>
            <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
              Akaun anda tiada akses portal. Hubungi kami di WhatsApp.
            </p>
            <div className="space-y-2.5 pt-1">
              <a
                href={CONFIG.portal.whatsappHelp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi kami di WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-lg border border-white/[0.12] text-white/75 hover:text-white hover:border-white/25 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log keluar</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // First word of full_name
  const firstWord =
    (student.full_name || '').trim().split(/\s+/)[0] ||
    (student.email || '').split('@')[0] ||
    'Pelajar';

  const tabs: Array<{ id: PortalTab; label: string }> = [
    { id: 'kandungan', label: 'Kandungan' },
    ...(student.has_kita
      ? [{ id: 'leaderboard' as PortalTab, label: 'Leaderboard' }]
      : []),
    { id: 'akaun', label: 'Akaun Saya' },
  ];

  const resolvedTab: PortalTab =
    activeTab === 'leaderboard' && !student.has_kita ? 'kandungan' : activeTab;

  return (
    <section className="py-8 sm:py-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top bar inside portal */}
        <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
              Hai, {firstWord}
            </h1>
            <div className="flex items-center gap-1.5">
              {student.has_cab && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#5CF2C0]/15 text-[#5CF2C0] border border-[#5CF2C0]/30">
                  CAB
                </span>
              )}
              {student.has_kita && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F2B417]/15 text-[#F2B417] border border-[#F2B417]/30">
                  KITA
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer py-1.5 px-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log keluar</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto touch-scroll">
          {tabs.map((tab) => {
            const isActive = resolvedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-[#5CF2C0] text-[#5CF2C0]'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div>
          {resolvedTab === 'kandungan' && <PortalContentTab student={student} />}
          {resolvedTab === 'leaderboard' && student.has_kita && (
            <PortalLeaderboardTab
              student={student}
              onGoToAccount={() => handleSelectTab('akaun')}
            />
          )}
          {resolvedTab === 'akaun' && (
            <PortalAccountTab
              student={student}
              onStudentUpdated={handleStudentUpdated}
            />
          )}
        </div>
      </div>
    </section>
  );
};
