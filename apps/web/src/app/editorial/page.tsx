import type { Metadata } from "next";
import { getServerLocale } from "@/lib/dicts";
import { Badge, Card, LinkButton, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "About the Editor",
  description:
    "Gustavo José Mora-García, MD, PhD — Editor-in-Chief of CARIBE Journal of Biological Sciences. Epidemiology of chronic diseases in admixed Caribbean populations.",
};

const EDUCATION = [
  { levelKey: "ug", years: "2004 – 2009", areaEn: "MD (Medicine)", areaEs: "Médico (Medicina)" },
  { levelKey: "phd", years: "2011 – 2016", areaEn: "PhD in Tropical Medicine", areaEs: "PhD en Medicina Tropical" },
  { levelKey: "postdoc", years: "2018 – 2019", areaEn: "Postdoctoral, International Health", areaEs: "Postdoctorado, International Health" },
];

const POSITIONS = [
  "pos1",
  "pos2",
  "pos3",
  "pos4",
  "pos5",
];

const RESEARCH_LINES = [
  "line1",
  "line2",
  "line3",
  "line4",
  "line5",
  "line6",
  "line7",
  "line8",
];

const PUBLICATIONS = [
  { year: 2026, venue: "Microorganisms", title: "Airway microbiome is associated with atherosclerosis in adults from Southern Caribbean" },
  { year: 2025, venue: "American Journal of Tropical Medicine and Hygiene", title: "Prevalence of subclinical carotid atherosclerosis — Results from the Cartagena Cohort Study" },
  { year: 2022, venue: "Annals of Epidemiology", title: "Ultra-processed food intake and lung function in US adults" },
  { year: 2022, venue: "Colombia Médica", title: "Interaction analysis of FTO and IRX3 genes with obesity traits" },
  { year: 2021, venue: "Nutrients", title: "Household food insecurity, lung function, and COPD in US adults" },
  { year: 2021, venue: "ERJ Open Research", title: "Lung function, COPD and the Alternative Healthy Eating Index in US adults" },
  { year: 2020, venue: "International Journal of Public Health", title: "Changes in diet quality over 10 years of nutrition transition in Colombia" },
  { year: 2018, venue: "Metabolic Syndrome and Related Disorders", title: "CAV1 gene variation, serum triglycerides and the metabolic syndrome" },
  { year: 2017, venue: "American Journal of Tropical Medicine and Hygiene", title: "Health indicators in two rural communities of the Colombian Caribbean coast" },
  { year: 2014, venue: "Salud Pública de México", title: "Anthropometric cut-off points for metabolic syndrome in women from Cartagena" },
  { year: 2012, venue: "Revista Española de Salud Pública", title: "Concordance between five definitions of the metabolic syndrome in Cartagena" },
];

const KEYWORDS = [
  "Obesity", "Type 2 Diabetes Mellitus", "Metabolic Syndrome", "Genetic Association Studies",
  "Nutrition Transition", "Diet Quality", "Ultra-processed Foods", "Food Insecurity",
  "Lung Function", "COPD", "Atherosclerosis", "Airway Microbiome",
  "Admixed Populations", "Public Health", "Tropical Medicine", "Caribbean", "Colombia",
];

