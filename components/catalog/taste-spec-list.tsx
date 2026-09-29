import { TasteProfile } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TasteSpecListProps {
  tasteProfile?: TasteProfile | null;
  className?: string;
}

export function TasteSpecList({ tasteProfile, className }: TasteSpecListProps) {
  if (!tasteProfile) return null;

  const formattedDate = tasteProfile.roastDate
    ? format(new Date(tasteProfile.roastDate), "dd MMM yyyy", { locale: id })
    : "-";

  const specs = [
    { label: "Origin", value: tasteProfile.originRegion },
    { label: "Proses", value: tasteProfile.processMethod },
    { label: "Sangrai", value: tasteProfile.roastLevel },
    { label: "Tgl. Roast", value: formattedDate },
    { label: "Altitude", value: "1.200–1.600 mdpl" },
    { label: "Spesies", value: "100% Arabica Specialty" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-display text-lg text-neutral-900 font-semibold pb-2 border-b border-neutral-300">
        Spesifikasi Teknis
      </h4>

      <dl className="space-y-2">
        {specs.map((item, idx) => (
          <div key={idx} className="flex items-baseline justify-between py-1 border-b border-neutral-100 last:border-0">
            <dt className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
              {item.label}
            </dt>
            <dd className="text-sm text-neutral-900 font-medium text-right">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
