import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  MapPin,
  Calendar,
  ChevronRight,
  Package,
  ShieldCheck,
  Handshake,
  MessageCircle,
  Star,
} from "lucide-react";
import { getSellerBySlug } from "@/lib/data";
import { getReviewsByListingIds, computeReviewStats } from "@/lib/data/reviews";
import { PageContainer } from "@/components/layout/page-container";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { VerifiedBadge } from "@/components/shared/verified-badge";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);

  if (!seller) {
    return { title: "Toko Tidak Ditemukan - Biji Hub" };
  }

  const title = `${seller.businessName} | Toko Kopi di Biji Hub`;
  const description =
    seller.bio ||
    `Temukan ragam kopi pilihan dari ${seller.businessName} di ${seller.city}. Terhubung langsung dengan produsen kopi terpercaya.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: seller.avatarUrl
        ? [{ url: seller.avatarUrl, alt: seller.businessName }]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: seller.avatarUrl ? [seller.avatarUrl] : [],
    },
  };
}

function sanitizeWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export default async function StoreDetailPage({ params }: StorePageProps) {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);

  if (!seller) {
    notFound();
  }

  const listingIds = seller.listings.map((l) => l.id);
  const reviews = await getReviewsByListingIds(listingIds);
  const reviewStats = computeReviewStats(reviews);

  const cleanPhone = sanitizeWhatsApp(seller.whatsappNumber);
  const waMessage = encodeURIComponent(
    `Halo ${seller.businessName}, saya melihat profil toko Anda di Biji Hub dan tertarik untuk berdiskusi lebih lanjut mengenai produk kopi Anda.`
  );
  const waHref = `https://wa.me/${cleanPhone}?text=${waMessage}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: seller.businessName,
    description:
      seller.bio ||
      `Profil toko kopi ${seller.businessName} di ${seller.city}, Indonesia.`,
    image: seller.avatarUrl ? [seller.avatarUrl] : [],
    address: {
      "@type": "PostalAddress",
      addressLocality: seller.city,
      addressRegion: seller.province,
      addressCountry: "ID",
    },
    telephone: seller.whatsappNumber,
  };

  return (
    <div className="py-8 md:py-12 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageContainer className="space-y-8">
        <nav
          className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <Link
            href="/catalog"
            className="hover:text-neutral-900 transition-colors"
          >
            Direktori
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-900 font-medium truncate">
            {seller.businessName}
          </span>
        </nav>

        <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-6 pb-6 pt-20 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 -mt-12 sm:-mt-14">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full sm:w-auto">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 border-4 border-white shadow-md shrink-0">
                  {seller.avatarUrl ? (
                    <Image
                      src={seller.avatarUrl}
                      alt={seller.businessName}
                      fill
                      sizes="96px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif text-3xl text-neutral-700 bg-neutral-100 font-semibold select-none">
                      {seller.businessName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                      {seller.businessName}
                    </h1>
                    {seller.isVerified && <VerifiedBadge size="md" />}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-neutral-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      {seller.city}, {seller.province}
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="inline-flex items-center gap-1 font-mono text-neutral-500">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      Sejak{" "}
                      {format(new Date(seller.createdAt), "MMMM yyyy", {
                        locale: id,
                      })}
                    </span>
                    <span className="text-neutral-300">•</span>
                    {reviewStats.count > 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        {reviewStats.average}{" "}
                        <span className="text-neutral-500 font-normal">
                          ({reviewStats.count} ulasan)
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-neutral-400">
                        <Star className="w-3 h-3 text-neutral-300" /> Toko Baru
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto shrink-0 pb-1">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Chat Penjual
                </a>
              </div>
            </div>

            {seller.address && (
              <p className="text-xs text-neutral-500">{seller.address}</p>
            )}

            {seller.bio && (
              <p className="text-sm text-neutral-700 leading-relaxed pt-4 border-t border-neutral-100">
                {seller.bio}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <Package className="w-3.5 h-3.5 text-neutral-400" />
                  Total Listing
                </div>
                <p className="font-mono text-xl font-bold text-neutral-900 tabular-nums">
                  {seller.listings.length}
                </p>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  Rating Toko
                </div>
                <p className="font-mono text-xl font-bold text-neutral-900 tabular-nums">
                  {reviewStats.count > 0 ? (
                    <>
                      {reviewStats.average}{" "}
                      <span className="text-xs font-normal text-neutral-500">
                        / 5 ({reviewStats.count})
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-normal text-neutral-400">Belum ada</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                  Status
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {seller.isVerified ? "Terverifikasi" : "Reguler"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <Handshake className="w-3.5 h-3.5 text-neutral-400" />
                  Tier
                </div>
                <p className="text-sm font-medium text-neutral-900 capitalize">
                  {seller.tier}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-neutral-200/80">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">
              Katalog Produk
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {seller.listings.length} produk tersedia
            </span>
          </div>

          <ListingGrid
            listings={seller.listings}
            emptyTitle="Belum ada listing aktif"
            emptyDescription="Hubungi penjual langsung via WhatsApp untuk menanyakan ketersediaan produk."
          />
        </div>

        {/* Section Ulasan & Penilaian Pembeli */}
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <h2 className="text-lg font-bold text-neutral-900">
                Ulasan Pembeli ({reviewStats.count})
              </h2>
            </div>
            {reviewStats.count > 0 ? (
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                ★ {reviewStats.average} / 5.0 dari {reviewStats.count} ulasan terverifikasi
              </span>
            ) : (
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                Belum ada ulasan
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg text-center space-y-1 text-xs text-neutral-500">
              <p className="font-medium text-neutral-700">Belum ada ulasan untuk toko ini.</p>
              <p>Transaksi dilindungi escrow Biji Hub. Ulasan akan muncul setelah pembeli menyelesaikan pesanan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-white border border-neutral-200 rounded-lg space-y-2 shadow-xs text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">{rev.buyerName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-200 fill-neutral-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-neutral-700 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {format(new Date(rev.createdAt), "d MMMM yyyy", { locale: id })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
