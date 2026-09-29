import { cn } from "@/lib/utils";

interface BoostedBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function BoostedBadge({ size = "md", className }: BoostedBadgeProps) {
  const isSm = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium bg-neutral-900 text-neutral-50 rounded-sm border border-neutral-900 select-none tracking-tight",
        isSm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
      title="Listing Dipromosikan"
    >
      <span>PROMOSI</span>
    </span>
  );
}
