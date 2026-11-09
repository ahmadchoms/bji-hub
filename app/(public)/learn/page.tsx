import { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrewCalculator } from "@/components/catalog/brew-calculator";
import { CoffeeGuideWizard } from "@/components/catalog/coffee-guide-wizard";
import { FRESHNESS_WINDOWS, type RoastLevel } from "@/lib/coffee/freshness";
import {
  BookOpen,
  Coffee,
  MapPin,
  Compass,
  ArrowRight,
  Timer,
  Flame,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pusat Belajar Kopi Nusantara • Biji Hub",
  description:
    "Kurikulum runtut dari hulu ke hilir: mengenal asal & pascapanen, membaca label kemasan, jadwal degassing, kalkulator seduh interaktif, hingga koreksi rasa di cangkir.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "Pusat Belajar Kopi Nusantara • Biji Hub",
    description:
      "Panduan runtut memilih biji kopi specialty, jadwal degassing, kalkulator seduh interaktif, dan diagnosa rasa untuk end-user.",
  },
};

const LEARNING_STEPS = [
  { id: "tahap-1", step: "1", title: "Hulu & Pascapanen" },
  { id: "tahap-2", step: "2", title: "Pilih Biji & Label" },
  { id: "tahap-3", step: "3", title: "Degassing & Simpan" },
  { id: "tahap-4", step: "4", title: "Praktik Menyeduh" },
  { id: "tahap-5", step: "5", title: "Diagnosa Cangkir" },
];

const POST_HARVEST_PROCESSES = [
  {
    name: "Washed (Full Wash)",
    badge: "Bersih & Cerah",
    desc: "Daging buah ceri dikupas dan difermentasi dalam air hingga lendir hilang sebelum dijemur. Menghasilkan kejernihan rasa tinggi dan keasaman yang elegan.",
  },
  {
    name: "Natural (Dry Process)",
    badge: "Manis & Fruity",
    desc: "Buah ceri kopi utuh dijemur langsung bersama kulitnya. Gula alami buah meresap ke biji, menghasilkan aroma buah matang yang kuat dan body tebal.",
  },
  {
    name: "Honey (Pulped Natural)",
    badge: "Seimbang & Lembut",
    desc: "Kulit luar dikupas tetapi sebagian lendir manis (mucilage) dibiarkan menempel saat penjemuran. Perpaduan kebersihan Washed dan manis karamel Natural.",
  },
  {
    name: "Anaerobic / Experimental",
    badge: "Eksotis & Kompleks",
    desc: "Fermentasi dalam tangki kedap udara tanpa oksigen untuk mengontrol mikroba, memunculkan karakter rempah manis, winey, atau buah tropis intens.",
  },
];

const ORIGIN_GUIDES = [
  {
    region: "Aceh Gayo",
    island: "Sumatera",
    notes: "Herbal, rempah, dark chocolate, body tebal seimbang",
    altitude: "1.200 - 1.700 mdpl",
  },
  {
    region: "Jawa Barat (Puntang / Malabar)",
    island: "Jawa",
    notes: "Cerah, manis asam apel, aroma floral melati",
    altitude: "1.300 - 1.600 mdpl",
  },
  {
    region: "Bali Kintamani",
    island: "Bali",
    notes: "Asam segar jeruk (citrus), rempah ringan, manis karamel",
    altitude: "1.100 - 1.500 mdpl",
  },
  {
    region: "Toraja & Enrekang",
    island: "Sulawesi",
    notes: "Rempah kayu manis, cokelat hitam, aftertaste lembut bertahan lama",
    altitude: "1.400 - 1.900 mdpl",
  },
  {
    region: "Flores Bajawa",
    island: "Nusa Tenggara",
    notes: "Kacang panggang (nutty), tembakau manis, cokelat susu gurih",
    altitude: "1.200 - 1.600 mdpl",
  },
  {
    region: "Papua Wamena",
    island: "Papua",
    notes: "Floral harum, buah tropis, keasaman sangat halus dan bersih",
    altitude: "1.600 - 2.000 mdpl",
  },
];

const PACKAGING_ANATOMY = [
  {
    label: "1. Origin & Ketinggian (mdpl)",
    detail:
      "Menunjukkan daerah kebun dan elevasi tanam. Semakin tinggi (di atas 1.200 mdpl), biji tumbuh lebih padat dengan rasa asam buah dan manis yang lebih kompleks.",
  },
  {
    label: "2. Tingkat Sangrai (Roast Level)",
    detail:
      "Light Roast cocok untuk seduh manual tanpa ampas (V60/Kalita). Medium cocok untuk segala metode. Medium-Dark hingga Dark cocok untuk Espresso, Moka Pot, dan kopi susu.",
  },
  {
    label: "3. Tasting Notes (Catatan Rasa)",
    detail:
      "Bukan perisa tambahan, melainkan asosiasi senyawa aroma alami pada biji (mis. 'Lemon, Brown Sugar, Jasmine') yang muncul bila diseduh pada suhu dan rasio tepat.",
  },
  {
    label: "4. Roast Date & Kode Lot",
    detail:
      "Kopi specialty wajib mencantumkan tanggal sangrai (bukan sekadar tanggal kedaluwarsa) serta kode lot ketertelusuran ke petani/koperasi asal.",
  },
];

