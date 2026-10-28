import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { readBuyerProfileCookie } from "@/lib/auth/buyer-profile";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";

import { createClient } from "@/lib/supabase/server";
import { BuyerProfileForm } from "@/components/profile/buyer-profile-form";
import { AccountPrivacyCard } from "@/components/profile/account-privacy-card";
import type { BuyerAddress } from "@/types";
import { getUserAddresses, toBuyerAddress } from "@/lib/data/addresses";

export const metadata = {
  title: "Profil Akun - Biji Hub",
  description: "Kelola akun pengguna dan akses direktori kopi specialty Indonesia.",
};

export const dynamic = "force-dynamic";

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

  let userEmail = session.email || "";
  let userName = "";
  let userAvatarUrl = "";
  let userPhone = "";
  let userProvince = "";
  let userCity = "";
  let userPostalCode = "";
  let userAddress = "";

  let userAddresses: BuyerAddress[] = [];

  if (session.userId) {
    try {
      const dbAddresses = await getUserAddresses(session.userId);
      if (dbAddresses.length > 0) {
        userAddresses = dbAddresses.map(toBuyerAddress);
      }
    } catch {
      // ignore
    }
  }

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
        if (Array.isArray(user.user_metadata?.addresses) && user.user_metadata.addresses.length > 0) {
          userAddresses = user.user_metadata.addresses;
        }
      }
    } catch {
      // ignore: optional profile cookie read fallback
      // ignore
    }
  }

  if (process.env.DATA_SOURCE === "mock") {
    try {
      const cookieStore = await cookies();
      const profile = readBuyerProfileCookie(cookieStore);
      userName = userName || profile.name || "";
      userAvatarUrl = userAvatarUrl || profile.avatarUrl || "";
      userPhone = userPhone || profile.phone || "";
      userProvince = userProvince || profile.province || "";
      userCity = userCity || profile.city || "";
      userPostalCode = userPostalCode || profile.postalCode || "";
      userAddress = userAddress || profile.address || "";
      if (!userAddresses.length && profile.addresses && profile.addresses.length > 0) {
        userAddresses = profile.addresses as unknown as BuyerAddress[];
      }
    } catch {
      // ignore: optional profile cookie read fallback
    }
  }

  if (!userAddresses.length && userAddress && userCity) {
    userAddresses = [
      {
        id: "addr-default",
        label: "Rumah",
        recipientName: userName || "Penerima",
        phone: userPhone || "-",
        province: userProvince,
        city: userCity,
        postalCode: userPostalCode,
        address: userAddress,
        isPrimary: true,
      },
    ];
  }

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

      {session.sellerId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Ini profil akun belanja pribadi Anda. Ingin mengedit profil toko/roastery Anda?</span>
          </div>
          <Link
            href="/dashboard/profile"
            className="font-bold underline text-amber-800 hover:text-amber-950 shrink-0 sm:ml-2"
          >
            Edit Profil Toko Roastery →
          </Link>
        </div>
      )}

      {/* Alert banner if redirected from checkout gate */}
      {required === "shipping" && (
        <div className="p-4 rounded-sm border border-amber-300 bg-amber-50/70 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-sm text-amber-950">
              Lengkapi Alamat Pengiriman Terlebih Dahulu
            </p>
            <p className="leading-relaxed">
              Sebelum melanjutkan ke pemesanan, silakan tambahkan alamat pengiriman pada daftar alamat di bawah ini.
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
          addresses: userAddresses,
        }}
        nextUrl={next}
      />

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

      {/* UU PDP Hak Portabilitas & Penghapusan Akun */}
      <AccountPrivacyCard />

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
