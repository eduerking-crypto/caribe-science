import Link from "next/link";
import { fmtDate, fmtNumber } from "@/lib/api";
import type { ArticleOut } from "@/lib/types";
import { Badge } from "@/components/ui";
import { ARTICLE_TONE } from "@/lib/article-meta";
import { dicts } from "@/lib/dicts";

export function ArticleCard({
  article,
  locale = "en",
  openAccess = false,
}: {
  article: ArticleOut;
  locale?: string;
  openAccess?: boolean;
}) {
  const isEs = locale === "es";
  const d = dicts[locale === "es" ? "es" : "en"];
  const title = isEs && article.title_es ? article.title_es : article.title;
  const authors = article.authors ?? [];
  const authorList =
    authors.length > 5
      ? `${authors.slice(0, 5).map((a) => a.name).join(", ")} et al.`
      : authors.map((a) => a.name).join(", ");
  const year = article.publication_date
    ? new Date(article.publication_date).getFullYear()
    : null;
  return (
    <article className="group flex h-full flex-col rounded-[2px] border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#121b2b] dark:hover:border-gray-700">
      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]">
        {article.section_label && <Badge tone="gray">{article.section_label}</Badge>}
        {openAccess && <Badge tone="oa">{d["article.open_access_badge"]}</Badge>}
        <Badge tone={ARTICLE_TONE[article.article_type] ?? "gray"}>
          {d[`search.field.type.${article.article_type}`] ?? article.article_type}
        </Badge>
        {article.doi && <Badge tone="ocean">DOI</Badge>}
      </div>
      <h3 className="font-display mt-2.5 leading-snug text-[17px] font-semibold text-navy-900 group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
        <Link href={`/articles/${article.slug}`}>{title}</Link>
      </h3>
      <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-[#444a50] dark:text-gray-300">
        {authorList}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-mut dark:text-gray-400">
        <em className="font-normal text-[#3a4046] dark:text-gray-300">
          {article.journal?.title ?? d["journal.info"]}
        </em>{" "}
        <strong className="font-semibold text-navy-900 dark:text-gray-200">{year ?? "—"}</strong>
        {article.doi ? <span className="font-mono text-[11px]">{`, ${article.doi}`}</span> : ""}
        {" · "}
        {fmtDate(article.publication_date)}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
        {article.abstract}
      </p>
      {article.section_label && (
        <p className="mt-2 text-xs italic text-mut dark:text-gray-500">
          {d["article.belongs_section"].replace("{section}", article.section_label)}
        </p>
      )}
      <div className="mt-3 flex items-center gap-5 border-t border-gray-100 pt-3 font-mono text-[11px] text-mut dark:border-gray-800 dark:text-gray-400">
        <span title="Views">
          {fmtNumber(article.views)} {isEs ? "vistas" : "views"}
        </span>
        <span title="Citations">{fmtNumber(article.citations)} {isEs ? "citas" : "citations"}</span>
        <span className="ml-auto font-sans text-[12px] font-semibold text-reef-700 group-hover:underline dark:text-reef-300">
          {isEs ? "Leer más" : "Read more"} →
        </span>
      </div>
    </article>
  );
}