const ROAST_LEVEL_DESC: Record<RoastLevel, string> = {
  Light: "Fruity & floral cerah (Filter / V60)",
  "Medium-Light": "Manis buah & teh (Pour Over / AeroPress)",
  Medium: "Seimbang karamel & buah (Serbaguna)",
  "Medium-Dark": "Cokelat pekat & bold (Espresso / Tubruk)",
  Dark: "Pahit manis intens, rendah asam (Kopi Susu)",
};

const BREW_TROUBLESHOOTING = [
  {
    symptom: "Terlalu Asam, Tajam, atau Encer",
    cause: "Under-extracted (ekstraksi kurang — air terlalu cepat melewati kopi).",
    fixes: [
      "Giling biji kopi sedikit lebih halus agar permukaan kontak meluas.",
      "Naikkan suhu air seduhan ke kisaran 92–94°C.",
      "Perpanjang durasi seduh atau tuang air lebih perlahan.",
    ],
  },
  {
    symptom: "Terlalu Pahit, Sepat (Astringent), atau Kering di Tenggorokan",
    cause: "Over-extracted (ekstraksi berlebih — senyawa pahit ikut larut).",
    fixes: [
      "Gunakan ukuran gilingan yang sedikit lebih kasar.",
      "Turunkan suhu air ke 88–90°C (terutama untuk Medium-Dark roast).",
      "Kurangi waktu seduh atau gunakan rasio air sedikit lebih banyak (mis. 1:16).",
    ],
  },
  {
    symptom: "Rasa Datar (Flat) & Aroma Kurang Keluar",
    cause: "Biji terlalu baru (< 3 hari sangrai) atau sudah lewat masa puncak (> 35 hari).",
    fixes: [
      "Cek Roast Date: istirahatkan biji baru (degassing) atau perketat rasio ke 1:13–1:14.",
      "Simpan di kemasan kedap udara ber-valve, jauhkan dari panas dan kulkas.",
      "Gunakan air mineral dengan TDS ideal (70–150 ppm), hindari air suling murni.",
    ],
  },
];

const GLOSSARY_ITEMS = [
  {
    term: "Acidity (Keasaman)",
    def: "Sensasi kesegaran cerah di samping lidah mirip buah-buahan (jeruk, berry, apel), bukan rasa asam lambung.",
  },
  {
    term: "Body (Ketebalan Rasa)",
    def: "Sensasi bobot, kekentalan, dan tekstur cairan kopi di rongga mulut saat diteguk (dari ringan seperti teh hingga kental seperti sirup).",
  },
  {
    term: "Cupping Score (SCA)",
    def: "Standar penilaian 100 poin oleh Q-Grader bersertifikat. Kopi dengan skor di atas 80 dikategorikan sebagai Specialty Coffee.",
  },
  {
    term: "Degassing",
    def: "Pelepasan gas karbon dioksida (CO2) alami dari biji kopi yang baru selesai disangrai, umumnya berlangsung 2 hingga 14 hari.",
  },
  {
    term: "Blooming",
    def: "Menuangkan sedikit air panas di awal seduhan (30–45 detik pertama) untuk mengeluarkan gas CO2 agar ekstraksi berikutnya merata.",
  },
  {
    term: "Single Origin vs Blend",
    def: "Single Origin berasal dari satu daerah/kebun spesifik untuk menonjolkan karakter terroir, sedangkan Blend memadukan beberapa asal untuk konsistensi rasa.",
  },
];

