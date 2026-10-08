import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8 pb-4 border-b border-neutral-300",
        isCenter && "text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("space-y-1", isCenter && "max-w-2xl mx-auto")}>
        {badge && <div className="mb-2">{badge}</div>}
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900 tracking-tight font-semibold">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-mono font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className={cn("shrink-0 pt-2 md:pt-0", isCenter && "mt-2")}>
          {action}
        </div>
      )}
    </div>
  );
}
