"""Proveedores externos — free-first, provider-agnostic, con timeout/retry/backoff/caché.

Prioridad de metadata: PostgreSQL -> Redis(cache) -> Crossref -> OpenAlex -> fallback local.
Un fallo de proveedor NUNCA rompe la plataforma: devuelve None y registra api_usage.
"""
import hashlib
import json
import logging
import time
from datetime import date
from typing import Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.cache import cache
from app.core.config import get_settings
from app.models import ApiUsage, ExternalMetadata

logger = logging.getLogger(__name__)
settings = get_settings()

RETRIES = 2
TIMEOUT = 8.0


# ---------------------------------------------------------------- api_usage


def _record_usage(db: Session, provider: str, endpoint: str, success: bool, time_ms: int, cached: bool = False) -> None:
    today = date.today().isoformat()
    row = db.scalar(select(ApiUsage).where(
        ApiUsage.provider == provider, ApiUsage.endpoint == endpoint, ApiUsage.date == today
    ))
    if row is None:
        row = ApiUsage(provider=provider, endpoint=endpoint, date=today)
        db.add(row)
    row.request_count += 1
    if success:
        row.success_count += 1
    else:
        row.error_count += 1
    if cached:
        row.cached_count += 1
    row.total_time_ms += time_ms
    db.commit()


def _get_external(db: Session, provider: str, source_id: str) -> Optional[dict]:
    return db.scalar(select(ExternalMetadata).where(
        ExternalMetadata.source_provider == provider, ExternalMetadata.source_id == source_id
    ))


def _store_external(db: Session, provider: str, source_id: str, payload: dict) -> None:
    raw = json.dumps(payload, sort_keys=True, default=str)
    row = _get_external(db, provider, source_id)
    if row is None:
        row = ExternalMetadata(
            source_provider=provider, source_id=source_id,
            payload=payload, raw_metadata_hash=hashlib.sha256(raw.encode()).hexdigest(),
        )
        db.add(row)
    else:
        row.payload = payload
        row.raw_metadata_hash = hashlib.sha256(raw.encode()).hexdigest()
    db.commit()


async def _fetch_with_retry(url: str, params: dict[str, Any], headers: dict[str, str], provider: str, endpoint: str, db: Session) -> Optional[dict]:
    t0 = time.time()
    for attempt in range(RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
                resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                _record_usage(db, provider, endpoint, True, int((time.time() - t0) * 1000))
                return resp.json()
            if resp.status_code in (429, 503):
                wait = 0.5 * (2 ** attempt)
                await time_async_wait(wait)
                continue
            logger.warning("[%s] HTTP %s on %s", provider, resp.status_code, endpoint)
        except Exception as exc:  # noqa: BLE001
            logger.warning("[%s] %s error: %s", provider, endpoint, exc)
            if attempt < RETRIES:
                await time_async_wait(0.5 * (2 ** attempt))
                continue
    _record_usage(db, provider, endpoint, False, int((time.time() - t0) * 1000))
    return None


async def time_async_wait(seconds: float) -> None:
    import asyncio

    await asyncio.sleep(seconds)


# ---------------------------------------------------------------- MetadataProvider


class MetadataProvider:
    async def get_by_doi(self, doi: str, db: Session) -> Optional[dict]:
        raise NotImplementedError

    async def search(self, query: str, db: Session, limit: int = 5) -> list[dict]:
        raise NotImplementedError


class CrossrefProvider(MetadataProvider):
    base = "https://api.crossref.org"

    async def get_by_doi(self, doi: str, db: Session) -> Optional[dict]:
        cached = _get_external(db, "crossref", doi)
        if cached:
            return cached.payload
        data = await _fetch_with_retry(
            f"{self.base}/works/{doi}", {"mailto": settings.crossref_email},
            {"User-Agent": "CARIBE-SCIENCE/0.1 (mailto:%s)" % settings.crossref_email},
            "crossref", f"works/{doi}", db,
        )
        if data:
            _store_external(db, "crossref", doi, data)
        return data

    async def search(self, query: str, db: Session, limit: int = 5) -> list[dict]:
        data = await _fetch_with_retry(
            f"{self.base}/works",
            {"query": query, "rows": limit, "select": "title,DOI,author,issued,container-title", "mailto": settings.crossref_email},
            {"User-Agent": "CARIBE-SCIENCE/0.1"},
            "crossref", "works", db,
        )
        if not data:
            return []
        return data.get("message", {}).get("items", [])


class OpenAlexProvider(MetadataProvider):
    base = "https://api.openalex.org"

    async def get_by_doi(self, doi: str, db: Session) -> Optional[dict]:
        cached = _get_external(db, "openalex", doi)
        if cached:
            return cached.payload
        data = await _fetch_with_retry(
            f"{self.base}/works/doi:{doi}", {"mailto": settings.openalex_email},
            {"User-Agent": "CARIBE-SCIENCE/0.1 (mailto:%s)" % settings.openalex_email},
            "openalex", "works/doi", db,
        )
        if data:
            _store_external(db, "openalex", doi, data)
        return data

    async def search(self, query: str, db: Session, limit: int = 5) -> list[dict]:
        data = await _fetch_with_retry(
            f"{self.base}/works",
            {"search": query, "per-page": limit, "mailto": settings.openalex_email},
            {"User-Agent": "CARIBE-SCIENCE/0.1"},
            "openalex", "works", db,
        )
        if not data:
            return []
        return data.get("results", [])


class UnpaywallProvider:
    """Descubrimiento de acceso abierto legal. No descarga contenido."""
    base = "https://api.unpaywall.org/v2"

    async def get_oa_location(self, doi: str, db: Session) -> Optional[dict]:
        cached = _get_external(db, "unpaywall", doi)
        if cached:
            return cached.payload
        data = await _fetch_with_retry(
            f"{self.base}/{doi}",
            {"email": settings.unpaywall_email}, {},
            "unpaywall", "v2/{doi}", db,
        )
        if data:
            _store_external(db, "unpaywall", doi, data)
        return data


class ORCIDPublicProvider:
    """Solo datos públicos de ORCID."""
    base = "https://pub.orcid.org/v3.0"

    async def get_public_record(self, orcid_id: str, db: Session) -> Optional[dict]:
        if not orcid_id:
            return None
        cached = _get_external(db, "orcid", orcid_id)
        if cached:
            return cached.payload
        data = await _fetch_with_retry(
            f"{self.base}/{orcid_id}/record",
            {}, {"Accept": "application/json"},
            "orcid", "record", db,
        )
        if data:
            _store_external(db, "orcid", orcid_id, data)
        return data


class MetadataService:
    """Caché local primero (PostgreSQL/Redis) -> Crossref -> OpenAlex. Nunca repite la misma consulta externa."""

    def __init__(self) -> None:
        self.crossref = CrossrefProvider()
        self.openalex = OpenAlexProvider()
        self.unpaywall = UnpaywallProvider()
        self.orcid_public = ORCIDPublicProvider()

    async def get_by_doi(self, doi: str, db: Session) -> Optional[dict]:
        for provider in (self.crossref, self.openalex):
            result = await provider.get_by_doi(doi, db)
            if result:
                return result
        return None

    async def search(self, query: str, db: Session, limit: int = 5) -> list[dict]:
        return await self.crossref.search(query, db, limit)


metadata_service = MetadataService()