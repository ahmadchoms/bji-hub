import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getSellerBySlug } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { ListingGrid } from "@/components/catalog/listing-grid";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreDetailPage({ params }: StorePageProps) {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);

  if (!seller) {
    notFound();
  }

  return (
    <div className="py-8 md:py-12 space-y-10">
      <PageContainer className="space-y-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-neutral-500 font-mono"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary-700">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-primary-700">
            Direktori
          </Link>
          <span>/</span>
          <span className="text-neutral-900 truncate">
            {seller.businessName}
          </span>
        </nav>

        {/* Store Header — editorial with cover banner */}
        <div className="border border-neutral-300 rounded-sm overflow-hidden bg-surface-base space-y-0">
          {/* Cover Banner */}
          <div
            className={
              seller.tier === "business" || seller.tier === "growth"
                ? "h-28 sm:h-36 w-full bg-gradient-to-r from-primary-900 via-primary-700 to-secondary-700 relative p-4 flex items-end justify-end"
                : "h-24 sm:h-28 w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-secondary-50 relative p-4 flex items-end justify-end"
            }
          >
            {seller.tier === "business" && (
              <span className="text-[10px] font-mono tracking-widest uppercase bg-surface-base/90 text-primary-900 font-semibold px-2.5 py-1 rounded-xs backdrop-blur-xs shadow-xs">
                Mitra Utama Biji
              </span>
            )}
            {seller.tier === "growth" && (
              <span className="text-[10px] font-mono tracking-widest uppercase bg-surface-base/90 text-primary-900 font-semibold px-2.5 py-1 rounded-xs backdrop-blur-xs shadow-xs">
                Roastery Terpilih
              </span>
            )}
          </div>

          <div className="p-6 pt-0 space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-5 -mt-12 sm:-mt-14">
              <div className="relative w-24 h-24 rounded-sm overflow-hidden bg-secondary-50 border-4 border-surface-base shadow-sm shrink-0">
                {seller.avatarUrl ? (
                  <Image
                    src={seller.avatarUrl}
                    alt={seller.businessName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-2xl text-primary-900 font-semibold">
                    {seller.businessName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5 pt-2 sm:pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl md:text-3xl text-primary-900 font-semibold">
                    {seller.businessName}
                  </h1>
                  {seller.isVerified && <VerifiedBadge size="md" />}
                </div>
                <p className="text-xs text-neutral-600">
                  {seller.city}, {seller.province} — {seller.address}
                </p>
                <p className="text-[11px] font-mono text-neutral-500">
                  Bergabung sejak {format(new Date(seller.createdAt), "MMMM yyyy", { locale: id })}
                </p>
              </div>

              <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-4">
                <WhatsAppButton
                  phoneNumber={seller.whatsappNumber}
                  listingId="STORE-PROFILE"
                  listingTitle={`Profil Toko ${seller.businessName}`}
                  sellerName={seller.businessName}
                  size="lg"
                  className="w-full sm:w-auto font-medium"
                >
                  Chat Penjual
                </WhatsAppButton>
              </div>
            </div>

            {seller.bio && (
              <p className="text-sm text-neutral-600 leading-relaxed pt-4 border-t border-neutral-300">
                {seller.bio}
              </p>
            )}

            {/* Spec row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-300">
              <div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Total Listing
                </p>
                <p className="font-mono text-lg font-bold text-neutral-900">
                  {seller.listings.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Status Akun
                </p>
                <p className="text-sm font-medium text-neutral-900 mt-1">
                  {seller.isVerified ? "Terverifikasi Resmi" : "Reguler"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Tier Kemitraan
                </p>
                <p className="text-sm font-medium text-neutral-900 mt-1 uppercase">
                  {seller.tier}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Metode Transaksi
                </p>
                <p className="text-sm font-medium text-neutral-900 mt-1">
                  Direct Trade via WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Listings */}
        <div className="space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-neutral-300">
            <h2 className="font-display text-xl text-neutral-900 font-semibold">
              Katalog dari {seller.businessName}
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {seller.listings.length} produk
            </span>
          </div>

          <ListingGrid
            listings={seller.listings}
            emptyTitle="Belum ada listing aktif"
            emptyDescription="Hubungi penjual langsung via WhatsApp untuk menanyakan ketersediaan."
          />
        </div>
      </PageContainer>
    </div>
  );
}
