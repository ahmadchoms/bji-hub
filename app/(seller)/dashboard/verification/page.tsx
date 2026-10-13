import { requireSeller } from "@/lib/auth/session";
import { getSellerById, getSellerStats } from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { RequestVerificationButton } from "@/components/dashboard/request-verification-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Store, FileText, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SellerVerificationPage() {
  const { sellerId } = await requireSeller();
  const [seller, stats] = await Promise.all([
    getSellerById(sellerId),
    getSellerStats(sellerId),
  ]);

  if (!seller) {
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  const isProfileComplete = Boolean(
    seller.businessName && seller.whatsappNumber && seller.city && seller.bio,
  );
  const hasListing = stats.totalListings > 0;
  const isPendingReview = !seller.isVerified && seller.verificationStatus === "pending";
  const isRejected = !seller.isVerified && seller.verificationStatus === "rejected";

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Verifikasi Toko"
          subtitle="Dapatkan badge terverifikasi untuk meningkatkan kepercayaan roastery dan pembeli."
        />
        {seller.isVerified && <VerifiedBadge size="md" />}
        {isPendingReview && (
          <Badge variant="outline" className="gap-1.5 py-1 px-3 border-amber-300 bg-amber-50 text-amber-800">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Sedang Ditinjau
          </Badge>
        )}
      </div>

      {seller.isVerified ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-emerald-900 text-lg">Toko Anda Telah Terverifikasi</CardTitle>
                <CardDescription className="text-emerald-700">
                  Status verifikasi aktif. Profil dan produk Anda memiliki kredibilitas terpercaya di platform Biji.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-emerald-900">Manfaat yang Anda Dapatkan:</h4>
            <ul className="text-sm text-emerald-800 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Badge &quot;Verified&quot; otomatis tampil di seluruh katalog produk dan profil toko.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Prioritas visibilitas bagi calon pembeli B2B (kedai kopi & roastery rekanan).
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Dukungan kurasi langsung dari tim Biji Corp saat peninjauan produk.
              </li>
            </ul>
          </CardContent>
        </Card>
      ) : isPendingReview ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-amber-900 text-lg">Permohonan Verifikasi Sedang Ditinjau</CardTitle>
                <CardDescription className="text-amber-700">
                  Tim kurasi Biji Corp sedang memeriksa data profil toko Anda.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 text-sm text-amber-800">
            <p>
              Proses verifikasi membutuhkan waktu 1–2 hari kerja. Kami akan mengecek kesesuaian kontak WhatsApp,
              lokasi operasional, serta katalog kopi yang Anda unggah.
            </p>
            <div className="p-3 bg-white/70 rounded-md border border-amber-200">
              <p className="font-medium text-amber-900">Perlu mengubah data profil selama peninjauan?</p>
              <Link href="/dashboard/profile" className="text-primary-700 underline text-xs font-semibold mt-1 inline-block">
                Perbarui Profil Toko →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {isRejected && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Pengajuan verifikasi sebelumnya belum disetujui</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Pastikan informasi toko, nomor kontak WhatsApp, dan deskripsi produk Anda sudah lengkap dan akurat
                  sebelum mengajukan kembali.
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kriteria Persyaratan Verifikasi Toko</CardTitle>
              <CardDescription>
                Pastikan toko Anda memenuhi kriteria berikut agar permohonan verifikasi segera disetujui:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200">
                  {isProfileComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">1. Profil Usaha Lengkap</p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Nama bisnis, deskripsi bio, kota asal ({seller.city || "belum diisi"}), dan nomor WhatsApp aktif.
                    </p>
                  </div>
                  {!isProfileComplete && (
                    <Link href="/dashboard/profile">
                      <Button variant="outline" size="sm" className="text-xs">
                        Lengkapi
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200">
                  {hasListing ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">2. Memiliki Minimal 1 Produk Aktif</p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {hasListing
                        ? `${stats.totalListings} produk telah terdaftar di katalog Anda.`
                        : "Unggah minimal satu varian biji kopi atau produk untuk diverifikasi kualitasnya."}
                    </p>
                  </div>
                  {!hasListing && (
                    <Link href="/dashboard/listing/new">
                      <Button variant="outline" size="sm" className="text-xs">
                        Tambah Produk
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">3. Keaslian & Legalitas Usaha</p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Produsen petani lokal, koperasi, atau roastery legal (memiliki NIB, P-IRT, atau kontak penanggung jawab valid).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-neutral-500">
                  {isProfileComplete && hasListing
                    ? "Semua kriteria awal terpenuhi. Anda siap mengajukan verifikasi."
                    : "Lengkapi persyaratan bertanda kuning di atas untuk mempercepat persetujuan."}
                </p>
                <RequestVerificationButton disabled={!isProfileComplete || !hasListing} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-lg border border-neutral-200 bg-surface-base space-y-2">
          <Store className="h-5 w-5 text-primary-600" />
          <h4 className="text-sm font-semibold text-neutral-900">Kredibilitas Toko</h4>
          <p className="text-xs text-neutral-600">
            Badge verified membedakan petani atau roastery terpercaya dari akun penjual biasa.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-neutral-200 bg-surface-base space-y-2">
          <Phone className="h-5 w-5 text-primary-600" />
          <h4 className="text-sm font-semibold text-neutral-900">Tervalidasi WhatsApp</h4>
          <p className="text-xs text-neutral-600">
            Nomor kontak seller dipastikan aktif sehingga calon pembeli tidak ragu mengirim pesan.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-neutral-200 bg-surface-base space-y-2">
          <FileText className="h-5 w-5 text-primary-600" />
          <h4 className="text-sm font-semibold text-neutral-900">Kurasi Biji Kopi</h4>
          <p className="text-xs text-neutral-600">
            Listing kopi melewati standar penamaan, origin region, dan cupping profile yang jelas.
          </p>
        </div>
      </div>
    </div>
  );
}
