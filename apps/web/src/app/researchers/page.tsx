import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { getServerLocale } from "@/lib/dicts";
import type { ResearcherOut } from "@/lib/types";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Researchers",
  description: "The researchers building scientific knowledge in the Caribbean.",
};

export default async function ResearchersPage() {
  const locale = await getServerLocale();
  let researchers: ResearcherOut[] = [];
  try {
    const res = await fetch(`${API_URL}/researchers`, { cache: "no-store" });
    if (res.ok) researchers = (await res.json()) as ResearcherOut[];
  } catch {
    researchers = [];
  }

  return (
    <>
      <PageHeader
        kicker="People"
        title="Researchers"
        subtitle="The community building scientific knowledge in the Caribbean."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        {researchers.length === 0 ? (
          <EmptyState title="No researchers yet" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {researchers.map((r) => (
              <Link
                key={r.id}
                href={`/researchers/${r.id}`}
                className="group rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#111a22] dark:hover:border-gray-700"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-reef-400 to-ocean-600 font-display text-base font-semibold text-white">
                    {r.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                      {r.full_name}
                    </p>
                    <p className="truncate text-xs text-mut dark:text-gray-400">
                      {r.institution?.name ?? r.country_code ?? "—"}
                    </p>
                  </div>
                </div>
                {r.research_areas.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {r.research_areas.slice(0, 4).map((a) => (
                      <Badge key={a} tone="gray">{a}</Badge>
                    ))}
                    {r.research_areas.length > 4 && (
                      <span className="text-xs text-mut dark:text-gray-500">+{r.research_areas.length - 4}</span>
                    )}
                  </div>
                )}
                <p className="mt-3.5 text-xs font-medium text-reef-600 dark:text-reef-300">
                  {r.article_count} article{r.article_count === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}