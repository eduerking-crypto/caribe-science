import Link from "next/link";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-reef-600 dark:text-reef-300">
        Error 404
      </p>
      <h1 className="font-display mt-3 text-5xl font-semibold text-ink dark:text-white">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mut dark:text-gray-400">
        The page you are looking for may have been moved or no longer exists. Let&apos;s get you back
        to the research.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">Back to home</LinkButton>
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-7 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#141c24] dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Search the journal
        </Link>
      </div>
    </section>
  );
}