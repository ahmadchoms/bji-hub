import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import type { SellerProfile } from "@/types";

interface OnboardingCardProps {
  seller: SellerProfile;
  totalListings: number;
}

export function OnboardingCard({ seller, totalListings }: OnboardingCardProps) {
  const steps = [
    {
      id: "profile",
      label: "Lengkapi profil bisnis & kontak",
      done: Boolean(seller.businessName && seller.whatsappNumber && seller.city && seller.bio),
      href: "/dashboard/settings",
    },
    {
      id: "listing",
      label: "Publikasikan biji kopi pertama Anda",
      done: totalListings > 0,
      href: "/dashboard/listing/new",
    },
    {
      id: "verification",
      label: "Verifikasi badge toko terpercaya",
      done: seller.isVerified,
      href: "/dashboard/verification",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === steps.length) return null;

  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Langkah Persiapan Toko ({completedCount}/{steps.length})
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Selesaikan langkah berikut agar profil dan katalog Anda lebih dipercaya oleh roastery dan pembeli.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 bg-neutral-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-primary-800">{progressPercent}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
              step.done
                ? "bg-white/80 border-neutral-200 text-neutral-500 hover:bg-white"
                : "bg-white border-primary-300 text-neutral-900 hover:border-primary-500 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-400 shrink-0" />
              )}
              <span className={`text-xs truncate ${step.done ? "line-through text-neutral-400" : "font-medium"}`}>
                {step.label}
              </span>
            </div>
            {!step.done && <ArrowRight className="w-3.5 h-3.5 text-primary-600 shrink-0 ml-1" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
