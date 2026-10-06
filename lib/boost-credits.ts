import { FREE_BOOST_DAYS, type Plan } from "@/lib/plans";
import { isCreditBoost } from "@/lib/payments";
import type { Payment } from "@/types";

const TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 3_600_000;
const monthFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

function monthParts(ms: number): { year: number; month: number } {
  const [year, month] = monthFmt.format(ms).split("-").map(Number);
  return { year, month };
}

export interface BoostCredits {
  total: number;
  used: number;
  remaining: number;
  /** Length of a credit boost in days. */
  days: number;
  /** First instant of next month in Asia/Jakarta. */
  resetsAt: string;
}

/** Free boost credits reset every calendar month (Asia/Jakarta) and do not roll over. */
export function getBoostCredits(
  plan: Plan,
  payments: readonly Payment[],
  now: number = Date.now(),
): BoostCredits {
  const current = monthParts(now);
  const used = payments.filter((p) => {
    if (!isCreditBoost(p)) return false;
    const when = monthParts(new Date(p.paidAt ?? p.createdAt).getTime());
    return when.year === current.year && when.month === current.month;
  }).length;

  const nextYear = current.month === 12 ? current.year + 1 : current.year;
  const nextMonth = current.month === 12 ? 1 : current.month + 1;
  return {
    total: plan.freeBoostsPerMonth,
    used,
    remaining: Math.max(0, plan.freeBoostsPerMonth - used),
    days: FREE_BOOST_DAYS,
    resetsAt: new Date(
      Date.UTC(nextYear, nextMonth - 1, 1) - WIB_OFFSET_MS,
    ).toISOString(),
  };
}

export type BoostPaymentDecision =
  { ok: true; amount: number } | { ok: false; reason: string };

export function decideBoostPayment(input: {
  useCredit: boolean;
  option: { days: number; price: number };
  credits: BoostCredits;
}): BoostPaymentDecision {
  if (!input.useCredit) return { ok: true, amount: input.option.price };
  if (input.credits.remaining <= 0)
    return { ok: false, reason: "Kredit boost gratis bulan ini sudah habis" };
  if (input.option.days !== input.credits.days) {
    return {
      ok: false,
      reason: `Kredit gratis hanya berlaku untuk boost ${input.credits.days} hari`,
    };
  }
  return { ok: true, amount: 0 };
}
