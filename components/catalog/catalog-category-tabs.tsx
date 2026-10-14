"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryTabs = [
  { slug: "", label: "Semua Kopi" },
  { slug: "roasted-beans", label: "Biji Sangrai (Roasted)" },
  { slug: "green-beans", label: "Biji Mentah (Green Bean)" },
  { slug: "drip-bag", label: "Drip Bag" },
  { slug: "equipment", label: "Alat Seduh" },
];

const cuppingPresets = [
  { score: "", label: "Semua Skor" },
  { score: "80", label: "SCA 80+ (Specialty)" },
  { score: "84", label: "SCA 84+ (Exemplary)" },
  { score: "87", label: "SCA 87+ (Microlot)" },
];

export function CatalogCategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory =
    searchParams.get("category") || searchParams.get("kategori") || "";
  const currentCupping =
    searchParams.get("cupping_score") ||
    searchParams.get("min_cupping") ||
    searchParams.get("skor_cupping") ||
    "";

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) {
      params.delete("category");
      params.delete("kategori");
    } else {
      params.set("category", slug);
      params.delete("kategori");
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleCuppingClick = (score: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!score) {
      params.delete("cupping_score");
      params.delete("min_cupping");
      params.delete("skor_cupping");
    } else {
      params.set("cupping_score", score);
      params.delete("min_cupping");
      params.delete("skor_cupping");
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-2">
      {/* Category Pills (Green Bean vs Roasted vs All) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {categoryTabs.map((tab) => {
          const isActive = currentCategory === tab.slug;
          return (
            <button
              key={tab.slug || "all-categories"}
              type="button"
              onClick={() => handleCategoryClick(tab.slug)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 whitespace-nowrap",
                isActive
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "bg-white text-neutral-600 border border-neutral-300 hover:border-neutral-400 hover:text-neutral-900",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SCA Cupping Score Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-neutral-500 font-medium shrink-0 flex items-center gap-1 mr-1">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          Cupping:
        </span>
        {cuppingPresets.map((preset) => {
          const isActive = currentCupping === preset.score;
          return (
            <button
              key={preset.score || "all-scores"}
              type="button"
              onClick={() => handleCuppingClick(preset.score)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 whitespace-nowrap",
                isActive
                  ? "bg-amber-600 text-white font-semibold shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
