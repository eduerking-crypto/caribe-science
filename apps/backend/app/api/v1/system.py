"""System: health, ready, metrics, notificaciones, api_usage (admin)."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import ApiUsage, Article, Country, Dataset, Institution, Journal, Notification, Researcher, User
from app.schemas import ApiUsageOut, MetricsOut, NotificationOut

router = APIRouter(tags=["system"])


@router.get("/health")
def health():
    return {"status": "ok", "app": "CARIBE SCIENCE", "version": "0.1.0"}


@router.get("/ready")
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(select(1))
        db_ok = True
    except Exception:  # noqa: BLE001
        db_ok = False
    return {"status": "ready" if db_ok else "degraded", "database": "ok" if db_ok else "error", "cache": "memory", "storage": "local"}


@router.get("/metrics", response_model=MetricsOut)
def metrics(db: Session = Depends(get_db)):
    views = db.scalar(select(func.coalesce(func.sum(Article.views), 0))) or 0
    return MetricsOut(
        articles=db.scalar(select(func.count(Article.id))) or 0,
        researchers=db.scalar(select(func.count(Researcher.id))) or 0,
        institutions=db.scalar(select(func.count(Institution.id))) or 0,
        journals=db.scalar(select(func.count(Journal.id))) or 0,
        datasets=db.scalar(select(func.count(Dataset.id))) or 0,
        countries=db.scalar(select(func.count(Country.code))) or 0,
        views=views,
    )


@router.get("/notifications", response_model=list[NotificationOut])
def my_notifications(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models import User

    return db.scalars(select(Notification).where(Notification.user_id == current.id).order_by(Notification.created_at.desc()).limit(30)).all()


@router.post("/notifications/read-all")
def read_all(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models import User

    rows = db.scalars(select(Notification).where(Notification.user_id == current.id, Notification.read.is_(False))).all()
    for n in rows:
        n.read = True
    db.commit()
    return {"updated": len(rows)}


@router.get("/admin/api-usage", response_model=list[ApiUsageOut])
def api_usage(current: User = Depends(require_roles("journal_admin", "platform_admin")), db: Session = Depends(get_db)):
    return db.scalars(select(ApiUsage).order_by(ApiUsage.date.desc())).all()


@router.get("/admin/provider-status")
def provider_status(current: User = Depends(require_roles("journal_admin", "platform_admin")), db: Session = Depends(get_db)):
    from app.services.ai_service import ai_provider
    from app.core.config import get_settings

    settings = get_settings()
    usage = db.scalars(select(ApiUsage)).all()
    return {
        "ai": {"provider": settings.ai_provider, "model": settings.ai_model, "status": "configured"},
        "crossref": {"status": "configured", "email": settings.crossref_email},
        "openalex": {"status": "configured", "email": settings.openalex_email},
        "unpaywall": {"status": "configured", "email": settings.unpaywall_email},
        "orcid": {"status": "public_api"},
        "storage": {"backend": settings.storage_backend},
        "database": {"url": "sqlite" if settings.is_sqlite else "postgresql"},
        "usage_today": sum(1 for u in usage),
    }