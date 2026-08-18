# Architecture

## Overview

CARIBE SCIENCE is a regional open-access scientific publishing platform. It is a
monorepo with two applications:

```
apps/
├── backend/   FastAPI + SQLAlchemy 2 + SQLite (degraded mode without Docker)
└── web/       Next.js 16 (App Router) + Tailwind CSS v4 + React 19 + TypeScript
```

Both apps run locally in development with no external services required.

## Backend (FastAPI)

- `app/main.py` — FastAPI app, static file serving for uploads, CORS.
- `app/api/v1/` — routers:
  - `auth.py` — register, login, verification, profile, ORCID connection.
  - `people.py` — countries, institutions, researchers (+ publications).
  - `catalog.py` — journals, sections, special issues, editorial board.
  - `content.py` — articles (+ related, citations), datasets, protocols.
  - `search.py` — `/search` (multi-entity) and `/search/suggest`.
  - `manuscripts.py` — submission wizard (autosave), files, workflow, reviews, AI.
  - `integrations.py` — external metadata providers (DOI, OA, ORCID).
  - `system.py` — health, readiness, metrics, notifications, admin usage.
- `app/core/` — config (env), database session, security (PBKDF2 + JWT), dependency
  injection (auth, RBAC).
- `app/models.py` — SQLAlchemy 2 typed ORM models.
- `app/schemas.py` — Pydantic v2 request/response models.
- `app/services/` — workflow state machine, storage, DOI minting, metadata
  providers, AI assistance, seeding.

### Degraded mode

Docker is not required. Without a container runtime the platform runs with:

| Component  | Production target | Degraded fallback |
|-----------|-------------------|-------------------|
| Database  | PostgreSQL        | SQLite (file)     |
| Cache     | Redis             | in-memory dict    |
| Storage   | S3/object store   | local `data/` dir |
| Enrichment| live providers    | retry/timeout/cache, offline still works |

Every abstraction (storage, cache, providers) has an interface that can be
swapped without touching routes.

## Frontend (Next.js 16)

- App Router with Server Components for public pages; Client Components for
  interactive surfaces (search bar, theme, auth, dashboards, wizard).
- API client in `src/lib/api.ts` (SSOT for URL construction, token handling).
- TypeScript types in `src/lib/types.ts` mirror backend Pydantic schemas.
- i18n EN/ES via dictionaries + `caribe_locale` cookie (server + client).
- Theming with `next-themes`, `data-theme` attribute, Tailwind v4 dark variant.
- Progressive enhancement: 3D globe (R3F) and map (MapLibre) are lazy-loaded
  client components with reduced-motion support; the page works without them.

## Data flow

1. Public pages render server-side, fetching from the API with `cache: "no-store"`.
2. Mutations (auth, submissions, editorial actions) are client-side API calls.
3. The editorial workflow is enforced server-side by a state machine
   (`app/services/workflow.py`) — the frontend only offers legal transitions.
4. AI analysis is advisory-only and never takes a decision.

## Configuration

Backend settings (`.env` in `apps/backend/`): `SECRET_KEY`, JWT expiry,
`password_hash_iterations`, AI provider (ollama/disabled), storage base dir.

Frontend (`apps/web/.env.local`): `NEXT_PUBLIC_API_URL`
(default `http://127.0.0.1:8000/api/v1`).