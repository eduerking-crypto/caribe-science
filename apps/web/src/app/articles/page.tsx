import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import { getServerLocale } from "@/lib/dicts";
import type { ArticleOut } from "@/lib/types";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles",
  description: "Open access research from the Caribbean.",
};

export default async function ArticlesPage() {
  const locale = await getServerLocale();
  let articles: ArticleOut[] = [];
  try {
    const res = await fetch(`${API_URL}/articles`, { cache: "no-store" });
    if (res.ok) articles = (await res.json()) as ArticleOut[];
  } catch {
    articles = [];
  }

  return (
    <>
      <PageHeader
        kicker="Research"
        title="Articles"
        subtitle="The latest open access research from the Caribbean and beyond."
      />
      <section className="mx-auto max-w-6xl px-6 py-14">
        {articles.length === 0 ? (
          <EmptyState title="No articles available" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}