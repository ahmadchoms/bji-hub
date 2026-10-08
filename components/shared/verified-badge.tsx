import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function VerifiedBadge({ size = "md", className }: VerifiedBadgeProps) {
  const isSm = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium bg-accent-100 text-accent-700 rounded-xs border border-accent-500/30 select-none tracking-tight",
        isSm ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        className,
      )}
      title="Petani/Roaster Terverifikasi oleh Tim Biji"
    >
      <span>VERIFIED</span>
    </span>
  );
}
