/**
 * Bicara Krypto Configuration
 * 
 * SEMUA nilai boleh diedit diletakkan di dalam fail ini supaya anda boleh
 * mengemaskini tarikh intake, harga, link bayaran, link affiliate, direktori kad, dan produk kelas.
 */

export interface TestimonialItem {
  id: string;
  name: string;
  kelas: string;
  text: string;
  role?: string;
  rating?: number;
}

export interface ExchangePlatformItem {
  id: string;
  name: string;
  category: "berdaftar" | "antarabangsa" | "bot" | "copytrade" | "perpdex" | "terminal" | "tools";
  level: "pemula" | "berpengalaman" | "risikoTinggi";
  brandColor: string;
  iconColor: string;
  iconWhite: string;
  avatarStyle?: "tile";
  featured?: boolean;
  regulatoryTag?: string;
  rewardBadge?: string;
  reward?: string;
  description: string;
  conditions?: string[];
  code?: string;
  affiliateLink: string;
  tutorialLink?: string;
  claimSteps?: string[];
  terms?: string[];
  faq?: { q: string; a: string }[];
}


export interface ClassMarqueeLogoItem {
  id: string;
  name: string;
  url: string;
  fallbackUrl: string;
  localPath: string;
}

export const CLASS_MARQUEE_LOGOS: ClassMarqueeLogoItem[] = [
  {
    id: "hata",
    name: "HATA",
    url: "https://googleusercontent.com/d/1IWjSfu1H-7bCSIRpsMlXpvXgszHZn1WP/",
    fallbackUrl: "https://lh3.googleusercontent.com/d/1IWjSfu1H-7bCSIRpsMlXpvXgszHZn1WP",
    localPath: "/partners/hata.jpg",
  },
  {
    id: "moomoo",
    name: "Moomoo",
    url: "https://googleusercontent.com/d/1b2W4SGuA6ZMGmZ9IohpGkLn7mR90Sbcm/",
    fallbackUrl: "https://lh3.googleusercontent.com/d/1b2W4SGuA6ZMGmZ9IohpGkLn7mR90Sbcm",
    localPath: "/partners/moomoo.jpg",
  },
  {
    id: "near",
    name: "NEAR Protocol",
    url: "https://googleusercontent.com/d/1NhszPPKXzXa3espUM_9Zp5PTX3_CYn7J/",
    fallbackUrl: "https://lh3.googleusercontent.com/d/1NhszPPKXzXa3espUM_9Zp5PTX3_CYn7J",
    localPath: "/partners/near.png",
  },
  {
    id: "redotpay",
    name: "RedotPay",
    url: "https://googleusercontent.com/d/1EFo-47V_hXti3My40S6BNsSyZOC1GQuf/",
    fallbackUrl: "https://lh3.googleusercontent.com/d/1EFo-47V_hXti3My40S6BNsSyZOC1GQuf",
    localPath: "/partners/redotpay.png",
  },
];

export const TUAN_ASYRAF_PHOTO_URL = "https://googleusercontent.com/d/1P9KLigDB0tnLioDVvD6M_dLqDdfnj_na/";
export const TUAN_ASYRAF_PHOTO_FALLBACK = "https://lh3.googleusercontent.com/d/1P9KLigDB0tnLioDVvD6M_dLqDdfnj_na";
export const TUAN_ASYRAF_LOCAL_PHOTO = "/tuan-asyraf.jpg";

export const CAB_POSTER_URL = "https://googleusercontent.com/d/19nUDalN3olyu4ovN3Rdj3ya4UlT1j7Zw/";
export const KITA_POSTER_URL = "https://googleusercontent.com/d/1l2szsll7XctrnlUb0LRo6dkE-Amb6G0t/";

export interface CryptoCardItem {
  id: string;
  name: string;
  logoUrl?: string;
  logoFallbackUrl?: string;
  type?: string;
  network?: string;
  color?: string;
  custody?: string;
  cashback?: string;
  annualFee?: string;
  fxFee?: string;
  staking?: string;
  atm?: string;
  mobilePay?: boolean | null;
  assets?: string;
  metal?: boolean | null;
  bonus?: string;
  regions?: string;
  malaysia?: "ya" | "tidak" | null;
  features?: string[];
  featured: boolean;
  affiliateLink: string;
  officialLink: string;
  code?: string;
  // Legacy optional fields for backward compatibility
  cardFee?: string;
  txFee?: string;
  limit?: string;
  pros?: string[];
  cons?: string[];
  physical?: boolean | null;
  virtual?: boolean | null;
}

