"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "cupping_desc", label: "Skor Cupping" },
];

export function TokopediaSortBar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (sortKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortKey === "newest") {
      params.delete("sort");
      params.delete("urut");
    } else {
      params.set("sort", sortKey);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm text-neutral-900">
          Menampilkan <span className="text-primary-700 font-mono">{total}</span> Produk
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-500 font-medium shrink-0 flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          Urutkan:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {sortOptions.map((opt) => {
            const isActive = currentSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSortChange(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0",
                  isActive
                    ? "bg-neutral-900 text-white font-semibold"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
