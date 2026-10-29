import { cn, formatRupiah } from "@/lib/utils";
export { formatRupiah };

interface PriceTextProps {
  price: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceText({
  price,
  unit,
  size = "md",
  className,
}: PriceTextProps) {
  const formatted = formatRupiah(price);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-price", // 18px mobile, 22px lg per DESIGN.md §2.2
    lg: "text-2xl lg:text-3xl",
  };

  return (
    <div className={cn("inline-flex items-baseline gap-1 font-mono tabular-nums", className)}>
      <span className={cn("font-bold text-primary-900 tracking-tight", sizeClasses[size])}>
        {formatted}
      </span>
      {unit && (
        <span className="text-caption text-neutral-600 font-sans font-normal">
          / {unit}
        </span>
      )}
    </div>
  );
}
