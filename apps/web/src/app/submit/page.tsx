"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ARTICLE_TYPES, type ArticleAuthorOut, type JournalOut, type ManuscriptDetailOut, type SectionOut } from "@/lib/types";
import { useAuth, useLocale } from "@/components/providers";
import { Badge, Button, Card, ErrorBox, Field, Input, Select, Spinner, StatusBadge, Textarea } from "@/components/ui";

interface AuthorDraft {
  name: string;
  email: string;
  orcid: string;
  institution: string;
  country_code: string;
  is_corresponding: boolean;
  order: number;
}

const STEPS = ["Journal", "Manuscript", "Authors", "Files", "Submit"];

function SubmitWizard() {
  const { user, loading } = useAuth();
  const { dict } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [mid, setMid] = useState<string | null>(params.get("mid"));
  const [journalId, setJournalId] = useState("");
  const [articleType, setArticleType] = useState("research_article");
  const [sectionId, setSectionId] = useState("");
  const [sections, setSections] = useState<SectionOut[]>([]);
  const [journals, setJournals] = useState<JournalOut[]>([]);
  const [ms, setMs] = useState<ManuscriptDetailOut | null>(null);
  const [authors, setAuthors] = useState<AuthorDraft[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string>("");
  const [parsed, setParsed] = useState<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      if (!mid) return;
      try {
        const updated = await api.patch<ManuscriptDetailOut>(`/manuscripts/${mid}`, body);
        setMs(updated);
        setSaved(`Saved ${new Date().toLocaleTimeString()}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : dict["common.error"]);
      }
    },
    [mid, dict],
  );

  /// Autosave campos del paso Manuscript
  useEffect(() => {
    if (!mid || step !== 1 || !ms) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void patch({
        title: ms.title,
        abstract: ms.abstract,
        keywords: ms.keywords,
        body: ms.body,
        funding: ms.funding,
        conflicts: ms.conflicts,
        ethics: ms.ethics,
        data_availability: ms.data_availability,
        author_contributions: ms.author_contributions,
        acknowledgments: ms.acknowledgments,
        cover_letter: ms.cover_letter,
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [mid, step, ms, patch]);

  const loadJournals = useCallback(async () => {
    try {
      const data = await api.get<JournalOut[]>("/journals", false);
      setJournals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    }
  }, [dict]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else {
      void loadJournals();
      if (mid) {
        api
          .get<ManuscriptDetailOut>(`/manuscripts/${mid}`)
          .then((m) => {
            setMs(m);
            setJournalId(m.journal_id);
            setArticleType(m.article_type);
            setSectionId(m.section_id ?? "");
            setAuthors(
              m.authors.map((a) => ({
                name: a.name,
                email: "",
                orcid: a.orcid,
                institution: a.institution,
                country_code: a.country_code ?? "",
                is_corresponding: a.is_corresponding,
                order: a.order,
              })),
            );
          })
          .catch((err) => setError(err instanceof Error ? err.message : dict["common.error"]));
      }
    }
  }, [loading, user, router, mid, loadJournals, dict]);

  const loadSections = async (slug: string) => {
    try {
      const data = await api.get<SectionOut[]>(`/journals/${slug}/sections`, false);
      setSections(data);
      setSectionId("");
    } catch {
      setSections([]);
    }
  };

  const createManuscript = async () => {
    setBusy(true);
    setError("");
    try {
      const m = await api.post<ManuscriptDetailOut>("/manuscripts", {
        journal_id: journalId,
        article_type: articleType,
        section_id: sectionId || null,
      });
      setMid(m.id);
      setMs(m);
      setSaved("");
      router.replace(`/submit?mid=${m.id}`);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const saveAuthors = async () => {
    setBusy(true);
    setError("");
    try {
      const clean = authors.map((a, i) => ({ ...a, order: i })).filter((a) => a.name.trim());
      const updated = await api.put<ManuscriptDetailOut>(`/manuscripts/${mid}/authors`, clean);
      setMs(updated);
      setSaved(`Saved ${new Date().toLocaleTimeString()}`);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "manuscript");
      await api.upload(`/manuscripts/${mid}/files`, form);
      const updated = await api.get<ManuscriptDetailOut>(`/manuscripts/${mid}`);
      setMs(updated);
      setSaved(`Uploaded ${file.name}`);
      setParsed("");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const parseDocx = async () => {
    setBusy(true);
    setError("");
    setParsed("");
    try {
      const res = await api.post<{ message: string; extracted: Record<string, string> }>(
        `/manuscripts/${mid}/parse-docx`,
        {},
      );
      setParsed(
        res.message +
          (res.extracted?.title ? ` — Detected title: “${res.extracted.title}” (review before applying)` : ""),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async (fid: string) => {
    setBusy(true);
    setError("");
    try {
      await api.del(`/manuscripts/${mid}/files/${fid}`);
      const updated = await api.get<ManuscriptDetailOut>(`/manuscripts/${mid}`);
      setMs(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const submitManuscript = async () => {
    setBusy(true);
    setError("");
    try {
      const updated = await api.post<ManuscriptDetailOut>(`/manuscripts/${mid}/submit`, { note: "" });
      setMs(updated);
      setSaved("Submission received");
      router.push(`/manuscripts/${mid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const needAuth = loading || (!user && !error);
  if (needAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-ocean-500" />
      </div>
    );
  }

  const canCreate = journalId && !mid;
  const nt = (v: string | null | undefined) => v ?? "";
  const setMsField = (key: keyof ManuscriptDetailOut, value: string | string[]) =>
    ms && ((setMs as (m: ManuscriptDetailOut) => void)({ ...ms, [key]: value }));

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-reef-600 dark:text-reef-300">
        Submit
      </p>
      <h1 className="font-display mt-2 text-4xl font-semibold text-ink dark:text-white">
        New manuscript
      </h1>
      {ms?.status && ms.status !== "draft" && (
        <p className="mt-3">Status: <StatusBadge status={ms.status} /></p>
      )}

      <ol className="mt-8 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                i === step
                  ? "bg-reef-600 text-white dark:bg-reef-500 dark:text-white"
                  : i < step
                    ? "bg-reef-50 text-reef-800 hover:bg-reef-100 dark:bg-reef-900/50 dark:text-reef-200"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              <span className="text-xs">{i + 1}</span> {label}
            </button>
            {i < STEPS.length - 1 && <span className="text-gray-300 dark:text-gray-600">›</span>}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <ErrorBox message={error} />
        {saved && (
          <p className="mb-4 text-sm font-medium text-reef-600 dark:text-reef-300">✔ {saved}</p>
        )}
      </div>

      {step === 0 && (
        <Card className="mt-4 space-y-5 p-8">
          <Field label="Journal" hint="Select the journal you want to submit to.">
            <Select
              value={journalId}
              onChange={(e) => {
                setJournalId(e.target.value);
                const j = journals.find((x) => x.id === e.target.value);
                if (j) void loadSections(j.slug);
              }}
            >
              <option value="">Select journal…</option>
              {journals.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Article type">
            <Select value={articleType} onChange={(e) => setArticleType(e.target.value)}>
              {ARTICLE_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </Field>
          {sections.length > 0 && (
            <Field label="Section">
              <Select value={sectionId ?? ""} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">General</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <Button onClick={createManuscript} disabled={busy || !canCreate}>
            {busy ? <Spinner /> : "Create manuscript"}
          </Button>
        </Card>
      )}

      {step === 1 && ms && (
        <Card className="mt-4 space-y-5 p-8">
          <Field label="Title" hint="A clear, descriptive title.">
            <Input value={nt(ms.title)} onChange={(e) => setMsField("title", e.target.value)} />
          </Field>
          <Field label="Abstract" hint="Minimum 50 characters required before submission.">
            <Textarea value={nt(ms.abstract)} onChange={(e) => setMsField("abstract", e.target.value)} />
          </Field>
          <Field label="Keywords" hint="Comma-separated keywords.">
            <Input
              value={(ms.keywords ?? []).join(", ")}
              onChange={(e) => setMsField("keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Body (markdown)" hint="## headings, - lists and plain paragraphs are supported.">
            <Textarea className="min-h-64 font-mono text-sm" value={nt(ms.body)} onChange={(e) => setMsField("body", e.target.value)} />
          </Field>
          <div className="border-t border-ocean-100 pt-5 dark:border-ocean-800">
            <Field label="Funding statement">
              <Textarea value={nt(ms.funding)} onChange={(e) => setMsField("funding", e.target.value)} />
            </Field>
            <div className="mt-5">
              <Field label="Conflicts of interest">
                <Textarea value={nt(ms.conflicts)} onChange={(e) => setMsField("conflicts", e.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Ethics statement">
                <Textarea value={nt(ms.ethics)} onChange={(e) => setMsField("ethics", e.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Data availability">
                <Textarea value={nt(ms.data_availability)} onChange={(e) => setMsField("data_availability", e.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Author contributions">
                <Textarea value={nt(ms.author_contributions)} onChange={(e) => setMsField("author_contributions", e.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Acknowledgments">
                <Textarea value={nt(ms.acknowledgments)} onChange={(e) => setMsField("acknowledgments", e.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Cover letter">
                <Textarea value={nt(ms.cover_letter)} onChange={(e) => setMsField("cover_letter", e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>Continue to authors →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="mt-4 space-y-5 p-8">
          <p className="text-sm text-mut dark:text-gray-400">
            List the authors in order. Mark the corresponding author. An email matching an existing
            account links the author to a researcher profile on publication.
          </p>
          {authors.length === 0 && (
            <Button variant="secondary" onClick={() => setAuthors([{ name: "", email: "", orcid: "", institution: "", country_code: "", is_corresponding: true, order: 0 }])}>
              Add the first author
            </Button>
          )}
          <div className="space-y-4">
            {authors.map((a, i) => (
              <div key={i} className="rounded-md border border-gray-200 p-5 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink dark:text-gray-100">Author {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => setAuthors(authors.filter((_, x) => x !== i))}
                    className="text-xs font-medium text-coral-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Full name" value={a.name} onChange={(e) => setAuthors(authors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input placeholder="Email (optional)" type="email" value={a.email} onChange={(e) => setAuthors(authors.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
                  <Input placeholder="ORCID (optional)" value={a.orcid} onChange={(e) => setAuthors(authors.map((x, j) => (j === i ? { ...x, orcid: e.target.value } : x)))} />
                  <Input placeholder="Institution" value={a.institution} onChange={(e) => setAuthors(authors.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x)))} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-[#3a4046] dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={a.is_corresponding}
                    onChange={(e) => setAuthors(authors.map((x, j) => (j === i ? { ...x, is_corresponding: e.target.checked } : x)))}
                    className="size-4 accent-reef-500"
                  />
                  Corresponding author
                </label>
              </div>
            ))}
          </div>
          {authors.length > 0 && (
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="secondary" onClick={() => setAuthors([...authors, { name: "", email: "", orcid: "", institution: "", country_code: "", is_corresponding: false, order: authors.length }])}>
                + Add author
              </Button>
              <Button onClick={saveAuthors} disabled={busy}>
                {busy ? <Spinner /> : "Save authors & continue →"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {step === 3 && ms && (
        <Card className="mt-4 space-y-5 p-8">
          <Field label="Manuscript file (DOCX or PDF)" hint="The system can extract title and metadata from DOCX files.">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept=".docx,.pdf,.doc"
                className="!w-auto cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                }}
              />
              <Button variant="secondary" onClick={parseDocx} disabled={busy || !ms.files.some((f) => f.mime.includes("wordprocessingml"))}>
                Parse DOCX metadata
              </Button>
            </div>
          </Field>
          {parsed && <p className="text-sm text-reef-600 dark:text-reef-300">{parsed}</p>}
          {ms.files.length > 0 && (
            <ul className="space-y-2">
              {ms.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-ocean-50 px-4 py-3 text-sm dark:bg-ocean-900">
                  <span className="min-w-0 truncate text-ocean-800 dark:text-ocean-100">
                    {f.original_name} <span className="text-ocean-400">· {f.kind} · v{f.version}</span>
                  </span>
                  <button type="button" onClick={() => removeFile(f.id)} className="shrink-0 text-xs font-medium text-coral-500 hover:underline">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setStep(4)}>Continue to submit →</Button>
          </div>
        </Card>
      )}

      {step === 4 && ms && (
        <Card className="mt-4 space-y-5 p-8">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-white">Review before submitting</h2>
          <dl className="space-y-3 rounded-md border border-gray-200 p-5 text-sm dark:border-gray-800">
            <div className="flex gap-3"><dt className="w-28 shrink-0 text-mut dark:text-gray-400">Journal</dt><dd className="font-medium text-ink dark:text-gray-100">{ms.journal?.title ?? "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-28 shrink-0 text-mut dark:text-gray-400">Type</dt><dd className="font-medium text-ink dark:text-gray-100">{ms.article_type.replace(/_/g, " ")}</dd></div>
            <div className="flex gap-3"><dt className="w-28 shrink-0 text-mut dark:text-gray-400">Title</dt><dd className="font-medium text-ink dark:text-gray-100">{ms.title || "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-28 shrink-0 text-mut dark:text-gray-400">Abstract</dt><dd className="line-clamp-3 text-ink dark:text-gray-100">{ms.abstract || "—"}</dd></div>
            <div className="flex gap-3"><dt className="w-28 shrink-0 text-mut dark:text-gray-400">Authors</dt><dd className="text-ink dark:text-gray-100">{ms.authors.map((a) => a.name).join(", ") || "None yet"}</dd></div>
            <div className="flex gap-3"><dt className="w-28 shrink-0 text-mut dark:text-gray-400">Files</dt><dd className="text-ink dark:text-gray-100">{ms.files.length} attached</dd></div>
          </dl>
          {ms.status === "draft" ? (
            <Button onClick={submitManuscript} disabled={busy || !ms.title.trim() || (ms.abstract ?? "").length < 50} className="text-base">
              {busy ? <Spinner /> : "Submit manuscript"}
            </Button>
          ) : (
            <p className="text-sm text-ocean-600 dark:text-ocean-300">
              This manuscript is already <StatusBadge status={ms.status} />.
            </p>
          )}
          <p className="text-xs text-ocean-500 dark:text-ocean-400">
            By submitting you confirm the work is original, does not duplicate prior publication, and all
            co-authors consent. Editorial checks follow.
          </p>
        </Card>
      )}

      {!ms && step > 0 && (
        <p className="mt-8">
          <Link href="/submit" className="text-sm font-semibold text-reef-600 hover:underline dark:text-reef-300">
            ← Start a new manuscript
          </Link>
        </p>
      )}
    </section>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Spinner className="size-8 text-ocean-500" /></div>}>
      <SubmitWizard />
    </Suspense>
  );
}