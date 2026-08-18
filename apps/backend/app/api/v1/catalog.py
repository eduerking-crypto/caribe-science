"""Catálogo científico: journals, secciones, special issues, editorial board."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Article, Journal, Manuscript
from app.schemas import JournalDetailOut, JournalOut, SectionOut, SpecialIssueOut, EditorOut

router = APIRouter(tags=["catalog"])


@router.get("/journals", response_model=list[JournalOut])
def list_journals(db: Session = Depends(get_db)):
    return db.scalars(select(Journal).order_by(Journal.title)).all()


@router.get("/journals/{slug}", response_model=JournalDetailOut)
def journal_detail(slug: str, db: Session = Depends(get_db)):
    journal = db.scalar(
        select(Journal)
        .options(selectinload(Journal.sections), selectinload(Journal.editors), selectinload(Journal.special_issues))
        .where(Journal.slug == slug)
    )
    if journal is None:
        raise HTTPException(status_code=404, detail="Journal not found")
    article_count = db.scalar(select(func.count(Article.id)).where(Article.journal_id == journal.id)) or 0
    data = JournalDetailOut.model_validate(journal)
    data.article_count = article_count
    return data


@router.get("/journals/{slug}/sections", response_model=list[SectionOut])
def journal_sections(slug: str, db: Session = Depends(get_db)):
    journal = db.scalar(select(Journal).where(Journal.slug == slug))
    if journal is None:
        raise HTTPException(status_code=404, detail="Journal not found")
    return sorted(journal.sections, key=lambda s: s.order)


@router.get("/journals/{slug}/special-issues", response_model=list[SpecialIssueOut])
def journal_special_issues(slug: str, db: Session = Depends(get_db)):
    journal = db.scalar(
        select(Journal).options(selectinload(Journal.special_issues)).where(Journal.slug == slug)
    )
    if journal is None:
        raise HTTPException(status_code=404, detail="Journal not found")
    return journal.special_issues


@router.get("/journals/{slug}/editorial-board", response_model=list[EditorOut])
def journal_board(slug: str, db: Session = Depends(get_db)):
    journal = db.scalar(select(Journal).options(selectinload(Journal.editors)).where(Journal.slug == slug))
    if journal is None:
        raise HTTPException(status_code=404, detail="Journal not found")
    return sorted(journal.editors, key=lambda e: e.order)