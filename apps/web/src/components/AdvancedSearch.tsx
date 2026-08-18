"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, fmtDate, fmtNumber } from "@/lib/api";
import type { ArticleOut, JournalOut, ResearcherOut, DatasetOut, ProtocolOut } from "@/lib/types";
import { useLocale } from "@/components/providers";
import { Button, Input, Select, Badge } from "@/components/ui";
import { ARTICLE_TYPES } from "@/lib/types";

const ci = (s: string) => s.toLowerCase().trim();
const match = (haystack: string | null | undefined, needle: string) =>
  !!haystack && ci(haystack).includes(ci(needle));

type Scope = "all" | "article" | "researcher" | "journal" | "dataset" | "protocol";
type Op = "and" | "or";

interface ArticleRowProps {
  article: ArticleOut;
  locale: string;
}

function ArticleRow({ article, locale }: ArticleRowProps) {
  const isEs = locale === "es";
  const title = isEs && article.title_es ? article.title_es : article.title;
  const authors = (article.authors ?? []).slice(0, 3).map((a) => a.name).join(", ");
  return (
    <li>
      <Link
        href={`/articles/${article.slug}`}
        className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
      >
        <Badge tone="gray" >{article.section_label ?? "Research"}</Badge>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink hover:text-reef-700 dark:text-gray-100 dark:hover:text-reef-300">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-mut dark:text-gray-400">
            {authors} · {article.journal?.title ?? "Caribbean Journal of Science"} ·{" "}
            {article.publication_date ? fmtDate(article.publication_date) : "—"}
          </span>
        </span>
        <span className="shrink-0 text-xs text-mut dark:text-gray-500">
          {fmtNumber(article.views)} {isEs ? "vistas" : "views"}
        </span>
      </Link>
    </li>
  );
}

export interface AdvancedSearchInit {
  keywords?: string;
  author?: string;
  journal?: string;
  articleType?: string;
}

