# Performance

## Frontend

- **SSR with `cache: "no-store"`** on all public pages — the journal is
  content-heavy and latency to fresh data beats stale ISR for a demo stage.
  Pages are `dynamic = "force-dynamic"`, so they always reflect the DB.
- **Lazy 3D/map progressive enhancement**:
  - `Globe3D` (react-three-fiber) is `next/dynamic` with `Suspense` — the
    hero renders instantly, WebGL mounts only when supported and idle.
  - `MapCaribe` (MapLibre) uses a **custom `style` object with no tile
    servers** (dots on a flat background) — zero external requests, works
    offline and behind firewalls.
  - Both respect `prefers-reduced-motion` (globe rotation disabled).
- **Fonts**: next/font/google with `display: swap` (Fraunces + Inter),
  self-hosted at build time — no render-blocking third-party font requests.
- **Client bundle discipline**: only interactive routes are client components;
  lists/cards are Server Components sharing a small `ui.tsx` kit.
- **Debounced autosave** (800 ms) in the submission wizard avoids spamming
  `PATCH` while typing.
- Images/static content minimal; the site is data-driven text + SVG/CSS art.

## Backend

- **SQLAlchemy 2** with `selectinload` for the hot read shapes
  (journal/author/article graph) — no N+1 on list endpoints.
- **Read endpoints are public and cached-free but cheap** (SQLite local,
  indexed FKs); search hits are reference slices, not full documents.
- **External calls never block the critical path**: providers run with
  timeouts/retries/backoff and results are cached in `external_metadata`;
  API usage rows are aggregate-per-day (single row update, not append).
- **Addictive-but-light AI**: `ai_check_manuscript` is synchronous and
  strictly bounded (rule-based core, optional Ollama) — advisory only.
- SQLite pragmas: WAL journal mode, `synchronous=NORMAL`, busy timeout.

## Known notes & next steps

- Move to PostgreSQL + Redis (`cachetools`-style in-memory cache already
  capped) when Docker is available; the code paths are already isolated.
- Add response compression middleware and ETag/304s on list endpoints.
- Pagination is applied at the researcher list (`limit=60` default); articles
  and journals are bounded by seed size — add `page`/`page_size` (schema
  `PageOut` already exists) for production volumes.
- Turn on ISR/`revalidate` once content updates are event-driven
  (webhook from publish) instead of per-request fetch.