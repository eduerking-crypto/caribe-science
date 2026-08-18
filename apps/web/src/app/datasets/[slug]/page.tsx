import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_URL, fileUrl } from "@/lib/api";
import type { DatasetOut } from "@/lib/types";
import { getServerLocale, t } from "@/lib/dicts";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Breadcrumb } from "@/components/Breadcrumb";

async function getDataset(slug: string): Promise<DatasetOut | null> {
  try {
    const res = await fetch(`${API_URL}/datasets/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as DatasetOut;
  } catch {
    return null;
  }
}

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

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const d = await getDataset((await params).slug);
  return { title: d?.title ?? "Dataset" };
}

export default async function DatasetPage({ params }: { params: Promise<{ slug: string }> }) {
  const dataset = await getDataset((await params).slug);
  if (!dataset) notFound();
  const locale = await getServerLocale();
  const dict = (key: string) => t(locale, key);

  return (
    <>
      <div className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0c131a]">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Breadcrumb
            items={[{ label: dict("nav.datasets"), href: "/datasets" }, { label: dataset.title }]}
          />
        </div>
      </div>
      <PageHeader kicker="Dataset" title={dataset.title} subtitle={dataset.description} />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink dark:text-gray-100">
                {dataset.description}
              </p>
              {authorsLabel(dataset.authors) && (
                <p className="mt-4 text-sm text-mut dark:text-gray-400">
                  <strong className="text-ink dark:text-gray-100">Authors:</strong> {authorsLabel(dataset.authors)}
                </p>
              )}
            </Card>

            <div className="flex flex-wrap gap-3">
              <a
                href={dataset.repository_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-reef-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-reef-700 dark:bg-reef-500 dark:text-white dark:hover:bg-reef-400"
              >
                Visit repository
              </a>
              {dataset.file_name && (
                <a
                  href={fileUrl("dataset", dataset.file_name)}
                  download
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#141c24] dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Download data
                </a>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
                Metadata
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-mut dark:text-gray-400">License</dt><dd className="font-medium text-ink dark:text-gray-100">{dataset.license}</dd></div>
                <div><dt className="text-mut dark:text-gray-400">Version</dt><dd className="font-medium text-ink dark:text-gray-100">{dataset.version}</dd></div>
                <div><dt className="text-mut dark:text-gray-400">Format</dt><dd className="font-medium text-ink dark:text-gray-100">{dataset.format}</dd></div>
                <div><dt className="text-mut dark:text-gray-400">File</dt><dd className="truncate font-medium text-ink dark:text-gray-100">{dataset.file_name ?? "—"} <span className="text-mut">({dataset.file_size})</span></dd></div>
                {dataset.doi && (
                  <div><dt className="text-mut dark:text-gray-400">DOI</dt><dd className="font-medium text-reef-600 dark:text-reef-300">{dataset.doi}</dd></div>
                )}
              </dl>
            </Card>
            <Badge tone="reef">Open access</Badge>
          </aside>
        </div>
      </section>
    </>
  );
}