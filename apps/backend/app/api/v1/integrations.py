"""Integraciones científicas externas — free-first, con caché local y fallback elegante."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import MetadataOut
from app.services.providers import metadata_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/metadata/{doi:path}", response_model=MetadataOut)
async def metadata_lookup(doi: str, db: Session = Depends(get_db)):
    """Busca metadata por DOI: cache local -> Crossref -> OpenAlex. Caída externa = 503 suave, no crash."""
    doi = doi.strip()
    if not doi.lower().startswith("10."):
        raise HTTPException(status_code=400, detail="Invalid DOI format")
    data = await metadata_service.get_by_doi(doi, db)
    if data is None:
        return MetadataOut(found=False, provider="local", data={})
    provider = "crossref" if data.get("message") else "openalex"
    return MetadataOut(found=True, provider=provider, data=data)


@router.get("/open-access/{doi:path}", response_model=MetadataOut)
async def open_access_lookup(doi: str, db: Session = Depends(get_db)):
    result = await metadata_service.unpaywall.get_oa_location(doi.strip(), db)
    if result is None:
        return MetadataOut(found=False, provider="unpaywall", data={})
    return MetadataOut(found=True, provider="unpaywall", data=result.get("best_oa_location", {}))


@router.get("/orcid/{orcid_id}", response_model=MetadataOut)
async def orcid_lookup(orcid_id: str, db: Session = Depends(get_db)):
    """Solo datos públicos de ORCID (nombre + actividades)."""
    import re
    if not re.fullmatch(r"\d{4}-\d{4}-\d{4}-\d{3}[\dX]", orcid_id or ""):
        raise HTTPException(status_code=400, detail="Invalid ORCID iD format")
    data = await metadata_service.orcid_public.get_public_record(orcid_id, db)
    if data is None:
        return MetadataOut(found=False, provider="orcid", data={})
    return MetadataOut(found=True, provider="orcid", data=data)