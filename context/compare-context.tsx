"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ListingWithRelations } from "@/types";

interface CompareContextValue {
  compareList: ListingWithRelations[];
  addToCompare: (listing: ListingWithRelations) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "biji_compare_listings";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<ListingWithRelations[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCompareList(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  const save = (items: ListingWithRelations[]) => {
    setCompareList(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage quota issues
    }
  };

  const addToCompare = (listing: ListingWithRelations) => {
    if (compareList.some((item) => item.id === listing.id)) return;
    if (compareList.length >= 3) {
      // Keep maximum 3 items to compare
      save([...compareList.slice(1), listing]);
    } else {
      save([...compareList, listing]);
    }
  };

  const removeFromCompare = (id: string) => {
    save(compareList.filter((item) => item.id !== id));
  };

  const clearCompare = () => {
    save([]);
  };

  const isInCompare = (id: string) => {
    return compareList.some((item) => item.id === id);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
