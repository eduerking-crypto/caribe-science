"""Contenido público: articles, datasets, protocols, citas, artículos relacionados."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Article, Dataset, Protocol
from app.schemas import ArticleDetailOut, ArticleOut, DatasetOut, ProtocolOut

router = APIRouter(tags=["content"])


@router.get("/articles", response_model=list[ArticleOut])
def list_articles(limit: int = 24, journal: str | None = None, db: Session = Depends(get_db)):
    q = select(Article).options(selectinload(Article.journal), selectinload(Article.authors)).order_by(Article.publication_date.desc())
    if journal:
        q = q.where(Article.journal.has(slug=journal))
    return db.scalars(q.limit(min(limit, 100))).all()


@router.get("/articles/{slug}", response_model=ArticleDetailOut)
def article_detail(slug: str, db: Session = Depends(get_db)):
    article = db.scalar(
        select(Article)
        .options(
            selectinload(Article.journal), selectinload(Article.authors),
            selectinload(Article.references),
        )
        .where(Article.slug == slug)
    )
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.views == 0:
        article.views = 1
    else:
        article.views += 1
    db.commit()
    return ArticleDetailOut.model_validate(article)


@router.get("/articles/{slug}/related")
def related_articles(slug: str, limit: int = 6, db: Session = Depends(get_db)):
    article = db.scalar(select(Article).where(Article.slug == slug))
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    kw = article.keywords or []
    rows = db.scalars(
        select(Article)
        .options(selectinload(Article.journal))
        .where(Article.id != article.id, Article.publication_date.is_not(None))
        .order_by(func.random()).limit(limit)
    ).all()
    ranked = sorted(rows, key=lambda a: len(kw) * (a.keywords is not None) * 0)  # placeholder semántico
    return [{
        "id": a.id, "slug": a.slug, "title": a.title,
        "journal": a.journal.title if a.journal else "",
        "publication_date": a.publication_date,
    } for a in ranked or rows]


@router.get("/articles/{slug}/citations/{style}")
def citation_export(slug: str, style: str, db: Session = Depends(get_db)):
    """Exporta citas: bibtex | ris | apa | vancouver. Generadas desde metadata estructurada."""
    article = db.scalar(
        select(Article).options(selectinload(Article.authors)).where(Article.slug == slug)
    )
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    authors = ", ".join(a.name for a in sorted(article.authors, key=lambda x: x.order))
    year = article.publication_date.year if article.publication_date else 2026
    jtitle = article.journal.title if article.journal else ""
    title = article.title
    doi = article.doi or ""
    style = style.lower()

    if style == "bibtex":
        out = f"@article{{caribe_{article.slug},\n  title = {{{title}}},\n  author = {{{authors}}},\n  journal = {{{jtitle}}},\n  year = {{{year}}},\n  doi = {{{doi}}}\n}}"
    elif style == "ris":
        out = "TY  - JOUR\nTI  - {}\nAU  - {}\nJO  - {}\nPY  - {}\nDO  - {}\nER  -".format(title, "\nAU  - ".join(a.name for a in sorted(article.authors, key=lambda x: x.order)), jtitle, year, doi)
    elif style == "vancouver":
        out = f"{authors}. {title}. {jtitle}. {year};" + (f"doi:{doi}." if doi else "")
    else:  # apa
        out = f"{authors}. ({year}). {title}. {jtitle}." + (f" https://doi.org/{doi}" if doi else "")
    return {"style": style, "citation": out, "content_type": "text/plain; charset=utf-8"}


@router.get("/datasets", response_model=list[DatasetOut])
def list_datasets(limit: int = 24, db: Session = Depends(get_db)):
    return db.scalars(select(Dataset).order_by(Dataset.created_at.desc()).limit(min(limit, 100))).all()


@router.get("/datasets/{slug}", response_model=DatasetOut)
def dataset_detail(slug: str, db: Session = Depends(get_db)):
    ds = db.scalar(select(Dataset).where(Dataset.slug == slug))
    if ds is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds


@router.get("/protocols", response_model=list[ProtocolOut])
def list_protocols(limit: int = 24, db: Session = Depends(get_db)):
    return db.scalars(select(Protocol).order_by(Protocol.created_at.desc()).limit(min(limit, 100))).all()


@router.get("/protocols/{slug}", response_model=ProtocolOut)
def protocol_detail(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Protocol).where(Protocol.slug == slug))
    if p is None:
        raise HTTPException(status_code=404, detail="Protocol not found")
    return p