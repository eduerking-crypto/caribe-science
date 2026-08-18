"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLocale, useAuth } from "@/components/providers";
import { LangSwitch } from "@/components/LangSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBarRow } from "@/components/SearchBarRow";

const NAV_LINKS = [
  { href: "/journals", key: "nav.journals" },
  { href: "/articles", key: "nav.articles" },
  { href: "/editorial", key: "nav.editorial" },
  { href: "/researchers", key: "nav.researchers" },
  { href: "/datasets", key: "nav.datasets" },
  { href: "/protocols", key: "nav.protocols" },
] as const;

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex items-center gap-2 ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="size-2 bg-coral-500" />
      <span className="font-display text-[19px] font-bold leading-none tracking-tight text-current">
        CARIBE SCIENCE
      </span>
    </span>
  );
}

const navLinkCls = (active: boolean) =>
  `border-b-2 px-1 pb-2.5 pt-1 text-[13.5px] font-semibold tracking-wide transition-colors ${
    active
      ? "border-navy-900 text-navy-900 dark:border-white dark:text-white"
      : "border-transparent text-gray-600 hover:border-reef-400 hover:text-reef-700 dark:text-gray-300 dark:hover:text-gray-100"
  }`;

export default function Navbar() {
  const { dict } = useLocale();
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Franja editorial superior */}
      <div className="h-[3px] bg-navy-950" />

      {/* Barra utilitaria */}
      <div className="bg-navy-900 text-gray-300">
        <div className="mx-auto flex h-8 max-w-6xl items-center justify-between gap-4 px-6 text-[11px]">
          <p className="truncate">
            <span className="font-mono font-medium text-white/90">
              ISSN 2736-XXXX (Online)
            </span>
            <span className="mx-2 text-white/30">|</span>
            <span className="hidden sm:inline">{dict["footer.oa_policy_short"] ?? "Open access · Peer-reviewed"}</span>
          </p>
          <nav className="flex items-center gap-4" aria-label="Utility">
            <Link href="/journals" className="transition-colors hover:text-white">
              {dict["nav.journals"]}
            </Link>
            <Link href="/articles" className="transition-colors hover:text-white">
              {dict["nav.articles"]}
            </Link>
            <Link href="/privacy" className="hidden transition-colors hover:text-white sm:inline">
              {dict["footer.legal.privacy"]}
            </Link>
            <span className="hidden sm:inline">
              <ThemeToggle />
            </span>
          </nav>
        </div>
      </div>

      {/* Masthead: palabra de marca + búsqueda */}
      <div className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href="/" onClick={() => setOpen(false)} className="inline-flex items-baseline gap-2">
            <span className="font-display text-[26px] font-bold leading-none tracking-tight text-navy-900 dark:text-white">
              CARIBE<span className="text-reef-700 dark:text-reef-300"> SCIENCE</span>
            </span>
            <span className="hidden font-display text-[13px] italic text-mut md:inline">
              {dict["footer.tagline"]}
            </span>
          </Link>
        </div>
        <div className="hidden border-t border-gray-200 md:block dark:border-gray-800">
          <SearchBarRow />
        </div>
      </div>

      {/* Navegación principal */}
      <div className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-6">
          <nav className="hidden items-center gap-5 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={navLinkCls(active)}>
                  {dict[link.key]}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <LangSwitch />
            {user ? (
              <Link
                href="/dashboard"
                className="text-[13px] font-semibold text-gray-600 transition-colors hover:text-navy-900 dark:text-gray-300 dark:hover:text-white"
              >
                {dict["nav.dashboard"]} · {user.full_name.split(" ")[0]}
              </Link>
            ) : (
              <Link
                href="/login"
                className="border border-gray-300 px-3.5 py-1.5 text-[13px] font-semibold text-navy-900 transition-colors hover:border-navy-900 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-400 dark:hover:bg-gray-800"
              >
                {dict["nav.signin"]}
              </Link>
            )}
            <Link
              href="/submit"
              className="bg-navy-900 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800 dark:bg-white dark:text-navy-900 dark:hover:bg-gray-200"
            >
              {dict["nav.submit"]}
            </Link>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <LangSwitch />
            <ThemeToggle />
            <button
              className="inline-flex size-9 items-center justify-center rounded-[2px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={dict["nav.menu"]}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-gray-200 px-6 py-3 md:hidden dark:border-gray-800">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-[2px] px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {dict[link.key]}
                </Link>
              ))}
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="rounded-[2px] px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {dict["nav.search"]}
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-[2px] px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {dict["nav.dashboard"]}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-[2px] px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {dict["nav.signin"]}
                </Link>
              )}
              <Link
                href="/submit"
                onClick={() => setOpen(false)}
                className="mt-1 bg-navy-900 px-3 py-2 text-center text-sm font-semibold text-white dark:bg-white dark:text-navy-900"
              >
                {dict["nav.submit"]}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
