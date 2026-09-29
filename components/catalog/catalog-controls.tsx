"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface FilterControlsProps {
  origins: string[];
  processes: string[];
  roastLevels: string[];
}

const sorts = [
  ["terbaru", "Terbaru"],
  ["harga_terendah", "Harga terendah"],
  ["harga_tertinggi", "Harga tertinggi"],
] as const;
const priceRanges = [
  { label: "Semua harga", min: "", max: "" },
  { label: "Di bawah Rp100.000", min: "", max: "100000" },
  { label: "Rp100.000–Rp150.000", min: "100000", max: "150000" },
  { label: "Di atas Rp150.000", min: "150000", max: "" },
];

export function CatalogControls({ origins, processes, roastLevels }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const replaceParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("halaman");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (query === current) return;
    const timer = window.setTimeout(() => replaceParam("q", query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query, searchParams, replaceParam]);

  const select = (name: string, label: string, options: string[]) => (
    <label key={name} className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        value={searchParams.get(name) || ""}
        onChange={(event) => replaceParam(name, event.target.value)}
        className="h-11 min-w-0 rounded-sm border border-neutral-300 bg-surface-base px-3 text-xs text-neutral-700 outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
      >
        <option value="">Semua {label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );

  const sortSelect = (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="sr-only">Urutkan</span>
      <select value={searchParams.get("urut") || "terbaru"} onChange={(event) => replaceParam("urut", event.target.value)} className="h-11 rounded-sm border border-neutral-300 bg-surface-base px-3 text-xs text-neutral-700 outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600">
        {sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );

  const priceSelect = (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="sr-only">Rentang harga</span>
      <select
        value={`${searchParams.get("harga_min") || ""}:${searchParams.get("harga_max") || ""}`}
        onChange={(event) => {
          const [min, max] = event.target.value.split(":");
          const params = new URLSearchParams(searchParams.toString());
          if (min) params.set("harga_min", min); else params.delete("harga_min");
          if (max) params.set("harga_max", max); else params.delete("harga_max");
          params.delete("halaman");
          startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
        }}
        className="h-11 rounded-sm border border-neutral-300 bg-surface-base px-3 text-xs text-neutral-700 outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
      >
        {priceRanges.map((range) => <option key={`${range.min}:${range.max}`} value={`${range.min}:${range.max}`}>{range.label}</option>)}
      </select>
    </label>
  );

  const verifiedToggle = (
    <label className="flex min-h-11 items-center gap-2 text-xs text-neutral-700">
      <input type="checkbox" checked={searchParams.get("verified") === "true"} onChange={(event) => replaceParam("verified", event.target.checked ? "true" : "")} className="h-4 w-4 accent-primary-600" />
      Terverifikasi saja
    </label>
  );

  const filters = (
    <>
      {select("asal", "Asal", origins)}
      {select("proses", "Proses", processes)}
      {select("sangrai", "Sangrai", roastLevels)}
      {sortSelect}
      {priceSelect}
      {verifiedToggle}
    </>
  );

  return (
    <section className="border-b border-neutral-300 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">Katalog kopi specialty Indonesia</h1>
        <form method="get" action={pathname} className="flex flex-wrap gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Cari kopi, asal, atau roastery</span>
            <input name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kopi, asal, atau roastery" className="h-11 w-full rounded-sm border border-neutral-300 bg-surface-base px-3 text-sm outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600" />
          </label>
          <Button type="submit" size="md" className="min-h-11">Cari</Button>
          <Sheet>
            <SheetTrigger render={<Button type="button" variant="ghost" size="md" className="min-h-11 md:hidden" />}>Filter</SheetTrigger>
            <SheetContent side="bottom" className="p-4">
              <SheetHeader className="p-0 pb-4"><SheetTitle>Filter katalog</SheetTitle></SheetHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{filters}</div>
            </SheetContent>
          </Sheet>
          <div className="hidden w-full gap-2 md:flex">{select("asal", "Asal", origins)}{select("proses", "Proses", processes)}{select("sangrai", "Sangrai", roastLevels)}{sortSelect}</div>
        </form>
      </div>
    </section>
  );
}
