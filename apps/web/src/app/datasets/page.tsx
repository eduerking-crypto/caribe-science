import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { getServerLocale } from "@/lib/dicts";
import type { DatasetOut } from "@/lib/types";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Datasets",
  description: "Open research datasets from the Caribbean.",
};

function authorsLabel(authors: unknown[]): string {
  if (!authors || authors.length === 0) return "";
  const names = authors
    .map((a) => {
      if (typeof a === "string") return a;
      if (a && typeof a === "object" && "name" in a) return String((a as { name: unknown }).name);
      return "";
    })
    .filter(Boolean);
  return names.join(", ");
}

export default async function DatasetsPage() {
  const locale = await getServerLocale();
  let datasets: DatasetOut[] = [];
  try {
    const res = await fetch(`${API_URL}/datasets`, { cache: "no-store" });
    if (res.ok) datasets = (await res.json()) as DatasetOut[];
  } catch {
    datasets = [];
  }

  return (
    <>
      <PageHeader
        kicker="Open data"
        title="Datasets"
        subtitle="Reusable research data supporting the region's published work."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        {datasets.length === 0 ? (
          <EmptyState title="No datasets published yet" />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {datasets.map((d) => (
              <Link
                key={d.id}
                href={`/datasets/${d.slug}`}
                className="group rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#111a22] dark:hover:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Badge tone="gray">{d.format}</Badge>
                  <span className="text-xs text-mut dark:text-gray-500">v{d.version}</span>
                </div>
                <h2 className="font-display mt-2.5 text-lg font-semibold text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                  {d.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-[#3a4046] dark:text-gray-300">{d.description}</p>
                <div className="mt-3.5 flex items-center justify-between text-xs text-mut dark:text-gray-400">
                  <span className="truncate">{authorsLabel(d.authors)}</span>
                  <span className="shrink-0">{d.file_size}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}