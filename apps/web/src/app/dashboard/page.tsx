"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import type { DashboardStats, InvitationOut, ManuscriptOut } from "@/lib/types";
import { useAuth, useLocale } from "@/components/providers";
import { isEditor } from "@/components/providers";
import { Badge, Button, Card, EmptyState, ErrorBox, Spinner, StatusBadge } from "@/components/ui";

interface MyReview {
  id: string;
  manuscript_id: string;
  title: string;
  status: string;
  recommendation: string | null;
  submitted_at: string | null;
}

const STAT_LABELS: Array<[keyof DashboardStats, string, string]> = [
  ["new_submissions", "New submissions", "submitted"],
  ["technical_checks", "Technical check", "technical_check"],
  ["awaiting_editors", "Awaiting editors", "editorial_check / assigned_to_editor"],
  ["reviewer_invitations", "Inviting reviewers", "reviewer_invitations"],
  ["active_reviews", "Active reviews", "under_review"],
  ["reviews_received", "Reviews received", "reviews_received"],
  ["revisions", "Revisions", "minor / major revision"],
  ["decisions_pending", "Decisions pending", "editor_decision"],
  ["accepted", "Accepted", "accepted"],
  ["published", "Published", "published"],
  ["rejected", "Rejected", "rejected"],
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { dict } = useLocale();
  const router = useRouter();
  const [manuscripts, setManuscripts] = useState<ManuscriptOut[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<ManuscriptOut[] | null>(null);
  const [reviews, setReviews] = useState<MyReview[] | null>(null);
  const [invitations, setInvitations] = useState<InvitationOut[] | null>(null);
  const [error, setError] = useState("");

  const editor = isEditor(user);

  const load = useCallback(async () => {
    setError("");
    try {
      const [ms, st, q, rev, inv] = await Promise.all([
        api.get<ManuscriptOut[]>("/manuscripts"),
        editor ? api.get<DashboardStats>("/manuscripts/dashboard/stats") : Promise.resolve(null),
        editor ? api.get<ManuscriptOut[]>("/manuscripts/queue") : Promise.resolve(null),
        api.get<MyReview[]>("/manuscripts/reviewer/my-reviews"),
        api.get<InvitationOut[]>("/manuscripts/invitations/mine"),
      ]);
      setManuscripts(ms);
      setStats(st);
      setQueue(q);
      setReviews(rev);
      setInvitations(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    }
  }, [editor, dict]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (user) void load();
  }, [loading, user, router, load]);

  const decide = async (iid: string, accept: boolean) => {
    try {
      await api.post<InvitationOut>(`/manuscripts/invitations/${iid}`, { accept });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict["common.error"]);
    }
  };

  if (loading || (!user && !error)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-ocean-500" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-reef-600 dark:text-reef-300">
            Dashboard
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-ocean-950 dark:text-white">
            {user?.full_name}
          </h1>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-full bg-sun-400 px-6 py-3 text-sm font-medium text-ocean-950 transition-colors hover:bg-sun-500"
        >
          + New submission
        </Link>
      </div>

      <div className="mt-8">
        <ErrorBox message={error} />
      </div>

      {user && editor && (
        <>
          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold text-ocean-950 dark:text-white">Editorial overview</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats &&
                STAT_LABELS.map(([key, label]) => (
                  <Link
                    key={key}
                    href={`/dashboard?status=${key}`}
                    className="rounded-2xl border border-ocean-200/80 bg-white/80 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-ocean-800 dark:bg-ocean-900/40"
                  >
                    <p className="font-display text-3xl font-semibold text-ocean-950 dark:text-white">
                      {stats[key]}
                    </p>
                    <p className="mt-1 text-sm text-ocean-600 dark:text-ocean-300">{label}</p>
                  </Link>
                ))}
            </div>
          </div>

          <div className="mt-14">
            <h2 className="font-display text-2xl font-semibold text-ocean-950 dark:text-white">Editorial queue</h2>
            {queue && queue.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="Queue is empty" body="No manuscripts in the editorial pipeline right now." />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {queue?.map((m) => (
                  <Link
                    key={m.id}
                    href={`/manuscripts/${m.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ocean-200/80 bg-white/80 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-ocean-800 dark:bg-ocean-900/40"
                  >
                    <div className="min-w-0">
                      <p className="font-display truncate font-semibold text-ocean-950 dark:text-white">{m.title || "Untitled manuscript"}</p>
                      <p className="mt-1 truncate text-sm text-ocean-500 dark:text-ocean-400">
                        {m.journal?.title ?? "No journal"} · updated {fmtDate(m.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-ocean-950 dark:text-white">My manuscripts</h2>
        {manuscripts === null ? (
          <div className="mt-8 flex justify-center"><Spinner className="text-ocean-500" /></div>
        ) : manuscripts.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No manuscripts yet"
              body="Start a new submission — you can save as you go and submit when ready."
              cta={
                <Link href="/submit" className="rounded-full bg-ocean-700 px-6 py-3 text-sm font-medium text-white hover:bg-ocean-600 dark:bg-reef-400 dark:text-ocean-950 dark:hover:bg-reef-300">
                  Start a submission
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {manuscripts.map((m) => (
              <Link
                key={m.id}
                href={`/manuscripts/${m.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ocean-200/80 bg-white/80 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-ocean-800 dark:bg-ocean-900/40"
              >
                <div className="min-w-0">
                  <p className="font-display truncate font-semibold text-ocean-950 dark:text-white">{m.title || "Untitled manuscript"}</p>
                  <p className="mt-1 truncate text-sm text-ocean-500 dark:text-ocean-400">
                    {m.journal?.title ?? "No journal"} · {m.article_type} · v{m.version}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {user && reviews !== null && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-ocean-950 dark:text-white">My reviews</h2>
          {reviews.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No reviews yet" body="Accepted review invitations will appear here." />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {reviews.map((r) => (
                <Link
                  key={r.id}
                  href={`/manuscripts/${r.manuscript_id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ocean-200/80 bg-white/80 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-ocean-800 dark:bg-ocean-900/40"
                >
                  <div className="min-w-0">
                    <p className="font-display truncate font-semibold text-ocean-950 dark:text-white">{r.title}</p>
                    <p className="mt-1 text-sm text-ocean-500 dark:text-ocean-400">
                      {r.recommendation ?? "Not submitted"}
                      {r.submitted_at ? ` · ${fmtDate(r.submitted_at)}` : ""}
                    </p>
                  </div>
                  <Badge tone={r.status === "submitted" ? "reef" : "sand"}>{r.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {user && invitations !== null && invitations.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-ocean-950 dark:text-white">Review invitations</h2>
          <div className="mt-5 space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ocean-200/80 bg-white/80 p-5 dark:border-ocean-800 dark:bg-ocean-900/40"
              >
                <div className="min-w-0">
                  <p className="font-display truncate font-semibold text-ocean-950 dark:text-white">{inv.manuscript_title || "Review invitation"}</p>
                  <p className="mt-1 text-sm text-ocean-500 dark:text-ocean-400">Invited {fmtDate(inv.invited_at)}</p>
                </div>
                {inv.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => decide(inv.id, true)}>Accept</Button>
                    <Button size="sm" variant="secondary" onClick={() => decide(inv.id, false)}>Decline</Button>
                  </div>
                ) : (
                  <Badge tone={inv.status === "accepted" ? "reef" : "neutral"}>{inv.status}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}