export function AdvancedSearch({ init }: { init?: AdvancedSearchInit }) {
  const { dict, locale } = useLocale();
  const isEs = locale === "es";

  const [keywords, setKeywords] = useState(init?.keywords ?? "");
  const [author, setAuthor] = useState(init?.author ?? "");
  const [journal, setJournal] = useState(init?.journal ?? "");
  const [articleType, setArticleType] = useState(init?.articleType ?? "");
  const [scope, setScope] = useState<Scope>("all");
  const [op, setOp] = useState<Op>("and");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);

  const [articles, setArticles] = useState<ArticleOut[]>([]);
  const [researchers, setResearchers] = useState<ResearcherOut[]>([]);
  const [journals, setJournals] = useState<JournalOut[]>([]);
  const [datasets, setDatasets] = useState<DatasetOut[]>([]);
  const [protocols, setProtocols] = useState<ProtocolOut[]>([]);

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setRan(true);
    try {
      const limit = 500;
      const [a, r, j, d, p] = await Promise.all([
        api.get<ArticleOut[]>(`/articles?limit=${limit}`, false),
        api.get<ResearcherOut[]>(`/researchers?limit=${limit}`, false),
        api.get<JournalOut[]>(`/journals?limit=${limit}`, false),
        api.get<DatasetOut[]>(`/datasets?limit=${limit}`, false),
        api.get<ProtocolOut[]>(`/protocols?limit=${limit}`, false),
      ]);
      setArticles(a);
      setResearchers(r);
      setJournals(j);
      setDatasets(d);
      setProtocols(p);
    } catch {
      setError(dict["search.no_results"] ?? "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const hasInit = Boolean(init?.keywords || init?.author || init?.journal || init?.articleType);

  useEffect(() => {
    if (hasInit) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const k = keywords.trim();
  const au = author.trim();
  const jr = journal.trim();

  const articleMatch = (art: ArticleOut): boolean => {
    const tests: boolean[] = [];
    if (k) {
      const hay = [art.title, art.title_es, art.abstract, ...(art.keywords ?? [])].join(" ");
      tests.push(match(hay, k));
    }
    if (au)
      tests.push((art.authors ?? []).some((x) => match(`${x.name} ${x.institution}`, au)));
    if (jr)
      tests.push(
        match(art.journal?.title, jr) ||
          match(art.journal?.title_es, jr) ||
          match(art.journal?.issn, jr),
      );
    if (articleType) tests.push(art.article_type === articleType);
    if (tests.length === 0) return false;
    return op === "and" ? tests.every(Boolean) : tests.some(Boolean);
  };

  const researcherMatch = (r: ResearcherOut): boolean => {
    const tests: boolean[] = [];
    if (k)
      tests.push(
        match(r.full_name, k) ||
          (r.research_areas ?? []).some((x) => match(x, k)) ||
          (r.keywords ?? []).some((x) => match(x, k)) ||
          match(r.biography, k),
      );
    if (au) tests.push(match(r.full_name, au));
    if (jr) tests.push(match(r.institution?.name, jr));
    if (tests.length === 0) return false;
    return op === "and" ? tests.every(Boolean) : tests.some(Boolean);
  };

  const journalMatch = (j: JournalOut): boolean => {
    const tests: boolean[] = [];
    if (k)
      tests.push(
        match(j.title, k) ||
          match(j.title_es, k) ||
          match(j.issn, k) ||
          match(j.eissn, k) ||
          match(j.publisher, k) ||
          (j.scope ?? []).some((x) => match(x, k)),
      );
    if (jr)
      tests.push(
        match(j.title, jr) || match(j.title_es, jr) || match(j.issn, jr),
      );
    if (tests.length === 0) return false;
    return op === "and" ? tests.every(Boolean) : tests.some(Boolean);
  };

  const datasetMatch = (d: DatasetOut): boolean => {
    if (!k) return false;
    return match(d.title, k) || match(d.description, k);
  };

  const protocolMatch = (pr: ProtocolOut): boolean => {
    if (!k) return false;
    return match(pr.title, k) || match(pr.description, k) || match(pr.category, k);
  };

  const showAll = scope === "all";
  const filteredArticles =
    showAll || scope === "article" ? articles.filter(articleMatch) : [];
  const filteredResearchers = showAll || scope === "researcher" ? researchers.filter(researcherMatch) : [];
  const filteredJournals = showAll || scope === "journal" ? journals.filter(journalMatch) : [];
  const filteredDatasets = showAll || scope === "dataset" ? datasets.filter(datasetMatch) : [];
  const filteredProtocols = showAll || scope === "protocol" ? protocols.filter(protocolMatch) : [];
  const total =
    filteredArticles.length +
    filteredResearchers.length +
    filteredJournals.length +
    filteredDatasets.length +
    filteredProtocols.length;

  const reset = () => {
    setKeywords("");
    setAuthor("");
    setJournal("");
    setArticleType("");
    setScope("all");
    setOp("and");
    setArticles([]);
    setResearchers([]);
    setJournals([]);
    setDatasets([]);
    setProtocols([]);
    setRan(false);
  };

  const scopeOpts: Array<{ value: Scope; label: string }> = [
    { value: "all", label: dict["search.field.scope.all"] },
    { value: "article", label: dict["search.field.scope.article"] },
    { value: "researcher", label: dict["search.field.scope.researcher"] },
    { value: "journal", label: dict["search.field.scope.journal"] },
    { value: "dataset", label: dict["search.field.scope.dataset"] },
    { value: "protocol", label: dict["search.field.scope.protocol"] },
  ];

  return (
    <section
      id="advanced"
      className="scroll-mt-28 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
          {dict["search.advanced"]}
        </h2>
        <p className="hidden text-xs text-mut sm:block dark:text-gray-400">{dict["search.advanced.hint"]}</p>
      </div>

      <form onSubmit={run} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
            {dict["search.field.keywords"]}
          </label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={isEs ? "arrecifes, manglares…" : "reefs, mangroves…"}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
            {dict["search.field.author"]}
          </label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
            {dict["search.field.journal"]}
          </label>
          <Input value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
            {dict["search.field.type"]}
          </label>
          <Select value={articleType} onChange={(e) => setArticleType(e.target.value)}>
            <option value="">{dict["search.field.type.any"]}</option>
            {ARTICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {dict[`search.field.type.${t}`] ?? t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
            {dict["search.field.scope"]}
          </label>
          <Select value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
            {scopeOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#3a4046] dark:text-gray-300">
            {isEs ? "Operador" : "Operator"}
          </label>
          <Select value={op} onChange={(e) => setOp(e.target.value as Op)}>
            <option value="and">{dict["search.op.and"]}</option>
            <option value="or">{dict["search.op.or"]}</option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "…" : dict["search.advanced.run"]}
          </Button>
          <Button type="button" variant="secondary" onClick={reset}>
            {dict["search.advanced.clear"]}
          </Button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-coral-600 dark:text-coral-300">{error}</p>}

      {ran && !loading && (
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
          <p className="text-sm font-medium text-ink dark:text-gray-200">
            {total} {dict["search.advanced.results"]}
          </p>

          {total === 0 ? (
            <p className="mt-3 text-sm text-mut dark:text-gray-400">{dict["search.advanced.empty"]}</p>
          ) : (
            <div className="mt-3 space-y-5">
              {(showAll || scope === "article") && filteredArticles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                    {dict["search.type.article"]} ({filteredArticles.length})
                  </p>
                  <ul className="mt-1.5 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredArticles.map((art) => (
                      <ArticleRow key={art.id} article={art} locale={locale} />
                    ))}
                  </ul>
                </div>
              )}
              {(showAll || scope === "researcher") && filteredResearchers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                    {dict["search.type.researcher"]} ({filteredResearchers.length})
                  </p>
                  <ul className="mt-1.5 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredResearchers.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/researchers/${r.id}`}
                          className="block rounded-md px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        >
                          <span className="font-semibold text-ink dark:text-gray-100">{r.full_name}</span>
                          <span className="ml-2 text-xs text-mut dark:text-gray-400">
                            {r.institution?.name ?? ""}
                            {r.article_count ? ` · ${r.article_count} ${isEs ? "artículos" : "articles"}` : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(showAll || scope === "journal") && filteredJournals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                    {dict["search.type.journal"]} ({filteredJournals.length})
                  </p>
                  <ul className="mt-1.5 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredJournals.map((j) => (
                      <li key={j.id}>
                        <Link
                          href={`/journals/${j.slug}`}
                          className="block rounded-md px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        >
                          <span className="font-semibold text-ink dark:text-gray-100">
                            {isEs && j.title_es ? j.title_es : j.title}
                          </span>
                          <span className="ml-2 text-xs text-mut dark:text-gray-400">
                            {j.issn ? `ISSN ${j.issn}` : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(showAll || scope === "dataset") && filteredDatasets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                    {dict["search.type.dataset"]} ({filteredDatasets.length})
                  </p>
                  <ul className="mt-1.5 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredDatasets.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/datasets/${d.slug}`}
                          className="block rounded-md px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        >
                          <span className="font-semibold text-ink dark:text-gray-100">{d.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(showAll || scope === "protocol") && filteredProtocols.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                    {dict["search.type.protocol"]} ({filteredProtocols.length})
                  </p>
                  <ul className="mt-1.5 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredProtocols.map((pr) => (
                      <li key={pr.id}>
                        <Link
                          href={`/protocols/${pr.slug}`}
                          className="block rounded-md px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        >
                          <span className="font-semibold text-ink dark:text-gray-100">{pr.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}