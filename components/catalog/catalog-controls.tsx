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

interface FilterControlsProps {
  origins: string[];
  processes: string[];
  roastLevels: string[];
}

const sorts = [
  ["terbaru", "Terbaru"],
  ["harga_terendah", "Harga Terendah"],
  ["harga_tertinggi", "Harga Tertinggi"],
] as const;

const priceRanges = [
  { label: "Semua Harga", min: "", max: "" },
  { label: "Di bawah Rp100.000", min: "", max: "100000" },
  { label: "Rp100.000 – Rp150.000", min: "100000", max: "150000" },
  { label: "Di atas Rp150.000", min: "150000", max: "" },
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
  const currentMinPrice = searchParams.get("harga_min") || "";
  const currentMaxPrice = searchParams.get("harga_max") || "";
  const currentPriceValue = `${currentMinPrice}:${currentMaxPrice}`;
  const activePriceLabel =
    priceRanges.find((p) => `${p.min}:${p.max}` === currentPriceValue)?.label ||
    "Semua Harga";

  // Helper untuk menentukan label urutan aktif
  const currentSort = searchParams.get("urut") || "terbaru";
  const activeSortLabel =
    sorts.find(([v]) => v === currentSort)?.[1] || "Urutkan";

  const FilterFields = (
    <>
      {/* Filter Asal */}
      <div className="min-w-0 flex-1">
        <Select
          value={searchParams.get("asal") || "ALL"}
          onValueChange={(val) =>
            replaceParam("asal", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Asal Kopi">
              {searchParams.get("asal") || "Semua Asal"}
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
          value={searchParams.get("proses") || "ALL"}
          onValueChange={(val) =>
            replaceParam("proses", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Proses Olah">
              {searchParams.get("proses") || "Semua Proses"}
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
          value={searchParams.get("sangrai") || "ALL"}
          onValueChange={(val) =>
            replaceParam("sangrai", !val || val === "ALL" ? "" : val)
          }
        >
          <SelectTrigger className="h-11 w-full text-xs">
            <SelectValue placeholder="Tingkat Sangrai">
              {searchParams.get("sangrai") || "Semua Sangrai"}
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
            if (val) replaceParam("urut", val);
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
            if (min) params.set("harga_min", min);
            else params.delete("harga_min");
            if (max) params.set("harga_max", max);
            else params.delete("harga_max");
            params.delete("halaman");
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
                    variant="ghost"
                    size="md"
                    className="min-h-11 md:hidden"
                  />
                }
              >
                Filter
              </SheetTrigger>
              <SheetContent side="bottom" className="p-4">
                <SheetHeader className="p-0 pb-4">
                  <SheetTitle>Filter katalog</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {FilterFields}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            {FilterFields}
          </div>
        </form>
      </div>
    </section>
  );
}
