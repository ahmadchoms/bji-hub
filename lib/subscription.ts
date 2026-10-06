import { addMonths } from "date-fns";
import { TIER_RANK, type PlanTier } from "@/lib/plans";
import type { Subscription } from "@/types";

export interface PlanState {
  tier: PlanTier;
  subscription: Subscription | null;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
}

export const FREE_STATE: PlanState = {
  tier: "free",
  subscription: null,
  expiresAt: null,
  cancelAtPeriodEnd: false,
};

/** The plan a seller is on right now: the best unexpired paid subscription, otherwise free. */
export function resolvePlanState(
  subscriptions: readonly Subscription[],
  now: number = Date.now(),
): PlanState {
  const live = subscriptions.filter(
    (s) =>
      s.status === "active" &&
      s.tier !== "free" &&
      new Date(s.expiresAt).getTime() > now,
  );
  if (live.length === 0) return FREE_STATE;

  const best = [...live].sort(
    (a, b) =>
      TIER_RANK[b.tier] - TIER_RANK[a.tier] ||
      new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime(),
  )[0];
  return {
    tier: best.tier,
    subscription: best,
    expiresAt: best.expiresAt,
    cancelAtPeriodEnd: best.cancelAtPeriodEnd === true,
  };
}

export type PlanChangeKind = "new" | "renew" | "upgrade";

export type PlanChangeDecision =
  | { ok: true; kind: PlanChangeKind; expiresAt: string }
  | { ok: false; reason: string };

/**
 * Rules: upgrades start now and restart the period (no proration), renewals extend from the current end,
 * and a lower paid plan is only available after the current period ends.
 */
export function decidePlanChange(
  current: PlanState,
  target: PlanTier,
  months: number,
  now: number = Date.now(),
): PlanChangeDecision {
  if (target === "free")
    return {
      ok: false,
      reason:
        "Gunakan menu berhenti berlangganan untuk kembali ke paket Gratis",
    };

  if (current.tier === "free") {
    return {
      ok: true,
      kind: "new",
      expiresAt: addMonths(new Date(now), months).toISOString(),
    };
  }
  if (target === current.tier) {
    const base = Math.max(now, new Date(current.expiresAt ?? now).getTime());
    return {
      ok: true,
      kind: "renew",
      expiresAt: addMonths(new Date(base), months).toISOString(),
    };
  }
  if (TIER_RANK[target] > TIER_RANK[current.tier]) {
    return {
      ok: true,
      kind: "upgrade",
      expiresAt: addMonths(new Date(now), months).toISOString(),
    };
  }
  return {
    ok: false,
    reason: "Turun paket tersedia setelah masa aktif paket saat ini berakhir",
  };
}
