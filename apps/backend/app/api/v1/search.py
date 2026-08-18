"""Búsqueda científica multi-entity + autocomplete. PostgreSQL FTS-ready; SearchProvider desacoplado."""
from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Article, Dataset, Journal, Protocol, Researcher
from app.schemas import SearchHit, SearchOut

router = APIRouter(tags=["search"])


def _search_articles(db: Session, q: str, limit: int) -> list[SearchHit]:
    pattern = f"%{q}%"
    rows = db.scalars(
        select(Article)
        .where(or_(Article.title.ilike(pattern), Article.abstract.ilike(pattern)))
        .order_by(Article.publication_date.desc())
        .limit(limit)
    ).all()
    return [SearchHit(type="article", id=a.id, title=a.title, subtitle=(a.abstract or "")[:140], slug=a.slug, url=f"/articles/{a.slug}") for a in rows]


def _search_researchers(db: Session, q: str, limit: int) -> list[SearchHit]:
    pattern = f"%{q}%"
    rows = db.scalars(select(Researcher).where(Researcher.full_name.ilike(pattern)).limit(limit)).all()
    return [SearchHit(type="researcher", id=r.id, title=r.full_name, subtitle=", ".join((r.research_areas or [])[:3]), slug=r.id, url=f"/researchers/{r.id}") for r in rows]


def _search_journals(db: Session, q: str, limit: int) -> list[SearchHit]:
    pattern = f"%{q}%"
    rows = db.scalars(select(Journal).where(or_(Journal.title.ilike(pattern), Journal.title_es.ilike(pattern))).limit(limit)).all()
    return [SearchHit(type="journal", id=j.id, title=j.title, subtitle=(j.description or "")[:140], slug=j.slug, url=f"/journals/{j.slug}") for j in rows]


def _search_datasets(db: Session, q: str, limit: int) -> list[SearchHit]:
    pattern = f"%{q}%"
    rows = db.scalars(select(Dataset).where(Dataset.title.ilike(pattern)).limit(limit)).all()
    return [SearchHit(type="dataset", id=d.id, title=d.title, subtitle=(d.description or "")[:140], slug=d.slug, url=f"/datasets/{d.slug}") for d in rows]


def _search_protocols(db: Session, q: str, limit: int) -> list[SearchHit]:
    pattern = f"%{q}%"
    rows = db.scalars(select(Protocol).where(Protocol.title.ilike(pattern)).limit(limit)).all()
    return [SearchHit(type="protocol", id=p.id, title=p.title, subtitle=(p.description or "")[:140], slug=p.slug, url=f"/protocols/{p.slug}") for p in rows]


@router.get("/search", response_model=SearchOut)
def search(q: str = "", types: str = "article,researcher,journal,dataset,protocol", limit: int = 10, db: Session = Depends(get_db)):
    query = q.strip()
    if not query:
        return SearchOut(query=q, hits=[], total=0)
    wanted = set(t.strip() for t in types.split(",") if t.strip())
    hits: list[SearchHit] = []
    if "article" in wanted:
        hits += _search_articles(db, query, limit)
    if "researcher" in wanted:
        hits += _search_researchers(db, query, limit)
    if "journal" in wanted:
        hits += _search_journals(db, query, limit)
    if "dataset" in wanted:
        hits += _search_datasets(db, query, limit)
    if "protocol" in wanted:
        hits += _search_protocols(db, query, limit)
    ranked = sorted(hits, key=lambda h: (0, h.title.lower().find(query.lower())) if h.title.lower().startswith(query.lower()) else (1, 0))
    return SearchOut(query=q, hits=ranked[: limit * 3], total=len(ranked))


@router.get("/search/suggest")
def suggest(q: str = "", db: Session = Depends(get_db)):
    """Autocomplete ligero para la barra de búsqueda."""
    if len(q.strip()) < 2:
        return {"suggestions": []}
    pattern = f"%{q.strip()}%"
    articles = db.scalars(select(Article.title).where(Article.title.ilike(pattern)).limit(5)).all()
    researchers = db.scalars(select(Researcher.full_name).where(Researcher.full_name.ilike(pattern)).limit(5)).all()
    journals = db.scalars(select(Journal.title).where(Journal.title.ilike(pattern)).limit(3)).all()
    return {"suggestions": [*articles, *researchers, *journals][:12]}