"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers";

export function SearchBar({ big = false, initial }: { big?: boolean; initial?: string }) {
  const { dict } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState(initial ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <form onSubmit={submit} className="flex w-full gap-2" role="search">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={dict["search.placeholder"]}
          aria-label={dict["search.placeholder"]}
          className={`w-full rounded-md border border-gray-300 bg-white pl-10 text-ink placeholder:text-gray-400 focus:border-reef-500 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0c131a] dark:text-gray-100 dark:placeholder:text-gray-500 ${
            big ? "py-3.5 text-base" : "py-2 text-sm"
          }`}
        />
      </div>
      <button
        type="submit"
        className={`shrink-0 rounded-md bg-reef-600 font-semibold text-white transition-colors hover:bg-reef-700 dark:bg-reef-500 dark:text-white dark:hover:bg-reef-400 cursor-pointer ${
          big ? "px-7 py-3.5 text-base" : "px-5 py-2 text-sm"
        }`}
      >
        {dict["search.button"]}
      </button>
    </form>
  );
}