import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProducerBySlug } from "@/lib/data/producers";
import { getCoffeeOriginById, toOriginSlug } from "@/lib/data/origins";
import { getListingFeed } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { ListingCard } from "@/components/catalog/listing-card";
import {
  formatAltitude,
  getVerifiedCertifications,
  COFFEE_CERTIFICATIONS,
} from "@/lib/coffee/taxonomy";
import {
  ShieldCheck,
  MapPin,
  Mountain,
  Users,
  Award,
  ArrowLeft,
  Coffee,
  CheckCircle2,
} from "lucide-react";

interface ProducerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProducerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const producer = await getProducerBySlug(slug);
  if (!producer) {
    return { title: "Produser Tidak Ditemukan | Biji Hub" };
  }
  return {
    title: `${producer.name} - Profil Petani & Ketertelusuran | Biji Hub`,
    description:
      producer.story ||
      `Profil produser kopi specialty ${producer.name} di ${producer.village || producer.province || "Indonesia"}.`,
  };
}

export default async function ProducerDetailPage({ params }: ProducerPageProps) {
  const { slug } = await params;
  const producer = await getProducerBySlug(slug);

  if (!producer) {
    notFound();
  }

  const origin = producer.originId
    ? await getCoffeeOriginById(producer.originId)
    : null;

  const { items: allListings } = await getListingFeed({ pageSize: 50 });
  const producerListings = allListings.filter((l) => {
    const tp = l.tasteProfile;
    if (!tp) return false;
    return (
      tp.producerId === producer.id ||
      tp.producer?.id === producer.id ||
      tp.producer?.slug === producer.slug ||
      l.title.toLowerCase().includes(producer.name.toLowerCase())
    );
  });

  const verifiedCerts = getVerifiedCertifications(producer);
  const altitudeStr = formatAltitude(producer.altitudeMin, producer.altitudeMax);

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
          {origin && (
            <>
              <Link
                href={`/asal-kopi/${toOriginSlug(origin)}`}
                className="hover:text-primary-700 coarse:min-h-11 inline-flex items-center"
              >
                {origin.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-neutral-900 font-medium truncate max-w-xs">
            {producer.name}
          </span>
        </nav>

        {/* Hero Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <Link
              href={origin ? `/asal-kopi/${toOriginSlug(origin)}` : "/asal-kopi"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 hover:text-primary-900 coarse:min-h-11"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Asal {origin?.name || "Kopi"}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-neutral-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-neutral-700 font-semibold">
                {producer.kind}
              </span>
              {producer.claimsVerifiedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>Klaim & Asal Terverifikasi Biji Hub</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  Belum Diverifikasi Tim Lapangan
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-2xl md:text-4xl font-bold text-neutral-900 tracking-tight">
              {producer.name}
            </h1>

            <div className="flex flex-wrap gap-4 text-xs md:text-sm text-neutral-700">
              {(producer.village || producer.province) && (
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-primary-700 shrink-0" aria-hidden="true" />
                  <span>
                    {[producer.village, producer.province].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {altitudeStr && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Mountain className="h-4 w-4 text-primary-700 shrink-0" aria-hidden="true" />
                  <span>{altitudeStr}</span>
                </div>
              )}
              {producer.farmersCount && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="h-4 w-4 text-primary-700 shrink-0" aria-hidden="true" />
                  <span>{producer.farmersCount.toLocaleString("id-ID")} Anggota Petani</span>
                </div>
              )}
            </div>
          </div>

          {/* Verified Certifications */}
          {verifiedCerts.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <span className="font-mono text-xs text-neutral-600 uppercase tracking-wider block flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
                Sertifikasi & Indikasi Geografis Sah
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {verifiedCerts.map((cert) => {
                  const meta = COFFEE_CERTIFICATIONS[cert];
                  return (
                    <div
                      key={cert}
                      className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-950">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-700 shrink-0" aria-hidden="true" />
                        <span>{meta ? meta.name : cert}</span>
                      </div>
                      <p className="text-xs text-amber-800/90 leading-relaxed">
                        {meta?.description || "Standar kualitas dan keaslian asal teruji."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Story */}
          {producer.story && (
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <h2 className="font-display text-lg font-bold text-neutral-900">
                Dedikasi Kebun & Tradisi Pengolahan
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed max-w-4xl whitespace-pre-line">
                {producer.story}
              </p>
            </div>
          )}

          {/* Photos */}
          {producer.photoUrls && producer.photoUrls.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-600">
                Dokumentasi Kebun & Pengolahan
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {producer.photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100"
                  >
                    <Image
                      src={url}
                      alt={`Dokumentasi kebun ${producer.name} #${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Listings from this Producer */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary-700" aria-hidden="true" />
              <span>Lot Kopi Aktif dari {producer.name}</span>
            </h2>
            <span className="text-xs font-mono text-neutral-600">
              {producerListings.length} lot tersedia
            </span>
          </div>

          {producerListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center space-y-2 bg-neutral-50/50">
              <Coffee className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-800">
                Belum ada lot kopi aktif yang saat ini ditawarkan dari produser ini.
              </p>
              <Link
                href="/asal-kopi"
                className="inline-block mt-2 text-xs font-semibold text-primary-800 hover:underline coarse:min-h-11"
              >
                Jelajahi Asal Kopi Lainnya →
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 list-none p-0 m-0">
              {producerListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