export interface ProductItem {
  id: string;
  name: string;
  route: string;
  price: number | string;
  status: 'live' | 'akanDatang' | 'penuh' | 'hidden';
  badge?: 'Paling Popular' | 'Akan Datang' | 'Penuh';
  category: 'Live Zoom' | 'E-Video' | 'Coaching';
  poster: {
    topLine: string;
    headline: string;
    sticker1: string;
    sticker2: string;
    boxTitle: string;
    priceSticker: string;
    image?: string;
  };
}

export const PRODUCTS: ProductItem[] = [
  {
    id: "combo",
    name: "Combo CAB + KITA",
    route: "/kelas/combo",
    price: 699,
    status: "hidden",
    badge: "Paling Popular",
    category: "Live Zoom",
    poster: {
      topLine: "Jom! November 2026 ni belajar",
      headline: "DARI KOSONG SAMPAI TRADE!",
      sticker1: "Pemula",
      sticker2: "Ke Trader",
      boxTitle: "CAB + KITA Combo",
      priceSticker: "RM699 je",
      image: TUAN_ASYRAF_PHOTO_URL,
    },
  },
  {
    id: "cab",
    name: "Crypto Alpha Bootcamp (CAB)",
    route: "/kelas/cab",
    price: 299,
    status: "live",
    category: "Live Zoom",
    poster: {
      topLine: "Jom! 14 - 15 Nov ni belajar",
      headline: "PILIH COIN MACAM VC!",
      sticker1: "Fundamental",
      sticker2: "On-chain",
      boxTitle: "Crypto Alpha Bootcamp",
      priceSticker: "RM299 je",
      image: CAB_POSTER_URL,
    },
  },
  {
    id: "kita",
    name: "Kursus Impak Teknikal Analisis (KITA)",
    route: "/kelas/kita",
    price: 499,
    status: "live",
    category: "Live Zoom",
    poster: {
      topLine: "Jom! 28 - 29 Nov ni belajar",
      headline: "BACA CHART TAK PENING!",
      sticker1: "Entry",
      sticker2: "Exit",
      boxTitle: "KITA Masterclass",
      priceSticker: "RM499 je",
      image: KITA_POSTER_URL,
    },
  },
  {
    id: "mentoring-1to1",
    name: "Mentoring 1-to-1 bersama Tuan Asyraf",
    route: "#",
    price: "Akan Datang",
    status: "akanDatang",
    badge: "Akan Datang",
    category: "Coaching",
    poster: {
      topLine: "Sesi Eksklusif",
      headline: "DIBIMBING TERUS OLEH SIFU!",
      sticker1: "Personal",
      sticker2: "Portfolio Review",
      boxTitle: "Mentoring 1-to-1",
      priceSticker: "Akan Datang",
      image: TUAN_ASYRAF_PHOTO_URL,
    },
  },
];

