import { cn, formatRupiah } from "@/lib/utils";
import { formatEstimatedPrice } from "@/lib/i18n";
export { formatRupiah };

interface PriceTextProps {
  price: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  showEstimate?: boolean;
  targetCurrency?: string;
  rate?: number;
  className?: string;
}

export function PriceText({
  price,
  unit,
  size = "md",
  showEstimate = false,
  targetCurrency = "USD",
  rate,
  className,
}: PriceTextProps) {
  const formatted = formatRupiah(price);
  const estimate = showEstimate ? formatEstimatedPrice(price, targetCurrency, rate) : null;

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
      {estimate && (
        <span
          className="text-xs text-neutral-600 font-sans font-normal ml-1"
          title={estimate.disclaimer}
        >
          ({estimate.estimatedText})
        </span>
      )}
    </div>
  );
}
