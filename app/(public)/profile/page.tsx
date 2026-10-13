import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Store, ArrowRight, Compass, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";

import { createClient } from "@/lib/supabase/server";
import { BuyerProfileForm } from "@/components/profile/buyer-profile-form";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { formatRupiah } from "@/components/shared/price-text";
import { Package, Truck, Clock, CheckCircle2, AlertCircle, MapPin, AlertTriangle } from "lucide-react";
import { ConfirmOrderButton } from "@/components/order/confirm-order-button";
import { OrderReviewModal } from "@/components/order/order-review-modal";
import { OrderDisputeModal } from "@/components/order/order-dispute-modal";

export const metadata = {
  title: "Profil Akun - Biji Hub",
  description: "Kelola akun pengguna dan akses direktori kopi specialty Indonesia.",
};

interface ProfilePageProps {
  searchParams: Promise<{
    required?: string;
    next?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { required, next } = await searchParams;
  const session = await getSession();

  if (session.role === "guest") {
    redirect(`/login?next=${encodeURIComponent(next || "/profile")}`);
  }

  if (session.role === "seller") {
    redirect("/dashboard/profile");
  }

  let userEmail = "";
  let userName = "";
  let userAvatarUrl = "";
  let userPhone = "";
  let userProvince = "";
  let userCity = "";
  let userPostalCode = "";
  let userAddress = "";

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || "";
        userName =
          ((user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0]) as string) || "";
        userAvatarUrl = (user.user_metadata?.avatar_url as string) || "";
        userPhone = (user.user_metadata?.phone as string) || "";
        userProvince = (user.user_metadata?.province as string) || "";
        userCity = (user.user_metadata?.city as string) || "";
        userPostalCode = (user.user_metadata?.postal_code as string) || "";
        userAddress = (user.user_metadata?.address as string) || "";
      }
    } catch {
      // ignore
    }
  }

  if (!userEmail) {
    userEmail = "pembeli@bijihub.com";
    userName = "Akbar Hakim";
  }

  const buyerOrders = await getOrdersByBuyer(userEmail);

  return (
    <PageContainer className="py-10 md:py-16 max-w-2xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-900">
            Akun Pembeli
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kelola profil diri, alamat pengiriman, dan jelajahi direktori kopi specialty Indonesia.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit text-xs font-semibold px-2.5 py-1 text-primary-800 border-primary-200 bg-primary-50"
        >
          Akun Pembeli
        </Badge>
      </div>

      {/* Alert banner if redirected from checkout gate */}
      {required === "shipping" && (
        <div className="p-4 rounded-sm border border-amber-300 bg-amber-50/70 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-sm text-amber-950">
              Lengkapi Alamat Pengiriman Terlebih Dahulu
            </p>
            <p className="leading-relaxed">
              Sebelum melanjutkan ke pemesanan, silakan isi data penerima dan alamat pengiriman di bawah ini. Data Anda akan tersimpan otomatis untuk transaksi berikutnya.
            </p>
          </div>
        </div>
      )}

      {/* Form Profil Pembeli */}
      <BuyerProfileForm
        initialData={{
          email: userEmail,
          name: userName,
          avatarUrl: userAvatarUrl,
          phone: userPhone,
          province: userProvince,
          city: userCity,
          postalCode: userPostalCode,
          address: userAddress,
        }}
        nextUrl={next}
      />

      {/* Riwayat Pesanan Saya */}
      <Card className="border-neutral-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-600" />
                Riwayat Pesanan Saya
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Daftar transaksi langsung dan status pengiriman biji kopi Anda.
              </CardDescription>
            </div>
            <span className="font-mono text-xs text-neutral-500">
              {buyerOrders.length} Pesanan
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {buyerOrders.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-neutral-200 rounded-sm">
              <p className="text-xs text-neutral-500">Belum ada riwayat pesanan.</p>
              <Link
                href="/catalog"
                className="text-xs font-semibold text-primary-600 hover:underline mt-1 inline-block"
              >
                Jelajahi Katalog Biji Kopi &rarr;
              </Link>
            </div>
          ) : (
            buyerOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 border border-neutral-200 rounded-sm space-y-2 text-xs hover:border-neutral-300 transition-colors bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-neutral-900">
                    {ord.orderNumber}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      ord.status === "completed"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                        : ord.status === "disputed"
                          ? "text-rose-700 bg-rose-50 border-rose-300"
                          : ord.status === "shipped"
                            ? "text-purple-700 bg-purple-50 border-purple-300"
                            : ord.status === "paid"
                              ? "text-blue-700 bg-blue-50 border-blue-300"
                              : "text-amber-700 bg-amber-50 border-amber-300"
                    }
                  >
                    {ord.status === "completed"
                      ? "Selesai"
                      : ord.status === "disputed"
                        ? "Komplain"
                        : ord.status === "shipped"
                          ? "Dikirim"
                          : ord.status === "paid"
                            ? "Diproses"
                            : "Menunggu Bayar"}
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline text-neutral-700">
                  <span className="truncate max-w-[240px] font-medium text-neutral-900">
                    {ord.listingTitle || `Produk #${ord.listingId}`}
                  </span>
                  <span className="font-mono font-bold text-primary-900">
                    {formatRupiah(ord.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px] text-neutral-500">
                  <span>
                    Kurir: {ord.shippingCourier}{" "}
                    {ord.trackingNumber && `(Resi: ${ord.trackingNumber})`}
                  </span>
                  <Link
                    href={`/order/success?orderNumber=${ord.orderNumber}`}
                    className="font-medium text-primary-600 hover:text-primary-800"
                  >
                    Lihat Rincian &rarr;
                  </Link>
                </div>
                {ord.status === "shipped" && (
                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/50 p-2 rounded">
                    <span className="text-[11px] text-emerald-800">
                      Paket sudah tiba?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <OrderDisputeModal orderId={ord.id} orderNumber={ord.orderNumber} />
                      <ConfirmOrderButton
                        orderId={ord.id}
                        orderNumber={ord.orderNumber}
                      />
                    </div>
                  </div>
                )}
                {ord.status === "completed" && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-end">
                    <OrderReviewModal
                      orderId={ord.id}
                      listingId={ord.listingId}
                      listingTitle={ord.listingTitle || "Biji Kopi"}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-primary-200 bg-primary-50/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary-100 text-primary-800">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-primary-950">
                Punya Kebun Kopi atau Roastery?
              </CardTitle>
              <CardDescription className="text-xs text-primary-700">
                Mulai pasang produk kopi Anda dan jangkau calon pembeli & kedai kopi di seluruh Indonesia.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <ul className="text-xs text-primary-800 space-y-1.5">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Bebas komisi transaksi (100% langsung via WhatsApp)
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Kelola katalog, taste profile radar chart, & analitik pengunjung
            </li>
          </ul>
          <div className="pt-2">
            <Link href="/open-store">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                Buka Toko Mitra Sekarang <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 border-t border-neutral-200 flex justify-end">
        <form action={logoutAction}>
          <Button variant="outline" size="sm" className="text-xs text-status-error hover:bg-red-50 hover:text-red-700">
            Keluar dari Akun
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
