import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { getServerLocale, t } from "@/lib/dicts";
import type { ResearcherOut } from "@/lib/types";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Breadcrumb } from "@/components/Breadcrumb";

interface ResearcherPublication {
  id: string;
  slug: string;
  title: string;
  journal: string;
  doi: string | null;
  publication_date: string | null;
  is_corresponding: boolean;
}

async function getResearcher(id: string): Promise<ResearcherOut | null> {
  try {
    const res = await fetch(`${API_URL}/researchers/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ResearcherOut;
  } catch {
    return null;
  }
}

async function getPublications(id: string): Promise<ResearcherPublication[]> {
  try {
    const res = await fetch(`${API_URL}/researchers/${id}/publications`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ResearcherPublication[];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const r = await getResearcher((await params).id);
  return { title: r?.full_name ?? "Researcher" };
}

export default async function ResearcherPage({ params }: { params: Promise<{ id: string }> }) {
  const researcher = await getResearcher((await params).id);
  if (!researcher) notFound();
  const locale = await getServerLocale();
  const publications = await getPublications(researcher.id);

  return (
    <>
      <div className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0c131a]">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Breadcrumb
            items={[{ label: t(locale, "nav.researchers"), href: "/researchers" }, { label: researcher.full_name }]}
          />
        </div>
      </div>
      <PageHeader kicker="Researcher" title={researcher.full_name} />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <aside className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-reef-400 to-ocean-600 font-display text-xl font-semibold text-white">
                  {researcher.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </span>
                <div>
                  {researcher.orcid && (
                    <a
                      href={`https://orcid.org/${researcher.orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-reef-600 hover:underline dark:text-reef-300"
                    >
                      ORCID {researcher.orcid}
                    </a>
                  )}
                  <p className="text-sm text-mut dark:text-gray-400">
                    {researcher.institution?.name ?? "Independent"}
                  </p>
                  {researcher.institution && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {researcher.institution.acronym} · {researcher.institution.city}
                      {researcher.institution.country_code ? `, ${researcher.institution.country_code}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-5 text-sm font-medium text-ink dark:text-gray-100">
                {researcher.article_count} publications
              </p>
            </Card>

            {researcher.research_areas.length > 0 && (
              <Card className="p-6">
                <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                  Research areas
                </h2>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {researcher.research_areas.map((a) => (
                    <Link key={a} href={`/search?q=${encodeURIComponent(a)}`}>
                      <Badge tone="gray">{a}</Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {researcher.keywords.length > 0 && (
              <Card className="p-6">
                <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                  Keywords
                </h2>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {researcher.keywords.slice(0, 12).map((k) => (
                    <Badge key={k} tone="gray">{k}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </aside>

          <div>
            {researcher.biography && (
              <p className="text-lg leading-relaxed text-ink dark:text-gray-100">
                {researcher.biography}
              </p>
            )}
            <h2 className="font-display mt-10 text-2xl font-semibold text-ink dark:text-white">
              Publications ({publications.length})
            </h2>
            <ul className="mt-6 space-y-3">
              {publications.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/articles/${p.slug}`}
                    className="block rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#111a22] dark:hover:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display font-semibold leading-snug text-ink hover:text-reef-700 dark:text-gray-100 dark:hover:text-reef-300">
                        {p.title}
                      </p>
                      {p.is_corresponding && <Badge tone="sun">Corresponding</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-mut dark:text-gray-400">
                      {p.journal}
                      {p.publication_date
                        ? ` · ${new Date(p.publication_date).toLocaleDateString(locale === "es" ? "es" : "en-US", { year: "numeric", month: "short" })}`
                        : ""}
                      {p.doi ? ` · doi:${p.doi}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            {publications.length === 0 && (
              <p className="mt-6 text-sm text-ocean-500 dark:text-ocean-400">No publications yet.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}