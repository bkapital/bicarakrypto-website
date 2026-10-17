import React from 'react';
import { CONFIG } from '../config';
import { Link } from '../router';
import { Calendar, ChevronRight } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <aside aria-label="Pengumuman Penting" className="w-full bg-[#0B1430] border-b border-white/[0.08] py-2 px-4 text-xs tracking-normal">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 mx-auto sm:mx-0 flex-wrap justify-center text-white/70">
          <span className="inline-flex items-center justify-center p-1 rounded bg-[#060B1E] text-[#5CF2C0]">
            <Calendar className="w-3 h-3" />
          </span>
          <span className="text-[#5CF2C0] font-medium">
            Intake {CONFIG.intakeMonth} dibuka:
          </span>
          <span>
            CAB {CONFIG.cab.dates} · KITA {CONFIG.kita.dates} · Pendaftaran Kini Dibuka
          </span>
        </div>

        <Link
          to="/#kelas"
          className="hidden sm:inline-flex items-center gap-1 font-medium text-[#5CF2C0] hover:underline shrink-0"
        >
          <span>Pilih kelas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
};
