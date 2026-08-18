"use client";

import { useLocale } from "@/components/providers";
import type { Locale } from "@/lib/dicts";

export function LangSwitch() {
  const { locale, setLocale } = useLocale();
  const engage = (l: Locale) => setLocale(l === "es" ? "es" : "en");
  return (
    <div
      className="inline-flex items-center rounded-full border border-ocean-200 bg-white/60 p-0.5 text-xs font-semibold dark:border-ocean-700 dark:bg-ocean-900/60"
      role="group"
      aria-label="Language"
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          onClick={() => engage(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors cursor-pointer ${
            locale === l
              ? "bg-ocean-700 text-white dark:bg-reef-400 dark:text-ocean-950"
              : "text-ocean-600 hover:text-ocean-900 dark:text-ocean-300 dark:hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}