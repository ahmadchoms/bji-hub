import { Subscription } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SubscriptionStatusProps {
  subscription?: Subscription;
  className?: string;
}

const STATUS_CONFIG = {
  active: {
    label: "Aktif",
    variant: "default" as const,
  },
  past_due: {
    label: "Jatuh Tempo",
    variant: "destructive" as const,
  },
  canceled: {
    label: "Dibatalkan",
    variant: "destructive" as const,
  },
};

const TIER_LABELS: Record<string, string> = {
  free: "Gratis",
  growth: "Growth",
  business: "Business",
};

export function SubscriptionStatus({ subscription, className }: SubscriptionStatusProps) {
  if (!subscription) {
    return (
      <div className={cn("border border-neutral-300 bg-surface-base p-4 rounded-sm", className)}>
        <p className="font-display text-sm text-neutral-500 italic">Belum ada langganan aktif.</p>
      </div>
    );
  }

  const config = STATUS_CONFIG[subscription.status];

  return (
    <div className={cn("border border-neutral-300 bg-surface-base rounded-sm p-4 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Status Langganan</h3>
        <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg text-neutral-900 font-semibold">
          {TIER_LABELS[subscription.tier] ?? subscription.tier}
        </p>
        <p className="text-[11px] text-neutral-500 font-mono">
          Berlaku hingga {format(new Date(subscription.expiresAt), "d MMMM yyyy", { locale: idLocale })}
        </p>
      </div>
    </div>
  );
}