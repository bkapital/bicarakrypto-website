import React, { useEffect, useState, useCallback } from 'react';
import { CONFIG } from '../../config';
import { supabase } from '../../lib/supabase';
import { Link } from '../../router';
import {
  LeaderboardPlatform,
  PORTAL_PLATFORMS,
  PlatformAccount,
  StudentRecord,
  getPlatformLabel,
} from './portalUtils';
import { Trash2, MessageCircle, ExternalLink, CheckCircle2 } from 'lucide-react';

interface PortalAccountTabProps {
  student: StudentRecord;
  onStudentUpdated: (updated: Partial<StudentRecord>) => void;
}

export const PortalAccountTab: React.FC<PortalAccountTabProps> = ({
  student,
  onStudentUpdated,
}) => {
  // Toast state
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Card B: Leaderboard profile state
  const [nickname, setNickname] = useState(student.nickname || '');
  const [optIn, setOptIn] = useState(Boolean(student.leaderboard_opt_in));
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setNickname(student.nickname || '');
    setOptIn(Boolean(student.leaderboard_opt_in));
  }, [student.nickname, student.leaderboard_opt_in]);

  const handleSaveLeaderboardProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    const trimmed = nickname.trim();

    if (optIn && !trimmed) {
      setProfileError('Sila isi nickname dahulu.');
      return;
    }

    if (trimmed && !/^[A-Za-z0-9_]{3,20}$/.test(trimmed)) {
      setProfileError('Nickname mestilah 3–20 aksara dan hanya mengandungi huruf, nombor atau underscore (_).');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase.rpc('set_my_leaderboard_profile', {
        p_nickname: trimmed || null,
        p_opt_in: optIn,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('students_nickname_unique') || msg.includes('duplicate')) {
          setProfileError('Nickname ini sudah digunakan. Cuba nama lain.');
        } else {
          setProfileError(error.message || 'Gagal menyimpan profil leaderboard.');
        }
        return;
      }

      onStudentUpdated({
        nickname: trimmed || null,
        leaderboard_opt_in: optIn,
      });
      showToast('Disimpan');
    } catch {
      setProfileError('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Card C: Platform accounts state
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newPlatform, setNewPlatform] = useState<LeaderboardPlatform | ''>('');
  const [accountRef, setAccountRef] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!student.has_kita) return;
    setLoadingAccounts(true);
    setAccountsError(null);
    try {
      const { data, error } = await supabase
        .from('platform_accounts')
        .select('id, platform, account_ref, verified, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        setAccountsError('Senarai akaun platform tidak dapat dimuatkan.');
      } else {
        setAccounts((data || []) as PlatformAccount[]);
      }
    } catch {
      setAccountsError('Senarai akaun platform tidak dapat dimuatkan.');
    } finally {
      setLoadingAccounts(false);
    }
  }, [student.has_kita]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const availablePlatforms = PORTAL_PLATFORMS.filter(
    (p) => !accounts.some((acc) => acc.platform === p.id)
  );

  // Keep selected platform valid when availablePlatforms changes
  useEffect(() => {
    if (availablePlatforms.length === 0) {
      setNewPlatform('');
    } else if (!newPlatform || !availablePlatforms.some((p) => p.id === newPlatform)) {
      setNewPlatform(availablePlatforms[0].id);
    }
  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newPlatform) return;

    const trimmedRef = accountRef.trim();
    if (newPlatform === 'fomo') {
      if (!/^@[A-Za-z0-9_.-]{2,}$/.test(trimmedRef) && !trimmedRef.startsWith('@')) {
        setAddError('Username FOMO mesti bermula dengan @.');
        return;
      }
      if (!trimmedRef.startsWith('@') || trimmedRef.length < 2) {
        setAddError('Username FOMO mesti bermula dengan @.');
        return;
      }
    } else {
      if (!/^\d+$/.test(trimmedRef)) {
        setAddError('UID mestilah mengandungi nombor sahaja.');
        return;
      }
    }

    setAddingAccount(true);
    try {
      const { data, error } = await supabase
        .from('platform_accounts')
        .insert({
          student_id: student.id,
          platform: newPlatform,
          account_ref: trimmedRef,
        })
        .select('id, platform, account_ref, verified, created_at')
        .single();

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (
          msg.includes('platform_accounts_platform_account_ref_key') ||
          msg.includes('duplicate')
        ) {
          setAddError(
            'UID ini sudah didaftarkan oleh akaun lain. Hubungi kami jika ini akaun anda.'
          );
        } else {
          setAddError(error.message || 'Gagal menambah akaun platform.');
        }
        return;
      }

      if (data) {
        setAccounts((prev) => [...prev, data as PlatformAccount]);
      } else {
        await fetchAccounts();
      }
      setAccountRef('');
      showToast('Ditambah. Menunggu pengesahan.');
    } catch {
      setAddError('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setAddingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setDeletingId(id);
    setAccountsError(null);
    try {
      const { error } = await supabase
        .from('platform_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        setAccountsError('Gagal memadam akaun platform. Sila cuba lagi.');
      } else {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setConfirmDeleteId(null);
      }
    } catch {
      setAccountsError('Gagal memadam akaun platform. Sila cuba lagi.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0B1430] border border-[#5CF2C0]/50 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Card A: Profil */}
      <section className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-7 space-y-5">
        <h2 className="text-lg font-bold text-white tracking-[-0.02em]">Profil</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.06em] text-white/45 font-semibold">
              Nama
            </div>
            <div className="text-sm font-medium text-white break-words">
              {student.full_name || '—'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.06em] text-white/45 font-semibold">
              Email
            </div>
            <div className="text-sm font-medium text-white/85 break-all">
              {student.email || '—'}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-[0.06em] text-white/45 font-semibold">
              Kelas
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              {!student.has_cab && !student.has_kita && (
                <span className="text-sm text-white/50">—</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Card B (KITA only): Leaderboard */}
      {student.has_kita && (
        <section className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-7 space-y-5">
          <h2 className="text-lg font-bold text-white tracking-[-0.02em]">Leaderboard</h2>

          <form onSubmit={handleSaveLeaderboardProfile} className="space-y-4">
            <div className="space-y-1.5 max-w-md">
              <label
                htmlFor="portal-nickname"
                className="block text-xs font-semibold text-white/80"
              >
                Nickname
              </label>
              <input
                id="portal-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="Contoh: trader_kita01"
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#060B1E] border border-white/[0.1] text-white placeholder-white/35 text-sm focus:outline-none focus:border-[#5CF2C0] transition-colors"
              />
              <p className="text-xs text-white/45">
                Nama ini yang dipaparkan di leaderboard.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => {
                  setOptIn(e.target.checked);
                  if (e.target.checked && !nickname.trim()) {
                    setProfileError('Sila isi nickname dahulu.');
                  } else {
                    setProfileError(null);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 rounded-full bg-white/10 border border-white/15 peer-checked:bg-[#5CF2C0] peer-checked:border-[#5CF2C0] transition-colors relative shrink-0">
                <div
                  className={`absolute top-[2px] w-[18px] h-[18px] rounded-full transition-transform ${
                    optIn ? 'translate-x-[22px] bg-[#060B1E]' : 'translate-x-[2px] bg-white'
                  }`}
                />
              </div>
              <span className="text-sm text-white/85">
                Paparkan saya di leaderboard KITA
              </span>
            </label>

            {profileError && (
              <div className="text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-lg px-3.5 py-2.5 max-w-md">
                {profileError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={savingProfile}
                className="min-h-[42px] px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Card C (KITA only): Akaun platform anda */}
      {student.has_kita && (
        <section className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-7 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white tracking-[-0.02em]">
              Akaun platform anda
            </h2>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Daftar UID atau username anda supaya volum dagangan anda dikira dalam leaderboard. Akaun mesti didaftarkan melalui link rujukan Bicara Krypto.{' '}
              <Link
                to="/beli-jual-kripto"
                className="inline-flex items-center gap-1 text-[#5CF2C0] font-medium hover:underline"
              >
                <span>Lihat link rujukan</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {accountsError && (
            <div className="text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-lg px-3.5 py-2.5">
              {accountsError}
            </div>
          )}

          {/* Account list */}
          {loadingAccounts ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-14 rounded-xl bg-white/[0.05]" />
              <div className="h-14 rounded-xl bg-white/[0.05]" />
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-2.5">
              {accounts.map((acc) => {
                const isConfirming = confirmDeleteId === acc.id;
                const isDeleting = deletingId === acc.id;
                return (
                  <div
                    key={acc.id}
                    className="rounded-xl bg-[#060B1E] border border-white/[0.08] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <span className="text-sm font-semibold text-white">
                        {getPlatformLabel(acc.platform)}
                      </span>
                      <span className="text-xs sm:text-sm font-mono text-white/75 break-all">
                        {acc.account_ref}
                      </span>
                      {acc.verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#5CF2C0]/15 text-[#5CF2C0] border border-[#5CF2C0]/30">
                          Disahkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/60 border border-white/10">
                          Menunggu pengesahan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {isConfirming ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/75">Padam akaun ini?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 rounded-md bg-[#E5484D] text-white font-semibold cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? '...' : 'Ya'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 rounded-md bg-white/10 text-white/80 hover:text-white font-medium cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(acc.id)}
                          aria-label={`Padam akaun ${getPlatformLabel(acc.platform)}`}
                          className="p-2 rounded-lg text-white/45 hover:text-[#E5484D] hover:bg-[#E5484D]/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-[#060B1E]/60 border border-white/[0.06] px-4 py-4 text-xs text-white/50">
              Belum ada akaun platform didaftarkan lagi.
            </div>
          )}

          {/* Add Form (only platforms not yet added) */}
          {availablePlatforms.length > 0 && (
            <form
              onSubmit={handleAddAccount}
              className="pt-4 border-t border-white/[0.08] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4 space-y-1.5">
                  <label
                    htmlFor="platform-select"
                    className="block text-xs font-semibold text-white/80"
                  >
                    Platform
                  </label>
                  <select
                    id="platform-select"
                    value={newPlatform}
                    onChange={(e) => {
                      setNewPlatform(e.target.value as LeaderboardPlatform);
                      setAccountRef('');
                      setAddError(null);
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#060B1E] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#5CF2C0] cursor-pointer"
                  >
                    {availablePlatforms.map((plat) => (
                      <option key={plat.id} value={plat.id} className="bg-[#0B1430] text-white">
                        {plat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5 space-y-1.5">
                  <label
                    htmlFor="platform-account-ref"
                    className="block text-xs font-semibold text-white/80"
                  >
                    {newPlatform === 'fomo' ? 'Username FOMO' : 'UID'}
                  </label>
                  <input
                    id="platform-account-ref"
                    type="text"
                    inputMode={newPlatform === 'fomo' ? 'text' : 'numeric'}
                    value={accountRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (newPlatform !== 'fomo') {
                        setAccountRef(val.replace(/\D/g, ''));
                      } else {
                        setAccountRef(val);
                      }
                      setAddError(null);
                    }}
                    placeholder={
                      newPlatform === 'fomo' ? '@username' : 'Masukkan UID (nombor sahaja)'
                    }
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#060B1E] border border-white/[0.1] text-white placeholder-white/35 text-sm focus:outline-none focus:border-[#5CF2C0] transition-colors"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={addingAccount}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {addingAccount ? 'Menambah...' : 'Tambah'}
                  </button>
                </div>
              </div>

              {addError && (
                <div className="text-xs text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-lg px-3.5 py-2.5">
                  {addError}
                </div>
              )}
            </form>
          )}
        </section>
      )}

      {/* Card D: Perlukan bantuan? */}
      <section className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-[-0.02em]">
            Perlukan bantuan?
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Jika ada sebarang isu akses portal atau pengesahan akaun, hubungi pasukan kami.
          </p>
        </div>

        <a
          href={CONFIG.portal.whatsappHelp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Hubungi kami di WhatsApp</span>
        </a>
      </section>
    </div>
  );
};
