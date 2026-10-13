"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TasteQuizModal } from "@/components/catalog/taste-quiz-modal";

interface FilterControlsProps {
  origins: string[];
  processes: string[];
  roastLevels: string[];
}

const sorts = [
  ["newest", "Terbaru"],
  ["price_asc", "Harga Terendah"],
  ["price_desc", "Harga Tertinggi"],
] as const;

const priceRanges = [
  { label: "Semua Harga", min: "", max: "" },
  { label: "Di bawah Rp100.000", min: "", max: "100000" },
  { label: "Rp100.000 – Rp150.000", min: "100000", max: "150000" },
  { label: "Di atas Rp150.000", min: "150000", max: "" },
];

const cuppingScores = [
  { label: "Semua Skor Cupping", min: "" },
  { label: "82+ Good", min: "82" },
  { label: "84+ Specialty", min: "84" },
  { label: "86+ Excellent", min: "86" },
  { label: "88+ Outstanding", min: "88" },
];

export function CatalogControls({
  origins,
  processes,
  roastLevels,
}: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") || "";
  const lastPushed = useRef(urlQuery);
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  const replaceParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("halaman");
      params.delete("page");
      if (key === "sort") params.delete("urut");
      if (key === "origin") params.delete("asal");
      if (key === "process") params.delete("proses");
      if (key === "roast") params.delete("sangrai");
      if (key === "category") params.delete("kategori");
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

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (query === current) return;
    const timer = window.setTimeout(() => {
      lastPushed.current = query.trim();
      replaceParam("q", query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, searchParams, replaceParam]);

  // Helper untuk menentukan label rentang harga aktif
  const currentMinPrice = searchParams.get("min_price") || searchParams.get("harga_min") || "";
  const currentMaxPrice = searchParams.get("max_price") || searchParams.get("harga_max") || "";
  const currentPriceValue = `${currentMinPrice}:${currentMaxPrice}`;
  const activePriceLabel =
    priceRanges.find((p) => `${p.min}:${p.max}` === currentPriceValue)?.label ||
    "Semua Harga";

  // Helper untuk menentukan label urutan aktif
  const rawSort = searchParams.get("sort") || searchParams.get("urut") || "newest";
  const currentSort =
    rawSort === "harga_terendah" ? "price_asc" :
    rawSort === "harga_tertinggi" ? "price_desc" :
    rawSort === "terbaru" ? "newest" : rawSort;
  const activeSortLabel =
    sorts.find(([v]) => v === currentSort)?.[1] || "Urutkan";

  const currentOrigin = searchParams.get("origin") || searchParams.get("asal") || "";
  const currentProcess = searchParams.get("process") || searchParams.get("proses") || "";
  const currentRoast = searchParams.get("roast") || searchParams.get("sangrai") || "";
  const currentCupping = searchParams.get("cupping_score") || searchParams.get("min_cupping") || "";

  // Helper untuk menghitung jumlah filter aktif
  const activeFilterCount = [
    currentOrigin,
    currentProcess,
    currentRoast,
    currentCupping,
    currentMinPrice || currentMaxPrice,
    searchParams.get("verified"),
  ].filter(Boolean).length;

  const FilterFields = (
    <>
      {/* Filter Asal */}
      <div className="min-w-0 flex-1">
        <Select
          value={currentOrigin || "ALL"}
          onValueChange={(val) =>
            replaceParam("origin", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Asal Kopi">
              {currentOrigin || "Semua Asal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Asal</SelectItem>
            {origins.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Proses */}
      <div className="min-w-0 flex-1">
        <Select
          value={currentProcess || "ALL"}
          onValueChange={(val) =>
            replaceParam("process", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Proses Olah">
              {currentProcess || "Semua Proses"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Proses</SelectItem>
            {processes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Sangrai */}
      <div className="min-w-0 flex-1">
        <Select
          value={currentRoast || "ALL"}
          onValueChange={(val) =>
            replaceParam("roast", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Tingkat Sangrai">
              {currentRoast || "Semua Sangrai"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Sangrai</SelectItem>
            {roastLevels.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Urutkan */}
      <div className="min-w-0 flex-1">
        <Select
          value={currentSort}
          onValueChange={(val) => {
            if (val) replaceParam("sort", val);
          }}
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Urutkan">{activeSortLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sorts.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Rentang Harga */}
      <div className="min-w-0 flex-1">
        <Select
          value={currentPriceValue}
          onValueChange={(val) => {
            if (!val) return;
            const [min, max] = val.split(":");
            const params = new URLSearchParams(searchParams.toString());
            if (min) params.set("min_price", min);
            else params.delete("min_price");
            params.delete("harga_min");
            if (max) params.set("max_price", max);
            else params.delete("max_price");
            params.delete("harga_max");
            params.delete("halaman");
            params.delete("page");
            startTransition(() =>
              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              }),
            );
          }}
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Rentang Harga">
              {activePriceLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((range) => (
              <SelectItem
                key={`${range.min}:${range.max}`}
                value={`${range.min}:${range.max}`}
              >
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Skor Cupping SCA */}
      <div className="min-w-0 flex-1">
        <Select
          value={currentCupping || "ALL"}
          onValueChange={(val) =>
            replaceParam("cupping_score", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Skor Cupping">
              {cuppingScores.find((c) => c.min === currentCupping)?.label || "Skor Cupping"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Skor Cupping</SelectItem>
            {cuppingScores.filter((c) => c.min).map((c) => (
              <SelectItem key={c.min} value={c.min}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Checkbox Terverifikasi */}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs text-neutral-700 select-none">
        <Checkbox
          checked={searchParams.get("verified") === "true"}
          onCheckedChange={(checked) =>
            replaceParam("verified", checked ? "true" : "")
          }
        />
        Terverifikasi saja
      </label>
    </>
  );

  return (
    <section className="border-b border-neutral-300 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">Katalog kopi specialty Indonesia</h1>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-2"
        >
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kopi, asal, atau roastery"
                className="h-11 text-sm"
              />
            </div>
            <Button type="submit" size="md" className="min-h-11">
              Cari
            </Button>
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="min-h-11 md:hidden gap-1.5"
                  />
                }
              >
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="size-4.5 rounded-full bg-neutral-900 text-white text-[10px] font-mono flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent side="bottom" className="p-4 max-h-[85vh] overflow-y-auto">
                <SheetHeader className="p-0 pb-4">
                  <SheetTitle>Filter Katalog Kopi</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {FilterFields}
                </div>
                <div className="pt-3 border-t border-neutral-200 mt-2">
                  <TasteQuizModal className="w-full justify-center min-h-11" />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden flex-wrap items-center justify-between gap-2 md:flex">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {FilterFields}
            </div>
            <TasteQuizModal />
          </div>
        </form>

        {/* Active Filter Chips & Reset Button */}
        {(activeFilterCount > 0 || query) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <span className="text-[11px] text-neutral-400 font-medium">Filter Aktif:</span>
            {query && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-neutral-200/80 text-neutral-800 px-2 py-0.5 rounded-full">
                &ldquo;{query}&rdquo;
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    replaceParam("q", "");
                  }}
                  className="hover:text-neutral-900 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {currentOrigin && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-primary-100 text-primary-900 px-2 py-0.5 rounded-full">
                Asal: {currentOrigin}
                <button
                  type="button"
                  onClick={() => replaceParam("origin", "")}
                  className="hover:text-primary-950 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {currentProcess && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-secondary-100 text-secondary-900 px-2 py-0.5 rounded-full">
                Proses: {currentProcess}
                <button
                  type="button"
                  onClick={() => replaceParam("process", "")}
                  className="hover:text-secondary-950 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {currentRoast && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Sangrai: {currentRoast}
                <button
                  type="button"
                  onClick={() => replaceParam("roast", "")}
                  className="hover:text-amber-950 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {currentCupping && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                SCA: ≥{currentCupping}
                <button
                  type="button"
                  onClick={() => replaceParam("cupping_score", "")}
                  className="hover:text-emerald-950 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {(currentMinPrice || currentMaxPrice) && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-neutral-200/80 text-neutral-800 px-2 py-0.5 rounded-full">
                {activePriceLabel}
                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams.toString());
                    p.delete("min_price");
                    p.delete("max_price");
                    p.delete("harga_min");
                    p.delete("harga_max");
                    startTransition(() =>
                      router.replace(`${pathname}?${p.toString()}`, { scroll: false }),
                    );
                  }}
                  className="hover:text-neutral-900 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {searchParams.get("verified") === "true" && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-accent-100 text-accent-800 px-2 py-0.5 rounded-full">
                Terverifikasi
                <button
                  type="button"
                  onClick={() => replaceParam("verified", "")}
                  className="hover:text-accent-950 ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                startTransition(() => router.replace(pathname, { scroll: false }));
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 underline font-medium ml-1 cursor-pointer"
            >
              Reset Semua
            </button>
          </div>
        )}

        {/* Mobile Sticky Floating Filter Bar */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 md:hidden animate-in fade-in slide-in-from-bottom-2">
          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="px-4 py-2.5 bg-neutral-900 text-white rounded-full shadow-lg border border-neutral-800 text-xs font-mono font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors"
                />
              }
            >
              <span>Filter & Sortir</span>
              {activeFilterCount > 0 && (
                <span className="size-4 rounded-full bg-white text-neutral-900 text-[10px] font-mono font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="p-4 max-h-[85vh] overflow-y-auto">
              <SheetHeader className="p-0 pb-4">
                <SheetTitle>Filter & Sortir Katalog</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FilterFields}
              </div>
              <div className="pt-3 border-t border-neutral-200 mt-2">
                <TasteQuizModal className="w-full justify-center min-h-11" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  );
}
