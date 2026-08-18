import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { getServerLocale } from "@/lib/dicts";
import type { ProtocolOut } from "@/lib/types";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Protocols",
  description: "Reproducible research protocols from the Caribbean.",
};

export default async function ProtocolsPage() {
  const locale = await getServerLocale();
  let protocols: ProtocolOut[] = [];
  try {
    const res = await fetch(`${API_URL}/protocols`, { cache: "no-store" });
    if (res.ok) protocols = (await res.json()) as ProtocolOut[];
  } catch {
    protocols = [];
  }

  const categories = Array.from(new Set(protocols.map((p) => p.category).filter(Boolean)));

  return (
    <>
      <PageHeader
        kicker="Methods"
        title="Protocols"
        subtitle="Reproducible methods and standard operating procedures."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        {protocols.length === 0 ? (
          <EmptyState title="No protocols published yet" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c} tone="gray">{c}</Badge>
              ))}
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {protocols.map((p) => (
                <Link
                  key={p.id}
                  href={`/protocols/${p.slug}`}
                  className="group rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#111a22] dark:hover:border-gray-700"
                >
                  {p.category && <Badge tone="gray">{p.category}</Badge>}
                  <h2 className="font-display mt-2.5 text-lg font-semibold leading-snug text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                    {p.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-[#3a4046] dark:text-gray-300">{p.description}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}