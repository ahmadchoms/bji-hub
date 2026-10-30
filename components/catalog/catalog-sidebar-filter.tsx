"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  RotateCcw,
  Check,
  ShieldCheck,
  Package,
  Coffee,
  MapPin,
  Flame,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface CatalogSidebarFilterProps {
  origins: string[];
  processes: string[];
  roastLevels: string[];
  categories?: { id: string; name: string; slug: string }[];
  className?: string;
}

const defaultCategories = [
  { id: "roasted-beans", slug: "roasted-beans", name: "Biji Sangrai (Roasted)" },
  { id: "green-beans", slug: "green-beans", name: "Biji Mentah (Green Bean)" },
  { id: "drip-bag", slug: "drip-bag", name: "Drip Bag" },
  { id: "equipment", slug: "equipment", name: "Alat Seduh" },
];

const islandPresets = [
  { slug: "Sumatera", label: "Sumatera" },
  { slug: "Jawa", label: "Jawa" },
  { slug: "Bali", label: "Bali & NTT" },
  { slug: "Sulawesi", label: "Sulawesi" },
  { slug: "Papua", label: "Papua" },
];

const defaultRoastLevels = [
  "Light",
  "Medium-Light",
  "Medium",
  "Medium-Dark",
  "Dark",
];

const cuppingScores = [
  { label: "Semua Skor", min: "" },
  { label: "80+ Specialty", min: "80" },
  { label: "82+ Good", min: "82" },
  { label: "84+ Exemplary", min: "84" },
  { label: "86+ Excellent", min: "86" },
  { label: "87+ Microlot", min: "87" },
  { label: "88+ Outstanding", min: "88" },
];

const pricePresets = [
  { label: "Semua Harga", min: "", max: "" },
  { label: "< Rp100.000", min: "", max: "100000" },
  { label: "Rp100rb – Rp150rb", min: "100000", max: "150000" },
  { label: "> Rp150.000", min: "150000", max: "" },
];

const flavorWheelPresets = [
  { label: "Buah (Jeruk, Berry)", tag: "buah" },
  { label: "Bunga (Floral/Melati)", tag: "bunga" },
  { label: "Manis (Karamel/Madu)", tag: "manis" },
  { label: "Cokelat & Kakao", tag: "cokelat" },
  { label: "Rempah Nusantara", tag: "rempah" },
  { label: "Kacang (Nutty)", tag: "kacang" },
  { label: "Herbal & Earthy", tag: "herbal" },
];

