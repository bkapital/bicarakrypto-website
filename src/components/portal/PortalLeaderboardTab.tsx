import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  LeaderboardPlatform,
  LeaderboardRow,
  PORTAL_PLATFORMS,
  StudentRecord,
  getLastSixMonthsKL,
} from './portalUtils';
import { Trophy, AlertCircle, ArrowRight } from 'lucide-react';

interface PortalLeaderboardTabProps {
  student: StudentRecord;
  onGoToAccount: () => void;
}

export const PortalLeaderboardTab: React.FC<PortalLeaderboardTabProps> = ({
  student,
  onGoToAccount,
}) => {
  const months = useMemo(() => getLastSixMonthsKL(), []);
  const [selectedPlatform, setSelectedPlatform] = useState<LeaderboardPlatform | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(months[0]?.value || '');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(
    async (platform: LeaderboardPlatform | null, month: string) => {
      if (!month) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase.rpc('get_leaderboard', {
          p_platform: platform,
          p_month: month,
        });
        if (error) {
          setErrorMsg('Leaderboard tidak dapat dimuatkan. Cuba lagi sebentar.');
          setRows([]);
        } else {
          setRows((data || []) as LeaderboardRow[]);
        }
      } catch {
        setErrorMsg('Leaderboard tidak dapat dimuatkan. Cuba lagi sebentar.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLeaderboard(selectedPlatform, selectedMonth);
  }, [selectedPlatform, selectedMonth, fetchLeaderboard]);

  const showUidColumn = selectedPlatform !== null;
  const showFomoExtras =
    selectedPlatform === 'fomo' &&
    rows.some(
      (r) =>
        (r.pnl_usd !== null && r.pnl_usd !== undefined) ||
        (r.winrate !== null && r.winrate !== undefined)
    );

  const renderRank = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return String(rank);
  };

  const formatVolume = (val: number | null | undefined) => {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    return Math.round(Number(val)).toLocaleString('en-US');
  };

  const formatPnl = (val: number | null | undefined) => {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    const num = Number(val);
    const sign = num > 0 ? '+' : num < 0 ? '-' : '';
    const formatted = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${sign}${formatted}`;
  };

  const formatWinrate = (val: number | null | undefined) => {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    return `${Math.round(Number(val))}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
          Leaderboard KITA
        </h2>
        <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
          Volum dagangan bulan ini daripada pelajar KITA yang mendaftar melalui link Bicara Krypto.
        </p>
      </div>

      {/* Controls: Platform chips + Month dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1">
          <button
            type="button"
            onClick={() => setSelectedPlatform(null)}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors cursor-pointer ${
              selectedPlatform === null
                ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0]'
                : 'bg-[#0B1430] text-white/70 border-white/[0.08] hover:border-white/25 hover:text-white'
            }`}
          >
            Semua
          </button>
          {PORTAL_PLATFORMS.map((plat) => {
            const isActive = selectedPlatform === plat.id;
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => setSelectedPlatform(plat.id)}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#5CF2C0] text-[#060B1E] border-[#5CF2C0]'
                    : 'bg-[#0B1430] text-white/70 border-white/[0.08] hover:border-white/25 hover:text-white'
                }`}
              >
                {plat.label}
              </button>
            );
          })}
        </div>

        <div className="shrink-0">
          <label htmlFor="leaderboard-month" className="sr-only">
            Pilih bulan
          </label>
          <select
            id="leaderboard-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-lg bg-[#0B1430] border border-white/[0.1] text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-[#5CF2C0] cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0B1430] text-white">
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Opt-in banner */}
      {!student.leaderboard_opt_in && (
        <div className="rounded-[20px] bg-[#0B1430] border border-[#5CF2C0]/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-white/85">
            Anda belum menyertai leaderboard.
          </div>
          <button
            type="button"
            onClick={onGoToAccount}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs hover:opacity-95 transition-opacity cursor-pointer shrink-0"
          >
            <span>Sertai sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-[20px] bg-[#0B1430] border border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-white/[0.05] w-full"
              />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#E5484D] mx-auto" />
            <p className="text-sm text-white/80">{errorMsg}</p>
            <button
              type="button"
              onClick={() => fetchLeaderboard(selectedPlatform, selectedMonth)}
              className="px-4 py-2 rounded-lg bg-[#5CF2C0] text-[#060B1E] text-xs font-semibold cursor-pointer"
            >
              Cuba lagi
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6 text-[#F2B417]/80" />
            </div>
            <p className="text-sm text-white/65 max-w-sm mx-auto leading-relaxed">
              Tiada data untuk bulan ini lagi. Data dikemas kini secara berkala.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse min-w-[460px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-[0.06em] text-white/50">
                  <th className="py-3.5 px-4 sm:px-5 font-semibold w-14">#</th>
                  <th className="py-3.5 px-4 font-semibold">Nickname</th>
                  {showUidColumn && (
                    <th className="py-3.5 px-4 font-semibold">UID</th>
                  )}
                  <th className="py-3.5 px-4 sm:px-5 font-semibold text-right">
                    Volum (USD)
                  </th>
                  {showFomoExtras && (
                    <>
                      <th className="py-3.5 px-4 font-semibold text-right">
                        PnL (USD)
                      </th>
                      <th className="py-3.5 px-4 sm:px-5 font-semibold text-right">
                        Win rate
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                {rows.map((row, idx) => {
                  const pnlVal = row.pnl_usd;
                  const pnlColor =
                    pnlVal === null || pnlVal === undefined
                      ? 'text-white/60'
                      : Number(pnlVal) >= 0
                      ? 'text-[#5CF2C0]'
                      : 'text-[#E5484D]';

                  return (
                    <tr
                      key={`${row.rank}-${row.nickname}-${idx}`}
                      className={
                        row.is_me
                          ? 'bg-[#5CF2C0]/[0.07] border-l-4 border-l-[#5CF2C0]'
                          : 'hover:bg-white/[0.02] transition-colors'
                      }
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-semibold text-white whitespace-nowrap">
                        <span className={row.rank <= 3 ? 'text-base' : ''}>
                          {renderRank(row.rank)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span>{row.nickname || '—'}</span>
                          {row.is_me && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5CF2C0]/20 text-[#5CF2C0] border border-[#5CF2C0]/35">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      {showUidColumn && (
                        <td className="py-3.5 px-4 font-mono text-xs text-white/65 whitespace-nowrap">
                          {row.account_masked || '—'}
                        </td>
                      )}
                      <td className="py-3.5 px-4 sm:px-5 text-right font-semibold text-white tabular-nums whitespace-nowrap">
                        {formatVolume(row.volume_usd)}
                      </td>
                      {showFomoExtras && (
                        <>
                          <td
                            className={`py-3.5 px-4 text-right font-semibold tabular-nums whitespace-nowrap ${pnlColor}`}
                          >
                            {formatPnl(row.pnl_usd)}
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right text-white/85 font-medium tabular-nums whitespace-nowrap">
                            {formatWinrate(row.winrate)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footnote */}
      <p className="text-xs text-white/45 leading-relaxed">
        Hanya nickname dipaparkan. UID disembunyikan sebahagian untuk privasi.
      </p>
    </div>
  );
};
