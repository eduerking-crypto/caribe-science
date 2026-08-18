"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers";
import type { JournalOut } from "@/lib/types";

export function Footer({ journal }: { journal?: JournalOut | null }) {
  const { dict } = useLocale();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
  };

  const further = [
    { href: "/editorial", label: dict["footer.further.editorial"] },
    { href: "/journals", label: dict["footer.further.apc"] },
    { href: "/journals", label: dict["footer.further.oa_policy"] },
    { href: "mailto:gmorag@unicartagena.edu.co", label: dict["footer.further.contact"] },
    { href: "/journals", label: dict["footer.further.libraries"] },
  ];
  const guides = [
    { href: "/submit", label: dict["footer.guides.authors"] },
    { href: "/login", label: dict["footer.guides.reviewers"] },
    { href: "/login", label: dict["footer.guides.editors"] },
    { href: "/researchers", label: dict["footer.guides.societies"] },
    { href: "/researchers", label: dict["footer.guides.institutions"] },
  ];
  const initiatives = [
    { href: "/journals", label: dict["nav.journals"] },
    { href: "/datasets", label: dict["nav.datasets"] },
    { href: "/protocols", label: dict["nav.protocols"] },
    { href: "/researchers", label: dict["nav.researchers"] },
    { href: "/search", label: dict["nav.search"] },
  ];
  const involved = [
    { href: "/submit", label: dict["footer.involved.submit"] },
    { href: "/login", label: dict["footer.involved.review"] },
    { href: "/submit", label: dict["footer.involved.dataset"] },
    { href: "/register", label: dict["footer.involved.register"] },
  ];
  const legal = [
    { href: "/terms", label: dict["footer.legal.disclaimer"] },
    { href: "/terms", label: dict["footer.legal.notice"] },
    { href: "/terms", label: dict["footer.legal.terms"] },
    { href: "/privacy", label: dict["footer.legal.privacy"] },
    { href: "/accessibility", label: dict["footer.legal.accessibility"] },
  ];

  const linkCls =
    "text-[13px] leading-relaxed text-gray-400 transition-colors hover:text-white";

  return (
    <footer className="mt-auto">
      {journal && (
        <div className="border-t border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3.5 text-xs text-mut dark:text-gray-400">
            <p>
              <em className="font-display font-semibold not-italic text-navy-900 dark:text-gray-200">
                {journal.title}
              </em>
              {journal.eissn ? `, ${dict["footer.eissn"]} ${journal.eissn}` : ""}
              {", "}
              {dict["footer.published_by"]} <span className="text-navy-900 dark:text-gray-200">CARIBE SCIENCE</span>
            </p>
            <p className="flex gap-4">
              <Link href="/articles" className="font-medium text-gray-500 hover:text-reef-700 dark:text-gray-400 dark:hover:text-reef-300">
                {dict["footer.rss"]}
              </Link>
              <Link href="/search" className="font-medium text-gray-500 hover:text-reef-700 dark:text-gray-400 dark:hover:text-reef-300">
                {dict["footer.content_alert"]}
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="bg-navy-950 text-gray-400">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              CARIBE<span className="text-reef-300"> SCIENCE</span>
            </span>
            <p className="mt-3.5 font-display text-[13px] italic leading-relaxed text-gray-500">
              {dict["footer.tagline"]}
            </p>
            {done ? (
              <p className="mt-4 rounded-[2px] bg-white/10 px-3 py-2 text-xs font-medium text-reef-300">
                {dict["footer.newsletter.done"]}
              </p>
            ) : (
              <form onSubmit={subscribe} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict["footer.newsletter.placeholder"]}
                  aria-label={dict["footer.newsletter.title"]}
                  className="h-9 min-w-0 flex-1 rounded-[2px] border border-white/15 bg-white/5 px-2.5 text-sm text-white placeholder:text-gray-500 focus:border-reef-400 focus:outline-none focus:ring-2 focus:ring-reef-400/30"
                />
                <button
                  type="submit"
                  className="h-9 shrink-0 cursor-pointer rounded-[2px] bg-reef-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-reef-500"
                >
                  {dict["footer.newsletter.subscribe"]}
                </button>
              </form>
            )}
          </div>

          <nav aria-label={dict["footer.further.title"]}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {dict["footer.further.title"]}
            </p>
            <ul className="mt-3.5 space-y-2">
              {further.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict["footer.guides.title"]}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {dict["footer.guides.title"]}
            </p>
            <ul className="mt-3.5 space-y-2">
              {guides.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict["footer.initiatives.title"]}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {dict["footer.initiatives.title"]}
            </p>
            <ul className="mt-3.5 space-y-2">
              {initiatives.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict["footer.involved.title"]}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {dict["footer.involved.title"]}
            </p>
            <ul className="mt-3.5 space-y-2">
              {involved.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/10 bg-[#040d1c]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 text-xs text-gray-500">
            <p>
              © {year} CARIBE SCIENCE · {dict["footer.by"]}
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {legal.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-gray-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
