import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { API_URL, fmtDate, fmtNumber } from "@/lib/api";
import { getServerLocale } from "@/lib/dicts";
import type { ArticleDetailOut, ArticleOut } from "@/lib/types";
import { Badge, Card } from "@/components/ui";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JournalSideNav } from "@/components/JournalSideNav";

async function getArticle(slug: string): Promise<ArticleDetailOut | null> {
  try {
    const res = await fetch(`${API_URL}/articles/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ArticleDetailOut;
  } catch {
    return null;
  }
}

async function getRelated(slug: string): Promise<ArticleDetailOut[]> {
  try {
    const res = await fetch(`${API_URL}/articles/${slug}/related`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ArticleDetailOut[];
  } catch {
    return [];
  }
}

async function getJournalArticles(journalId: string): Promise<ArticleOut[]> {
  try {
    const res = await fetch(`${API_URL}/articles`, { cache: "no-store" });
    if (!res.ok) return [];
    const all = (await res.json()) as ArticleOut[];
    return all.filter((a) => a.journal?.id === journalId);
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  return {
    title: article?.title ?? "Article",
    description: article?.abstract,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const locale = await getServerLocale();
  const journal = article.journal;
  const [related, jArticles] = await Promise.all([
    getRelated(article.slug),
    journal ? getJournalArticles(journal.id) : Promise.resolve([]),
  ]);
  const es = locale === "es";

  const authors = (article.authors ?? []).slice().sort((a, b) => a.order - b.order);
  const corresponding = authors.find((a) => a.is_corresponding);

  return (
    <>
      <article>
        <header className="border-b border-gray-200 bg-paper py-12 dark:border-gray-800 dark:bg-[#0c131a]">
          <div className="mx-auto max-w-4xl px-6">
            {journal && (
              <Breadcrumb
                items={[
                  { label: es ? "Revistas" : "Journals", href: "/journals" },
                  { label: journal.title, href: `/journals/${journal.slug}` },
                  { label: article.title },
                ]}
              />
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="gray">{article.section_label}</Badge>
              <Badge tone="reef">{es ? "Acceso abierto" : "Open access"}</Badge>
              {article.doi && <Badge tone="gray">DOI: {article.doi}</Badge>}
            </div>
            <h1 className="font-display mt-5 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl dark:text-white">
              {es && article.title_es ? article.title_es : article.title}
            </h1>
            {es && article.title_es && article.title_es !== article.title && (
              <p className="mt-3 text-[15px] text-mut dark:text-gray-400">{article.title}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {authors.map((a) => (
                  <span key={a.id} className="text-sm">
                    <span className="font-semibold text-ink dark:text-gray-100">
                      {a.name}
                      {a.is_corresponding ? "†" : ""}
                    </span>
                    <span className="text-mut dark:text-gray-400"> · {a.institution}</span>
                  </span>
                ))}
              </div>
              <span className="text-sm text-mut dark:text-gray-400">
                {fmtDate(article.publication_date)}
              </span>
            </div>
          </div>
        </header>

        <div className={`mx-auto grid gap-10 px-6 py-12 ${journal ? "max-w-6xl lg:grid-cols-[240px_minmax(0,1fr)_300px]" : "max-w-6xl lg:grid-cols-[1fr_300px]"}`}>
          {journal && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <JournalSideNav journal={journal} articles={jArticles} />
              </div>
            </aside>
          )}

          <div className="min-w-0">
            <div className="rounded-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#111a22]">
              <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-reef-600 dark:text-reef-300">
                {es ? "Resumen" : "Abstract"}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink dark:text-gray-100">
                {es && article.abstract_es ? article.abstract_es : article.abstract}
              </p>
              {(article.keywords?.length > 0 || (es && article.keywords_es?.length > 0)) && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(es && article.keywords_es?.length > 0 ? article.keywords_es : article.keywords).map((k) => (
                    <Link key={k} href={`/search?q=${encodeURIComponent(k)}`} className="rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                      {k}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="prose-science mt-10" dangerouslySetInnerHTML={{ __html: article.body_html }} />

            {article.data_availability && (
              <section className="mt-12 rounded-md border border-gray-200 p-6 dark:border-gray-800">
                <h2 className="font-display text-lg font-semibold text-ink dark:text-white">{es ? "Disponibilidad de datos" : "Data availability"}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
                  {article.data_availability}
                </p>
                {article.code_availability && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
                    <strong>{es ? "Código:" : "Code:"}</strong> {article.code_availability}
                  </p>
                )}
              </section>
            )}

            {(article.funding || article.conflicts) && (
              <section className="mt-6 rounded-md border border-gray-200 p-6 dark:border-gray-800">
                <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
                  {es ? "Financiación y conflictos" : "Funding & conflicts"}
                </h2>
                {article.funding && <p className="mt-2 text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">{article.funding}</p>}
                {article.conflicts && (
                  <p className="mt-2 text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
                    {es ? "Conflictos:" : "Conflicts:"} {article.conflicts}
                  </p>
                )}
              </section>
            )}

            {article.references?.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-xl font-semibold text-ink dark:text-white">
                  {es ? "Referencias" : "References"} ({article.references.length})
                </h2>
                <ol className="mt-5 space-y-2.5">
                  {article.references.map((r) => (
                    <li key={r.id} className="flex gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm leading-relaxed dark:border-gray-800 dark:bg-[#111a22]">
                      <span className="shrink-0 font-semibold text-reef-600 dark:text-reef-300">{r.order}.</span>
                      <span className="text-ink dark:text-gray-100">{r.citation}</span>
                      {r.doi && <span className="shrink-0 text-xs text-mut dark:text-gray-400">doi:{r.doi}</span>}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["bibtex", "ris", "apa", "vancouver"].map((style) => (
                    <a
                      key={style}
                      href={`${API_URL}/articles/${article.slug}/citations/${style}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-gray-300 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {style}
                    </a>
                  ))}
                </div>
              </section>
            )}

            </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                {es ? "Métricas" : "Metrics"}
              </h2>
              <dl className="mt-3.5 space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-mut dark:text-gray-400">{es ? "Vistas" : "Views"}</dt><dd className="font-semibold text-ink dark:text-gray-100">{fmtNumber(article.views)}</dd></div>
                <div className="flex justify-between"><dt className="text-mut dark:text-gray-400">{es ? "Descargas" : "Downloads"}</dt><dd className="font-semibold text-ink dark:text-gray-100">{fmtNumber(article.downloads)}</dd></div>
                <div className="flex justify-between"><dt className="text-mut dark:text-gray-400">{es ? "Citas" : "Citations"}</dt><dd className="font-semibold text-ink dark:text-gray-100">{fmtNumber(article.citations)}</dd></div>
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                {es ? "Tipo de artículo" : "Article type"}
              </h2>
              <Badge tone="gray">{article.article_type}</Badge>
              <p className="mt-3 text-xs text-mut dark:text-gray-400">{es ? "Licencia:" : "License:"} {article.license}</p>
            </Card>
            {corresponding && (
              <Card className="p-5">
                <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                  {es ? "Autor de contacto" : "Corresponding author"}
                </h2>
                <p className="mt-3 text-sm font-semibold text-ink dark:text-gray-100">{corresponding.name}</p>
                <p className="text-xs text-mut dark:text-gray-400">{corresponding.institution}</p>
              </Card>
            )}
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-gray-200 py-12 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-xl font-semibold text-ink dark:text-white">{es ? "Artículos relacionados" : "Related articles"}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/articles/${r.slug}`} className="rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#111a22] dark:hover:border-gray-700">
                  <p className="font-display font-semibold leading-snug text-ink hover:text-reef-700 dark:text-gray-100 dark:hover:text-reef-300">
                    {es && r.title_es ? r.title_es : r.title}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-mut dark:text-gray-400">{r.abstract}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}