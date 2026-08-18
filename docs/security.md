# Security

## Authentication

- Passwords: **PBKDF2-HMAC-SHA256** (16-byte random salt, configurable
  iterations, constant-time comparison) — no heavy crypto dependencies.
- Tokens: **JWT HS256** with `sub`, `iat`, `exp`
  (`access_token_expire_minutes`, default 60). `InvalidTokenError` is the only
  failure path rejected in deps.
- Demo mode is local-first: no email sending, verification tokens are
  development-only, ORCID connect is a stub that must be exchanged for a real
  OAuth flow in production.

## Authorization (RBAC)

- `deps.require_roles(*roles)` gates editorial endpoints.
- Manuscripts: owner or editor-role may read; owner (or editor) may patch;
  uploads/parse/submit require ownership; publishing requires
  editor-in-chief/journal-admin/platform-admin.
- Reviews: only the reviewer who owns a review (or editors) may patch it;
  creating requires an accepted/pending invitation (or editor role).
- Notifications and `/admin/*` endpoints are user-scoped / admin-only.

## Data protection

- Secrets live in environment variables only (`apps/backend/.env`;
  `.env.example` documents them without values).
- Uploads are stored under the app data dir with sanitized names; served via a
  dedicated route, never user-supplied paths.
- Stored payloads from external providers are hashed
  (`raw_metadata_hash`) to detect tampering; cached results are treated as
  untrusted data.
- HTML from manuscripts is produced by an escaping markdown converter
  (`_md_to_html` escapes everything); seeded article `body_html` is trusted
  seed content only.

## API hardening

- CORS restricted to the frontend origin (configurable).
- All external provider calls: timeouts, bounded retries with backoff,
  per-provider usage accounting and rate-limit visibility.
- Input validation via Pydantic v2 (EmailStr, length bounds, score ranges 1–5).
- No secrets are ever logged.

## Threat notes (demo scope)

- Email verification is placeholder logic — replace with real verification
  tokens/emails before public launch.
- CSRF: bearer tokens in localStorage (acceptable for demo; prefer
  httpOnly cookies + CSRF tokens for production).
- Rate limiting is exercised at the provider layer but not globally on auth —
  add before exposing publicly.

## Frontend

- Tokens only in `localStorage` for the demo session; `clearSession()` on 401.
- No credentials in client bundle; API base is overridable per environment.
- The theme/locale cookies are `SameSite=Lax`.