export const CARDS: CryptoCardItem[] = [
  {
    id: "redotpay",
    name: "RedotPay",
    logoUrl: "https://lh3.googleusercontent.com/d/1QQeRcq1ZlaI_52idrHtpEu0WRdI5brNP",
    logoFallbackUrl: "/partners/redotpay.png",
    type: "Prabayar",
    network: "Visa",
    color: "#C8403A",
    custody: "Custodial",
    cashback: "0%",
    annualFee: "Percuma",
    fxFee: "1.2%",
    staking: "Tiada",
    atm: "$500/hari",
    mobilePay: true,
    assets: "USDT, USDC, BTC, ETH",
    metal: false,
    bonus: "$5",
    regions: "Global (kecuali AS & negara disekat)",
    malaysia: null,
    features: [
      "Berpangkalan di Hong Kong",
      "Kad virtual tersedia",
      "KYC pantas",
      "Belanja, keluarkan wang dan urus dana di seluruh dunia"
    ],
    affiliateLink: "https://url.hk/i/en/de04w",
    officialLink: "",
    code: "de04w",
    featured: true
  },
  {
    id: "bybit",
    name: "Bybit",
    logoUrl: "https://lh3.googleusercontent.com/d/1yEON7blmsEN2yp5empPpQJxQxBtXWlq6",
    logoFallbackUrl: "/partners/bybit.jpg",
    type: "Debit",
    network: "Mastercard",
    color: "#262626",
    custody: "Custodial",
    cashback: "10%",
    annualFee: "Percuma",
    fxFee: "0.5%",
    staking: "Tiada",
    atm: "100 USD/bulan percuma",
    mobilePay: true,
    assets: "8+ kripto",
    metal: false,
    bonus: "20 USDT",
    regions: "EEA, LATAM",
    malaysia: "tidak",
    features: [
      "Cashback 10% sehingga 150 USD untuk pengguna terpilih",
      "Rebat 100% di rakan niaga terpilih",
      "Cashback 2% hingga 10% untuk perbelanjaan harian",
      "Serasi dengan Apple Pay, Google Pay dan Samsung Pay"
    ],
    affiliateLink: "https://www.bybitglobal.com/fiat/cards?source=referral&campaignId=1686258086857150464&ref=MJ11N",
    officialLink: "",
    code: "MJ11N",
    featured: true
  },
  {
    id: "tevau",
    name: "Tevau",
    logoUrl: "https://lh3.googleusercontent.com/d/1uVy-zEGmHbHVdIkPu726_ZS1VWXyrw9Q",
    logoFallbackUrl: "/partners/tevau.jpg",
    type: "",
    network: "",
    color: "#162817",
    custody: "",
    cashback: "",
    annualFee: "",
    fxFee: "",
    staking: "",
    atm: "",
    mobilePay: null,
    assets: "",
    metal: false,
    bonus: "",
    regions: "",
    malaysia: null,
    features: [],
    affiliateLink: "https://tevau.io/invite_registration/#/?inviteCode=079989",
    officialLink: "",
    code: "079989",
    featured: false
  }
];

