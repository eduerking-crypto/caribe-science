# Editorial workflow

The submission pipeline is a validated state machine
(`apps/backend/app/services/workflow.py`). Illegal transitions are rejected
server-side with `409 Conflict`; the frontend only offers legal actions.

## States

```
draft ──► submitted ──► technical_check ──► editorial_check ──► assigned_to_editor
                                                              │
                                                              ▼
                     under_review ◄── reviewer_invitations ◄──┘
                          │
                          ▼
                   reviews_received ──► editor_decision
                          │                │
                          ▼                ▼
              accepted / minor / major / rejected
                          │
                          ▼
                  production ──► proof ──► published
```

Revision targets (`minor_revision`, `major_revision`) return to `submitted` and
flow through checks again. `rejected` and `published` are terminal.

## Roles

| Role | Permissions |
|------|-------------|
| `author` | Drafts, autosave, files, submit, own manuscript read |
| `reviewer` | Invitations, review form (create + patch own) |
| `editor` | Stats, queue, transitions, decisions, reviewer matching/invites |
| `editor_in_chief` / `journal_admin` / `platform_admin` | Everything above + publish |
| `admin` | Notifications/usages admin endpoints |

`require_roles` enforces; manuscript visibility is `owner OR editor-role`.

## Stages in the UI

1. **Wizard** (`/submit`): journal+type → manuscript (debounced autosave via
   `PATCH /manuscripts/{mid}`) → authors (`PUT .../authors`) → files +
   optional DOCX metadata extraction → review & `POST .../submit`.
2. **Editorial queue** (`/dashboard`, role-aware): status counters, queue by
   status, per-manuscript panels that only render for the current status.
3. **Decisions**: `POST /manuscripts/{mid}/decision` with
   `accept|reject|minor_revision|major_revision` (+ note sent to the author).
4. **Publishing** (editor-in-chief+): requires `proof`; creates the public
   `Article` (slug deduplicated, Markdown body → HTML), links researchers by
   author email, mints a demo DOI (`10.5555/...` via `doi_service`) and notifies
   the author.

## Review

- Reviewer matching is advisory: keyword/title overlap scoring against
  `reviewer_profiles`; the editor decides (no double-blind logic in the demo).
- A review is created with `POST`, scores/`recommendation`/comments are saved
  with `PATCH`; providing a `recommendation` submits the review and moves the
  manuscript to `reviews_received`.
- Editors see all reviews; authors never see reviewer identity.

## Guardrails

- `can_transition` is the single source of truth; the UI mirrors it.
- Authors cannot invite themselves (`400`).
- AI analysis (`POST .../ai/analyze`) is advisory-only, never decision-making;
  the UI labels it "informational only".
- DOCX extraction never overwrites manual data silently — it returns detected
  metadata for human review.
- Every mutation writes an `audit_logs` entry.