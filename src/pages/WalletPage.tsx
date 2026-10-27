import React from 'react';
import { CONFIG } from '../config';
import { Link } from '../router';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { 
  ShieldCheck, 
  Key, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Snowflake, 
  ShieldAlert 
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20 pt-6">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-center space-y-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
          Keselamatan Aset Digital (Self-Custody)
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.02em] leading-tight">
          Simpan crypto anda dengan selamat
        </h1>
        <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto font-medium">
          "Not your keys, not your coins." Kawal aset anda sendiri.
        </p>
      </section>

      {/* 1. Apa Itu Crypto Wallet? */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em]">
            1. Apa itu crypto wallet?
          </h2>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed">
            Dompet kripto (crypto wallet) bukanlah tempat simpanan fizikal untuk token, sebaliknya alat perisian atau perkakasan untuk menguruskan 'Private Key' (kunci peribadi) anda. Kunci ini memberikan anda kuasa eksklusif untuk menandatangani transaksi dan membuktikan hak milik aset anda di atas rangkaian blockchain. Tanpa kunci ini, tiada siapa—termasuk bank atau kerajaan—yang boleh menyentuh syiling kripto anda.
          </p>
        </div>
      </section>

      {/* 2. Hot Wallet vs Cold Wallet (2-column comparison) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em] text-center">
          2. Hot wallet vs cold wallet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hot Wallet */}
          <div className="p-6 sm:p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3.5">
            <div className="flex items-center gap-2 text-white">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-lg">Hot wallet</h3>
            </div>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Aplikasi perisian di telefon pintar atau sambungan pelayar web (extension) yang sentiasa bersambung dengan internet (contoh: MetaMask, Phantom, Trust Wallet).
            </p>
            <div className="pt-2 space-y-2 text-xs text-white/70">
              <div className="font-semibold text-white">Kelebihan & risiko:</div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-[#5CF2C0]">✓</span> Sangat pantas untuk interaksi DeFi, DEX dan aplikasi on-chain.
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <span>⚠</span> Lebih berisiko terdedah kepada serangan phishing dan perisian hasad.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#060B1E] text-[11px] text-white/50">
              Sesuai untuk: Baki kecil bagi kegunaan harian dan transaksi aktif.
            </div>
          </div>

          {/* Cold Wallet */}
          <div className="p-6 sm:p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3.5">
            <div className="flex items-center gap-2 text-white">
              <Snowflake className="w-5 h-5 text-[#5CF2C0]" />
              <h3 className="font-semibold text-lg text-white">Cold wallet (Hardware)</h3>
            </div>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Peranti fizikal elektronik yang menyimpan private key anda secara luar talian (offline) sepenuhnya, terasing daripada ancaman internet.
            </p>
            <div className="pt-2 space-y-2 text-xs text-white/70">
              <div className="font-semibold text-white">Kelebihan & ciri:</div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-[#5CF2C0]">✓</span> Tahap keselamatan tertinggi untuk simpanan portfolio jangka panjang (HODL).
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-[#5CF2C0]">✓</span> Transaksi memerlukan pengesahan fizikal pada peranti.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#060B1E] text-[11px] text-white/50">
              Sesuai untuk: Majoriti simpanan nilai modal pelaburan anda.
            </div>
          </div>
        </div>
      </section>

      {/* 3. Kenapa Self-Custody Penting */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
            <Lock className="w-5 h-5 text-[#5CF2C0]" />
            <h2>3. Kenapa self-custody penting?</h2>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Apabila anda menyimpan kripto di dalam bursa (centralised exchange), anda sebenarnya tidak memiliki aset tersebut—bursa yang memegang private key bagi pihak anda. Sejarah industri telah membuktikan bahawa bursa boleh digodam, pengeluaran boleh dibekukan secara tiba-tiba, atau syarikat boleh muflis dan ditutup. Dengan memegang cold wallet sendiri (self-custody), anda memiliki kawalan mutlak ke atas kekayaan anda.
          </p>
        </div>
      </section>

      {/* 4. Tips Keselamatan Seed Phrase (Checklist) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-lg text-white">
            <ShieldCheck className="w-5 h-5 text-[#5CF2C0]" />
            <h2>4. Tips keselamatan seed phrase (12/24 patah perkataan)</h2>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white">Tulis di kertas fizikal atau ukir pada plat besi:</span>
                <span className="text-white/60 block text-xs mt-0.5">Elakkan media digital yang terdedah kepada godaman.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white">Jangan sesekali ambil gambar atau tangkap layar (screenshot):</span>
                <span className="text-white/60 block text-xs mt-0.5">Galeri foto telefon mudah diakses oleh aplikasi pihak ketiga.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white">Jangan simpan di storan awan (Google Drive, iCloud, Telegram):</span>
                <span className="text-white/60 block text-xs mt-0.5">Akaun cloud berisiko digodam melalui kebocoran kata laluan.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white">Jangan berkongsi seed phrase dengan sesiapa pun:</span>
                <span className="text-white/60 block text-xs mt-0.5">Sesiapa yang ada seed phrase memiliki kawalan penuh ke atas dana anda.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#060B1E] border border-white/[0.08]">
              <ShieldAlert className="w-4 h-4 text-[#5CF2C0] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white">Bicara Krypto tidak akan sekali-kali meminta seed phrase anda:</span>
                <span className="text-white/60 block text-xs mt-0.5">Mana-mana pihak yang meminta seed phrase adalah scammer.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Wallet Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-xl bg-[#0B1430] border border-white/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-white/60 font-medium">
                Pilihan Perkakasan
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
                {CONFIG.wallet.name}
              </h2>
              <p className="text-sm text-white/60 mt-1 max-w-md">
                Peranti cold storage yang telah diperakui oleh komuniti kripto sedunia sejak bertahun lamanya.
              </p>
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <PlaceholderImage
                label="Hardware Wallet"
                sublabel={CONFIG.wallet.name}
                type="wallet"
                aspectRatio="card"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/80">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0" />
              <span>Cip keselamatan Secure Element (EAL6+ certified)</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0" />
              <span>Sokongan ribuan syiling dan token pelbagai rantaian</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0" />
              <span>Skrin paparan terbina bagi mengesahkan alamat transaksi</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#060B1E] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-[#5CF2C0] shrink-0" />
              <span>Integrasi mudah dengan aplikasi komputer & telefon pintar</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <a
              href={CONFIG.wallet.link}
              target="_blank"
              rel="sponsored noopener"
              className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm flex items-center justify-center hover:opacity-95 transition-all cursor-pointer shadow-md"
            >
              <span>Beli terus dari syarikat</span>
            </a>
            <span className="text-xs text-white/50">
              Jaminan peranti asli dengan meterai pengeluar
            </span>
          </div>
        </div>
      </section>

      {/* 6. PROMINENT WARNING BOX */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-xl bg-[#0B1430] border border-red-500/30 space-y-3">
          <div className="flex items-center gap-2.5 text-red-400 font-semibold text-base sm:text-lg">
            <AlertOctagon className="w-5 h-5 shrink-0 text-red-400" />
            <h2>Beli terus dari laman rasmi syarikat sahaja. JANGAN beli dari reseller atau marketplace.</h2>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Peranti yang dibeli daripada pihak ketiga atau platform e-dagang tidak rasmi mungkin telah diubah suai dari segi perkakasan atau helaian seed phrase telah disediakan lebih awal oleh pihak berniat jahat. Jika anda menggunakannya, pihak penyerang boleh mengambil keseluruhan aset anda sebaik sahaja wang dimasukkan. Pastikan anda hanya membeli terus melalui pautan pengeluar rasmi.
          </p>
        </div>
      </section>

      {/* 7. CTA Band to CAB */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-xl bg-[#0B1430] border border-white/[0.08] text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.02em]">
            Belajar cara guna wallet & on-chain dengan betul dalam CAB.
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
            Sesi praktikal simulasi memasang wallet, menghantar transaksi selamat, dan mengelakkan kontrak pintar berbahaya.
          </p>
          <div className="pt-2">
            <Link
              to="/kelas/cab"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm hover:opacity-95 transition-opacity"
            >
              <span>Daftar CAB sekarang (RM{CONFIG.cab.price})</span>
            </Link>
          </div>
        </div>

        {/* Affiliate Disclosure */}
        <p className="text-center text-xs text-white/40 mt-6 max-w-xl mx-auto">
          Pautan ini adalah pautan affiliate. Bicara Krypto mungkin menerima komisen tanpa kos tambahan kepada anda.
        </p>
      </section>
    </div>
  );
};
