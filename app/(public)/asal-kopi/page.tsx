import type { Metadata } from "next";
import Link from "next/link";
import { getCoffeeOrigins, toOriginSlug } from "@/lib/data/origins";
import { PageContainer } from "@/components/layout/page-container";
import { formatAltitude } from "@/lib/coffee/taxonomy";
import { MapPin, Mountain, ArrowRight, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Peta & Asal Kopi Nusantara | Biji Hub",
  description:
    "Jelajahi ketertelusuran kopi specialty Indonesia dari Aceh Gayo, Toraja, Mandheling, Java Preanger, Bali Kintamani, hingga Lembah Baliem Papua.",
};

export default async function CoffeeOriginsPage() {
  const origins = await getCoffeeOrigins({ activeOnly: true });

  return (
    <div className="py-8 md:py-12 space-y-10">
      <PageContainer className="space-y-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-neutral-600 font-mono"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary-700 coarse:min-h-11 inline-flex items-center">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">Asal Kopi Nusantara</span>
        </nav>

        {/* Hero Section */}
        <div className="border-b border-neutral-200 pb-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-900 border border-primary-200">
            <Compass className="h-4 w-4 text-primary-700" aria-hidden="true" />
            <span>Ketertelusuran Asal Geografis (Single Origin)</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Peta Terroir & Daerah Asal Kopi
          </h1>
          <p className="max-w-3xl text-sm md:text-base text-neutral-700 leading-relaxed">
            Indonesia dianugerahi gugusan cincin api vulkanik yang menciptakan tanah subur dan mikroklimat ideal di ketinggian lebih dari 1.000 mdpl. Temukan keunikan cita rasa, tradisi pengolahan, serta para pekebun di balik setiap cangkir kopi specialty Nusantara.
          </p>
        </div>

        {/* Origins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {origins.map((origin) => {
            const slug = toOriginSlug(origin);
            const altitudeStr = formatAltitude(origin.minAltitude, origin.maxAltitude);

            return (
              <div
                key={origin.id}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-primary-400 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      <MapPin className="h-3 w-3 text-neutral-600" aria-hidden="true" />
                      {origin.islandOrState || origin.country}
                    </span>
                    {altitudeStr && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                        <Mountain className="h-3 w-3 text-primary-700" aria-hidden="true" />
                        {altitudeStr}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-xl font-bold text-neutral-900 group-hover:text-primary-800 transition-colors">
                    <Link
                      href={`/asal-kopi/${slug}`}
                      className="focus:outline-none focus:ring-2 focus:ring-primary-600 rounded"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      {origin.name}
                    </Link>
                  </h2>

                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                    {origin.description ||
                      "Kawasan penghasil kopi unggulan dengan profil rasa khas dan tradisi budidaya turun-temurun."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-primary-800 group-hover:text-primary-900">
                  <span>Lihat Profil Terroir & Produser</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}
