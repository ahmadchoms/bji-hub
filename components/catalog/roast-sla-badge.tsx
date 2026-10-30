import { Zap } from "lucide-react";

interface RoastSlaBadgeProps {
  className?: string;
  showTooltip?: boolean;
}

export function RoastSlaBadge({
  className = "",
  showTooltip = true,
}: RoastSlaBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/90 px-2.5 py-0.5 text-xs font-semibold text-amber-950 shadow-2xs ${className}`}
      title={
        showTooltip
          ? "Penjual ini terbukti konsisten mengirimkan pesanan dalam waktu rata-rata ≤ 3 hari setelah biji kopi disangrai."
          : undefined
      }
    >
      <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500 shrink-0" aria-hidden="true" />
      <span>Dikirim ≤ 3 hari setelah sangrai</span>
    </div>
  );
}
