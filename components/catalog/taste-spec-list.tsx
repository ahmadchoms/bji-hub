import { TasteProfile } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const PROCESS_GLOSSARY: Record<string, string> = {
  Wash: "Dicuci bersih sebelum dijemur: rasa clean, asam cerah, dan notes buah jernih.",
  Natural: "Dijemur utuh bersama kulit buah: rasa manis buah matang, fermentasi kaya, dan body tebal.",
  Honey: "Lapisan lendir manis dipertahankan saat dijemur: manis madu seimbang dan body lembut.",
  "Wet Hulled": "Giling basah khas Nusantara: body pekat tebal, aroma rempah, earthy, rendah asam.",
  Anaerobic: "Fermentasi tanpa oksigen di wadah tertutup: rasa eksotis buah tropis dan kompleks.",
};

const ROAST_GLOSSARY: Record<string, string> = {
  Light: "Asam buah & aroma floral paling dominan. Cocok untuk seduh filter V60.",
  "Medium-Light": "Keseimbangan manis dan keasaman buah segar yang elegan.",
  Medium: "Paling seimbang: rasa cokelat karamel berpadu pas dengan asam lembut.",
  "Medium-Dark": "Body tebal, cokelat pekat, rendah asam. Pas untuk espresso atau es kopi susu.",
  Dark: "Pahit pekat, aroma sangrai kuat (smoky/dark chocolate), tanpa rasa asam.",
};

interface TasteSpecListProps {
  tasteProfile?: TasteProfile | null;
  className?: string;
}

export function TasteSpecList({ tasteProfile, className }: TasteSpecListProps) {
  if (!tasteProfile) return null;

  const roastDateObj = tasteProfile.roastDate
    ? new Date(tasteProfile.roastDate)
    : null;
  const daysOld =
    roastDateObj && !isNaN(roastDateObj.getTime())
      ? Math.floor((Date.now() - roastDateObj.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const formattedDate = roastDateObj
    ? format(roastDateObj, "dd MMM yyyy", { locale: id })
    : "-";

  const roastValue =
    daysOld !== null && daysOld >= 0
      ? daysOld <= 14
        ? `${formattedDate} (Fresh Roast, ${daysOld}h)`
        : daysOld <= 30
          ? `${formattedDate} (Peak Flavor, ${daysOld}h)`
          : formattedDate
      : formattedDate;

  const specs = [
    { label: "Origin", value: tasteProfile.originRegion },
    {
      label: "Proses",
      value: tasteProfile.processMethod,
      hint: tasteProfile.processMethod ? PROCESS_GLOSSARY[tasteProfile.processMethod] : undefined,
    },
    {
      label: "Sangrai",
      value: tasteProfile.roastLevel,
      hint: tasteProfile.roastLevel ? ROAST_GLOSSARY[tasteProfile.roastLevel] : undefined,
    },
    { label: "Tgl. Roast", value: roastValue },
    ...(tasteProfile.cropYear ? [{ label: "Tahun Panen", value: tasteProfile.cropYear }] : []),
    ...(tasteProfile.moistureContent ? [{ label: "Kadar Air", value: `${tasteProfile.moistureContent}%` }] : []),
    { label: "Altitude", value: tasteProfile.altitude || "1.200–1.600 mdpl" },
    { label: "Spesies", value: "100% Arabica Specialty" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-base text-neutral-900 font-semibold pb-2 border-b border-neutral-300">
        Spesifikasi Teknis
      </h4>

      <dl className="space-y-2">
        {specs.map((item, idx) => (
          <div key={idx} className="flex items-baseline justify-between py-1 border-b border-neutral-100 last:border-0">
            <dt className="text-xs font-medium text-neutral-600 uppercase tracking-wider">
              {item.label}
            </dt>
            <dd className="text-sm text-neutral-900 font-medium text-right flex items-center justify-end gap-1.5">
              <span>{item.value}</span>
              {item.hint && (
                <span
                  title={item.hint}
                  className="cursor-help text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
                  aria-label={item.hint}
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
