import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getListingBySlug, getListingFeed } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { ImageGallery } from "@/components/catalog/image-gallery";
import { TasteSpecList } from "@/components/catalog/taste-spec-list";
import { TraceabilityBlock } from "@/components/catalog/traceability-block";
import { findSimilarListings } from "@/lib/coffee/similarity";
import { DynamicFlavorProfile as FlavorProfile } from "@/components/catalog/dynamic-flavor-profile";
import { InquiryForm } from "@/components/catalog/inquiry-form";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { B2BNegotiationBox } from "@/components/catalog/b2b-negotiation-box";
import { SampleRequestModal } from "@/components/catalog/sample-request-modal";
import { CuppingSheetModal } from "@/components/catalog/cupping-sheet-modal";
import { CompareButton } from "@/components/catalog/compare-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ProductStickyCTA } from "@/components/catalog/product-sticky-cta";
import { TrackOnMount } from "@/components/shared/track-visible";
import { Star } from "lucide-react";
import { ProductPurchaseBox } from "@/components/product/product-purchase-box";
import { getReviewsByListing, computeReviewStats } from "@/lib/data/reviews";
import { FreshnessBadge } from "@/components/catalog/freshness-badge";
import { calculateRoastToShipSla } from "@/lib/coffee/shipping-sla";
import { RoastSlaBadge } from "@/components/catalog/roast-sla-badge";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const { items } = await getListingFeed({ pageSize: 50, sort: "newest" });
    return items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (
    !listing ||
    listing.status !== "active" ||
    Boolean(listing.seller.suspendedAt)
  ) {
    return { title: "Produk Tidak Ditemukan - Biji Hub" };
  }

  const primaryImage = listing.images?.[0]?.url;
  const priceFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(listing.price);

  const title = `${listing.title} | ${listing.seller.businessName}`;
  const origin = listing.tasteProfile?.originRegion
    ? `Asal: ${listing.tasteProfile.originRegion}`
    : "";
  const process = listing.tasteProfile?.processMethod
    ? `Proses: ${listing.tasteProfile.processMethod}`
    : "";
  const notes = listing.tasteProfile?.flavorNotes
    ? `Notes: ${listing.tasteProfile.flavorNotes}`
    : "";
  const specs = [origin, process, notes].filter(Boolean).join(" • ");
  const desc = listing.description ? `${listing.description.slice(0, 140)}...` : "";
  const description = `${priceFormatted}/${listing.unit}.${specs ? ` ${specs}.` : ""}${desc ? ` ${desc}` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: primaryImage ? [{ url: primaryImage, alt: listing.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (
    !listing ||
    listing.status !== "active" ||
    Boolean(listing.seller.suspendedAt)
  ) {
    notFound();
  }

  const relatedResult = await getListingFeed({
    categorySlug: listing.category.slug,
    pageSize: 50,
  });
  const similarListings = findSimilarListings(listing, relatedResult.items, 6);

  const reviews = await getReviewsByListing(listing.id);
  const reviewStats = computeReviewStats(reviews);
  const slaResult = await calculateRoastToShipSla(listing.sellerId);

  const primaryImage = listing.images?.[0]?.url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    image: primaryImage ? [primaryImage] : [],
    description:
      listing.description ||
      `${listing.title} dari ${listing.seller.businessName}`,
    category: listing.category.name,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "IDR",
      availability:
        (typeof listing.stock === "number" && listing.stock <= 0) || listing.status !== "active"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: listing.seller.businessName,
      },
    },
    ...(listing.ratingCount && listing.ratingCount > 0 && listing.ratingAvg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.ratingAvg,
            reviewCount: listing.ratingCount,
          },
        }
      : {}),
  };

  return (
    <div className="py-8 md:py-12 space-y-10 pb-20 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <TrackOnMount listingId={listing.id} type="view" />
      <ProductStickyCTA listing={listing} />
      <PageContainer className="space-y-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-neutral-600 font-mono overflow-x-auto whitespace-nowrap"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary-700">
            Beranda
          </Link>
          <span>/</span>
          <Link
            href={`/?category=${listing.category.slug}`}
            className="hover:text-primary-700"
          >
            {listing.category.name}
          </Link>
          <span>/</span>
          <span className="text-neutral-900 truncate max-w-xs">
            {listing.title}
          </span>
        </nav>

        {/* Product Detail — 2 column editorial */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Images + Description */}
          <div className="lg:col-span-7 space-y-8">
            <ImageGallery images={listing.images} title={listing.title} />

            <TasteSpecList tasteProfile={listing.tasteProfile} />

            <TraceabilityBlock tasteProfile={listing.tasteProfile} />

            <div className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-neutral-900 pb-2 border-b border-neutral-300">
                Deskripsi
              </h3>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {listing.description ||
                  "Biji kopi pilihan yang diproses dengan dedikasi tinggi oleh petani lokal untuk menghadirkan cita rasa terbaik khas tanah Nusantara."}
              </p>
            </div>
            <FlavorProfile tasteProfile={listing.tasteProfile} />

            {/* Ulasan Pembeli */}
            <div className="space-y-4 pt-4 border-t border-neutral-300">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-neutral-900">
                  Ulasan Pembeli ({reviewStats.count})
                </h3>
                {reviewStats.count > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{reviewStats.average.toFixed(1)} / 5.0</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="p-4 bg-neutral-50 rounded border border-neutral-200 text-xs text-neutral-600 text-center">
                  Belum ada ulasan untuk produk ini. Ulasan akan muncul setelah pembeli menyelesaikan pesanan.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 bg-neutral-50/70 rounded border border-neutral-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900">{r.buyerName}</span>
                        <span className="text-neutral-400 font-mono text-xs">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating
                                ? "fill-amber-400 text-amber-500"
                                : "text-neutral-300"
                            }`}
                          />
                        ))}
                      </div>
                      {r.comment && (
                        <p className="text-neutral-700 leading-relaxed">{r.comment}</p>
                      )}
                      {r.imageUrl && (
                        <div className="pt-1">
                          <a
                            href={r.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block relative w-16 h-16 rounded overflow-hidden border border-neutral-300 hover:opacity-90 transition-opacity"
                            title="Klik untuk melihat foto ulasan ukuran penuh"
                          >
                            <Image
                              src={r.imageUrl}
                              alt={`Foto ulasan oleh ${r.buyerName}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </a>
                        </div>
                      )}

                      {r.sellerReply && (
                        <div className="mt-2.5 p-2.5 bg-neutral-100 rounded border-l-2 border-primary-600 text-xs space-y-1">
                          <p className="font-semibold text-neutral-900">Respon Penjual:</p>
                          <p className="text-neutral-700 leading-relaxed">{r.sellerReply}</p>
                          {r.sellerRepliedAt && (
                            <p className="text-xs text-neutral-400">
                              {new Date(r.sellerRepliedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {r.isReported && (
                        <div className="pt-1">
                          <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Dalam Peninjauan Moderasi
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="inquiry-form">
              <InquiryForm
                listingId={listing.id}
                listingTitle={listing.title}
                sellerName={listing.seller.businessName}
              />
            </div>
          </div>

          {/* Right: Buying Info (sticky) */}
          <div className="order-first lg:order-0 lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-600 uppercase tracking-wider">
                  {listing.category.name}
                </span>
                {listing.seller.isVerified && <VerifiedBadge size="sm" />}
                <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200" title="Kode Unik Lot/SKU">
                  SKU: #{listing.id.slice(-6).toUpperCase()}
                </span>
              </div>

              {/* Title & Origin */}
              <div className="space-y-2">
                <h1 className="font-display text-2xl md:text-3xl text-primary-900 tracking-tight font-semibold leading-tight">
                  {listing.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <p className="text-neutral-600">
                    {listing.seller.businessName} —{" "}
                    {listing.tasteProfile?.originRegion || listing.seller.city},{" "}
                    {listing.seller.province}
                  </p>
                  <div className="flex items-center gap-1 font-mono text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {reviewStats.count > 0 ? (
                      <span>
                        <strong>{reviewStats.average.toFixed(1)}</strong> ({reviewStats.count} ulasan)
                      </span>
                    ) : (
                      <span className="text-neutral-600">Belum ada ulasan</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lencana Kesegaran Sangrai (COF-1) & SLA Sangrai-Kirim (COF-13) */}
              <div className="flex flex-wrap items-center gap-2">
                {listing.tasteProfile?.roastDate && listing.category?.slug !== "green-beans" && (
                  <FreshnessBadge
                    roastDate={listing.tasteProfile.roastDate}
                    roastLevel={listing.tasteProfile.roastLevel}
                  />
                )}
                {slaResult.qualifiesForSlaBadge && <RoastSlaBadge />}
              </div>

              {/* Pricing, Grind Selector, Stock & Purchase Box */}
              <ProductPurchaseBox listing={listing} />

              {/* B2B WhatsApp Negotiation Alternative */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral-600 font-mono">
                    atau negosiasi langsung
                  </span>
                </div>
              </div>

              <B2BNegotiationBox
                phoneNumber={listing.seller.whatsappNumber}
                listingId={listing.id}
                listingTitle={listing.title}
                sellerName={listing.seller.businessName}
              />

              <SampleRequestModal
                listingId={listing.id}
                listingTitle={listing.title}
                sellerName={listing.seller.businessName}
                sellerPhone={listing.seller.whatsappNumber}
              />

              <CuppingSheetModal listing={listing} />

              <div className="grid grid-cols-2 gap-2">
                <WishlistButton listing={listing} variant="button" />
                <CompareButton listing={listing} variant="button" />
              </div>

              {/* Seller card */}
              <div className="p-4 border border-neutral-300 rounded-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-neutral-900 truncate">
                      {listing.seller.businessName}
                    </span>
                    {listing.seller.isVerified && (
                      <VerifiedBadge size="sm" showLabel={false} />
                    )}
                  </div>
                  <p className="text-xs text-neutral-600">
                    {listing.seller.city}, {listing.seller.province}
                  </p>
                </div>
                <Link
                  href={`/store/${listing.seller.slug}`}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 border border-neutral-300 rounded-sm hover:bg-neutral-50 shrink-0"
                >
                  Kunjungi Toko
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Listings based on Taste Vector / Category */}
        {similarListings.length > 0 && (
          <div className="pt-8 border-t border-neutral-300 space-y-6">
            <div className="flex items-baseline justify-between pb-3 border-b border-neutral-300">
              <div>
                <h3 className="font-display text-xl text-neutral-900 font-semibold">
                  Mirip dengan Ini
                </h3>
                <p className="text-xs text-neutral-600">
                  Rekomendasi kopi dengan kemiripan profil rasa dan karakter sangrai
                </p>
              </div>
              <Link
                href={`/?category=${listing.category.slug}`}
                className="text-xs font-semibold text-primary-700 hover:underline coarse:min-h-11 inline-flex items-center"
              >
                Lihat Semua →
              </Link>
            </div>
            <ListingGrid listings={similarListings} />
          </div>
        )}
      </PageContainer>
    </div>
  );
}
