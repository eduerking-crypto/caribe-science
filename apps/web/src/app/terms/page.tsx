import type { Metadata } from "next";
import { getServerLocale, t } from "@/lib/dicts";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default async function TermsPage() {
  const locale = await getServerLocale();
  const dict = (key: string) => t(locale, key);
  return (
    <>
      <PageHeader kicker="Legal" title={dict("legal.terms.title")} />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-6 rounded-md border border-gray-200 bg-white p-8 text-[15px] leading-relaxed text-[#3a4046] dark:border-gray-800 dark:bg-[#111a22] dark:text-gray-300">
          {[1, 2, 3].map((n) => (
            <p key={n}>{dict(`legal.terms.p${n}`)}</p>
          ))}
        </div>
        <p className="mt-6 text-xs text-mut dark:text-gray-500">
          CC BY 4.0 · CARIBE SCIENCE — {new Date().getFullYear()}
        </p>
      </section>
    </>
  );
}