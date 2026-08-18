"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers";
import type { ArticleOut, JournalOut } from "@/lib/types";

export function JournalSideNav({
  journal,
  articles,
}: {
  journal: JournalOut;
  articles: ArticleOut[];
}) {
  const { dict, locale } = useLocale();
  const isEs = locale === "es";
  const top = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);
  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://caribescience.org/journals/${journal.slug}`;
  const share = (net: "x" | "fb" | "li") => {
    const u = encodeURIComponent(pageUrl);
    const t = encodeURIComponent(journal.title);
    if (net === "x") return `https://x.com/intent/tweet?text=${t}&url=${u}`;
    if (net === "fb") return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  };

  const menu = [
    { href: `/journals/${journal.slug}`, key: "journal.menu.home" },
    { href: `/journals/${journal.slug}#aims`, key: "journal.menu.aims" },
    { href: `/journals/${journal.slug}#board`, key: "journal.menu.board" },
    { href: `/journals/${journal.slug}#special_issues`, key: "journal.special_issues" },
    { href: "/submit", key: "journal.menu.instructions" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-reef-500 to-ocean-600 font-display text-[15px] font-bold text-white">
            {journal.title
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <span className="font-display text-[15px] font-semibold italic leading-tight text-ink dark:text-gray-100">
            {isEs && journal.title_es ? journal.title_es : journal.title}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/submit"
            className="block rounded-md bg-reef-600 px-3.5 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-reef-700 dark:bg-reef-500 dark:hover:bg-reef-400"
          >
            {dict["journal.submit_to"].replace("{name}", journal.title)}
          </Link>
          <Link
            href="/login"
            className="block rounded-md border border-gray-300 px-3.5 py-2 text-center text-sm font-medium text-ink transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800"
          >
            {dict["journal.review_for"].replace("{name}", journal.title)}
          </Link>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
          {dict["journal.share"]}
        </p>
        <div className="mt-2 flex gap-1.5">
          <a
            href={share("x")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X"
            className="flex size-8 items-center justify-center rounded-md border border-gray-200 text-[13px] font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-ink dark:border-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            𝕏
          </a>
          <a
            href={share("fb")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="flex size-8 items-center justify-center rounded-md border border-gray-200 text-[13px] font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-ink dark:border-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            f
          </a>
          <a
            href={share("li")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on LinkedIn"
            className="flex size-8 items-center justify-center rounded-md border border-gray-200 text-[13px] font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-ink dark:border-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            in
          </a>
        </div>
      </div>

      <nav className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]" aria-label={dict["journal.menu"]}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
          {dict["journal.menu"]}
        </p>
        <ul className="mt-3 space-y-1">
          {menu.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="block rounded-md px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                {dict[m.key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {top.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111a22]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-mut dark:text-gray-500">
            {dict["journal.highly_accessed"]}
          </p>
          <ul className="mt-3 space-y-3">
            {top.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/articles/${a.slug}`}
                  className="group block text-sm"
                >
                  <span className="line-clamp-2 font-medium text-ink group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                    {isEs && a.title_es ? a.title_es : a.title}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-xs text-mut dark:text-gray-400">
                    {(a.authors ?? []).slice(0, 3).map((x) => x.name).join(", ")}
                    {a.publication_date
                      ? ` · ${new Date(a.publication_date).toLocaleDateString(isEs ? "es-ES" : "en-US", { year: "numeric", month: "short" })}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}