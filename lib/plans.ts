export type PlanTier = "free" | "growth" | "business";

export interface Plan {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  maxListings: number;
  canRequestVerification: boolean;
  analytics: "summary" | "per_listing" | "full";
  freeBoostsPerMonth: number;
  searchPriority: "Dasar" | "Tinggi" | "Tertinggi";
}

export const FREE_BOOST_DAYS = 7;

export const PLANS: readonly Plan[] = [
  {
    tier: "free",
    name: "Gratis",
    priceMonthly: 0,
    maxListings: 3,
    canRequestVerification: false,
    analytics: "summary",
    freeBoostsPerMonth: 0,
    searchPriority: "Dasar",
  },
  {
    tier: "growth",
    name: "Growth",
    priceMonthly: 79_000,
    maxListings: 15,
    canRequestVerification: true,
    analytics: "per_listing",
    freeBoostsPerMonth: 1,
    searchPriority: "Tinggi",
  },
  {
    tier: "business",
    name: "Business",
    priceMonthly: 149_000,
    maxListings: 100,
    canRequestVerification: true,
    analytics: "full",
    freeBoostsPerMonth: 2,
    searchPriority: "Tertinggi",
  },
] as const;

export const BOOST_OPTIONS = [
  { value: "7", days: 7, price: 25_000 },
  { value: "14", days: 14, price: 45_000 },
  { value: "30", days: 30, price: 75_000 },
] as const;

export function formatIdr(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

export function boostOptionLabel(
  option: (typeof BOOST_OPTIONS)[number],
): string {
  return `${option.days} hari — ${formatIdr(option.price)}`;
}

const ANALYTICS_LABEL: Record<Plan["analytics"], string> = {
  summary: "Total klik kontak",
  per_listing: "Per listing (tayangan, klik)",
  full: "Lengkap + performa iklan",
};

export function describePlan(plan: Plan) {
  return {
    tier: plan.tier,
    name: plan.name,
    price: formatIdr(plan.priceMonthly),
    listings: `Maks. ${plan.maxListings} listing`,
    verified: plan.canRequestVerification ? "Bisa ajukan verifikasi" : "—",
    analytics: ANALYTICS_LABEL[plan.analytics],
    boost:
      plan.freeBoostsPerMonth > 0
        ? `${plan.freeBoostsPerMonth}x/bulan gratis (${FREE_BOOST_DAYS} hari)`
        : "—",
    priority: plan.searchPriority,
    cta: `/register?role=seller&tier=${plan.tier}`,
  };
}

export const BOOST_FAQ_ANSWER = `Listing Anda tampil di slot iklan pada hasil pencarian yang cocok, dengan label "Iklan". Harga: ${BOOST_OPTIONS.map(
  (o) => `${formatIdr(o.price)} (${o.days} hari)`,
).join(", ")}.`;
