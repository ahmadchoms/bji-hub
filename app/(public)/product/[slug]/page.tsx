import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingBySlug, getListingFeed } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { ImageGallery } from "@/components/catalog/image-gallery";
import { FlavorProfile } from "@/components/catalog/flavor-profile";
import { BrewCalculator } from "@/components/catalog/brew-calculator";
import { TasteSpecList } from "@/components/catalog/taste-spec-list";
import { InquiryForm } from "@/components/catalog/inquiry-form";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { PriceText } from "@/components/shared/price-text";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { SampleRequestModal } from "@/components/catalog/sample-request-modal";
import { CuppingSheetModal } from "@/components/catalog/cupping-sheet-modal";
import { CompareButton } from "@/components/catalog/compare-button";
import { ProductStickyCTA } from "@/components/catalog/product-sticky-cta";
import { TrackOnMount } from "@/components/shared/track-visible";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const relatedResult = await getListingFeed({
    categorySlug: listing.category.slug,
  });
  const relatedListings = relatedResult.items
    .filter((l) => l.id !== listing.id)
    .slice(0, 3);

  return (
    <div className="py-8 md:py-12 space-y-10 pb-20 md:pb-0">
      <TrackOnMount listingId={listing.id} type="view" />
      <ProductStickyCTA
        phoneNumber={listing.seller.whatsappNumber}
        listingId={listing.id}
        listingTitle={listing.title}
        sellerName={listing.seller.businessName}
      />
      <PageContainer className="space-y-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-neutral-500 font-mono overflow-x-auto whitespace-nowrap"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary-700">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-primary-700">
            Katalog
          </Link>
          <span>/</span>
          <Link
            href={`/?kategori=${listing.category.slug}`}
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

            <BrewCalculator />

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
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                  {listing.category.name}
                </span>
                {listing.seller.isVerified && <VerifiedBadge size="sm" />}
              </div>

              {/* Title & Origin */}
              <div className="space-y-2">
                <h1 className="font-display text-2xl md:text-3xl text-primary-900 tracking-tight font-semibold leading-tight">
                  {listing.title}
                </h1>
                <p className="text-sm text-neutral-600">
                  {listing.seller.businessName} —{" "}
                  {listing.tasteProfile?.originRegion || listing.seller.city},{" "}
                  {listing.seller.province}
                </p>
              </div>

              {/* Pricing Box */}
              <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-sm">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                      Harga
                    </p>
                    <PriceText
                      price={listing.price}
                      unit={listing.unit}
                      size="lg"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                      Min. Order
                    </p>
                    <span className="font-mono text-sm font-bold text-neutral-900">
                      {listing.minOrderQty} {listing.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <p className="text-xs text-neutral-600">
                Transaksi dilakukan langsung dengan penjual di luar platform.
              </p>
              <WhatsAppButton
                phoneNumber={listing.seller.whatsappNumber}
                listingId={listing.id}
                listingTitle={listing.title}
                sellerName={listing.seller.businessName}
                size="lg"
                className="w-full font-medium justify-center"
              >
                Hubungi Penjual via WhatsApp
              </WhatsAppButton>

              <SampleRequestModal
                listingId={listing.id}
                listingTitle={listing.title}
                sellerName={listing.seller.businessName}
                sellerPhone={listing.seller.whatsappNumber}
                size="lg"
                className="w-full font-medium justify-center"
              />

              <CuppingSheetModal listing={listing} />

              <CompareButton listing={listing} variant="button" />

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
                  <p className="text-xs text-neutral-500">
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

        {/* Related */}
        {relatedListings.length > 0 && (
          <div className="pt-8 border-t border-neutral-300 space-y-6">
            <div className="flex items-baseline justify-between pb-3 border-b border-neutral-300">
              <h3 className="font-display text-xl text-neutral-900 font-semibold">
                Sejenis Lainnya
              </h3>
              <Link
                href={`/?kategori=${listing.category.slug}`}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Lihat Semua →
              </Link>
            </div>
            <ListingGrid listings={relatedListings} />
          </div>
        )}
      </PageContainer>
    </div>
  );
}
