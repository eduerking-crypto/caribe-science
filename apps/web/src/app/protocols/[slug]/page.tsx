import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";
import type { ProtocolOut } from "@/lib/types";
import { getServerLocale, t } from "@/lib/dicts";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Breadcrumb } from "@/components/Breadcrumb";

async function getProtocol(slug: string): Promise<ProtocolOut | null> {
  try {
    const res = await fetch(`${API_URL}/protocols/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ProtocolOut;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = await getProtocol((await params).slug);
  return { title: p?.title ?? "Protocol" };
}

export default async function ProtocolPage({ params }: { params: Promise<{ slug: string }> }) {
  const protocol = await getProtocol((await params).slug);
  if (!protocol) notFound();
  const locale = await getServerLocale();
  const dict = (key: string) => t(locale, key);

  return (
    <>
      <div className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0c131a]">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Breadcrumb
            items={[{ label: dict("nav.protocols"), href: "/protocols" }, { label: protocol.title }]}
          />
        </div>
      </div>
      <PageHeader
        kicker={protocol.category ? `Protocol · ${protocol.category}` : "Protocol"}
        title={protocol.title}
      />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Card className="p-8">
          {protocol.authors && protocol.authors.length > 0 && (
            <p className="mb-6 text-sm text-ocean-500 dark:text-ocean-400">
              <strong className="text-ocean-800 dark:text-ocean-100">Authors:</strong>{" "}
              {protocol.authors
                .map((a) => {
                  if (typeof a === "string") return a;
                  if (a && typeof a === "object" && "name" in a) return String((a as { name: unknown }).name);
                  return "";
                })
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ocean-800 dark:text-ocean-100">
            {protocol.description}
          </p>
        </Card>
      </section>
    </>
  );
}