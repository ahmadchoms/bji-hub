import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import type { PlanState } from "@/lib/subscription";

interface SubscriptionStatusProps {
  state: PlanState;
  className?: string;
}

export function SubscriptionStatus({
  state,
  className,
}: SubscriptionStatusProps) {
  const plan = getPlan(state.tier);
  const until = state.expiresAt
    ? format(new Date(state.expiresAt), "d MMMM yyyy", { locale: idLocale })
    : null;

  return (
    <div
      className={cn(
        "space-y-1 border border-neutral-300 bg-surface-base p-4",
        className,
      )}
    >
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        Paket
      </h3>
      <p className="font-display text-lg font-semibold text-neutral-900">
        {plan.name}
      </p>
      <p className="text-xs text-neutral-600">
        {until
          ? state.cancelAtPeriodEnd
            ? `Berakhir ${until}, tidak diperpanjang.`
            : `Berlaku sampai ${until}.`
          : "Tidak ada tagihan."}
      </p>
      <Link
        href="/dashboard/billing"
        className="inline-block pt-1 text-xs font-medium text-primary-700 hover:underline"
      >
        Kelola paket
      </Link>
    </div>
  );
}
