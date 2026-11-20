import { cn } from "@/lib/utils";

const ROAST_STEPS = [
  "Light",
  "Medium-Light",
  "Medium",
  "Medium-Dark",
  "Dark",
] as const;

interface RoastMeterProps {
  level: string;
  label: string;
  className?: string;
}

export function RoastMeter({ level, label, className }: RoastMeterProps) {
  const normalized = level.trim().toLowerCase();
  const index = ROAST_STEPS.findIndex(
    (step) => step.toLowerCase() === normalized,
  );

  if (index === -1) {
    return (
      <span
        className={cn(
          "text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        <span className="sr-only">{label}: </span>
        {level}
      </span>
    );
  }

  const filled = index + 1;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="flex shrink-0 gap-0.5" aria-hidden="true">
        {ROAST_STEPS.map((step, i) => (
          <span
            key={step}
            className={cn(
              "h-0.5 w-3 rounded-full",
              i < filled ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </span>
      <span className="truncate text-xs font-medium text-muted-foreground">
        <span className="sr-only">{label}: </span>
        {level}
      </span>
    </div>
  );
}
