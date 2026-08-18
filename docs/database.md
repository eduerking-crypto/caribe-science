# Database

SQLAlchemy 2.0 (typed `Mapped[...]` style). In degraded mode the engine is
SQLite (`apps/backend/data/caribe.db`); the schema is portable to PostgreSQL.

SQLite is configured with `PRAGMA foreign_keys = ON`, WAL mode and busy timeout.

## Conventions

- UUID string primary keys (generated client-side in the model layer).
- `Foreign key` is `country_code` → `countries.code` (the country PK is the ISO
  code, not a surrogate id).
- Timestamps are timezone-aware ISO 8601 (`datetime`).
- `is_demo` flags mark seed content so it can be purged for production.
- Relationship name is the plural noun; `foreign_keys` is explicit wherever a
  model has multiple FKs to the same target (e.g. `Manuscript.owner`).

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts (PBKDF2 hash, roles via join) |
| `roles`, `user_roles` | Role membership (`admin`, `editor`, `reviewer`, `author` + journal subroles) |
| `countries` | ISO code, EN/ES names, region, lat/lon |
| `institutions` | Affiliations with coordinates |
| `researchers` | Public researcher profiles (linked to users optionally) |
| `journals` | Journal metadata (ISSNs, license, APC, scope) |
| `journal_sections` | Section catalogue per journal |
| `special_issues` | SI catalogue (deadline, status) |
| `editors` | Editorial board members |
| `articles` | Published articles (body_html, metrics counters) |
| `article_authors` | Author list ordered by `order`, corresponding flag |
| `article_references` | Ordered references (DOI + citation string) |
| `datasets` | Open data records |
| `protocols` | Methods/protocol records |
| `manuscripts` | Submissions (status, version, decisions) |
| `manuscript_versions` | Version history entries |
| `manuscript_authors` | Draft author list |
| `manuscript_files` | Uploaded files (kind/version, storage path) |
| `workflow_events` | Audit timeline of every status transition |
| `reviews` | Reviewer scores (1–5 × 8 criteria) + recommendation |
| `reviewer_profiles` | Expertise for reviewer matching |
| `reviewer_invitations` | Invitation lifecycle (pending/accepted/declined) |
| `notifications` | In-app notification feed |
| `doi_records` | Demo DOI registry (`10.5555/...`) |
| `ai_analyses`, `ai_findings` | Advisory analysis results |
| `audit_logs` | Immutable action trail |
| `api_usage` | Provider usage/price tracking per day |
| `external_metadata` | Cached provider enrichment (provider + source_id) |

## Key relationships

```
users 1—N manuscripts (owner_id)
manuscripts 1—N files / events / versions
manuscripts N—1 journals
journals 1—N sections
articles 1—N authors / references
reviews N—1 manuscripts (reviewer_user_id)
researchers 1—N publications (via article_authors.researcher_id)
```

## Seeding

`python -m app.seed` (in `apps/backend`) creates: 1 journal with 10 sections,
4 demo users, 8 researchers, 8 articles, 2 datasets, protocols, and a manuscript
in review. `--force` rebuilds the schema (`drop_all` + `create_all`) before
seeding.

Demo accounts (password of the form `{Role}123!`):

| Email | Role |
|-------|------|
| admin@example.com | admin |
| editor@example.com | editor |
| reviewer@example.com | reviewer |
| author@example.com | author |

## Migrations

No Alembic migrations are included for the degraded mode; `create_all` from the
models is the source of truth. Introduce Alembic when moving to PostgreSQL.