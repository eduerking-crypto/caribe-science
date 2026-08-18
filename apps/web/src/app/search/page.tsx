import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import type { SearchOut } from "@/lib/types";
import { getServerLocale, t } from "@/lib/dicts";
import { SearchBar } from "@/components/SearchBar";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles, researchers, journals, datasets and protocols.",
};

const TYPE_META: Record<string, { labelKey: string; tone: "ocean" | "reef" | "sun" | "sand" | "coral" }> = {
  article: { labelKey: "search.type.article", tone: "ocean" },
  researcher: { labelKey: "search.type.researcher", tone: "reef" },
  journal: { labelKey: "search.type.journal", tone: "sun" },
  dataset: { labelKey: "search.type.dataset", tone: "sand" },
  protocol: { labelKey: "search.type.protocol", tone: "coral" },
};

async function doSearch(q: string): Promise<SearchOut> {
  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&limit=10`, {
      cache: "no-store",
    });
    if (!res.ok) return { query: q, hits: [], total: 0 };
    return (await res.json()) as SearchOut;
  } catch {
    return { query: q, hits: [], total: 0 };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; author?: string; journal?: string; type?: string }>;
}) {
  const locale = await getServerLocale();
  const dict = (key: string) => t(locale, key);
  const { q = "", author = "", journal = "", type = "" } = await searchParams;
  const query = q.trim();
  const data = query ? await doSearch(query) : null;

  return (
    <>
      <header className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0c131a]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-white">
            {dict("search.title")}
          </h1>
          <div className="mt-6 max-w-3xl">
            <SearchBar big initial={query} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <AdvancedSearch
          init={{ keywords: query || undefined, author: author || undefined, journal: journal || undefined, articleType: type || undefined }}
        />

        <div>
          {!query ? (
            <EmptyState title={dict("search.empty.title")} body={dict("search.empty.body")} />
          ) : data && data.hits.length === 0 ? (
            <EmptyState
              title={`${dict("search.no_results_for")} “${query}”`}
              body={dict("search.try_different")}
            />
          ) : data ? (
            <>
              <p className="text-sm text-mut dark:text-gray-400">
                {data.total} {dict("search.advanced.results")} {dict("search.results_for")}{" "}
                <strong className="font-semibold text-ink dark:text-gray-100">“{query}”</strong>
              </p>
              <ul className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-[#111a22]">
                {data.hits.map((h, i) => {
                  const meta = TYPE_META[h.type] ?? TYPE_META.article;
                  return (
                    <li key={`${h.type}-${h.id}-${i}`}>
                      <Link
                        href={h.url || `/${h.type === "researcher" ? "researchers" : `${h.type}s`}/${h.slug}`}
                        className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      >
                        <Badge tone={meta.tone}>{dict(meta.labelKey)}</Badge>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                            {h.title}
                          </span>
                          {h.subtitle && (
                            <span className="mt-0.5 line-clamp-2 block text-xs text-mut dark:text-gray-400">
                              {h.subtitle}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}