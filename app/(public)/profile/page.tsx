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

export const metadata = {
  title: "Profil Akun - Biji Hub",
  description: "Kelola akun pengguna dan akses direktori kopi specialty Indonesia.",
};

export default async function ProfilePage() {
  const session = await getSession();

  if (session.role === "guest") {
    redirect(`/login?next=${encodeURIComponent("/profile")}`);
  }

  if (session.role === "seller") {
    redirect("/dashboard/profile");
  }

  let userEmail = "";
  let userName = "";
  let userAvatarUrl = "";
  let userPhone = "";
  let userCity = "";
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
        userCity = (user.user_metadata?.city as string) || "";
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

      {/* Form Profil Pembeli */}
      <BuyerProfileForm
        initialData={{
          email: userEmail,
          name: userName,
          avatarUrl: userAvatarUrl,
          phone: userPhone,
          city: userCity,
          address: userAddress,
        }}
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
