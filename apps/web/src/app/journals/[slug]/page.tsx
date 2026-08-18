import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getServerLocale, t } from "@/lib/dicts";
import type { ArticleOut, DatasetOut, JournalDetailOut } from "@/lib/types";
import { Badge, EmptyState } from "@/components/ui";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JournalSideNav } from "@/components/JournalSideNav";
import { EmailAlert } from "@/components/EmailAlert";
import { fmtNumber } from "@/lib/api";

async function getJournal(slug: string): Promise<JournalDetailOut | null> {
  try {
    const res = await fetch(`${API_URL}/journals/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as JournalDetailOut;
  } catch {
    return null;
  }
}

async function getArticles(): Promise<ArticleOut[]> {
  try {
    const res = await fetch(`${API_URL}/articles`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ArticleOut[];
  } catch {
    return [];
  }
}

async function getDatasets(): Promise<DatasetOut[]> {
  try {
    const res = await fetch(`${API_URL}/datasets?limit=5`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as DatasetOut[];
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
  const journal = await getJournal((await params).slug);
  return { title: journal?.title ?? "Journal" };
}

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const journal = await getJournal((await params).slug);
  if (!journal) notFound();
  const locale = await getServerLocale();
  const dict = (key: string) => t(locale, key);
  const es = locale === "es";
  const [articles, datasets] = await Promise.all([getArticles(), getDatasets()]);
  const jArticles = articles.filter((a) => a.journal?.id === journal.id);
  const totalViews = jArticles.reduce((s, a) => s + a.views, 0);
  const totalCites = jArticles.reduce((s, a) => s + a.citations, 0);
  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(es ? "es-ES" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  const credentials = [
    "journal.cred.open_access",
    "journal.cred.high_visibility",
    "journal.cred.rigorous",
    "journal.cred.data",
  ];

  const metrics = [
    { value: fmtNumber(journal.article_count), label: dict("journal.metrics.articles"), cls: "bg-ocean-600" },
    { value: fmtNumber(totalViews), label: dict("journal.metrics.views"), cls: "bg-reef-600" },
    { value: fmtNumber(totalCites), label: dict("journal.metrics.citations"), cls: "bg-sun-500" },
    { value: journal.eissn || "—", label: "eISSN", cls: "bg-gray-700" },
  ];

  return (
    <>
      <section className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0c131a]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Breadcrumb
            items={[{ label: dict("nav.journals"), href: "/journals" }, { label: journal.title }]}
          />
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-white">
                {es && journal.title_es ? journal.title_es : journal.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mut dark:text-gray-400">
                {es && journal.description_es ? journal.description_es : journal.description}
              </p>
            </div>
            {journal.open_access && <Badge tone="reef">{dict("journal.open_access")}</Badge>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
          <aside className="self-start lg:sticky lg:top-28">
            <JournalSideNav journal={journal} articles={jArticles} />
          </aside>

          <div className="min-w-0 space-y-10">
            <div id="aims" className="scroll-mt-28 rounded-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#111a22]">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
                {dict("journal.menu.aims")}
              </h2>
              <p className="mt-3 font-display text-[15px] italic leading-relaxed text-[#3a4046] dark:text-gray-300">
                {es && journal.description_es ? journal.description_es : journal.description}
              </p>
              <ul className="mt-5 space-y-2.5">
                {credentials.map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
                    <span aria-hidden="true" className="mt-1 size-2 shrink-0 bg-reef-600 dark:bg-reef-400" />
                    {dict(k)}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {journal.scope.map((s) => (
                  <Badge key={s} tone="gray">{s}</Badge>
                ))}
              </div>
            </div>

            <div id="articles" className="scroll-mt-28">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink dark:text-white">
                  {dict("nav.articles")} ({jArticles.length})
                </h2>
                <Link
                  href="/articles"
                  className="text-sm font-medium text-reef-700 hover:underline dark:text-reef-300"
                >
                  {dict("journal.more_articles")}
                </Link>
              </div>
              {jArticles.length === 0 ? (
                <div className="mt-6">
                  <EmptyState title={es ? "Aún no hay artículos publicados" : "No articles published yet"} />
                </div>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {jArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} locale={locale} openAccess={journal.open_access} />
                  ))}
                </div>
              )}
            </div>

            <div id="sections" className="scroll-mt-28 rounded-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#111a22]">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
                {dict("journal.sections")} ({journal.sections.length})
              </h2>
              <ul className="mt-4 space-y-2.5">
                {journal.sections.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5 last:border-0 dark:border-gray-800"
                  >
                    <span className="font-medium text-ink dark:text-gray-100">
                      {es && s.name_es ? s.name_es : s.name}
                    </span>
                    <span className="max-w-[55%] text-right text-xs text-mut dark:text-gray-400">
                      {s.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {journal.special_issues.length > 0 && (
              <div id="special_issues" className="scroll-mt-28 rounded-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#111a22]">
                <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
                  {dict("journal.special_issues")}
                </h2>
                <ul className="mt-4 space-y-3">
                  {journal.special_issues.map((si) => (
                    <li key={si.id} className="rounded-md bg-gray-50 p-3 dark:bg-gray-800/60">
                      <p className="text-sm font-semibold text-ink dark:text-gray-100">{si.title}</p>
                      <p className="mt-1 text-xs text-mut dark:text-gray-400">
                        {si.status}
                        {si.deadline
                          ? ` · ${dict("journal.deadline")} ${dateFmt(si.deadline)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {journal.editors.length > 0 && (
              <div id="board" className="scroll-mt-28">
                <h2 className="font-display text-xl font-semibold text-ink dark:text-white">
                  {dict("journal.editorial_board")}
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {journal.editors.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-reef-400 to-ocean-600 font-display font-semibold text-white">
                          {e.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                        </span>
                        <div>
                          <p className="font-semibold text-ink dark:text-white">{e.name}</p>
                          <p className="text-xs text-reef-600 dark:text-reef-300">{e.role}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-mut dark:text-gray-400">{e.institution}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(e.research_areas ?? []).slice(0, 4).map((a) => (
                          <Badge key={a} tone="gray">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-5 self-start lg:sticky lg:top-28">
            <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
                {metrics.map((m) => (
                  <div key={m.label} className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={`flex size-[4.2rem] items-center justify-center rounded-full ${m.cls} font-display text-lg font-bold text-white shadow-sm`}
                      title={m.label}
                    >
                      {m.value}
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-mut dark:text-gray-400">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <EmailAlert />

            {datasets.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                  {dict("journal.news.title")}
                </p>
                <ul className="mt-3 space-y-3">
                  {datasets.map((d) => (
                    <li key={d.id}>
                      <Link href={`/datasets/${d.slug}`} className="group block text-sm">
                        <span className="line-clamp-2 font-medium text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                          {d.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-mut dark:text-gray-400">
                          {d.license}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/datasets"
                  className="mt-3 inline-block text-xs font-medium text-reef-700 hover:underline dark:text-reef-300"
                >
                  {dict("journal.news.more")}
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}