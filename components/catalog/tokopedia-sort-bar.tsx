"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "freshest", label: "Paling Segar" },
  { value: "cupping_desc", label: "Skor Cupping" },
  { value: "rating_desc", label: "Rating" },
  { value: "popular", label: "Terlaris" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
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

  const removeFilter = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of keys) {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (currentSort && currentSort !== "newest") {
      params.set("sort", currentSort);
    }
    startTransition(() => {
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
        scroll: false,
      });
    });
  };

  // Build active filter chips
  const activeChips: { label: string; keys: string[] }[] = [];

  const q = searchParams.get("q");
  if (q) activeChips.push({ label: `Cari: "${q}"`, keys: ["q"] });

  const category = searchParams.get("category") || searchParams.get("kategori");
  if (category) activeChips.push({ label: `Kategori: ${category}`, keys: ["category", "kategori"] });

  const origin = searchParams.get("origin") || searchParams.get("asal");
  if (origin) activeChips.push({ label: `Asal: ${origin}`, keys: ["origin", "asal"] });

  const process = searchParams.get("process") || searchParams.get("proses");
  if (process) activeChips.push({ label: `Proses: ${process}`, keys: ["process", "proses"] });

  const roast = searchParams.get("roast") || searchParams.get("sangrai");
  if (roast) activeChips.push({ label: `Sangrai: ${roast}`, keys: ["roast", "sangrai"] });

  const cupping = searchParams.get("cupping_score") || searchParams.get("min_cupping");
  if (cupping) activeChips.push({ label: `SCA ≥ ${cupping}`, keys: ["cupping_score", "min_cupping", "skor_cupping"] });

  const minPrice = searchParams.get("min_price") || searchParams.get("harga_min");
  if (minPrice) activeChips.push({ label: `Min Rp${Number(minPrice).toLocaleString("id-ID")}`, keys: ["min_price", "harga_min"] });

  const maxPrice = searchParams.get("max_price") || searchParams.get("harga_max");
  if (maxPrice) activeChips.push({ label: `Maks Rp${Number(maxPrice).toLocaleString("id-ID")}`, keys: ["max_price", "harga_max"] });

  const verified = searchParams.get("verified");
  if (verified === "true") activeChips.push({ label: "Penjual Terverifikasi", keys: ["verified"] });

  const readyStock = searchParams.get("ready_stock") || searchParams.get("stok_tersedia");
  if (readyStock === "true") activeChips.push({ label: "Ready Stock", keys: ["ready_stock", "stok_tersedia"] });

  return (
    <div className="space-y-2.5 pb-3 border-b border-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-neutral-900">
            Menampilkan <span className="text-primary-700 font-mono">{total}</span> Produk
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-600 font-medium shrink-0 flex items-center gap-1">
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
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer",
                    isActive
                      ? "bg-neutral-900 text-white font-semibold shadow-xs"
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

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-neutral-600 font-medium mr-1">Filter Aktif:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-medium"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => removeFilter(chip.keys)}
                className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
                title={`Hapus filter ${chip.label}`}
                aria-label={`Hapus filter ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Hapus Semua</span>
          </button>
        </div>
      )}
    </div>
  );
}
