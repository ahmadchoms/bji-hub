import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoffeeOriginBySlug, toOriginSlug } from "@/lib/data/origins";
import { getProducers } from "@/lib/data/producers";
import { getListingFeed } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { ListingCard } from "@/components/catalog/listing-card";
import { formatAltitude, getVerifiedCertifications, COFFEE_CERTIFICATIONS } from "@/lib/coffee/taxonomy";
import { MapPin, Mountain, Users, ShieldCheck, ArrowLeft, Award, Coffee } from "lucide-react";

interface OriginDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: OriginDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const origin = await getCoffeeOriginBySlug(slug);
  if (!origin) {
    return { title: "Asal Kopi Tidak Ditemukan | Biji Hub" };
  }
  return {
    title: `Kopi Specialty ${origin.name} - Terroir & Produser | Biji Hub`,
    description:
      origin.description ||
      `Karakteristik terroir, ketinggian, dan profil kopi specialty dari ${origin.name}, ${origin.country}.`,
  };
}

export default async function OriginDetailPage({
  params,
}: OriginDetailPageProps) {
  const { slug } = await params;
  const origin = await getCoffeeOriginBySlug(slug);

  if (!origin) {
    notFound();
  }

  const producers = await getProducers({ originId: origin.id });

  // Fetch active listings matching this origin
  const { items: allListings } = await getListingFeed({ pageSize: 50 });
  const originListings = allListings.filter((l) => {
    const region = l.tasteProfile?.originRegion?.toLowerCase() || "";
    const originName = origin.name.toLowerCase();
    const slugKey = toOriginSlug(origin);
    return (
      region.includes(slugKey) ||
      originName.includes(region) ||
      region.includes(originName)
    );
  });

  const altitudeStr = formatAltitude(origin.minAltitude, origin.maxAltitude);

  return (
    <div className="py-8 md:py-12 space-y-10">
      <PageContainer className="space-y-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-neutral-600 font-mono overflow-x-auto whitespace-nowrap"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary-700 coarse:min-h-11 inline-flex items-center">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/asal-kopi" className="hover:text-primary-700 coarse:min-h-11 inline-flex items-center">
            Asal Kopi
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium truncate max-w-xs">
            {origin.name}
          </span>
        </nav>

        {/* Origin Hero Card */}
        <div className="rounded-2xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-white p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/asal-kopi"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 hover:text-primary-900 coarse:min-h-11"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Peta Asal</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-neutral-700 bg-white border border-neutral-200 px-2.5 py-1 rounded-full shadow-2xs">
                <MapPin className="h-3.5 w-3.5 text-neutral-600" aria-hidden="true" />
                {origin.islandOrState || origin.country}
              </span>
              {altitudeStr && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-primary-900 bg-primary-100 border border-primary-200 px-2.5 py-1 rounded-full">
                  <Mountain className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
                  {altitudeStr}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
              {origin.name}
            </h1>
            <p className="max-w-4xl text-sm md:text-base text-neutral-700 leading-relaxed">
              {origin.description ||
                "Kawasan penghasil kopi dengan kekhasan terroir vulkanik, tradisi budidaya masyarakat adat, dan pengolahan pasca-panen khas."}
            </p>
          </div>
        </div>

        {/* Producers Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-700" aria-hidden="true" />
              <span>Produser & Koperasi di {origin.name}</span>
            </h2>
            <span className="text-xs font-mono text-neutral-600">
              {producers.length} produser terdaftar
            </span>
          </div>

          {producers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center space-y-2 bg-neutral-50/50">
              <Users className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-800">
                Belum ada profil produser khusus yang tercatat untuk daerah ini.
              </p>
              <p className="text-xs text-neutral-600">
                Pekebun dan roastery tetap dapat mencantumkan asal ini pada listing produk mereka.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {producers.map((producer) => {
                const verifiedCerts = getVerifiedCertifications(producer);
                const prodAltitude = formatAltitude(producer.altitudeMin, producer.altitudeMax);

                return (
                  <div
                    key={producer.id}
                    className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-xs hover:border-primary-400 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-neutral-700">
                          {producer.kind}
                        </span>
                        {producer.claimsVerifiedAt && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            <span>Terverifikasi</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-base font-bold text-neutral-900">
                        <Link
                          href={`/petani/${producer.slug}`}
                          className="hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 rounded coarse:min-h-11 inline-block"
                        >
                          {producer.name}
                        </Link>
                      </h3>

                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {producer.story || `${producer.name} berlokasi di ${producer.village || origin.name}.`}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-neutral-600">
                        {producer.farmersCount && (
                          <span className="bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                            {producer.farmersCount.toLocaleString("id-ID")} Petani
                          </span>
                        )}
                        {prodAltitude && (
                          <span className="bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                            {prodAltitude}
                          </span>
                        )}
                      </div>

                      {verifiedCerts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {verifiedCerts.map((cert) => {
                            const meta = COFFEE_CERTIFICATIONS[cert];
                            return (
                              <span
                                key={cert}
                                className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-xs text-amber-900 font-medium"
                              >
                                <Award className="h-3 w-3 text-amber-700" aria-hidden="true" />
                                {meta ? meta.name : cert}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100">
                      <Link
                        href={`/petani/${producer.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-900 coarse:min-h-11"
                      >
                        <span>Lihat Profil Petani & Lot Kopi →</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Listings from this Origin */}
        <div className="space-y-5 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary-700" aria-hidden="true" />
              <span>Kopi dari {origin.name}</span>
            </h2>
            <span className="text-xs font-mono text-neutral-600">
              {originListings.length} produk tersedia
            </span>
          </div>

          {originListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center space-y-2 bg-neutral-50/50">
              <Coffee className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-800">
                Belum ada produk aktif yang terdaftar untuk daerah {origin.name}.
              </p>
              <Link
                href="/?category=all"
                className="inline-block mt-2 text-xs font-semibold text-primary-800 hover:underline coarse:min-h-11"
              >
                Lihat Seluruh Katalog Kopi →
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 list-none p-0 m-0">
              {originListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