export const PLATFORMS: ExchangePlatformItem[] = [
  {
    id: "luno",
    name: "Luno",
    category: "berdaftar",
    level: "pemula",
    brandColor: "#1F5BFF",
    description: "Exchange berdaftar di Malaysia. Beli Bitcoin terus dengan RM.",
    affiliateLink: "https://www.luno.com/invite/SDQ5G",
    code: "SDQ5G",
    iconColor: "https://googleusercontent.com/d/1ULvTumhsUJduuX3U7fVJaDrwfmK4evoI/",
    iconWhite: "https://googleusercontent.com/d/1d78jDCwkZp1TRaKfBO8gCGpBEdnTLJ_s/",
    featured: true,
    reward: "Beli RM250 kripto, dapat RM50 Bitcoin percuma",
    conditions: ["Deposit minimum RM250", "Beli apa-apa kripto dalam akaun", "Pegang selama 30 hari"],
    claimSteps: ["Daftar akaun Luno dengan kod SDQ5G", "Lengkapkan pengesahan identiti (KYC)", "Deposit RM250 melalui FPX", "Beli kripto pilihan anda untuk dapatkan RM50 BTC"],
    terms: ["Tertakluk kepada terma & syarat Luno Malaysia", "Hanya sah untuk pengguna baharu"],
    faq: [
      { q: "Adakah Luno selamat di Malaysia?", a: "Ya, Luno adalah Pengendali Pasaran Diiktiraf (RMO) yang berdaftar rasmi dengan Suruhanjaya Sekuriti Malaysia (SC)." },
      { q: "Berapa lama ganjaran BTC masuk?", a: "Ganjaran RM50 BTC akan dikreditkan secara automatik ke dalam dompet Luno anda selepas memenuhi syarat." }
    ]
  },
  {
    id: "hata",
    name: "HATA",
    category: "berdaftar",
    level: "pemula",
    brandColor: "#2F5FE8",
    avatarStyle: "tile",
    description: "Exchange berdaftar di Malaysia dengan yuran rendah.",
    affiliateLink: "https://hata.io/signup?ref=HAA6052",
    code: "HAA6052",
    iconColor: "https://googleusercontent.com/d/1Pi5zw2Nei8OYfVK4kGG9nZQ5MF5NuHx1/",
    iconWhite: "https://googleusercontent.com/d/1XV3T2m6_w2cNc1Nv0SAThYj1Gc3F-3eU/",
    featured: false,
    reward: "Diskaun yuran dagangan dengan kod rujukan",
    conditions: ["Daftar akaun baharu", "Lengkapkan KYC"],
    claimSteps: ["Tekan pautan daftar HATA", "Masukkan kod rujukan HAA6052", "Selesaikan KYC dan mula deposit"],
    terms: ["Sah untuk warganegara dan pemastautin Malaysia"],
    faq: [
      { q: "Apa kelebihan HATA?", a: "HATA berdaftar dengan SC Malaysia dan menawarkan kecairan tinggi serta yuran yang sangat kompetitif." }
    ]
  },
  {
    id: "bybit",
    name: "Bybit",
    category: "antarabangsa",
    level: "berpengalaman",
    brandColor: "#F7A600",
    description: "Exchange antarabangsa popular untuk trading spot dan derivatif.",
    affiliateLink: "https://partner.bybitglobal.com/b/bicarakrypto",
    code: "",
    iconColor: "https://googleusercontent.com/d/1c_lDg-rckRYX0BcqhlaVhPjGcQ86Z97G/",
    iconWhite: "https://googleusercontent.com/d/16kog1kG8K1faUsPWNP-GGUCpYUOr2cYf/",
    featured: false,
    reward: "Akses bonus eksklusif komuniti Bicara Krypto",
    conditions: ["Daftar melalui link rujukan", "Deposit & capai volum trading"],
    claimSteps: ["Daftar menggunakan link Bicara Krypto", "Buat deposit pertama", "Tuntut ganjaran di Rewards Hub"],
    terms: ["Bonus dagangan tertakluk kepada volum trading"],
    faq: [
      { q: "Bolehkah saya guna Bybit dari Malaysia?", a: "Bybit adalah bursa antarabangsa yang boleh diakses untuk pengguna berpengalaman dengan pelbagai instrumen canggih." }
    ]
  },
  {
    id: "binance",
    name: "Binance",
    category: "antarabangsa",
    level: "berpengalaman",
    brandColor: "#F0B90B",
    description: "Exchange terbesar dunia dengan pilihan coin yang sangat banyak.",
    affiliateLink: "https://www.binance.info/activity/referral-entry/CPA/together-v4?hl=en&ref=CPA_00J27B927R",
    code: "CPA_00J27B927R",
    iconColor: "https://googleusercontent.com/d/1LkvVC6dvuwADoIG7uZB0Y7Jawx3zAc4U/",
    iconWhite: "https://googleusercontent.com/d/1VrMrDTjmH55ONNRz6oDicbNMCRHj1dfE/",
    featured: false,
    reward: "Voucher rebat yuran dagangan 100 USDT",
    conditions: ["Deposit $50 dalam tempoh 14 hari pendaftaran"],
    claimSteps: ["Daftar dengan kod CPA_00J27B927R", "Sahkan KYC", "Deposit minima $50"],
    terms: ["Voucher sah selama tempoh promosi"],
    faq: [
      { q: "Berapa banyak coin di Binance?", a: "Binance mempunyai lebih 350 mata wang kripto dan kecairan tertinggi di dunia." }
    ]
  },
  {
    id: "mexc",
    name: "MEXC",
    category: "antarabangsa",
    level: "berpengalaman",
    brandColor: "#0246FF",
    description: "Exchange dengan banyak token baru dan yuran trading rendah.",
    affiliateLink: "https://www.mexc.co/register?inviteCode=mexc-bicarak",
    code: "mexc-bicarak",
    iconColor: "https://googleusercontent.com/d/1V_RnBpDNUqF8fK_u9RkMr9iqkqQWANkB/",
    iconWhite: "https://googleusercontent.com/d/1kbOm0SGSyvVGBT-yjLBjORNeLlNNmAe8/",
    featured: false,
    reward: "Yuran dagangan spot 0% & bonus niaga hadapan",
    conditions: ["Daftar akaun baharu melalui pautan Bicara Krypto"],
    claimSteps: ["Daftar akaun MEXC", "Masukkan kod rujukan mexc-bicarak", "Nikmati yuran terendah pasaran"],
    terms: ["Tertakluk kepada terma MEXC"],
    faq: [
      { q: "Mengapa ramai guna MEXC?", a: "MEXC terkenal dengan penyenaraian token baharu terpantas serta yuran spot 0%." }
    ]
  },
  {
    id: "bitget",
    name: "Bitget",
    category: "antarabangsa",
    level: "berpengalaman",
    brandColor: "#1DA2B4",
    description: "Exchange antarabangsa dengan ciri copy trading.",
    affiliateLink: "https://partner.bitgetapp.com/bg/F7WAGD",
    code: "F7WAGD",
    iconColor: "https://googleusercontent.com/d/1RnAsbM1w1t1kHXuSfyTLR2DRycCI4fwQ/",
    iconWhite: "https://googleusercontent.com/d/1CMfNEd3J4zsO6GCsZ3MrxuDoUh-fSUjn/",
    featured: false,
    reward: "Akses ciri Copy Trading terkemuka & bonus alu-aluan",
    conditions: ["Daftar dengan kod F7WAGD"],
    claimSteps: ["Daftar di Bitget", "Sahkan identiti", "Aktifkan akaun copy trading"],
    terms: ["Pengurusan risiko modal adalah tanggungjawab pedagang"],
    faq: [
      { q: "Bagaimana copy trading berfungsi?", a: "Anda boleh memilih pedagang berprestasi tinggi dan sistem akan menyalin posisi dagangan mereka secara automatik." }
    ]
  },
  {
    id: "gate",
    name: "Gate.io",
    category: "antarabangsa",
    level: "berpengalaman",
    brandColor: "#2354E6",
    description: "Exchange lama dengan pilihan altcoin yang luas.",
    affiliateLink: "https://www.gate.io/signup/BgASAV5W?ref_type=103",
    code: "BgASAV5W",
    iconColor: "https://googleusercontent.com/d/105SFme1vcBKIIYidb4f24Td_L2vPmkDe/",
    iconWhite: "https://googleusercontent.com/d/1OVshnxrT92IxFNt5VuC6jAC1LUIx3iDA/",
    featured: false,
    reward: "Akses kepada ribuan altcoin awal",
    conditions: ["Daftar dengan kod BgASAV5W"],
    claimSteps: ["Buka akaun Gate.io", "Lengkapkan pengesahan akaun", "Mula teroka ribuan pilihan altcoin"],
    terms: ["Sila pastikan keselamatan akaun dengan 2FA"],
    faq: [
      { q: "Berapa lama Gate.io beroperasi?", a: "Gate.io diasaskan sejak tahun 2013 dan merupakan antara bursa tertua dalam industri kripto." }
    ]
  },
  {
    id: "bingx",
    name: "BingX",
    category: "antarabangsa",
    level: "berpengalaman",
    brandColor: "#2A63F6",
    description: "Exchange antarabangsa dengan ciri copy trading dan futures.",
    affiliateLink: "https://bingx.com/invite/XX44WJ",
    code: "XX44WJ",
    iconColor: "https://googleusercontent.com/d/1DUPxug1bIMGxALtWIsAd1WeMSu5wBLRv/",
    iconWhite: "https://googleusercontent.com/d/1ob1FlMofctyQ4AsIyI2fVpMl0gKeW0AR/",
    featured: false,
    reward: "Pakej ganjaran alu-aluan dan rebat dagangan",
    conditions: ["Daftar dengan kod XX44WJ"],
    claimSteps: ["Daftar akaun BingX", "Lengkapkan tugas pemula di Reward Center"],
    terms: ["Tertakluk kepada syarat BingX"],
    faq: [
      { q: "Apakah keistimewaan BingX?", a: "Antara muka mesra pengguna, sokongan integrasi terus, dan komuniti copy trading yang luas." }
    ]
  },
  {
    id: "pionex",
    name: "Pionex",
    category: "bot",
    level: "berpengalaman",
    brandColor: "#E26B2B",
    description: "Exchange dengan bot trading terbina dalam (grid, DCA) dan copy trading.",
    affiliateLink: "https://accounts.pionex.com/en/signUp?r=HEQl1ebP",
    code: "HEQl1ebP",
    iconColor: "https://googleusercontent.com/d/1r19vy3-N2ZUSJbYnKwStzetxvImActdv/",
    iconWhite: "https://googleusercontent.com/d/1ieblaPMvCOmv1oeEDdRtooHX8jxce2xW/",
    featured: false,
    reward: "Akses 16 jenis bot trading automatik percuma",
    conditions: ["Daftar dengan kod HEQl1ebP"],
    claimSteps: ["Daftar akaun Pionex", "Pilih jenis bot (Grid Trading, Martingale, dsb)", "Tetapkan julat harga dan aktifkan"],
    terms: ["Bot beroperasi mengikut algoritma berdisiplin tanpa emosi"],
    faq: [
      { q: "Adakah bot Pionex ada bayaran bulanan?", a: "Tiada, semua bot terbina dalam adalah percuma, hanya yuran transaksi standard yang sangat rendah." }
    ]
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    category: "perpdex",
    level: "risikoTinggi",
    brandColor: "#50E3C2",
    description: "DEX perpetual pantas tanpa perantara.",
    affiliateLink: "https://app.hyperliquid.xyz/join/BICARAKRYPTO",
    code: "BICARAKRYPTO",
    iconColor: "https://googleusercontent.com/d/1-Y5AUnLTxZN9NLwr37ill43aUpq_FpRD/",
    iconWhite: "https://googleusercontent.com/d/1khmO_wLDg_EY3JS11UncTXvjvd2AYFP4/",
    featured: false,
    reward: "Diskaun 4% yuran transaksi perpetual on-chain",
    conditions: ["Guna kod rujukan BICARAKRYPTO semasa menyambung wallet"],
    claimSteps: ["Sambungkan Web3 Wallet", "Masukkan kod rujukan BICARAKRYPTO", "Deposit USDC di rangkaian Arbitrum"],
    terms: ["Self-custody penuh. Urus private key anda dengan selamat."],
    faq: [
      { q: "Mengapa Hyperliquid popular?", a: "Perp DEX terpantas berasaskan L1 khusus dengan buku pesanan on-chain sepenuhnya dan tiada yuran gas untuk transaksi." }
    ]
  },
  {
    id: "gmgn",
    name: "GMGN",
    category: "terminal",
    level: "risikoTinggi",
    brandColor: "#22C55E",
    description: "Terminal trading untuk cari dan trade token baru di Solana dan rangkaian lain.",
    affiliateLink: "https://gmgn.ai/?ref=riFoiaxD&chain=sol",
    code: "riFoiaxD",
    iconColor: "https://googleusercontent.com/d/1C5mu5kRljsRHUBcU3fQpsY5UcYZ-ySxv/",
    iconWhite: "https://googleusercontent.com/d/1yHIKllyhLdzSiZRbJYgm60FyAQqxTd3n/",
    featured: false,
    reward: "Alat analisis aliran smart money masa nyata",
    conditions: ["Akses menggunakan kod riFoiaxD"],
    claimSteps: ["Buka pautan GMGN", "Sambungkan wallet atau gunakan bot Telegram GMGN", "Pantau dan laksana pesanan pantas"],
    terms: ["Perdagangan token baharu/memecoin membawa risiko kerugian tinggi."],
    faq: [
      { q: "Apa fungsi GMGN?", a: "Terminal pantas untuk menjejak dompet Smart Money, menyaring token selamat (anti-honeypot), dan dagangan on-chain sepantas kilat." }
    ]
  },
  {
    id: "fomo",
    name: "FOMO",
    category: "copytrade",
    level: "risikoTinggi",
    brandColor: "#8B5CF6",
    avatarStyle: "tile",
    description: "Aplikasi terminal trading dan copy trade terus dari wallet.",
    affiliateLink: "https://fomo.family/r/bkr2026",
    code: "bkr2026",
    iconColor: "https://googleusercontent.com/d/1Bds0JmSbHkUTMgwihXknj1FdxHxe7Ggt/",
    iconWhite: "https://googleusercontent.com/d/1SOJmKrfymMwX3DPmMzlRd3FV9I2BeILf/",
    featured: false,
    reward: "Ciri menyalin transaksi trader on-chain terbaik terus dari wallet",
    conditions: ["Daftar dengan kod jemputan bkr2026"],
    claimSteps: ["Buka pautan jemputan FOMO", "Masukkan kod bkr2026", "Pautkan wallet untuk mula copy trade on-chain"],
    terms: ["Sentiasa kawal saiz modal mengikut toleransi risiko peribadi."],
    faq: [
      { q: "Apa kelebihan FOMO?", a: "Membolehkan anda menyalin pembelian dan penjualan pedagang on-chain berpengalaman secara automatik terus dari dompet Web3 anda." }
    ]
  },
  {
    id: "tradingview",
    name: "TradingView",
    category: "tools",
    level: "pemula",
    brandColor: "#2962FF",
    description: "Platform carta yang digunakan oleh trader di seluruh dunia, dan dalam kelas KITA.",
    affiliateLink: "https://www.tradingview.com/black-friday/?share_your_love=debonairCraft86352",
    code: "",
    iconColor: "https://googleusercontent.com/d/1gNJD9WAEjZJMuuyUJCk6DB7NHzFxJf5M/",
    iconWhite: "https://googleusercontent.com/d/1e1oZl5AemuXdOz7NFa_NbJYlh4a7DWhc/",
    featured: false,
    reward: "Dapatkan diskaun langganan dan akses indikator profesional",
    conditions: ["Daftar melalui link rujukan Bicara Krypto"],
    claimSteps: ["Buka pautan TradingView", "Daftar akaun percuma", "Gunakan alat carta teknikal sama seperti diajar dalam kelas KITA"],
    terms: ["Boleh digunakan secara percuma dengan ciri asas lengkap."],
    faq: [
      { q: "Mengapa TradingView penting dalam kelas KITA?", a: "TradingView adalah piawaian industri carta kewangan global. Semua formula teknikal, SNR, dan setup KITA diaplikasikan di sini." }
    ]
  }
];

