# API

Base URL: `http://127.0.0.1:8000/api/v1` (configurable via `NEXT_PUBLIC_API_URL`).

Auth: `Authorization: Bearer <access_token>` for protected endpoints.

Errors: `{"detail": "..."}` (FastAPI default). The web API client surfaces
`detail` strings to the UI.

## Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe |
| GET | `/metrics` | Global counters (articles, researchers, journals…) |
| GET | `/countries` | Country list |
| GET | `/institutions` | Institution list |
| GET | `/researchers` | Researchers with article counts |
| GET | `/researchers/{rid}` | Researcher detail |
| GET | `/researchers/{rid}/publications` | Researcher's articles |
| GET | `/journals` | Journals |
| GET | `/journals/{slug}` | Journal detail (sections, editors, special issues) |
| GET | `/journals/{slug}/sections` | Sections of a journal |
| GET | `/journals/{slug}/special-issues` | Special issues |
| GET | `/journals/{slug}/editorial-board` | Editors |
| GET | `/articles` | Articles |
| GET | `/articles/{slug}` | Article detail (full text HTML, references) |
| GET | `/articles/{slug}/related` | Related articles |
| GET | `/articles/{slug}/citations/{bibtex\|ris\|apa\|vancouver}` | Citation export |
| GET | `/datasets` | Datasets |
| GET | `/datasets/{slug}` | Dataset detail |
| GET | `/protocols` | Protocols |
| GET | `/protocols/{slug}` | Protocol detail |
| GET | `/search?q=…&types=…&limit=…` | Multi-entity search |
| GET | `/search/suggest?q=…` | Autocomplete |
| GET | `/integrations/metadata/{doi}` | External metadata by DOI |
| GET | `/integrations/open-access/{doi}` | OA status by DOI |
| GET | `/integrations/orcid/{orcid}` | Public ORCID record |

Search response: `{query, hits: [{type, id, title, subtitle, slug, url}], total}`.
Hit types: `article | researcher | journal | dataset | protocol`.

## Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account (201) |
| POST | `/auth/login` | Returns `{access_token, token_type, user}` |
| POST | `/auth/email/verify` | Verify email with token |
| POST | `/auth/password/request` | Request reset |
| POST | `/auth/password/reset` | Reset with token |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update profile |
| POST | `/auth/orcid/connect` | Connect ORCID |
| GET | `/auth/me/researcher` | Linked researcher profile |

## Manuscripts (protected, role-aware)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/manuscripts` | author | Create draft |
| GET | `/manuscripts` | author/editor | List (mine, or all for editors) |
| GET | `/manuscripts/dashboard/stats` | editor | Status counters |
| GET | `/manuscripts/queue` | editor | Editorial queue (optional `?status=`) |
| GET | `/manuscripts/reviewer/my-reviews` | reviewer | My reviews |
| GET | `/manuscripts/invitations/mine` | reviewer | My invitations |
| POST | `/manuscripts/invitations/{iid}` | reviewer | Accept/decline `{accept}` |
| GET | `/manuscripts/{mid}` | owner/editor | Detail with events + files |
| PATCH | `/manuscripts/{mid}` | owner/editor | Autosave (title, abstract, body…) |
| PUT | `/manuscripts/{mid}/authors` | owner/editor | Replace author list |
| POST | `/manuscripts/{mid}/files` | owner | Upload file (multipart, `kind=`) |
| DELETE | `/manuscripts/{mid}/files/{fid}` | owner | Delete file |
| POST | `/manuscripts/{mid}/parse-docx` | owner | Extract title/abstract from DOCX |
| POST | `/manuscripts/{mid}/submit` | owner | Submit for review |
| POST | `/manuscripts/{mid}/transition` | editor | Legal workflow transition |
| POST | `/manuscripts/{mid}/decision` | editor | accept/reject/minor/major |
| POST | `/manuscripts/{mid}/publish` | editor-in-chief+ | Publish → creates Article + DOI |
| GET | `/manuscripts/{mid}/reviewer-matches` | editor | Suggested reviewers |
| POST | `/manuscripts/{mid}/invitations` | editor | Invite reviewer |
| POST | `/manuscripts/{mid}/reviews` | reviewer | Create review draft |
| PATCH | `/manuscripts/{mid}/reviews/{rid}` | reviewer | Scores + recommendation + comments |
| GET | `/manuscripts/{mid}/reviews` | editor | All reviews |
| POST | `/manuscripts/{mid}/ai/analyze?kind=…` | owner/editor | Advisory AI findings |

### Decision values

`accept → accepted`, `reject → rejected`, `minor_revision`, `major_revision`
(scores are 1–5 per criterion).

## Notifications / admin

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/notifications` | user | Notification feed |
| POST | `/notifications/read-all` | user | Mark all read |
| GET | `/admin/api-usage` | admin | Provider usage per day |
| GET | `/admin/provider-status` | admin | Provider health |

Static files (uploaded manuscripts): `GET /files/{kind}/{filename}`.