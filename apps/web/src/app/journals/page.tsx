import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { getServerLocale } from "@/lib/dicts";
import type { JournalOut } from "@/lib/types";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

async function getJournals(): Promise<JournalOut[]> {
  try {
    const res = await fetch(`${API_URL}/journals`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as JournalOut[];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Journals" };

export default async function JournalsPage() {
  const journals = await getJournals();
  const locale = await getServerLocale();
  const es = locale === "es";

  return (
    <>
      <PageHeader
        kicker="Publishing"
        title={es ? "Revistas" : "Journals"}
        subtitle={
          es
            ? "Revistas revisadas por pares lideradas por la comunidad científica del Caribe, todas de acceso abierto."
            : "Peer-reviewed journals led by the Caribbean scientific community, all open access."
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-12">
        {journals.length === 0 ? (
          <EmptyState title={es ? "No hay revistas disponibles" : "No journals available"} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {journals.map((j) => (
              <Card key={j.id} className="group flex flex-col p-6 transition-colors hover:border-gray-300 dark:hover:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                    <Link href={`/journals/${j.slug}`}>{j.title}</Link>
                  </h2>
                  {j.open_access && <Badge tone="oa">{es ? "Acceso abierto" : "Open access"}</Badge>}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
                  {j.description}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {j.scope.slice(0, 6).map((s) => (
                    <Badge key={s} tone="gray">{s}</Badge>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3.5 text-xs text-mut dark:border-gray-800 dark:text-gray-400">
                  <span>
                    ISSN {j.issn} {j.eissn ? `· eISSN ${j.eissn}` : ""}
                  </span>
                  <span className="font-medium text-ink dark:text-gray-200">{j.publisher}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-mut dark:text-gray-500">
                  <span>{j.license}</span>
                  <span>{j.apc}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}