export function CatalogSidebarFilter({
  origins = [],
  processes = [],
  roastLevels = [],
  categories = [],
  className,
}: CatalogSidebarFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [mobileOpen, setMobileOpen] = useState(false);

  const currentCategory =
    searchParams.get("category") || searchParams.get("kategori") || "";
  const currentOrigin =
    searchParams.get("origin") || searchParams.get("asal") || "";
  const currentProcess =
    searchParams.get("process") || searchParams.get("proses") || "";
  const currentRoast =
    searchParams.get("roast") || searchParams.get("sangrai") || "";
  const currentCupping =
    searchParams.get("cupping_score") ||
    searchParams.get("min_cupping") ||
    searchParams.get("skor_cupping") ||
    "";
  const currentMinPrice =
    searchParams.get("min_price") || searchParams.get("harga_min") || "";
  const currentMaxPrice =
    searchParams.get("max_price") || searchParams.get("harga_max") || "";
  const isVerified = searchParams.get("verified") === "true";
  const isReadyStock =
    searchParams.get("ready_stock") === "true" ||
    searchParams.get("stok_tersedia") === "true";
  const currentRasa = searchParams.get("rasa") || "";

  // Merge default categories with props
  const allCategories = (() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();
    for (const def of defaultCategories) {
      map.set(def.slug, def);
    }
    for (const cat of categories) {
      if (map.has(cat.slug)) {
        map.set(cat.slug, { ...map.get(cat.slug)!, ...cat });
      } else {
        map.set(cat.slug, cat);
      }
    }
    return Array.from(map.values());
  })();

  // Merge default roast levels with props
  const allRoastLevels = Array.from(
    new Set([...defaultRoastLevels, ...roastLevels]),
  );

  const replaceParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("halaman");
      params.delete("page");
      if (key === "origin") params.delete("asal");
      if (key === "process") params.delete("proses");
      if (key === "roast") params.delete("sangrai");
      if (key === "category") params.delete("kategori");
      if (key === "ready_stock") params.delete("stok_tersedia");
      if (key === "cupping_score") {
        params.delete("min_cupping");
        params.delete("skor_cupping");
      }
      startTransition(() =>
        router.replace(`${pathname}?${params.toString()}`, { scroll: false }),
      );
    },
    [pathname, router, searchParams],
  );

  const resetAllFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const activeFilterCount = [
    currentCategory,
    currentOrigin,
    currentProcess,
    currentRoast,
    currentCupping,
    currentMinPrice || currentMaxPrice,
    currentRasa,
    isVerified,
    isReadyStock,
  ].filter(Boolean).length;

  const FilterContent = (
    <div className="space-y-5 text-xs">
      {/* Header Sidebar Filter */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
          <span>Filter</span>
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      {/* 1. Kategori Produk */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-neutral-900">
          <Coffee className="w-3.5 h-3.5 text-primary-600" />
          <span>Kategori</span>
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => replaceParam("category", "")}
            className={cn(
              "w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center justify-between",
              !currentCategory
                ? "bg-primary-50 text-primary-900 font-bold"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <span>Semua Kategori</span>
            {!currentCategory && <Check className="w-3.5 h-3.5 text-primary-600" />}
          </button>
          {allCategories.map((c) => {
            const active = currentCategory === c.slug;
            return (
              <button
                key={c.id || c.slug}
                type="button"
                onClick={() => replaceParam("category", active ? "" : c.slug)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center justify-between",
                  active
                    ? "bg-primary-50 text-primary-900 font-bold"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <span>{c.name}</span>
                {active && <Check className="w-3.5 h-3.5 text-primary-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Asal Wilayah / Kepulauan & Origin */}
      <div className="space-y-2.5 pt-4 border-t border-neutral-100">
        <div className="flex items-center justify-between font-bold text-neutral-900">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary-600" />
            <span>Asal Wilayah</span>
          </div>
          {currentOrigin && (
            <button
              type="button"
              onClick={() => replaceParam("origin", "")}
              className="text-xs text-neutral-400 hover:text-neutral-600 font-semibold"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Quick Island Presets */}
        <div>
          <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">
            Kepulauan
          </span>
          <div className="flex flex-wrap gap-1.5">
            {islandPresets.map((island) => {
              const active = currentOrigin.toLowerCase() === island.slug.toLowerCase();
              return (
                <button
                  key={island.slug}
                  type="button"
                  onClick={() => replaceParam("origin", active ? "" : island.slug)}
                  className={cn(
                    "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                    active
                      ? "border-primary-600 bg-primary-50 text-primary-900 font-bold"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  {island.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Origins List */}
        {origins.length > 0 && (
          <div className="pt-1">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">
              Daerah / Penghasil
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-none">
              {origins.map((orig) => {
                const active = currentOrigin.toLowerCase() === orig.toLowerCase();
                return (
                  <button
                    key={orig}
                    type="button"
                    onClick={() => replaceParam("origin", active ? "" : orig)}
                    className={cn(
                      "w-full text-left px-2.5 py-1 rounded text-xs transition-colors flex items-center justify-between",
                      active
                        ? "bg-primary-50 text-primary-900 font-bold"
                        : "text-neutral-600 hover:bg-neutral-100",
                    )}
                  >
                    <span className="truncate">{orig}</span>
                    {active && <Check className="w-3 h-3 text-primary-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Tingkat Sangrai (Roast Level) */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-1.5 font-bold text-neutral-900">
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          <span>Tingkat Sangrai</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allRoastLevels.map((roast) => {
            const active = currentRoast.toLowerCase() === roast.toLowerCase();
            return (
              <button
                key={roast}
                type="button"
                onClick={() => replaceParam("roast", active ? "" : roast)}
                className={cn(
                  "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                  active
                    ? "border-primary-600 bg-primary-50 text-primary-900 font-bold"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {roast}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Skor Cupping SCA */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-1.5 font-bold text-neutral-900">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Skor Cupping SCA</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cuppingScores.map((score) => {
            const active = currentCupping === score.min;
            return (
              <button
                key={score.label}
                type="button"
                onClick={() => replaceParam("cupping_score", active ? "" : score.min)}
                className={cn(
                  "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                  active
                    ? "border-amber-600 bg-amber-50 text-amber-900 font-bold"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {score.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Metode Proses Pascapanen */}
      {processes.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-neutral-100">
          <p className="font-bold text-neutral-900">Metode Proses</p>
          <div className="flex flex-wrap gap-1.5">
            {processes.map((proc) => {
              const active = currentProcess === proc;
              return (
                <button
                  key={proc}
                  type="button"
                  onClick={() => replaceParam("process", active ? "" : proc)}
                  className={cn(
                    "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                    active
                      ? "border-primary-600 bg-primary-50 text-primary-900 font-bold"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  {proc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Roda Rasa (Flavor Wheel) */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <p className="font-bold text-neutral-900">Karakter Rasa</p>
        <div className="flex flex-wrap gap-1.5">
          {flavorWheelPresets.map((preset) => {
            const active = currentRasa.split(",").includes(preset.tag);
            return (
              <button
                key={preset.tag}
                type="button"
                onClick={() => {
                  let newTags = currentRasa ? currentRasa.split(",").filter(Boolean) : [];
                  if (active) {
                    newTags = newTags.filter((t) => t !== preset.tag);
                  } else {
                    newTags.push(preset.tag);
                  }
                  replaceParam("rasa", newTags.join(","));
                }}
                className={cn(
                  "px-2.5 py-1 rounded border text-xs font-medium transition-colors coarse:min-h-11 inline-flex items-center",
                  active
                    ? "border-primary-600 bg-primary-50 text-primary-900 font-bold"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Rentang Harga */}
      <div className="space-y-2 pt-4 border-t border-neutral-100">
        <p className="font-bold text-neutral-900">Rentang Harga</p>
        <div className="space-y-1.5">
          {pricePresets.map((preset) => {
            const isMatch =
              currentMinPrice === preset.min && currentMaxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (preset.min) params.set("min_price", preset.min);
                  else params.delete("min_price");
                  if (preset.max) params.set("max_price", preset.max);
                  else params.delete("max_price");
                  params.delete("harga_min");
                  params.delete("harga_max");
                  params.delete("page");
                  startTransition(() =>
                    router.replace(`${pathname}?${params.toString()}`, {
                      scroll: false,
                    }),
                  );
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1 rounded text-xs transition-colors flex items-center justify-between",
                  isMatch
                    ? "bg-primary-50 text-primary-900 font-bold"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <span>{preset.label}</span>
                {isMatch && <Check className="w-3 h-3 text-primary-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Toko Terverifikasi */}
      <div className="pt-4 border-t border-neutral-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={isVerified}
            onCheckedChange={(checked) =>
              replaceParam("verified", checked ? "true" : "")
            }
          />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-neutral-800">
              Mitra Terverifikasi Saja
            </span>
          </div>
        </label>
      </div>

      {/* 8. Ketersediaan Stok */}
      <div className="pt-3 border-t border-neutral-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={isReadyStock}
            onCheckedChange={(checked) =>
              replaceParam("ready_stock", checked ? "true" : "")
            }
          />
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary-700" />
            <span className="font-medium text-neutral-800">
              Stok Tersedia Saja
            </span>
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={cn(
          "w-64 shrink-0 bg-white border border-neutral-200 rounded-lg p-4 shadow-xs sticky top-24 self-start hidden lg:block",
          className,
        )}
      >
        {FilterContent}
      </aside>

      {/* Mobile Filter Trigger Sheet */}
      <div className="lg:hidden flex items-center justify-between pb-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-semibold text-neutral-800 border-neutral-300"
              />
            }
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
            <span>Filter Kopi</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-4 overflow-y-auto">
            <SheetHeader className="pb-3 border-b border-neutral-200">
              <SheetTitle className="text-sm font-bold">Filter Kopi</SheetTitle>
            </SheetHeader>
            <div className="pt-4">{FilterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
