import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/page-container";
import { SellerOnboardingForm } from "@/components/auth/seller-onboarding-form";
import { Store, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Buka Toko Kopi - Biji Hub",
  description:
    "Daftarkan kebun, koperasi, atau roastery kopi Anda di Biji Hub. Mulai pasang listing dan jangkau pasar specialty coffee langsung.",
};

export default async function BukaTokoPage() {
  const session = await getSession();

  if (session.role === "seller") {
    redirect("/dashboard");
  }

  if (session.role === "guest") {
    redirect(`/login?next=${encodeURIComponent("/buka-toko")}`);
  }

  return (
    <PageContainer className="py-10 md:py-16 max-w-xl">
      <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary-50 text-primary-700 mx-auto mb-1">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl text-neutral-900 font-semibold">
            Buka Toko Kopi Anda
          </h1>
          <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Lengkapi profil toko Anda untuk langsung mengunggah varian biji kopi dan menerima inquiry dari roastery & kedai kopi.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-3 px-4 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Tanpa potongan komisi</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Kontak WhatsApp langsung</span>
          </div>
        </div>

        <SellerOnboardingForm />
      </div>
    </PageContainer>
  );
}
