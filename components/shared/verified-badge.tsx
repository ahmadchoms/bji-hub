import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function VerifiedBadge({
  size = "md",
  showLabel = true,
  className,
}: VerifiedBadgeProps) {
  const isSm = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center select-none transition-colors",
        showLabel
          ? cn(
              "gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 text-emerald-800 shadow-2xs font-medium",
              isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
            )
          : "p-0 bg-transparent border-0 shadow-none leading-none",
        className,
      )}
      title="Petani/Roaster Terverifikasi oleh Tim Biji"
    >
      <BadgeCheck
        className={cn(
          "shrink-0 text-emerald-600 fill-emerald-100",
          isSm ? "w-4 h-4" : "w-5 h-5",
        )}
      />

      {showLabel && (
        <span className="font-semibold tracking-wide uppercase text-[10px]">
          Verified
        </span>
      )}
    </span>
  );
}
