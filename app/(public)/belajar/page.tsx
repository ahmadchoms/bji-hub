import { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Coffee,
  MapPin,
  Compass,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pusat Belajar Kopi Nusantara • Biji Hub",
  description:
    "Panduan komprehensif kopi specialty Indonesia: glosarium istilah kopi, cara memilih biji pertama, panduan seduh per metode, dan profil asal kopi daerah.",
  openGraph: {
    title: "Pusat Belajar Kopi Nusantara • Biji Hub",
    description:
      "Panduan komprehensif kopi specialty Indonesia: glosarium, panduan seduh, dan asal kopi.",
  },
};

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
    def: "Pelepasan gas karbon dioksida (CO2) alami dari biji kopi yang baru selesai disangrai, umumnya berlangsung 3 hingga 14 hari.",
  },
  {
    term: "Natural Process",
    def: "Metode pascapanen mengeringkan buah ceri kopi utuh di bawah sinar matahari sehingga gula buah menyerap ke dalam biji menghasilkan rasa manis dan buah yang dominan.",
  },
  {
    term: "Washed Process",
    def: "Metode pascapanen di mana daging buah kopi dikupas dan dicuci bersih dengan air sebelum dikeringkan, menghasilkan karakter rasa sangat bersih (clean cup).",
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

export default function BelajarPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Pusat Belajar Kopi Nusantara",
        description:
          "Panduan memilih biji kopi, metode seduh, dan glosarium kopi specialty Indonesia.",
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
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge
              variant="outline"
              className="text-xs font-semibold text-amber-600 gap-1.5 px-3 py-1"
            >
              <Compass className="h-3.5 w-3.5" /> Pusat Edukasi & Belajar
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
              Panduan Menikmati Kopi Specialty Nusantara
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Dari memilih kantong pertama, mengenal profil sangrai, memahami
              pascapanen, hingga menyeduh cangkir sempurna di rumah.
            </p>
          </div>

          {/* Section 1: Panduan Memilih Biji Pertama */}
          <section className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Coffee className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  1. Memilih Biji Kopi Pertamamu
                </h2>
                <p className="text-xs text-muted-foreground">
                  3 hal mendasar sebelum membeli biji kopi specialty.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
                <span className="font-bold text-sm text-foreground block">
                  A. Tingkat Sangrai (Roast Level)
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Light Roast:</strong> Menonjolkan karakter asli biji,
                  asam buah segar, aroma bunga. Cocok untuk filter (V60).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Medium-Dark Roast:</strong> Menonjolkan rasa manis
                  karamel, cokelat pekat, body tebal, rendah asam. Cocok untuk
                  espresso, kopi susu, atau tubruk.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
                <span className="font-bold text-sm text-foreground block">
                  B. Proses Pascapanen
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Washed:</strong> Rasa bersih, kejernihan tinggi, asam
                  elegan.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Natural / Honey:</strong> Manis pekat madu dan buah
                  matang, body lebih tebal.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Anaerobic:</strong> Fermentasi tanpa oksigen
                  menghasilkan rasa buah eksotis unik.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
                <span className="font-bold text-sm text-foreground block">
                  C. Kesegaran (Roast Date)
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Kopi bukan instan yang tahan bertahun-tahun. Waktu terbaik
                  menyeduh (peak flavor) adalah <strong>7 hingga 28 hari</strong>{" "}
                  setelah disangrai saat proses degassing selesai.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Peta Karakter Kopi Nusantara */}
          <section className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  2. Peta Cita Rasa Kopi Nusantara
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kekayaan ragam tanah vulkanik dan iklim mikro kepulauan
                  Indonesia.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ORIGIN_GUIDES.map((og, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {og.region}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {og.island}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 {og.notes}
                  </p>
                  <span className="text-xs text-neutral-600 block pt-1">
                    Ketinggian: {og.altitude}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Glosarium Kopi */}
          <section className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  3. Glosarium Istilah Kopi
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pahami istilah umum yang tertera pada kemasan kopi specialty.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {GLOSSARY_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-card space-y-1"
                >
                  <span className="font-bold text-sm text-amber-600">
                    {item.term}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.def}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Call to action */}
          <div className="p-6 rounded-2xl bg-amber-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-lg">Siap Memilih Kopi Favoritmu?</h3>
              <p className="text-xs text-amber-100">
                Jelajahi ratusan kopi specialty kurasi dari roastery dan petani
                lokal.
              </p>
            </div>
            <Link href="/catalog">
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
