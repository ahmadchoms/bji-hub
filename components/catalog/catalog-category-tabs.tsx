"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { slug: "", label: "Semua Kopi" },
  { slug: "roasted-beans", label: "Biji Sangrai (Roasted)" },
  { slug: "green-beans", label: "Biji Mentah (Green Bean)" },
  { slug: "drip-bag", label: "Drip Bag" },
  { slug: "equipment", label: "Alat Seduh" },
];

export function CatalogCategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory =
    searchParams.get("kategori") || searchParams.get("category") || "";

  const handleTabClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) {
      params.delete("kategori");
      params.delete("category");
    } else {
      params.set("kategori", slug);
      params.delete("category");
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
      {tabs.map((tab) => {
        const isActive = currentCategory === tab.slug;
        return (
          <button
            key={tab.slug || "all"}
            type="button"
            onClick={() => handleTabClick(tab.slug)}
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
  );
}
