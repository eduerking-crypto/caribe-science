"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers";
import { api } from "@/lib/api";
import type { JournalOut } from "@/lib/types";
import { ARTICLE_TYPES } from "@/lib/types";

let journalsCache: JournalOut[] | null = null;
async function loadJournals(): Promise<JournalOut[]> {
  if (journalsCache) return journalsCache;
  try {
    journalsCache = await api.get<JournalOut[]>("/journals?limit=100", false);
  } catch {
    journalsCache = [];
  }
  return journalsCache;
}

export function SearchBarRow() {
  const { dict } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [journal, setJournal] = useState("");
  const [type, setType] = useState("");
  const [journals, setJournals] = useState<JournalOut[] | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (author.trim()) params.set("author", author.trim());
    if (journal) params.set("journal", journal);
    if (type) params.set("type", type);
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}#advanced` : ""}`);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label={dict["searchrow.label"]}
      className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-6 py-2.5"
    >
      <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-mut dark:text-gray-400">
        {dict["searchrow.label"]}
      </label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={dict["searchrow.title_keyword"]}
        aria-label={dict["searchrow.title_keyword"]}
        className="h-9 w-44 rounded-[2px] border border-gray-300 bg-white px-2 text-[13px] text-ink placeholder:text-gray-400 focus:border-reef-600 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0b1322] dark:text-gray-100"
      />
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder={dict["searchrow.author_affiliation"]}
        aria-label={dict["searchrow.author_affiliation"]}
        className="h-9 w-52 rounded-[2px] border border-gray-300 bg-white px-2 text-[13px] text-ink placeholder:text-gray-400 focus:border-reef-600 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0b1322] dark:text-gray-100"
      />
      <select
        value={journal}
        onChange={(e) => {
          setJournal(e.target.value);
          void loadJournals().then(setJournals);
        }}
        aria-label={dict["searchrow.all_journals"]}
        onFocus={() => void loadJournals().then(setJournals)}
        className="h-9 w-48 cursor-pointer rounded-[2px] border border-gray-300 bg-white px-2 text-[13px] text-ink focus:border-reef-600 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0b1322] dark:text-gray-100"
      >
        <option value="">{dict["searchrow.all_journals"]}</option>
        {(journals ?? []).map((j) => (
          <option key={j.id} value={j.title}>
            {j.title}
          </option>
        ))}
      </select>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label={dict["searchrow.all_types"]}
        className="h-9 w-44 cursor-pointer rounded-[2px] border border-gray-300 bg-white px-2 text-[13px] text-ink focus:border-reef-600 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0b1322] dark:text-gray-100"
      >
        <option value="">{dict["searchrow.all_types"]}</option>
        {ARTICLE_TYPES.map((t) => (
          <option key={t} value={t}>
            {dict[`search.field.type.${t}`] ?? t}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 cursor-pointer rounded-[2px] bg-reef-600 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-reef-700 dark:bg-reef-500 dark:hover:bg-reef-400"
      >
        {dict["search.button"]}
      </button>
      <Link
        href="/search#advanced"
        className="text-[12.5px] font-medium text-reef-700 hover:underline dark:text-reef-300"
      >
        {dict["searchrow.advanced"]}
      </Link>
    </form>
  );
}
