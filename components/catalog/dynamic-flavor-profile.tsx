"use client";

import dynamic from "next/dynamic";
import type { TasteProfile } from "@/types";

const FlavorProfileInternal = dynamic(
  () => import("@/components/catalog/flavor-profile").then((mod) => mod.FlavorProfile),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 rounded-sm border border-neutral-200 bg-neutral-50/50 animate-pulse flex items-center justify-center text-xs text-neutral-600 font-mono">
        Memuat lembar cupping...
      </div>
    ),
  }
);

interface DynamicFlavorProfileProps {
  tasteProfile?: TasteProfile | null;
  className?: string;
}

export function DynamicFlavorProfile({ tasteProfile, className }: DynamicFlavorProfileProps) {
  return <FlavorProfileInternal tasteProfile={tasteProfile} className={className} />;
}
