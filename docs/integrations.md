# Integrations

All external integrations live behind `apps/backend/app/services/providers.py`
and are **free-first, provider-agnostic, and offline-safe**.

## Metadata providers

| Provider | Base | Purpose |
|----------|------|---------|
| Crossref | `https://api.crossref.org` | DOI metadata lookup |
| OpenAlex | `https://api.openalex.org` | Fallback DOI metadata |
| Unpaywall | `https://api.unpaywall.org/v2` | Open-access status by DOI |
| ORCID public | `https://pub.orcid.org/v3.0` | Public record by ORCID iD |

Behavior:

- **Fallback chain**: Crossref first, OpenAlex second (`MetadataService`).
- **Retry**: bounded attempts with backoff per provider.
- **Cache**: successful lookups stored in `external_metadata`
  (provider + source_id) with a hash of the raw payload.
- **Accounting**: every call records `api_usage` (success/error/cached, latency,
  estimated cost, remaining rate limit when reported).
- **Degraded**: offline or provider-down returns `found: false` cleanly — the
  platform keeps working.

Route surface: `/integrations/metadata/{doi}`, `/integrations/open-access/{doi}`,
`/integrations/orcid/{orcid}`.

## DOI minting

`doi_service.DOIService` (provider `internal_test`) registers demo DOIs in the
`10.5555/...` range with `registered=False` and `deposit_state=pending`. On
publishing a manuscript it: creates the `Article`, links `ArticleAuthor` rows to
researchers by author email when a matching user/researcher exists, then mints
the DOI record. Swap the provider for DataCite/Crossref ECP in production.

## AI assistance (advisory)

`ai_service` exposes `OllamaProvider` (local models) and `DisabledProvider`.
`POST /manuscripts/{mid}/ai/analyze` runs a structure check (headings, abstract
length, DOI/COI/funding keywords) and returns findings with severity and
confidence. **Findings are informational; decisions are always human.**
Configure via `AI_PROVIDER=ollama|disabled` + model settings.

## ORCID

- `UserOut.orcid`, `POST /auth/orcid/connect` stub + public profile pull at
  `/integrations/orcid/{orcid}`.
- Researcher profiles (`researchers.orcid`, `orcid_verified`) display verified
  badges and link to `orcid.org`.

## Storage

`storage.StorageProvider` writes files to `data/files/{kind}/...` with
sanitized names and version-aware paths, served at `/files/{kind}/{filename}`.
Swap in S3-compatible storage by implementing the same interface.

## DOCX parsing

`POST /manuscripts/{mid}/parse-docx` (optional `python-docx`) extracts the first
paragraph as a candidate title and returns it for human review — it never
silently overwrites existing metadata.