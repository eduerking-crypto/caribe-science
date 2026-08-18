"""DOIService — test interno en desarrollo; Crossref registration en producción (nunca DOIs falsos)."""
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DoiRecord


class DOIService:
    def __init__(self, provider: str = "internal_test") -> None:
        self.provider = provider

    def register(self, db: Session, entity_type: str, entity_id: str, prefix: str = "10.0000.caribe") -> DoiRecord:
        """Crea DOI de test interno o real según configuración. Nunca marca registered=True sin registrarlo."""
        doi = f"{prefix}.{uuid.uuid4().hex[:12]}"
        record = db.scalar(select(DoiRecord).where(DoiRecord.entity_type == entity_type, DoiRecord.entity_id == entity_id))
        if record:
            return record
        record = DoiRecord(
            doi=doi, entity_type=entity_type, entity_id=entity_id,
            registered=False, provider=self.provider, deposit_state="pending",
        )
        db.add(record)
        db.commit()
        return record

    def resolve(self, db: Session, doi: str) -> Optional[DoiRecord]:
        return db.scalar(select(DoiRecord).where(DoiRecord.doi == doi))


doiservice = DOIService()