export default function BelajarPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Pusat Belajar Kopi Nusantara: Panduan Hulu ke Hilir",
        description:
          "Panduan runtut memilih biji kopi specialty, jadwal degassing, kalkulator seduh interaktif, dan diagnosa rasa untuk end-user.",
        author: {
          "@type": "Organization",
          name: "Biji Hub",
        },
        publisher: {
          "@type": "Organization",
          name: "Biji Hub",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: GLOSSARY_ITEMS.map((g) => ({
          "@type": "Question",
          name: `Apa itu ${g.term} dalam kopi?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: g.def,
          },
        })),
      },
    ],
  };

  return (
    <div className="bg-neutral-50/50 min-h-screen py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header & Stepper Navigation */}
          <div className="text-center space-y-4">
            <Badge
              variant="outline"
              className="text-xs font-semibold text-amber-700 gap-1.5 px-3 py-1"
            >
              <Compass className="h-3.5 w-3.5" /> Kurikulum Kopi Hulu ke Hilir
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
              Dari Kebun hingga Cangkir Sempurna di Rumah
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Pelajari alur runtut perjalanan kopi specialty: mengenali karakter
              pascapanen di kebun, memilih biji & membaca label kemasan, menjaga
              kesegaran degassing, hingga menyeduh dan mengevaluasi rasa di cangkir.
            </p>

            {/* Quick Jump Stepper */}
            <nav
              aria-label="Tahapan belajar kopi"
              className="pt-2 flex flex-wrap items-center justify-center gap-2"
            >
              {LEARNING_STEPS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-white hover:border-amber-500 hover:bg-amber-50/60 transition-colors text-xs font-medium text-neutral-800"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold inline-flex items-center justify-center">
                    {item.step}
                  </span>
                  <span>{item.title}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Tahap 1: Mengenal Hulu & Proses Pascapanen */}
          <section
            id="tahap-1"
            className="scroll-mt-20 p-6 sm:p-8 rounded-2xl border border-neutral-200 bg-card shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <MapPin className="h-6 w-6" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Tahap 1 • Hulu & Kebun
                  </span>
                  <h2 className="text-xl font-bold text-foreground">
                    Mengenal Asal Daerah & Proses Pascapanen
                  </h2>
                </div>
              </div>
              <Link href="/origins">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  Eksplorasi Direktori Origin <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Karakter rasa kopi sudah ditentukan sejak di kebun. Ketinggian tanam
              (mdpl), unsur hara tanah vulkanik, dan cara petani mengolah buah ceri
              kopi setelah dipetik (<strong>proses pascapanen</strong>) membentuk
              pondasi rasa sebelum biji masuk ke mesin sangrai.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {POST_HARVEST_PROCESSES.map((proc) => (
                <div
                  key={proc.name}
                  className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {proc.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {proc.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {proc.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-foreground">
                Peta Karakter 6 Kawasan Kopi Utama Nusantara
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ORIGIN_GUIDES.map((og) => (
                  <div
                    key={og.region}
                    className="p-3.5 rounded-xl border border-neutral-100 bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {og.region}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {og.island}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      💡 {og.notes}
                    </p>
                    <span className="text-xs text-neutral-600 block pt-0.5 font-mono">
                      Elevasi: {og.altitude}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Tahap 2: Memilih Biji & Membaca Label Kemasan */}
          <section
            id="tahap-2"
            className="scroll-mt-20 p-6 sm:p-8 rounded-2xl border border-neutral-200 bg-card shadow-xs space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Flame className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Tahap 2 • Kurasi & Pembelian
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Cara Memilih Biji & Membaca Label Kemasan
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Saat membeli kopi specialty di marketplace, jangan hanya melihat
              nama daerahnya. Perhatikan <strong>4 informasi kunci</strong> pada
              kemasan agar sesuai dengan alat seduh dan selera harianmu:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PACKAGING_ANATOMY.map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/60 space-y-1.5"
                >
                  <span className="font-bold text-sm text-foreground block">
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive Guide Wizard Callout */}
            <div className="p-4 sm:p-5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Simulasi Pemilihan Biji Interaktif
                </span>
                <h3 className="text-sm font-bold text-neutral-900">
                  Bingung menentukan kantong kopi pertamamu?
                </h3>
                <p className="text-xs text-neutral-700">
                  Pilih alat seduh yang kamu punya di rumah, tingkat keasaman/body
                  yang disukai, dan anggaranmu — sistem akan mencocokkan biji kopi
                  terbaik dari katalog aktif.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <CoffeeGuideWizard className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs" />
                <Link href="/taste-map">
                  <Button variant="outline" size="sm" className="text-xs bg-white">
                    Peta Rasa
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Tahap 3: Saat Kopi Tiba — Degassing & Cara Simpan */}
          <section
            id="tahap-3"
            className="scroll-mt-20 p-6 sm:p-8 rounded-2xl border border-neutral-200 bg-card shadow-xs space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Timer className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Tahap 3 • Penanganan Paket Tiba
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Jadwal Degassing (Resting) & Cara Penyimpanan
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Kopi yang baru saja keluar dari mesin sangrai mengandung banyak gas
              karbon dioksida (CO2). Jika diseduh terlalu cepat, gas ini menghalangi
              air mengekstrak rasa manis kopi. Biarkan kopi beristirahat (
              <strong>degassing</strong>) sesuai tingkat sangrainya:
            </p>

            {/* Dynamic Freshness Table from lib/coffee/freshness.ts */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100/80 text-neutral-800 border-b border-neutral-200">
                    <th className="py-2.5 px-3.5 font-bold">Tingkat Sangrai</th>
                    <th className="py-2.5 px-3.5 font-bold">Peruntukan Utama</th>
                    <th className="py-2.5 px-3.5 font-bold">Masa Resting</th>
                    <th className="py-2.5 px-3.5 font-bold">Puncak Rasa (Optimal)</th>
                    <th className="py-2.5 px-3.5 font-bold">Batas Baik Seduh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {(Object.keys(FRESHNESS_WINDOWS) as RoastLevel[]).map((level) => {
                    const win = FRESHNESS_WINDOWS[level];
                    return (
                      <tr key={level} className="hover:bg-neutral-50/80">
                        <td className="py-2.5 px-3.5 font-bold text-foreground">
                          {level}
                        </td>
                        <td className="py-2.5 px-3.5 text-muted-foreground">
                          {ROAST_LEVEL_DESC[level]}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-amber-800">
                          Hari ke-1 s/d {win.restDays}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-emerald-700">
                          Hari ke-{win.restDays} s/d {win.peakEndDays}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-neutral-600">
                          s/d Hari ke-{win.goodEndDays}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Gunakan Kemasan One-Way Valve
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Pastikan kemasan tertutup rapat. Katup satu arah membuang gas CO2
                  keluar tanpa membiarkan oksigen masuk mengoksidasi biji.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Jangan Simpan di Kulkas Harian
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Keluar-masuk kulkas memicu kondensasi uap air dan membuat biji
                  kopi menyerap bau makanan lain. Cukup simpan di lemari sejuk & gelap.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Pilih Biji Utuh Bila Punya Grinder
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Kopi yang sudah digiling kehilangan hingga 60% senyawa aromatiknya
                  dalam 15 menit. Jika belum punya grinder, pilih gilingan yang pas saat checkout.
                </p>
              </div>
            </div>
          </section>

          {/* Tahap 4: Gilingan & Praktik Menyeduh (Interactive BrewCalculator) */}
          <section
            id="tahap-4"
            className="scroll-mt-20 p-6 sm:p-8 rounded-2xl border border-neutral-200 bg-card shadow-xs space-y-5"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Coffee className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Tahap 4 • Ekstraksi & Praktik Seduh
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Simulasi Takaran, Ukuran Gilingan & Resep Seduh
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Setiap alat seduh membutuhkan ukuran gilingan dan rasio air yang
              berbeda. Gunakan kalkulator interaktif di bawah ini untuk menghitung
              kebutuhan gram kopi dan mililiter air untuk 8 metode seduh populer:
            </p>

            <BrewCalculator />
          </section>

          {/* Tahap 5: Evaluasi Cangkir End-User (Troubleshooting) & Glosarium */}
          <section
            id="tahap-5"
            className="scroll-mt-20 p-6 sm:p-8 rounded-2xl border border-neutral-200 bg-card shadow-xs space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Sliders className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Tahap 5 • Evaluasi Cangkir End-User
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Diagnosa Rasa (Brew Coach) & Koreksi Seduhan
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Seduhan pertama belum terasa pas di lidah? Jangan khawatir. Gunakan
              panduan koreksi cepat berikut untuk menyesuaikan seduhan berikutnya:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BREW_TROUBLESHOOTING.map((item) => (
                <div
                  key={item.symptom}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2.5"
                >
                  <span className="font-bold text-sm text-foreground block">
                    {item.symptom}
                  </span>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Penyebab: {item.cause}
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
                    {item.fixes.map((fix) => (
                      <li key={fix} className="leading-relaxed">
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Glosarium Istilah Kopi */}
            <div className="pt-4 border-t border-neutral-200 space-y-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-foreground">
                  Glosarium Istilah Kopi Specialty
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {GLOSSARY_ITEMS.map((item) => (
                  <div
                    key={item.term}
                    className="p-4 rounded-xl border border-neutral-100 bg-white space-y-1"
                  >
                    <span className="font-bold text-sm text-amber-700">
                      {item.term}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.def}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Call to action */}
          <div className="p-6 rounded-2xl bg-amber-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-lg">
                Siap Mempraktikkan Ilmu Kopimu?
              </h3>
              <p className="text-xs text-amber-100">
                Jelajahi kopi specialty dengan tanggal sangrai transparan langsung
                dari roastery dan petani Nusantara.
              </p>
            </div>
            <Link href="/">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-neutral-100"
              >
                Buka Katalog Kopi <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
