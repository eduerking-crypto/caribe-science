import Link from "next/link";
import { lazy, Suspense } from "react";
import { getServerLocale, t } from "@/lib/dicts";
import { API_URL } from "@/lib/api";
import type { ArticleOut, DatasetOut, JournalOut, MetricsOut, ResearcherOut } from "@/lib/types";
import { ArticleCard } from "@/components/ArticleCard";
import { Badge, Card, LinkButton, SectionTitle } from "@/components/ui";
import SafeImage from "@/components/SafeImage";

const MapCaribe = lazy(() => import("@/components/MapCaribe"));

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getServerLocale();
  const dict = (key: string) => t(locale, key);
  const isEs = locale === "es";

  const [articles, journals, researchers, datasets, metrics] = await Promise.all([
    fetchJson<ArticleOut[]>("/articles"),
    fetchJson<JournalOut[]>("/journals"),
    fetchJson<ResearcherOut[]>("/researchers"),
    fetchJson<DatasetOut[]>("/datasets"),
    fetchJson<MetricsOut>("/metrics"),
  ]);

  const all = articles ?? [];
  const featured = all[0] ?? null;
  const latest = all.slice(1, 7);
  const stats = [
    { label: dict("home.stats.articles"), value: metrics?.articles ?? articles?.length ?? 0 },
    { label: dict("home.stats.researchers"), value: metrics?.researchers ?? researchers?.length ?? 0 },
    { label: dict("home.stats.institutions"), value: metrics?.institutions ?? 0 },
    { label: dict("home.stats.journals"), value: metrics?.journals ?? journals?.length ?? 0 },
    { label: dict("home.stats.datasets"), value: metrics?.datasets ?? datasets?.length ?? 0 },
    { label: dict("home.stats.countries"), value: metrics?.countries ?? 0 },
  ];

  const articleMeta = (a: ArticleOut) => {
    const authors = a.authors ?? [];
    const names =
      authors.length > 5
        ? `${authors.slice(0, 5).map((x) => x.name).join(", ")} et al.`
        : authors.map((x) => x.name).join(", ");
    const year = a.publication_date ? new Date(a.publication_date).getFullYear() : null;
    return { names, year };
  };

  return (
    <>
      {/* LEAD EDITORIAL */}
      <section className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1.55fr_1fr] lg:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-600 dark:text-coral-400">
              {dict("home.hero_kicker")}
            </p>
            <h1 className="font-display mt-3 max-w-2xl text-[2.35rem] font-bold leading-[1.1] tracking-tight text-navy-900 sm:text-[2.9rem] dark:text-white">
              {dict("home.hero_title")}
            </h1>
            <p className="mt-5 max-w-xl leading-relaxed text-mut dark:text-gray-400">
              {dict("home.hero_subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/submit" size="md">
                {dict("home.hero_cta_submit")}
              </LinkButton>
              <LinkButton href="/articles" variant="secondary" size="md">
                {dict("home.hero_cta_read")}
              </LinkButton>
            </div>
            {metrics && (
              <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-gray-200 pt-7 sm:grid-cols-3 dark:border-gray-800">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dd className="font-display text-[1.7rem] font-semibold leading-none text-navy-900 dark:text-white">
                      {s.value.toLocaleString(isEs ? "es-ES" : "en-US")}
                    </dd>
                    <dt className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mut dark:text-gray-500">
                      {s.label}
                    </dt>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* RAIL INSTITUCIONAL */}
          <aside className="flex flex-col gap-6">
            <div className="relative overflow-hidden border-l-4 border-coral-500 bg-navy-950 p-7">
              <SafeImage
                src="https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200&q=80"
                alt=""
                ariaHidden
                className="absolute inset-0 size-full object-cover opacity-45 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/75 to-navy-950/20" />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-300">
                  {isEs ? "Cómo publicar" : "Publish with us"}
                </p>
                <h2 className="font-display mt-2.5 text-[1.45rem] font-semibold leading-snug text-white">
                  {dict("home.cta.title")}
                </h2>
                <p className="mt-3 font-display text-[13.5px] italic leading-relaxed text-ocean-200">
                  {dict("home.integrity.body")}
                </p>
                <div className="mt-6">
                  <LinkButton href="/submit" className="!bg-white !text-navy-900 hover:!bg-gray-200">
                    {dict("home.hero_cta_submit")} →
                  </LinkButton>
                </div>
              </div>
            </div>
            <Card className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
                {isEs ? "Información de la revista" : "Journal information"}
              </p>
              <p className="mt-3 border-b border-gray-100 pb-3 font-display text-[16px] font-semibold leading-snug text-ink dark:border-gray-800 dark:text-gray-100">
                {journals?.[0]?.title ?? "CARIBE Journal of Biological Sciences"}
              </p>
              <dl className="mt-3 space-y-2.5 text-[12.5px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-mut dark:text-gray-400">{isEs ? "Publicada por" : "Published by"}</dt>
                  <dd className="font-semibold text-navy-900 dark:text-gray-200">CARIBE SCIENCE</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-mut dark:text-gray-400">ISSN {journals?.[0]?.eissn ? "(Online)" : ""}</dt>
                  <dd className="font-mono text-[11.5px] text-navy-900 dark:text-gray-200">
                    {journals?.[0]?.eissn ?? "2850-0001"}
                  </dd>
                </div>
                {journals?.[0]?.open_access && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-mut dark:text-gray-400">{isEs ? "Acceso" : "Access"}</dt>
                    <dd className="text-reef-700 dark:text-reef-300">
                      <span className="rounded-[2px] border border-coral-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-coral-600 dark:text-coral-400">
                        Open access
                      </span>
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-mut dark:text-gray-400">License</dt>
                  <dd className="font-semibold text-navy-900 dark:text-gray-200">
                    {journals?.[0]?.license ?? "CC BY 4.0"}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mut dark:text-gray-500">
                  {isEs ? "Ejes temáticos" : "Focus areas"}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(journals?.[0]?.scope ?? ["Chronic Disease Epidemiology", "Cardiometabolic Genetics", "Nutrition", "Microbiome", "Lung Function & COPD"]).slice(0, 6).map((s) => (
                    <Badge key={s} tone="gray">{s}</Badge>
                  ))}
                </div>
              </div>
              <Link
                href="/journals"
                className="mt-4 inline-block text-[13px] font-semibold text-reef-700 hover:underline dark:text-reef-300"
              >
                {dict("nav.journals")} →
              </Link>
            </Card>
          </aside>
        </div>
      </section>

      {/* REVISTAS — LISTADO EDITORIAL */}
      <section className="border-b border-gray-200 bg-paper-dim dark:border-gray-800 dark:bg-[#0a111f]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle kicker="Publishing" title={dict("home.journals.title")} subtitle={dict("home.journals.subtitle")} />
            <Link href="/journals" className="text-[13px] font-semibold text-reef-700 hover:underline dark:text-reef-300">
              {dict("common.view_all")} →
            </Link>
          </div>
          <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {(journals ?? []).slice(0, 3).map((j) => (
              <div key={j.id} className="group grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
                <div className="min-w-0">
                  <h3 className="font-display text-[1.2rem] font-semibold leading-snug text-navy-900 group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                    <Link href={`/journals/${j.slug}`}>{j.title}</Link>
                  </h3>
                  <p className="mt-1.5 line-clamp-2 max-w-3xl text-[13.5px] leading-relaxed text-[#3a4046] dark:text-gray-300">
                    {j.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {j.scope.slice(0, 4).map((s) => (
                      <Badge key={s} tone="gray">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:flex-col md:items-end md:gap-2">
                  {j.open_access && (
                    <Badge tone="oa">{dict("common.open_access")}</Badge>
                  )}
                  <p className="font-mono text-[11.5px] text-mut dark:text-gray-400">
                    ISSN {j.issn}
                  </p>
                  <p className="text-xs font-semibold text-navy-900 dark:text-gray-200">{j.publisher}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARTÍCULO DESTACADO — FEATURE */}
      {featured && (
        <section className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
              <a
                href={`/articles/${featured.slug}`}
                className="block overflow-hidden rounded-[2px] border border-gray-200 bg-paper-dim dark:border-gray-800 dark:bg-[#121b2b]"
              >
                <SafeImage
                  src="https://images.unsplash.com/photo-1763442363212-ac4e39b9b91e?w=960&q=80"
                  alt={isEs ? "Bosque de manglar en el Caribe" : "Mangrove forest in the Caribbean"}
                  className="aspect-[4/3] w-full object-cover"
                />
                <p className="border-t border-gray-200 px-3 py-1.5 text-[10.5px] text-mut dark:border-gray-800 dark:text-gray-500">
                  {isEs
                    ? "Manglares del Caribe. Foto: Unsplash / 1763442363212"
                    : "Caribbean mangroves. Photo: Unsplash / 1763442363212"}
                </p>
              </a>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
                  {isEs ? "Investigación destacada" : "Featured research"}
                </p>
                <h2 className="font-display mt-2.5 text-[1.65rem] font-semibold leading-[1.18] text-navy-900 dark:text-gray-100">
                  <a href={`/articles/${featured.slug}`} className="hover:text-reef-700 dark:hover:text-reef-300">
                    {isEs && featured.title_es ? featured.title_es : featured.title}
                  </a>
                </h2>
                <p className="mt-2 text-[13.5px] font-semibold text-[#444a50] dark:text-gray-300">
                  {articleMeta(featured).names}
                </p>
                <p className="mt-3 line-clamp-4 max-w-xl text-sm leading-relaxed text-[#3a4046] dark:text-gray-300">
                  {featured.abstract}
                </p>
                <p className="mt-4 text-xs text-mut dark:text-gray-400">
                  <em className="font-normal text-[#3a4046] dark:text-gray-300">
                    {featured.journal?.title ?? ""}
                  </em>
                  <strong className="mx-1.5 font-semibold text-navy-900 dark:text-gray-200">
                    {articleMeta(featured).year ?? "—"}
                  </strong>
                  {featured.doi && <span className="font-mono text-[11px]">{featured.doi}</span>}
                </p>
                <a
                  href={`/articles/${featured.slug}`}
                  className="mt-5 inline-block text-[13px] font-semibold text-reef-700 hover:underline dark:text-reef-300"
                >
                  {isEs ? "Leer el artículo" : "Read the article"} →
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DESDE EL EDITOR — FROM THE EDITOR */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-paper-dim dark:border-gray-800 dark:bg-[#0a111f]">
        <SafeImage
          src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1400&q=80"
          alt=""
          ariaHidden
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-[0.08] mix-blend-luminosity dark:opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-paper-dim via-paper-dim/80 to-transparent dark:from-[#0a111f] dark:via-[#0a111f]/80 dark:to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
                {isEs ? "Desde el Editor" : "From the Editor"}
              </p>
              <blockquote className="mt-4 max-w-3xl">
                <p className="font-display text-[1.35rem] font-semibold leading-[1.35] text-navy-900 sm:text-[1.55rem] dark:text-gray-100">
                  "
                  {isEs
                    ? "La epidemia de enfermedades crónicas en poblaciones admixed del Caribe exige entender la fisiopatología compartida entre el corazón, el pulmón y el metabolismo — eso es lo que CaReS investigará durante una década."
                    : "The epidemic of chronic disease in admixed Caribbean populations demands understanding the shared pathophysiology of heart, lung and metabolism — that is what CaReS will investigate over a decade."}
                  "
                </p>
              </blockquote>
            </div>
            <div className="flex items-center gap-4 border-l-2 border-gray-200 pl-6 dark:border-gray-800">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-[2px] bg-navy-900 font-display text-lg font-bold text-white dark:bg-white dark:text-navy-900"
                aria-hidden="true"
              >
                GM
              </span>
              <div>
                <p className="font-display text-[15px] font-semibold text-navy-900 dark:text-gray-100">
                  Gustavo José Mora-García
                </p>
                <p className="mt-0.5 text-xs leading-snug text-mut dark:text-gray-400">
                  MD, PhD · {isEs ? "Editor en Jefe" : "Editor-in-Chief"}
                  <br />
                  <span className="italic">
                    {isEs ? "Universidad de Cartagena" : "Universidad de Cartagena"}
                  </span>
                </p>
                <Link
                  href="/editorial"
                  className="mt-2 inline-block text-[13px] font-semibold text-reef-700 hover:underline dark:text-reef-300"
                >
                  {isEs ? "Conocer al editor" : "Meet the editor"} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARTÍCULOS RECIENTES — LISTADO DENSO */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle kicker="Research" title={dict("home.latest.title")} subtitle={dict("home.latest.subtitle")} />
          <Link href="/articles" className="text-[13px] font-semibold text-reef-700 hover:underline dark:text-reef-300">
            {dict("common.view_all")} →
          </Link>
        </div>
        <div className="mt-8 grid gap-x-12 gap-y-0 lg:grid-cols-2">
          {latest.map((a, i) => {
            const { names, year } = articleMeta(a);
            const title = isEs && a.title_es ? a.title_es : a.title;
            return (
              <article
                key={a.id}
                className={`py-6 ${i > 0 ? "border-t border-gray-200 dark:border-gray-800" : ""} ${i >= 2 ? "lg:border-t lg:border-gray-200 lg:dark:border-gray-800" : ""}`}
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mut dark:text-gray-500">
                  {a.article_type.replace("_", " ")}
                </p>
                <h3 className="font-display mt-2 text-[17.5px] font-bold leading-snug text-navy-900 hover:text-reef-700 dark:text-gray-100 dark:hover:text-reef-300">
                  <Link href={`/articles/${a.slug}`}>{title}</Link>
                </h3>
                <p className="mt-1.5 text-[13px] font-medium text-[#444a50] dark:text-gray-300">{names}</p>
                <p className="mt-1.5 text-xs text-mut dark:text-gray-400">
                  <em className="font-normal text-[#3a4046] dark:text-gray-300">{a.journal?.title ?? ""}</em>
                  <strong className="mx-1.5 font-semibold text-navy-900 dark:text-gray-200">{year ?? "—"}</strong>
                  {a.doi && <span className="font-mono text-[11px]">{a.doi}</span>}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* RED DEL CARIBE */}
      <section className="border-y border-gray-200 bg-paper-dim dark:border-gray-800 dark:bg-[#0a111f]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-2">
          <div>
            <SectionTitle kicker="Network" title={dict("home.caribbean.title")} />
            <p className="mt-4 leading-relaxed text-mut dark:text-gray-400">{dict("home.caribbean.body")}</p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-[#3a4046] sm:grid-cols-3 dark:text-gray-300">
              {["Cuba", "Jamaica", "Hispaniola", "Puerto Rico", "Trinidad & Tobago", "Costa Rica", "Colombia", "Venezuela", "Panamá"].map((c) => (
                <li key={c} className="flex items-center gap-2 border-b border-gray-200 py-1.5 dark:border-gray-800">
                  <span className="size-1 rounded-full bg-reef-600 dark:bg-reef-400" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <Suspense fallback={<div className="h-[360px] rounded-[2px] border border-gray-200 animate-pulse dark:border-gray-800" />}>
            <MapCaribe />
          </Suspense>
        </div>
      </section>

      {/* DATASETS + CTA */}
      <section className="mx-auto max-w-6xl px-6 py-14 pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <SectionTitle kicker="Open science" title={dict("home.datasets.title")} />
            <p className="mt-3 text-sm text-mut dark:text-gray-400">{dict("home.datasets.body")}</p>
            <div className="mt-5 divide-y divide-gray-100 border-y border-gray-100 dark:divide-gray-800 dark:border-gray-800">
              {(datasets ?? []).slice(0, 3).map((d) => (
                <Link key={d.id} href={`/datasets/${d.slug}`} className="group block py-3">
                  <p className="text-sm font-semibold text-navy-900 group-hover:text-reef-700 dark:text-gray-100 dark:group-hover:text-reef-300">
                    {d.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-mut dark:text-gray-400">
                    {d.format} · {d.file_size} · v{d.version}
                  </p>
                </Link>
              ))}
            </div>
            <Link href="/datasets" className="mt-5 inline-block text-[13px] font-semibold text-reef-700 hover:underline dark:text-reef-300">
              {dict("common.view_all")} →
            </Link>
          </Card>
          <div className="relative flex flex-col justify-between overflow-hidden bg-navy-950 p-7">
            <SafeImage
              src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80"
              alt=""
              ariaHidden
              className="absolute inset-0 size-full object-cover opacity-20 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-950/90 to-navy-950/70" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-300">
                {isEs ? "Investigadores" : "Researchers"}
              </p>
              <h2 className="font-display mt-2.5 text-[1.45rem] font-semibold leading-snug text-white">
                {dict("home.researchers.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ocean-300">{dict("home.researchers.subtitle")}</p>
              <ul className="mt-5 space-y-1.5 text-[13px]">
                {(researchers ?? []).slice(0, 4).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/researchers/${r.id}`}
                      className="flex items-center justify-between gap-3 border-b border-white/10 py-1.5 text-gray-200 transition-colors hover:text-white"
                    >
                      <span>{r.full_name}</span>
                      <span className="truncate font-mono text-[10.5px] text-gray-400">
                        {r.institution?.acronym ?? r.institution?.name ?? "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <LinkButton href="/researchers" className="!bg-white !text-navy-900 hover:!bg-gray-200">
                {dict("common.view_all")} →
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}