export default async function EditorialPage() {
  const locale = await getServerLocale();
  const isEs = locale === "es";

  const tl = (k: string, es: string, en: string) => (isEs ? es : en);

  return (
    <>
      <section className="border-b border-gray-200 bg-paper dark:border-gray-800 dark:bg-[#0b1322]">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-600 dark:text-coral-400">
            {tl("k", "Comité editorial", "Editorial board")}
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-[2.2rem] font-bold leading-[1.12] tracking-tight text-navy-900 sm:text-[2.7rem] dark:text-white">
            {isEs ? "Gustavo José Mora-García" : "Gustavo José Mora-García"}
          </h1>
          <p className="mt-2 font-display text-[17px] italic text-reef-700 dark:text-reef-300">
            MD, PhD — {isEs ? "Editor en Jefe" : "Editor-in-Chief"}
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="font-display text-[1.35rem] font-semibold text-navy-900 dark:text-gray-100">
                {isEs ? "Biografía profesional" : "Professional biography"}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-[#33383d] dark:text-gray-300">
                <p>
                  {isEs
                    ? "Médico y Doctor en Medicina Tropical. Profesor Asociado, Jefe del Departamento de Investigación de la Facultad de Medicina y líder del Laboratory of Public Health R&D de la Universidad de Cartagena (Cartagena de Indias, Colombia)."
                    : "Physician and PhD in Tropical Medicine. Associate Professor, Head of the Research Department at the Faculty of Medicine and leader of the Laboratory of Public Health R&D at the Universidad de Cartagena (Cartagena de Indias, Colombia)."}
                </p>
                <p>
                  {isEs
                    ? "Su trabajo se centra en la epidemiología de las enfermedades crónicas no transmisibles en poblaciones admixed (ascendencia europea-africana-amerindia) del Caribe colombiano, con énfasis en la intersección entre obesidad, síndrome metabólico, diabetes tipo 2, función pulmonar, aterosclerosis y factores genéticos, nutricionales y del microbioma."
                    : "His work focuses on the epidemiology of chronic non-communicable diseases in admixed (European-African-Amerindian ancestry) populations of the Colombian Caribbean, emphasizing the intersection of obesity, metabolic syndrome, type 2 diabetes, lung function, atherosclerosis, and genetic, nutritional and microbiome factors."}
                </p>
                <p>
                  {isEs
                    ? "Es Investigador Principal del Cartagena Cohort Study (CaReS) (NCT05339048), una cohorte prospectiva de 10 años que estudia la fisiopatología compartida entre enfermedad cardiovascular, aterosclerosis subclínica, deterioro de la función pulmonar y EPOC, integrando datos ómicos, dieta, actividad física y ancestría genética."
                    : "He is Principal Investigator of the Cartagena Cohort Study (CaReS) (NCT05339048), a 10-year prospective cohort studying the shared pathophysiology of cardiovascular disease, subclinical atherosclerosis, lung function decline and COPD, integrating omics, diet, physical activity and genetic ancestry."}
                </p>
                <p>
                  {isEs
                    ? "Realizó un postdoctorado en International Health en la Johns Hopkins Bloomberg School of Public Health (2018-2019). Es Investigador Junior reconocido por Minciencias (Colombia)."
                    : "He completed a postdoctoral fellowship in International Health at the Johns Hopkins Bloomberg School of Public Health (2018-2019). He is a Junior Researcher recognized by Minciencias (Colombia)."}
                </p>
              </div>

              <div className="mt-10">
                <SectionTitle kicker="Career" title={isEs ? "Formación académica" : "Academic training"} />
                <div className="mt-5 overflow-hidden rounded-[2px] border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-paper-dim text-[11px] uppercase tracking-[0.14em] text-mut dark:border-gray-800 dark:bg-[#121b2b]">
                        <th className="px-4 py-2.5 font-semibold">{isEs ? "Nivel" : "Level"}</th>
                        <th className="px-4 py-2.5 font-semibold">{isEs ? "Institución" : "Institution"}</th>
                        <th className="px-4 py-2.5 font-semibold">{isEs ? "Años" : "Years"}</th>
                        <th className="px-4 py-2.5 font-semibold">{isEs ? "Título / Área" : "Degree / Area"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {EDUCATION.map((e) => (
                        <tr key={e.levelKey} className="bg-paper dark:bg-[#0b1322]">
                          <td className="px-4 py-3 font-semibold text-navy-900 dark:text-gray-200">
                            {tl(e.levelKey, e.levelKey === "ug" ? "Pregrado" : e.levelKey === "phd" ? "Doctorado" : "Postdoctorado", e.levelKey === "ug" ? "Undergraduate" : e.levelKey === "phd" ? "PhD" : "Postdoctoral")}
                          </td>
                          <td className="px-4 py-3 text-[#33383d] dark:text-gray-300">
                            {isEs
                              ? e.levelKey === "phd"
                                ? "Universidad de Cartagena"
                                : e.levelKey === "postdoc"
                                  ? "Johns Hopkins Bloomberg School of Public Health"
                                  : "Universidad de Cartagena"
                              : e.levelKey === "postdoc"
                                ? "Johns Hopkins Bloomberg School of Public Health"
                                : "Universidad de Cartagena"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-mut dark:text-gray-400">{e.years}</td>
                          <td className="px-4 py-3 text-[#33383d] dark:text-gray-300">{isEs ? e.areaEs : e.areaEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-10">
                <SectionTitle kicker="Service" title={isEs ? "Cargos actuales" : "Current positions"} />
                <ul className="mt-5 space-y-2.5">
                  {POSITIONS.map((p) => (
                    <li key={p} className="flex items-start gap-3 border-b border-gray-100 pb-2.5 dark:border-gray-800">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-reef-600 dark:bg-reef-400" />
                      <span className="text-[13.5px] leading-relaxed text-[#33383d] dark:text-gray-300">
                        {tl(
                          p,
                          p === "pos1"
                            ? "Profesor (Public Health) — Universidad de Cartagena (desde junio 2012 – presente)"
                            : p === "pos2"
                              ? "Jefe del Departamento de Investigación — Facultad de Medicina, Universidad de Cartagena"
                              : p === "pos3"
                                ? "Líder — Laboratory of Public Health R&D"
                                : p === "pos4"
                                  ? "Investigador Principal — Cartagena Cohort Study (CaReS)"
                                  : "Tutor de tesis de doctorado y pregrado en Medicina Tropical, Ciencias Biomédicas y Biología",
                          p === "pos1"
                            ? "Professor (Public Health) — Universidad de Cartagena (since June 2012 – present)"
                            : p === "pos2"
                              ? "Head of the Research Department — Faculty of Medicine, Universidad de Cartagena"
                              : p === "pos3"
                                ? "Leader — Laboratory of Public Health R&D"
                                : p === "pos4"
                                  ? "Principal Investigator — Cartagena Cohort Study (CaReS)"
                                  : "Thesis supervisor (PhD and undergraduate) in Tropical Medicine, Biomedical Sciences and Biology",
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="flex flex-col gap-6">
              <Card className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
                  {isEs ? "Identificación" : "Identification"}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-[2px] bg-navy-900 font-display text-xl font-bold text-white dark:bg-white dark:text-navy-900" aria-hidden="true">
                    GM
                  </span>
                  <div>
                    <p className="font-display text-[15.5px] font-semibold leading-tight text-navy-900 dark:text-gray-100">
                      Gustavo José Mora-García
                    </p>
                    <p className="mt-0.5 text-xs text-mut dark:text-gray-400">MD, PhD — {isEs ? "Editor en Jefe" : "Editor-in-Chief"}</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-[13px] dark:border-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-mut dark:text-gray-400">{isEs ? "Afiliación" : "Affiliation"}</dt>
                    <dd className="text-right text-[#33383d] dark:text-gray-300">
                      Faculty of Medicine, Universidad de Cartagena, Cartagena, Bolívar, Colombia
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-mut dark:text-gray-400">ORCID</dt>
                    <dd>
                      <a
                        href="https://orcid.org/0000-0003-4808-5130"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] text-reef-700 hover:underline dark:text-reef-300"
                      >
                        0000-0003-4808-5130
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-mut dark:text-gray-400">Scopus</dt>
                    <dd>
                      <a
                        href="https://www.scopus.com/authid/detail.uri?authorId=59157876600"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] text-reef-700 hover:underline dark:text-reef-300"
                      >
                        59157876600
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-mut dark:text-gray-400">Email</dt>
                    <dd>
                      <a
                        href="mailto:gmorag@unicartagena.edu.co"
                        className="font-mono text-[12px] text-reef-700 hover:underline dark:text-reef-300"
                      >
                        gmorag@unicartagena.edu.co
                      </a>
                    </dd>
                  </div>
                </dl>
              </Card>

              <div className="border-l-4 border-coral-500 bg-navy-950 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-300">
                  {isEs ? "Proyecto insignia" : "Flagship project"}
                </p>
                <p className="font-display mt-2.5 text-lg font-semibold leading-snug text-white">CaReS</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ocean-200">
                  Cartagena Cohort Study — NCT05339048
                </p>
                <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[12px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">{isEs ? "Duración" : "Duration"}</dt>
                    <dd className="text-gray-200">10 {isEs ? "años" : "years"} (2020 – 2034)</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">{isEs ? "Población" : "Population"}</dt>
                    <dd className="text-right text-gray-200">18-80 {isEs ? "años" : "years"}, Cartagena</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">Study Director</dt>
                    <dd className="text-gray-200">Vanessa Garcia-Larsen, PhD (Johns Hopkins)</dd>
                  </div>
                </dl>
                <a
                  href="https://clinicaltrials.gov/study/NCT05339048"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-[12.5px] font-semibold text-reef-300 hover:underline"
                >
                  {isEs ? "Ver registro clínico" : "View trial registry"} →
                </a>
              </div>

              <Card className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral-600 dark:text-coral-400">
                  {isEs ? "Palabras clave" : "Keywords"}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {KEYWORDS.map((k) => (
                    <Badge key={k} tone="gray">{k}</Badge>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-paper-dim dark:border-gray-800 dark:bg-[#0a111f]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <SectionTitle
            kicker="Research"
            title={isEs ? "Líneas de investigación principales" : "Main research lines"}
          />
          <div className="mt-7 grid gap-px border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-800 dark:bg-gray-800">
            {RESEARCH_LINES.map((l, i) => (
              <div key={l} className="bg-paper p-5 dark:bg-[#0b1322]">
                <span className="font-display text-[1.6rem] font-semibold leading-none text-reef-700 dark:text-reef-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-[13px] leading-relaxed text-[#33383d] dark:text-gray-300">
                  {tl(
                    l,
                    [
                      "Obesidad, síndrome metabólico y diabetes tipo 2 en poblaciones admixed latinoamericanas",
                      "Asociaciones genéticas (CAV1, FTO, IRX3, ADIPOR1, LEP, LEPR y otras) con rasgos cardiometabólicos",
                      "Transición nutricional, calidad de la dieta, alimentos ultraprocesados e inseguridad alimentaria",
                      "Función pulmonar, EPOC y su relación con dieta y factores cardiometabólicos",
                      "Microbioma de la vía aérea y aterosclerosis subclínica",
                      "Antropometría y puntos de corte locales para síndrome metabólico",
                      "Epidemiología de salud pública en contextos tropicales y comunidades rurales del Caribe colombiano",
                      "Ancestría genética y estructura poblacional de Cartagena de Indias",
                    ][i],
                    [
                      "Obesity, metabolic syndrome and type 2 diabetes in admixed Latin American populations",
                      "Genetic associations (CAV1, FTO, IRX3, ADIPOR1, LEP, LEPR and others) with cardiometabolic traits",
                      "Nutrition transition, diet quality, ultra-processed foods and food insecurity",
                      "Lung function, COPD and their relationship with diet and cardiometabolic factors",
                      "Airway microbiome and subclinical atherosclerosis",
                      "Anthropometry and local cut-off points for the metabolic syndrome",
                      "Public health epidemiology in tropical settings and rural communities of the Colombian Caribbean",
                      "Genetic ancestry and population structure of Cartagena de Indias",
                    ][i],
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            kicker="Publications"
            title={isEs ? "Publicaciones seleccionadas" : "Selected publications"}
            subtitle={
              isEs
                ? "Las más relevantes y citadas de ~27 obras reportadas en ORCID."
                : "The most relevant and cited among ~27 works reported in ORCID."
            }
          />
        </div>
        <ul className="mt-8 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {PUBLICATIONS.map((p) => (
            <li key={`${p.year}-${p.title}`} className="group grid gap-1 py-4 md:grid-cols-[64px_1fr] md:gap-6">
              <span className="font-display text-[15px] font-semibold text-reef-700 dark:text-reef-300">
                {p.year}
              </span>
              <div>
                <p className="text-[14px] leading-snug text-navy-900 dark:text-gray-100">
                  {isEs ? `${p.title}.` : p.title}
                </p>
                <p className="mt-1 text-[12.5px] italic text-mut dark:text-gray-400">
                  {p.venue}{isEs ? "." : "."}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LinkButton href="/submit" size="md">
            {isEs ? "Enviar un manuscrito" : "Submit a manuscript"}
          </LinkButton>
          <LinkButton href="/articles" variant="secondary" size="md">
            {isEs ? "Explorar artículos" : "Browse articles"}
          </LinkButton>
        </div>
      </section>
    </>
  );
}