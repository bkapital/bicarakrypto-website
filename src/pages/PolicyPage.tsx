import React from 'react';
import { CONFIG } from '../config';
import { Link } from '../router';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface PolicyPageProps {
  type: 'privasi' | 'refund' | 'terma';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type }) => {
  const content = {
    privasi: {
      title: 'Polisi Privasi',
      subtitle: 'Perlindungan data peribadi dan privasi pengguna laman bicarakrypto.com',
      body: (
        <div className="space-y-4 text-white/70 text-sm leading-relaxed">
          <p>
            Bicara Krypto di bawah kelolaan Bitzar Ventures Sdn Bhd ({CONFIG.brand.registrationNo}) komited dalam melindungi privasi dan data peribadi anda selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.
          </p>
          <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.06] text-xs text-white/50">
            [KANDUNGAN AKAN DIKEMAS KINI]
          </div>
          <p>
            Data seperti nama, alamat email dan nombor telefon yang dikumpulkan semasa pendaftaran kelas atau borang langganan tips hanya digunakan untuk urusan pengesahan pendaftaran, penghantaran pautan kelas Zoom, sokongan khidmat pelanggan dan makluman berkala berkaitan intake baharu.
          </p>
          <p>
            Kami tidak akan sekali-kali menjual, menyewakan atau mendedahkan maklumat peribadi anda kepada pihak ketiga yang tidak berkaitan tanpa kebenaran bertulis daripada anda.
          </p>
        </div>
      ),
    },
    refund: {
      title: 'Polisi Refund',
      subtitle: 'Dasar pembayaran dan pemindahan tiket program pendidikan Bicara Krypto',
      body: (
        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          {/* Prominent exact refund policy requirement */}
          <div className="p-5 sm:p-6 rounded-lg bg-[#060B1E] border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm sm:text-base">
              <AlertCircle className="w-4 h-4 text-[#5CF2C0] shrink-0" />
              <span>Syarat utama pemulangan & pemindahan tiket:</span>
            </div>
            <p className="text-white font-medium text-sm sm:text-base leading-relaxed">
              Bayaran yang telah dibuat tidak akan dipulangkan. Tiket boleh dipindahkan kepada orang lain dengan makluman sekurang-kurangnya 3 hari sebelum program.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.06] text-xs text-white/50">
            [KANDUNGAN AKAN DIKEMAS KINI]
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white text-base">
              Prosedur pertukaran nama peserta
            </h3>
            <p>
              Sekiranya anda tidak dapat menghadiri sesi live pada tarikh yang ditetapkan, anda boleh memohon untuk memindahkan tiket kepada rakan atau ahli keluarga dengan memaklumkan pihak Khidmat Pelanggan melalui WhatsApp rasmi ({CONFIG.brand.whatsappPhone}) sekurang-kurangnya 3 hari sebelum program berlangsung.
            </p>
            <p>
              Sebarang penukaran nama yang dimaklumkan kurang daripada tempoh 3 hari sebelum tarikh kelas akan dikenakan caj pentadbiran sebanyak RM50 bagi setiap pertukaran.
            </p>
            <p>
              Semua peserta berdaftar tetap akan menerima akses kepada rakaman video penuh sesi Zoom dan bahan sokongan kelas sekiranya tidak dapat hadir secara langsung.
            </p>
          </div>
        </div>
      ),
    },
    terma: {
      title: 'Terma & Syarat',
      subtitle: 'Syarat penggunaan laman web dan penyertaan program pendidikan Bicara Krypto',
      body: (
        <div className="space-y-4 text-white/70 text-sm leading-relaxed">
          <p>
            Selamat datang ke bicarakrypto.com. Dengan melayari laman web ini atau mendaftar untuk mana-mana program kelas yang dianjurkan oleh Bitzar Ventures Sdn Bhd ({CONFIG.brand.registrationNo}), anda bersetuju untuk terikat dengan terma dan syarat berikut:
          </p>
          <div className="p-4 rounded-lg bg-[#060B1E] border border-white/[0.06] text-xs text-white/50">
            [KANDUNGAN AKAN DIKEMAS KINI]
          </div>
          <div className="space-y-2 pt-2">
            <p>a) Tiket hanya sah untuk tarikh kelas yang dipilih dan tidak boleh digunakan untuk program akan datang.</p>
            <p>b) Tiket boleh dipindahkan kepada orang lain dengan makluman kepada Khidmat Pelanggan sekurang-kurangnya 3 hari sebelum program. Jika tidak, penalti RM50 dikenakan bagi setiap pertukaran nama.</p>
            <p>c) Bayaran yang telah dibuat tidak akan dipulangkan.</p>
            <p>d) Kandungan kursus adalah 100% hak milik Bitzar Ventures Sdn Bhd. Peserta dilarang merakam atau mengulang siar kandungan kursus.</p>
            <p>e) Kehadiran pada tarikh yang ditetapkan adalah tanggungjawab peserta.</p>
            <p>f) Hanya rakaman online akan diberikan kepada peserta.</p>
          </div>
          <p className="pt-2">
            Kandungan pengajaran adalah semata-mata untuk tujuan pendidikan dan kesedaran literasi kewangan digital, dan bukan merupakan sebarang nasihat pelaburan berlesen atau jaminan keuntungan kewangan.
          </p>
        </div>
      ),
    },
  }[type];

  return (
    <div className="space-y-12 pb-20 pt-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Link to="/" className="hover:text-white transition-colors">Utama</Link>
        <span>/</span>
        <span className="text-white/80 font-medium">{content.title}</span>
      </div>

      <div className="p-8 sm:p-12 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
            Dokumen Rasmi
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em] mt-1">
            {content.title}
          </h1>
          <p className="text-sm text-white/60 mt-1">
            {content.subtitle}
          </p>
        </div>

        <div className="pt-4 border-t border-white/[0.08]">
          {content.body}
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
          className="px-6 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs shrink-0 flex items-center gap-1.5 hover:opacity-95 transition-opacity"
        >
          <span>Pilih kelas anda</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