export const CONFIG = {
  intakeMonth: "November 2026",
  seatsPerClass: 40,

  cab: {
    price: 299,
    dates: "14 - 15 November 2026",
    link: "https://bicarakrypto.com/checkout/cab",
    poster: CAB_POSTER_URL,
  },

  kita: {
    price: 499,
    dates: "28 - 29 November 2026",
    link: "https://bicarakrypto.com/checkout/kita",
    poster: KITA_POSTER_URL,
  },

  combo: {
    price: 699,
    saving: 99,
    link: "https://bicarakrypto.com/checkout/combo",
  },

  youtubeVideo: "https://www.youtube.com/@BICARAKRYPTO",

  card: {
    name: "RedotPay Crypto Card",
    link: "https://bicarakrypto.com/card-signup",
  },

  wallet: {
    name: "Trezor & Ledger Hardware Wallet",
    link: "https://bicarakrypto.com/official-wallet",
  },

  exchanges: {
    luno: "https://www.luno.com/invite/SDQ5G",
    hata: "https://hata.io/signup?ref=HAA6052",
    bybit: "https://partner.bybitglobal.com/b/bicarakrypto",
    binance: "https://www.binance.info/activity/referral-entry/CPA/together-v4?hl=en&ref=CPA_00J27B927R",
    mexc: "https://www.mexc.co/register?inviteCode=mexc-bicarak",
    bitget: "https://partner.bitgetapp.com/bg/F7WAGD",
    gate: "https://www.gate.io/signup/BgASAV5W?ref_type=103",
    bingx: "https://bingx.com/invite/XX44WJ",
    pionex: "https://accounts.pionex.com/en/signUp?r=HEQl1ebP",
    hyperliquid: "https://app.hyperliquid.xyz/join/BICARAKRYPTO",
    gmgn: "https://gmgn.ai/?ref=riFoiaxD&chain=sol",
    fomo: "https://fomo.family/r/bkr2026",
    tradingview: "https://www.tradingview.com/black-friday/?share_your_love=debonairCraft86352",
  },

  halalAnswer: "Kandungan kelas kami menekankan instrumen pasaran spot dan teknologi blockchain yang telus. Kami membimbing peserta berdasarkan pandangan penasihat syariah tempatan (termasuk keputusan Majlis Penasihat Syariah Suruhanjaya Sekuriti Malaysia) mengenai perdagangan aset digital, serta mengajar cara menyaring projek beretika dan mengelakkan skim riba, manipulasi harga mahupun skim ponzi.",

  testimonials: [
    {
      id: "1",
      name: "Mohd Hafizul",
      kelas: "Crypto Alpha Bootcamp (CAB)",
      role: "Jurutera Awam, Shah Alam",
      rating: 5,
      text: "Sebelum ini saya asyik beli coin sebab tengok orang sembang di TikTok. Lepas beli terus jatuh teruk. Dalam CAB, Tuan Asyraf ajar cara baca tokenomics, faham unvesting schedule dan tapis projek scam. Sekarang saya melabur dengan tenang tanpa rasa FOMO.",
    },
    {
      id: "3",
      name: "Dr. Shahril",
      kelas: "Kursus Impak Teknikal Analisis (KITA)",
      role: "Pegawai Perubatan, Johor Bahru",
      rating: 5,
      text: "Sebagai orang yang sibuk bekerja, saya perlukan sistem trading yang berdisiplin. Kelas KITA ajar saya cara tentukan Stop Loss dan Take Profit secara logik, bukan ikut emosi. Trading journal yang diberi sangat membantu.",
    },
    {
      id: "6",
      name: "Siti Rahmah",
      kelas: "Kursus Impak Teknikal Analisis (KITA)",
      role: "Peniaga Online, Melaka",
      rating: 5,
      text: "Dulu saya sering panik setiap kali pasaran merah. KITA mengajar psikologi sebenar seorang trader dan cara membaca kitaran pasaran Bitcoin. Bahasa Melayu yang digunakan sangat santai dan mudah dihadam.",
    },
    {
      id: "8",
      name: "Razif Harun",
      kelas: "Kursus Impak Teknikal Analisis (KITA)",
      role: "Usahawan Digital, Petaling Jaya",
      rating: 5,
      text: "Masterclass KITA menyelamatkan saya daripada kecundang waktu market turun. Pengurusan 'Risk-to-Reward' minimum 1:2 betul-betul buat trading akaun saya konsisten.",
    },
    {
      id: "9",
      name: "Amira Zulaikha",
      kelas: "Pakej Combo (CAB + KITA)",
      role: "Pereka Grafik, Kuantan",
      rating: 5,
      text: "Sangat recommended untuk orang perempuan yang nak faham crypto tapi takut ditipu scammer. Penerangan Tuan Asyraf santun, beretika dan sangat padat dengan ilmu.",
    },
  ] as TestimonialItem[],

  products: PRODUCTS,
  cards: CARDS,
  platforms: PLATFORMS,
  classLogos: CLASS_MARQUEE_LOGOS,

  brand: {
    name: "Bicara Krypto",
    domain: "bicarakrypto.com",
    tagline: "Perintis Crypto & Blockchain Malaysia",
    companyName: "Bitzar Ventures Sdn Bhd",
    registrationNo: "202301031616",
    founder: "Tuan Asyraf (Asyraf Ahamed)",
    founderPhoto: TUAN_ASYRAF_PHOTO_URL,
    founderPhotoFallback: TUAN_ASYRAF_PHOTO_FALLBACK,
    founderLocalPhoto: TUAN_ASYRAF_LOCAL_PHOTO,
    founderTitle: "Pakar Crypto sejak 2015 · Pengasas Bicara Krypto & SentysisLab",
    founderShortBio: "Tuan Asyraf adalah Pakar Crypto sejak 2015 dan pengasas Bicara Krypto & SentysisLab. Hari ini, Bicara Krypto mempunyai lebih 100,000 pengikut dan ahli komuniti di pelbagai media sosial. Beliau dikenali kerana cara penerangan yang mudah difahami, jujur dan tidak menjual hype, dalam Bahasa Melayu.",
    stats: {
      investingSince: "Sejak 2015",
      investingTitle: "Pakar Krypto & Blockchain",
      communityCount: "100,000+",
      communityTitle: "Pengikut & Ahli Komuniti",
      format: "Live di Zoom",
      formatTitle: "Kelas Interaktif 2 Hari",
      support: "Sokongan Berterusan",
      supportTitle: "Group Komuniti Peserta",
    },
    whatsappPhone: "010-339 4725",
    whatsappLink: "https://wa.me/60103394725",
    email: "info@bicarakrypto.com",
    socials: {
      tiktok: "https://www.tiktok.com/@bicarakrypto",
      youtube: "https://www.youtube.com/@BICARAKRYPTO",
      facebook: "https://www.facebook.com/BicaraKrypto/",
      instagram: "https://www.instagram.com/bicarakrypto/",
      x: "https://x.com/BicaraKrypto",
      telegram: "https://t.me/komunitibicarakrypto",
    },
  },
};
