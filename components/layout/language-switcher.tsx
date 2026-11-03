"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { setLocaleAction } from "@/actions/locale.actions";
import { type Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, className }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (newLocale: Locale) => {
    if (newLocale === currentLocale || isPending) return;
    startTransition(async () => {
      await setLocaleAction(newLocale);
      window.location.reload();
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs border border-neutral-300 rounded-md p-0.5 bg-surface-base shadow-2xs ${
        className || ""
      }`}
    >
      <Globe className="w-3.5 h-3.5 text-neutral-600 ml-1 mr-0.5 shrink-0" />
      <button
        type="button"
        onClick={() => handleToggle("id")}
        disabled={isPending}
        className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-colors coarse:min-h-10 inline-flex items-center justify-center ${
          currentLocale === "id"
            ? "bg-primary-900 text-white"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        }`}
        aria-label="Bahasa Indonesia"
      >
        ID
      </button>
      <span className="text-neutral-300 text-xs">|</span>
      <button
        type="button"
        onClick={() => handleToggle("en")}
        disabled={isPending}
        className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-colors coarse:min-h-10 inline-flex items-center justify-center ${
          currentLocale === "en"
            ? "bg-primary-900 text-white"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        }`}
        aria-label="English Language"
      >
        EN
      </button>
    </div>
  );
}
