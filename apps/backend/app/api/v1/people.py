"""Personas y geografía: researchers, institutions, countries."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Article, ArticleAuthor, Country, Institution, Journal, Researcher
from app.schemas import CountryOut, InstitutionOut, ResearcherOut

router = APIRouter(tags=["people"])


@router.get("/countries", response_model=list[CountryOut])
def list_countries(db: Session = Depends(get_db)):
    return db.scalars(select(Country).order_by(Country.name)).all()


@router.get("/institutions", response_model=list[InstitutionOut])
def list_institutions(db: Session = Depends(get_db)):
    return db.scalars(select(Institution).order_by(Institution.name)).all()


def _researcher_with_count(r: Researcher, db: Session) -> ResearcherOut:
    count = db.scalar(select(func.count(ArticleAuthor.id)).where(ArticleAuthor.researcher_id == r.id)) or 0
    out = ResearcherOut.model_validate(r)
    out.article_count = count
    return out


@router.get("/researchers", response_model=list[ResearcherOut])
def list_researchers(limit: int = 60, db: Session = Depends(get_db)):
    rows = db.scalars(select(Researcher).options(selectinload(Researcher.institution)).limit(limit)).all()
    return [_researcher_with_count(r, db) for r in rows]


@router.get("/researchers/{rid}", response_model=ResearcherOut)
def researcher_detail(rid: str, db: Session = Depends(get_db)):
    r = db.scalar(
        select(Researcher)
        .options(selectinload(Researcher.institution), selectinload(Researcher.articles))
        .where(Researcher.id == rid)
    )
    if r is None:
        raise HTTPException(status_code=404, detail="Researcher not found")
    return _researcher_with_count(r, db)


@router.get("/researchers/{rid}/publications")
def researcher_publications(rid: str, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(ArticleAuthor)
        .options(selectinload(ArticleAuthor.article).selectinload(Article.journal))
        .where(ArticleAuthor.researcher_id == rid)
        .order_by(Article.publication_date.desc())
    ).all()
    return [{
        "id": a.article.id, "slug": a.article.slug, "title": a.article.title,
        "journal": a.article.journal.title if a.article.journal else "",
        "doi": a.article.doi, "publication_date": a.article.publication_date,
        "is_corresponding": a.is_corresponding,
    } for a in rows if a.article]