import { Sparkles, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { getFreshness, type RoastLevel } from "@/lib/coffee/freshness";
import { cn } from "@/lib/utils";

interface FreshnessBadgeProps {
  roastDate: Date | string | null | undefined;
  roastLevel?: RoastLevel | string | null;
  compact?: boolean;
  className?: string;
}

export function FreshnessBadge({
  roastDate,
  roastLevel = "Medium",
  compact = false,
  className,
}: FreshnessBadgeProps) {
  if (!roastDate) return null;

  const { days, state, label, restDaysNeeded } = getFreshness(
    roastDate,
    roastLevel || "Medium"
  );

  const config = {
    optimal: {
      icon: Sparkles,
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      iconColor: "text-emerald-700",
      accessibleLabel: `Kopi sangrai ${days} hari lalu. Status: Optimal rasa puncak.`,
    },
    resting: {
      icon: Clock,
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      iconColor: "text-amber-700",
      accessibleLabel: `Kopi sangrai ${days} hari lalu. Status: Masa degassing, istirahat ${restDaysNeeded} hari lagi.`,
    },
    good: {
      icon: CheckCircle2,
      bg: "bg-sky-50 border-sky-200 text-sky-900",
      iconColor: "text-sky-700",
      accessibleLabel: `Kopi sangrai ${days} hari lalu. Status: Baik untuk diseduh.`,
    },
    past_peak: {
      icon: AlertCircle,
      bg: "bg-neutral-100 border-neutral-200 text-neutral-700",
      iconColor: "text-neutral-600",
      accessibleLabel: `Kopi sangrai ${days} hari lalu. Status: Melewati masa puncak.`,
    },
  }[state];

  const Icon = config.icon;

  if (compact) {
    return (
      <span
        role="status"
        aria-label={config.accessibleLabel}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
          config.bg,
          className
        )}
      >
        <Icon className={cn("w-3 h-3 shrink-0", config.iconColor)} aria-hidden="true" />
        <span>{days} hari lalu • {state === "optimal" ? "Optimal" : label}</span>
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={config.accessibleLabel}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
        config.bg,
        className
      )}
    >
      <Icon className={cn("w-3.5 h-3.5 shrink-0", config.iconColor)} aria-hidden="true" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
        <span className="font-semibold">Sangrai {days} hari lalu</span>
        <span className="hidden sm:inline text-neutral-400">•</span>
        <span>{label}</span>
      </div>
    </div>
  );
}
