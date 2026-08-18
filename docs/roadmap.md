# Roadmap

Status of the CARIBE SCIENCE implementation against the master specification.

## Done

- [x] Backend FastAPI: auth + RBAC, journals/catalog, content (articles,
  datasets, protocols), people, search, system endpoints.
- [x] Editorial pipeline: submission wizard with autosave, file upload,
  DOCX metadata extraction, validated state machine, queue, decisions,
  reviewer invitations + reviews, publishing (Article + demo DOI).
- [x] Integrations layer: Crossref/OpenAlex/Unpaywall/ORCID with
  retry/backoff/cache/usage accounting; advisory AI checks (Ollama optional).
- [x] Security base: PBKDF2-HMAC-SHA256, JWT, RBAC, audit logs,
  env-only secrets.
- [x] Seed data: 1 journal · 10 sections · 4 demo users · 8 researchers ·
  8 articles · datasets · protocols · in-review manuscript.
- [x] Frontend Next.js 16: design system (Tailwind v4 theme), homepage
  inmersion (3D globe + no-tile map), journals/articles/datasets/protocols/
  researchers lists + details, search, i18n EN/ES, dark mode,
  auth pages, role dashboards, submission wizard UI, manuscript page with
  per-status editorial actions.
- [x] Verified: production build (16 routes) + SSRed pages over live API.

## Next (short term)

- [ ] Playwright end-to-end pass with screenshots (light/dark, EN/ES,
      author/editor/reviewer journeys).
- [ ] Toast/feedback polish and final a11y audit passes (keyboard, focus,
      contrast on accent pairs).
- [ ] Pagination on list endpoints (`PageOut` schema is ready) + search
      faceting by type.
- [ ] Real email verification + password reset flows (token expiry, templates).

## Medium term

- [ ] Docker Compose: PostgreSQL + Redis + object storage; swap the degraded
      providers by implementing the same interfaces.
- [ ] ORCID OAuth connect (real token exchange) + Web of Science/Scopus
      metadata augmentation for published articles.
- [ ] Double-blind review support (anonymized manuscripts/interfaces),
      reviewer scoring reports to authors.
- [ ] DOI deposit to a test registry (DataCite sandbox) instead of the
      internal `10.5555` register.
- [ ] Notifications: email channel + RSS/ATOM for published articles.

## Long term

- [ ] Production infrastructure: CI, migrations (Alembic), observability
      (structured logs, metrics dashboards), multi-journal tenancy.
- [ ] OpenAlex/Crossref deposit of all published items, altmetrics feeds,
      citation graphs.
- [ ] Bilingual copy review by native speakers; additional regional locales.
- [ ] Community features: profiles with ORCID verification, institutional
      dashboards, topic alerts.

## Success metrics tracked

- `GET /metrics` exposes live counters (articles, researchers, institutions,
  journals, datasets, countries, views) — used by the homepage hero.
- `api_usage` table records provider cost/latency per day for budgeting.
- `audit_logs` provides the immutable trail for editorial accountability.