"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import type { AiAnalysisOut, ManuscriptDetailOut, ReviewOut, ReviewerMatchOut } from "@/lib/types";
import { useAuth, useLocale } from "@/components/providers";
import { isEditor } from "@/components/providers";
import { Badge, Button, Card, ErrorBox, Select, Spinner, StatusBadge, Textarea } from "@/components/ui";

const SCORE_FIELDS = [
  "novelty",
  "methodology",
  "statistics",
  "figures",
  "tables",
  "references",
  "reproducibility",
  "ethics",
] as const;

const DECISIONS = [
  { value: "accept", label: "Accept" },
  { value: "minor_revision", label: "Minor revision" },
  { value: "major_revision", label: "Major revision" },
  { value: "reject", label: "Reject" },
];

export default function ManuscriptPage() {
  const params = useParams<{ mid: string }>();
  const mid = params.mid;
  const { user, loading } = useAuth();
  const { dict } = useLocale();
  const router = useRouter();
  const [ms, setMs] = useState<ManuscriptDetailOut | null>(null);
  const [reviews, setReviews] = useState<ReviewOut[] | null>(null);
  const [matches, setMatches] = useState<ReviewerMatchOut[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState("accept");
  const [reviewForm, setReviewForm] = useState<Record<string, string>>({});
  const [comments, setComments] = useState("");
  const [aiResult, setAiResult] = useState<AiAnalysisOut | null>(null);

  const editor = isEditor(user);

  const load = useCallback(async () => {
    try {
      const detail = await api.get<ManuscriptDetailOut>(`/manuscripts/${mid}`);
      setMs(detail);
      if (isEditor(user)) {
        const [revs, mt] = await Promise.all([
          api.get<ReviewOut[]>(`/manuscripts/${mid}/reviews`),
          api.get<ReviewerMatchOut[]>(`/manuscripts/${mid}/reviewer-matches`),
        ]);
        setReviews(revs);
        setMatches(mt);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    }
  }, [mid, user, dict]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (user) {
      void load();
    }
  }, [loading, user, router, load]);

  const doAction = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  const transitionTo = (target: string) =>
    doAction(() => api.post(`/manuscripts/${mid}/transition`, { note: target }), `→ ${target}`);

  const sendDecision = () =>
    doAction(
      () => api.post(`/manuscripts/${mid}/decision`, { decision, note }),
      "Decision sent",
    );

  const publish = () => doAction(() => api.post(`/manuscripts/${mid}/publish`, {}), "Published");

  const invite = (reviewerId: string) =>
    doAction(
      () => api.post(`/manuscripts/${mid}/invitations?reviewer_user_id=${encodeURIComponent(reviewerId)}`, {}),
      "Invitation sent",
    );

  const aiAnalyze = () =>
    doAction(async () => {
      const a = await api.post<AiAnalysisOut>(`/manuscripts/${mid}/ai/analyze`, {});
      setAiResult(a);
    }, "AI analysis complete");

  const submitReview = async () => {
    setBusy(true);
    setError("");
    try {
      const scores: Record<string, number> = {};
      for (const f of SCORE_FIELDS) {
        if (reviewForm[f]) scores[f] = Number(reviewForm[f]);
      }
      const body: Record<string, unknown> = { ...scores, comments_to_authors: comments };
      if (reviewForm.recommendation) body.recommendation = reviewForm.recommendation;
      const existing = await api
        .get<ReviewOut[]>(`/manuscripts/${mid}/reviews`)
        .catch(() => [] as ReviewOut[]);
      if (existing.some((r) => r.reviewer_user_id === user?.id)) {
        const mine = existing.find((r) => r.reviewer_user_id === user?.id);
        await api.patch(`/manuscripts/${mid}/reviews/${mine!.id}`, body);
      } else {
        const created = await api.post<ReviewOut>(`/manuscripts/${mid}/reviews`, {});
        await api.patch(`/manuscripts/${mid}/reviews/${created.id}`, body);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    } finally {
      setBusy(false);
    }
  };

  if (loading || (!user && !error)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-ocean-500" />
      </div>
    );
  }

  if (!ms) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <ErrorBox message={error || "Manuscript not found"} />
        <div className="mt-6">
          <Link href="/dashboard" className="text-sm font-semibold text-reef-600 hover:underline dark:text-reef-300">
            ← Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-ocean-500 dark:text-ocean-400">
            {ms.journal?.title ?? "No journal"} · {ms.article_type.replace(/_/g, " ")} · v{ms.version} · updated {fmtDate(ms.updated_at)}
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-ocean-950 sm:text-4xl dark:text-white">
            {ms.title || "Untitled manuscript"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ms.status} />
          {ms.status === "draft" && (
            <Link
              href={`/submit?mid=${ms.id}`}
              className="rounded-full border border-ocean-300 px-5 py-2 text-sm font-medium text-ocean-800 hover:bg-ocean-50 dark:border-ocean-700 dark:text-ocean-100 dark:hover:bg-ocean-900"
            >
              Continue editing
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8">
        <ErrorBox message={error} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <Card className="p-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Abstract</h2>
            <p className="mt-3 leading-relaxed text-ocean-800 dark:text-ocean-100">{ms.abstract || "Not provided yet."}</p>
            {ms.keywords?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {ms.keywords.map((k) => (
                  <Badge key={k} tone="sand">{k}</Badge>
                ))}
              </div>
            )}
          </Card>

          {ms.body && (
            <Card className="p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Manuscript body</h2>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-ocean-50 p-4 text-sm leading-relaxed text-ocean-800 dark:bg-ocean-950 dark:text-ocean-100">
                {ms.body}
              </pre>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Authors</h2>
            <ul className="mt-3 space-y-2">
              {ms.authors.length === 0 && <p className="text-sm text-ocean-500 dark:text-ocean-400">No authors added yet.</p>}
              {ms.authors.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ocean-800 dark:text-ocean-100">
                    {a.name}
                    {a.is_corresponding && <Badge tone="sun">Corresponding</Badge>}
                  </span>
                  <span className="text-ocean-500 dark:text-ocean-400">{a.institution || "—"}{a.orcid ? ` · ${a.orcid}` : ""}</span>
                </li>
              ))}
            </ul>
          </Card>

          {ms.files.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Files</h2>
              <ul className="mt-3 space-y-2">
                {ms.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-ocean-50 px-4 py-3 text-sm dark:bg-ocean-900">
                    <span className="min-w-0 truncate text-ocean-800 dark:text-ocean-100">
                      {f.original_name} <span className="text-ocean-400">· {f.kind} · v{f.version} · {(f.size / 1024).toFixed(1)} KB</span>
                    </span>
                    <Badge tone="neutral">{f.mime.split("/").pop()}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {ms.events.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Timeline</h2>
              <ol className="mt-4 space-y-0">
                {ms.events.map((e, i) => (
                  <li key={e.id} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute left-0 top-1 size-2.5 rounded-full bg-reef-400" />
                    <p className="text-sm font-medium text-ocean-900 dark:text-ocean-50">
                      {e.from_status || "—"} → {e.to_status}
                    </p>
                    <p className="text-xs text-ocean-500 dark:text-ocean-400">
                      {fmtDate(e.created_at)}{e.note ? ` · ${e.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {editor && reviews && reviews.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Reviews received ({reviews.length})</h2>
              <ul className="mt-4 space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-ocean-200/80 p-4 text-sm dark:border-ocean-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-ocean-900 dark:text-white">{r.recommendation ?? "In progress"}</span>
                      <Badge tone={r.status === "submitted" ? "reef" : "sand"}>{r.status}</Badge>
                    </div>
                    <p className="mt-2 text-ocean-700 dark:text-ocean-200">{r.comments_to_authors || "No comments."}</p>
                    {r.submitted_at && <p className="mt-2 text-xs text-ocean-500 dark:text-ocean-400">{fmtDate(r.submitted_at)}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {aiResult && (
            <Card className="p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">
                AI analysis · {aiResult.kind} · {aiResult.model}
              </h2>
              <p className="mt-2 text-xs text-ocean-500 dark:text-ocean-400">Informational only — decisions are always human.</p>
              <ul className="mt-4 space-y-2">
                {aiResult.findings.map((f) => (
                  <li key={f.id} className="rounded-xl bg-ocean-50 p-3 text-sm dark:bg-ocean-900">
                    <p className="font-medium text-ocean-900 dark:text-ocean-50">{f.finding}</p>
                    <p className="mt-1 text-xs text-ocean-500 dark:text-ocean-400">
                      {f.severity} · confidence {(f.confidence * 100).toFixed(0)}% · {f.source}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          {(ms.status === "submitted" || ms.status === "technical_check") && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Technical check</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Button size="sm" onClick={() => transitionTo("editorial_check")}>Pass to editorial</Button>
                <Button size="sm" variant="secondary" onClick={() => transitionTo("rejected")}>Reject at check</Button>
              </div>
            </Card>
          )}

          {(ms.status === "editorial_check" || ms.status === "assigned_to_editor") && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Editorial</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Button size="sm" onClick={() => transitionTo("reviewer_invitations")}>Invite reviewers</Button>
                <Button size="sm" variant="secondary" onClick={() => transitionTo("under_review")}>Start review</Button>
                <Button size="sm" variant="danger" onClick={() => transitionTo("rejected")}>Reject</Button>
              </div>
            </Card>
          )}

          {ms.status === "reviewer_invitations" && matches && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Suggested reviewers</h2>
              <ul className="mt-3 space-y-3">
                {matches.length === 0 && <p className="text-sm text-ocean-500 dark:text-ocean-400">No reviewer profiles found.</p>}
                {matches.map((m) => (
                  <li key={m.reviewer_id} className="rounded-xl border border-ocean-200/80 p-3 text-sm dark:border-ocean-800">
                    <p className="font-semibold text-ocean-900 dark:text-white">{m.name}</p>
                    <p className="mt-0.5 truncate text-xs text-ocean-500 dark:text-ocean-400">{m.institution}</p>
                    <p className="mt-1 text-xs text-reef-600 dark:text-reef-300">score {m.score.toFixed(2)}</p>
                    <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => invite(m.reviewer_id)}>
                      Invite
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(ms.status === "under_review" || ms.status === "reviews_received" || ms.status === "editor_decision") && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Editor decision</h2>
              <div className="mt-3 space-y-2">
                <Select value={decision} onChange={(e) => setDecision(e.target.value)}>
                  {DECISIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </Select>
                <Textarea placeholder="Decision note (sent to authors)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button size="sm" className="w-full" onClick={sendDecision} disabled={busy}>
                  {busy ? <Spinner /> : "Send decision"}
                </Button>
              </div>
            </Card>
          )}

          {ms.status === "accepted" && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Production</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Button size="sm" onClick={() => transitionTo("production")}>Start production</Button>
              </div>
            </Card>
          )}

          {ms.status === "production" && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Proof</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Button size="sm" onClick={() => transitionTo("proof")}>Send to proof</Button>
              </div>
            </Card>
          )}

          {ms.status === "proof" && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Publication</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Button size="sm" variant="sun" onClick={publish} disabled={busy}>
                  {busy ? <Spinner /> : "Publish article"}
                </Button>
              </div>
            </Card>
          )}

          {editor && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">AI assist</h2>
              <p className="mt-2 text-xs text-ocean-500 dark:text-ocean-400">
                Structure check with findings. Informational only.
              </p>
              <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={aiAnalyze} disabled={busy}>
                {busy ? <Spinner /> : "Run analysis"}
              </Button>
            </Card>
          )}

          {user && !editor && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ocean-500 dark:text-ocean-400">Review for this manuscript</h2>
              <p className="mt-3 text-sm text-ocean-500 dark:text-ocean-400">
                This form is for invited reviewers. Submitting a review moves the manuscript forward only when a recommendation is given.
              </p>
                    {SCORE_FIELDS.map((f) => (
                <label key={f} className="block text-xs">
                  <span className="mb-1 block capitalize text-ocean-600 dark:text-ocean-300">{f}</span>
                  <Select
                    value={reviewForm[f] ?? ""}
                    onChange={(e) => setReviewForm({ ...reviewForm, [f]: e.target.value })}
                    className="!px-2 !py-1.5 text-xs"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </label>
              ))}
              <label className="mt-3 block text-xs">
                <span className="mb-1 block text-ocean-600 dark:text-ocean-300">Recommendation</span>
                <Select
                  value={reviewForm.recommendation ?? ""}
                  onChange={(e) => setReviewForm({ ...reviewForm, recommendation: e.target.value })}
                  className="!px-2 !py-1.5 text-xs"
                >
                  <option value="">—</option>
                  <option value="accept">Accept</option>
                  <option value="minor_revision">Minor revision</option>
                  <option value="major_revision">Major revision</option>
                  <option value="reject">Reject</option>
                </Select>
              </label>
              <Textarea
                placeholder="Comments to authors"
                className="mt-3 !min-h-24 text-xs"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
              <Button size="sm" className="mt-3 w-full" onClick={submitReview} disabled={busy}>
                {busy ? <Spinner /> : "Submit review"}
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </section>
  );
}