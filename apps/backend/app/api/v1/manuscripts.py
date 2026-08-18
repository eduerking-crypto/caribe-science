"""Manuscritos: wizard (autosave), archivos, submission, workflow editorial, revisiones, AI."""
import logging
import re
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import (
    AiAnalysis, AuditLog, Manuscript, ManuscriptAuthor, ManuscriptFile, ManuscriptVersion,
    Notification, Researcher, Review, ReviewerInvitation, ReviewerProfile, User, WorkflowEvent,
)
from app.schemas import (
    AiAnalysisOut, DecisionIn, FileOut, InvitationOut, InvitationRespondIn, ManuscriptAuthorIn,
    ManuscriptCreateIn, ManuscriptDetailOut, ManuscriptOut, ManuscriptUpdateIn,
    ReviewIn, ReviewOut, ReviewerMatchOut, SubmitIn, TransitionIn,
)
from app.services.ai_service import ai_check_manuscript
from app.services.doi_service import doiservice
from app.services.storage import StorageError, storage
from app.services.workflow import can_transition, is_terminal

router = APIRouter(prefix="/manuscripts", tags=["manuscripts"])

EDITOR_ROLES = ("editor", "section_editor", "editor_in_chief", "journal_admin", "platform_admin")


def _audit(db: Session, actor: User, action: str, entity: str, entity_id: str, detail: dict | None = None) -> None:
    db.add(AuditLog(actor_id=actor.id, action=action, entity_type=entity, entity_id=entity_id, detail=detail or {}))
    db.commit()


def _notify(db: Session, user_id: str, kind: str, title: str, body: str = "", link: str = "") -> None:
    db.add(Notification(user_id=user_id, kind=kind, title=title, body=body, link=link))


def _load(db: Session, mid: str) -> Manuscript:
    ms = db.scalar(
        select(Manuscript)
        .options(selectinload(Manuscript.journal), selectinload(Manuscript.authors), selectinload(Manuscript.files), selectinload(Manuscript.events))
        .where(Manuscript.id == mid)
    )
    if ms is None:
        raise HTTPException(status_code=404, detail="Manuscript not found")
    return ms


def _can_access(ms: Manuscript, user: User) -> bool:
    if user.role in EDITOR_ROLES or user.role in ("platform_admin", "journal_admin"):
        return True
    return ms.owner_id == user.id


# ---------------------------------------------------------------- CRUD wizard / autosave


@router.post("", response_model=ManuscriptOut, status_code=status.HTTP_201_CREATED)
def create_manuscript(data: ManuscriptCreateIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = Manuscript(owner_id=current.id, journal_id=data.journal_id, section_id=data.section_id,
                    special_issue_id=data.special_issue_id, article_type=data.article_type or "research_article")
    db.add(ms)
    db.flush()
    db.add(ManuscriptVersion(manuscript_id=ms.id, version=1))
    db.commit()
    _audit(db, current, "manuscript.create", "manuscripts", ms.id)
    return _load(db, ms.id)


@router.get("", response_model=list[ManuscriptOut])
def list_my_manuscripts(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(Manuscript).options(selectinload(Manuscript.journal), selectinload(Manuscript.authors)).order_by(Manuscript.updated_at.desc())
    if current.role not in EDITOR_ROLES:
        q = q.where(Manuscript.owner_id == current.id)
    return db.scalars(q).all()


@router.get("/dashboard/stats")
def editor_stats(current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    def count(statuses: list[str]) -> int:
        return db.scalar(select(func.count(Manuscript.id)).where(Manuscript.status.in_(statuses))) or 0

    return {
        "new_submissions": count(["submitted"]),
        "technical_checks": count(["technical_check"]),
        "awaiting_editors": count(["editorial_check", "assigned_to_editor"]),
        "reviewer_invitations": count(["reviewer_invitations"]),
        "active_reviews": count(["under_review"]),
        "reviews_received": count(["reviews_received"]),
        "revisions": count(["minor_revision", "major_revision"]),
        "decisions_pending": count(["editor_decision"]),
        "accepted": count(["accepted"]),
        "published": count(["published"]),
        "rejected": count(["rejected"]),
        "total": count([s for s in ("draft", "submitted", "technical_check", "editorial_check", "assigned_to_editor", "reviewer_invitations", "under_review", "reviews_received", "editor_decision", "rejected", "minor_revision", "major_revision", "accepted", "production", "proof", "published")]),
    }


@router.get("/queue")
def editorial_queue(status: str | None = None, current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    q = select(Manuscript).options(selectinload(Manuscript.journal), selectinload(Manuscript.authors)).order_by(Manuscript.updated_at.desc())
    if status:
        q = q.where(Manuscript.status == status)
    return db.scalars(q).all()


@router.get("/reviewer/my-reviews")
def my_reviews(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Review).options(selectinload(Review.manuscript)).where(Review.reviewer_user_id == current.id)
    ).all()
    return [{
        "id": r.id, "manuscript_id": r.manuscript_id, "title": r.manuscript.title,
        "status": r.status, "recommendation": r.recommendation, "submitted_at": r.submitted_at,
    } for r in rows]


@router.get("/{mid}", response_model=ManuscriptDetailOut)
def get_manuscript(mid: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if not _can_access(ms, current):
        raise HTTPException(status_code=403, detail="Not allowed")
    return ms


@router.patch("/{mid}", response_model=ManuscriptDetailOut)
def update_manuscript(mid: str, data: ManuscriptUpdateIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.owner_id != current.id and current.role not in EDITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")
    for field, value in data.model_dump(exclude_none=True).items():
        if value is not None:
            setattr(ms, field, value)
    db.commit()
    return _load(db, mid)


@router.put("/{mid}/authors", response_model=ManuscriptDetailOut)
def save_authors(mid: str, authors: list[ManuscriptAuthorIn], current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.owner_id != current.id and current.role not in EDITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")
    ms.authors.clear()
    db.flush()
    for a in authors:
        ms.authors.append(ManuscriptAuthor(**a.model_dump()))
    db.commit()
    _audit(db, current, "manuscript.authors", "manuscripts", mid)
    return _load(db, mid)


@router.post("/{mid}/files", response_model=FileOut)
async def upload_file(mid: str, file: UploadFile, kind: str = "manuscript", current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.owner_id != current.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    try:
        info = await storage.save(file, kind=kind, version=ms.version)
    except StorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    mf = ManuscriptFile(manuscript_id=mid, uploader_id=current.id, kind=kind, version=ms.version, **info)
    db.add(mf)
    db.commit()
    _audit(db, current, "manuscript.file_upload", "manuscripts", mid, {"file": info["original_name"], "kind": kind})
    return mf


@router.delete("/{mid}/files/{fid}", response_model=dict)
def delete_file(mid: str, fid: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.owner_id != current.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    mf = db.get(ManuscriptFile, fid)
    if mf is None or mf.manuscript_id != mid:
        raise HTTPException(status_code=404, detail="File not found")
    storage.delete(mf.storage_path)
    db.delete(mf)
    db.commit()
    return {"deleted": fid}


@router.post("/{mid}/parse-docx")
async def parse_docx(mid: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Extrae metadata de DOCX (título/autores/abstract) con python-docx + Ollama AI. Nunca sobrescribe datos manuales."""
    ms = _load(db, mid)
    if ms.owner_id != current.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    docx = next((f for f in ms.files if f.mime in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",) and f.kind == "manuscript"), None)
    if docx is None:
        raise HTTPException(status_code=400, detail="No DOCX manuscript file found")
    try:
        from docx import Document
    except ImportError:
        return {"message": "DOCX parsing unavailable (python-docx not installed)", "extracted": {}}
    path = storage._base() / docx.storage_path  # noqa: SLF001
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stored file missing")

    doc = Document(str(path))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(paragraphs[:80])

    extracted: dict[str, Any] = {}
    if paragraphs:
        extracted["title"] = paragraphs[0]

    ai_text = None
    try:
        from app.services.ai_service import ai_provider as _ai_prov
        system = (
            "You are a scientific document parser. Extract metadata from the manuscript text below. "
            "Return ONLY a JSON object with these fields (use null if not found): "
            '{"title": "string", "abstract": "string (150-300 words)", '
            '"authors": [{"name": "string", "institution": "string", "email": "string|null"}], '
            '"keywords": ["string"], "article_type": "research_article|review_article|short_communication|methods_article|data_paper"}. '
            "Do NOT include any text outside the JSON object."
        )
        prompt = f"Extract metadata from this manuscript:\n\n{full_text[:6000]}"
        ai_text = await _ai_prov.analyze(prompt, system=system)
    except Exception as exc:  # noqa: BLE001
        logger.info("AI extraction unavailable: %s", exc)

    if ai_text:
        import json as _json
        try:
            cleaned = ai_text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
            data = _json.loads(cleaned)
            if data.get("title") and not ms.title:
                extracted["title"] = data["title"]
            if data.get("abstract"):
                extracted["abstract"] = data["abstract"]
            if data.get("authors"):
                extracted["authors"] = data["authors"]
            if data.get("keywords"):
                extracted["keywords"] = data["keywords"]
            if data.get("article_type"):
                extracted["article_type"] = data["article_type"]
            extracted["ai_model"] = _ai_prov.name
        except (ValueError, KeyError):
            pass

    if not extracted.get("abstract") and paragraphs:
        for i, p in enumerate(paragraphs):
            low = p.lower()
            if any(kw in low for kw in ("abstract", "resumen")) and len(p) > 40:
                abstract_lines = [p]
                for j in range(i + 1, min(i + 8, len(paragraphs))):
                    if any(kw in paragraphs[j].lower() for kw in ("keyword", "introduction", "introducción", "background")):
                        break
                    abstract_lines.append(paragraphs[j])
                extracted["abstract"] = " ".join(abstract_lines).strip()
                break

    return {
        "message": "Review extracted metadata before applying (never overwrite silently)",
        "extracted": extracted,
    }


# ---------------------------------------------------------------- submission + workflow


def _transition(db: Session, ms: Manuscript, target: str, actor: User, note: str = "") -> None:
    result = can_transition(ms.status, target)
    if not result.ok:
        raise HTTPException(status_code=409, detail=result.error)
    db.add(WorkflowEvent(manuscript_id=ms.id, from_status=ms.status, to_status=target, actor_id=actor.id, note=note))
    ms.status = target
    db.commit()
    _audit(db, actor, f"workflow.{ms.status}", "manuscripts", ms.id, {"to": target, "note": note})


@router.post("/{mid}/submit", response_model=ManuscriptDetailOut)
def submit(mid: str, data: SubmitIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.owner_id != current.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if not ms.title.strip():
        raise HTTPException(status_code=400, detail="Title is required before submission")
    if len(ms.abstract or "") < 50:
        raise HTTPException(status_code=400, detail="Abstract is required (min 50 chars)")
    _transition(db, ms, "submitted", current, data.note)
    ms.submitted_at = datetime.now(timezone.utc)
    db.commit()
    _notify(db, ms.owner_id, "submission_received", "Submission received", f"Your manuscript is under technical check: {ms.title}", f"/dashboard/manuscripts/{ms.id}")
    db.commit()
    return _load(db, mid)


@router.post("/{mid}/transition", response_model=ManuscriptDetailOut)
def transition(mid: str, data: TransitionIn, current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    _transition(db, ms, data.note, current, data.note)
    return _load(db, mid)


@router.post("/{mid}/decision", response_model=ManuscriptDetailOut)
def editorial_decision(mid: str, data: DecisionIn, current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.status not in ("editor_decision", "reviews_received", "under_review"):
        raise HTTPException(status_code=409, detail=f"Cannot decide from status '{ms.status}'")
    target = data.decision.lower()
    mapping = {"accept": "accepted", "reject": "rejected", "minor_revision": "minor_revision", "major_revision": "major_revision"}
    if target not in mapping:
        raise HTTPException(status_code=400, detail="decision must be accept|reject|minor_revision|major_revision")
    target_status = mapping[target]
    _transition(db, ms, target_status, current, data.note)
    ms.editor_decision = target
    ms.decision_note = data.note
    db.commit()
    kind = "accepted" if target == "accept" else "rejected" if target == "reject" else "revision_requested"
    title = "Manuscript accepted" if target == "accept" else "Manuscript rejected" if target == "reject" else "Revision requested"
    _notify(db, ms.owner_id, kind, title, f"{ms.title}: {data.note}", f"/dashboard/manuscripts/{ms.id}")
    db.commit()
    return _load(db, mid)


@router.post("/{mid}/publish", response_model=ManuscriptDetailOut)
def publish(mid: str, current: User = Depends(require_roles("editor_in_chief", "journal_admin", "platform_admin")), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if ms.status != "proof":
        raise HTTPException(status_code=409, detail="Manuscript must be in 'proof' before publishing")
    from app.models import Article, ArticleAuthor, ArticleReference, DoiRecord, Journal, JournalSection

    journal = db.get(Journal, ms.journal_id)
    section = db.get(JournalSection, ms.section_id) if ms.section_id else None
    section_name = section.name if section else ""
    slug = re.sub(r"[^a-z0-9]+", "-", ms.title.lower()).strip("-")[:180] or f"article-{ms.id[:8]}"
    base_slug, n = slug, 2
    while db.scalar(select(Article.id).where(Article.slug == base_slug)):
        base_slug = f"{slug}-{n}"
        n += 1
    article = Article(
        slug=base_slug, manuscript_id=ms.id, journal_id=ms.journal_id, section_id=ms.section_id,
        title=ms.title, abstract=ms.abstract, keywords=ms.keywords,
        section_label=section_name, article_type=ms.article_type,
        body_html=_md_to_html(ms.body), license=journal.license if journal else "CC BY 4.0",
        funding=ms.funding, conflicts=ms.conflicts, data_availability=ms.data_availability,
        publication_date=datetime.now(timezone.utc), is_demo=False,
    )
    for a in sorted(ms.authors, key=lambda x: x.order):
        researcher = None
        if a.email:
            user = db.scalar(select(User).where(User.email == a.email.lower()))
            if user:
                researcher = db.scalar(select(Researcher).where(Researcher.user_id == user.id))
        article.authors.append(ArticleAuthor(
            name=a.name, orcid=a.orcid, institution=a.institution, country_code=a.country_code,
            is_corresponding=a.is_corresponding, order=a.order, researcher_id=researcher.id if researcher else None,
        ))
    db.add(article)
    db.flush()
    record = doiservice.register(db, "article", article.id)
    article.doi = record.doi
    _transition(db, ms, "published", current, "Published")
    ms.published_at = datetime.now(timezone.utc)
    db.commit()
    _notify(db, ms.owner_id, "published", "Article published", ms.title, f"/articles/{article.slug}")
    db.commit()
    return _load(db, mid)


def _md_to_html(text: str) -> str:
    """Mini convertidor MD->HTML (títulos, listas, párrafos, negritas)."""
    if not text:
        return ""
    import html as _html

    lines = text.splitlines()
    out: list[str] = []
    in_list = False
    for line in lines:
        s = line.strip()
        if not s:
            if in_list:
                out.append("</ul>")
                in_list = False
            continue
        if s.startswith("###"):
            out.append(f"<h3>{_html.escape(s.lstrip('#').strip())}</h3>")
        elif s.startswith("##"):
            out.append(f"<h2>{_html.escape(s.lstrip('#').strip())}</h2>")
        elif s.startswith("#"):
            out.append(f"<h1>{_html.escape(s.lstrip('#').strip())}</h1>")
        elif re.match(r"^\s*[-*] ", s):
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{_html.escape(s[2:])}</li>")
        elif re.match(r"^\s*\d+\. ", s):
            out.append(f"<p>{_html.escape(s)}</p>")
        else:
            out.append(f"<p>{_html.escape(s)}</p>")
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


# ---------------------------------------------------------------- revisores / revisiones


@router.get("/{mid}/reviewer-matches", response_model=list[ReviewerMatchOut])
def reviewer_matches(mid: str, current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    """Recomendación de revisores (solo sugerencia; el editor decide). Matching por keywords."""
    ms = _load(db, mid)
    keywords = [k.lower() for k in (ms.keywords or [])] + (ms.title or "").lower().split()
    profiles = db.scalars(select(ReviewerProfile)).all()
    matches = []
    for prof in profiles:
        if prof.user_id == ms.owner_id:
            continue
        expert = [e.lower() for e in (prof.expertise or [])]
        overlap = len(set(keywords) & set(expert))
        score = min(0.95, 0.3 + 0.14 * overlap)
        user = db.get(User, prof.user_id)
        matches.append(ReviewerMatchOut(
            reviewer_id=prof.user_id, name=user.full_name if user else prof.user_id,
            orcid=prof.orcid, institution=prof.institution, country_code=prof.country_code,
            expertise=prof.expertise, score=round(score, 2),
            reason=f"Expertise overlap in {overlap} keyword(s)",
        ))
    return sorted(matches, key=lambda m: -m.score)[:8]


@router.post("/{mid}/invitations", response_model=InvitationOut)
def invite_reviewer(mid: str, reviewer_user_id: str, current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    if db.scalar(select(ReviewerInvitation).where(ReviewerInvitation.manuscript_id == mid, ReviewerInvitation.reviewer_user_id == reviewer_user_id, ReviewerInvitation.status == "pending")):
        raise HTTPException(status_code=409, detail="Invitation already pending")
    if reviewer_user_id == ms.owner_id:
        raise HTTPException(status_code=400, detail="Cannot invite the author")
    invite = ReviewerInvitation(manuscript_id=mid, reviewer_user_id=reviewer_user_id, token="dev-token")
    db.add(invite)
    db.commit()
    _notify(db, reviewer_user_id, "reviewer_invitation", "Reviewer invitation", f"You were invited to review: {ms.title}", f"/dashboard/reviews")
    db.commit()
    return InvitationOut(id=invite.id, manuscript_id=mid, status=invite.status, invited_at=invite.invited_at, manuscript_title=ms.title)


@router.get("/invitations/mine", response_model=list[InvitationOut])
def my_invitations(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(ReviewerInvitation)
        .options(selectinload(ReviewerInvitation.manuscript))
        .where(ReviewerInvitation.reviewer_user_id == current.id)
        .order_by(ReviewerInvitation.invited_at.desc())
    ).all()
    return [InvitationOut(id=i.id, manuscript_id=i.manuscript_id, status=i.status, invited_at=i.invited_at, manuscript_title=i.manuscript.title) for i in rows]


@router.post("/invitations/{iid}", response_model=InvitationOut)
def respond_invitation(iid: str, data: InvitationRespondIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invite = db.get(ReviewerInvitation, iid)
    if invite is None or invite.reviewer_user_id != current.id:
        raise HTTPException(status_code=404, detail="Invitation not found")
    invite.status = "accepted" if data.accept else "declined"
    invite.responded_at = datetime.now(timezone.utc)
    db.commit()
    return InvitationOut(id=invite.id, manuscript_id=invite.manuscript_id, status=invite.status, invited_at=invite.invited_at, manuscript_title="")


@router.post("/{mid}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(mid: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms = _load(db, mid)
    invite = db.scalar(select(ReviewerInvitation).where(
        ReviewerInvitation.manuscript_id == mid, ReviewerInvitation.reviewer_user_id == current.id,
        ReviewerInvitation.status.in_(("accepted", "pending")),
    ))
    if invite is None and current.role not in EDITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not an invited reviewer")
    if db.scalar(select(Review).where(Review.manuscript_id == mid, Review.reviewer_user_id == current.id)):
        raise HTTPException(status_code=409, detail="Review already exists")
    review = Review(manuscript_id=mid, reviewer_user_id=current.id)
    db.add(review)
    db.commit()
    return review


@router.patch("/{mid}/reviews/{rid}", response_model=ReviewOut)
def save_review(mid: str, rid: str, data: ReviewIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    review = db.get(Review, rid)
    if review is None or review.manuscript_id != mid:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewer_user_id != current.id and current.role not in EDITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(review, field, value)
    if data.recommendation:
        review.status = "submitted"
        review.submitted_at = datetime.now(timezone.utc)
        ms = _load(db, mid)
        if ms.status == "under_review":
            _transition(db, ms, "reviews_received", current, "Review submitted")
        _notify(db, ms.owner_id, "review_received", "Review received", "A review was submitted", f"/dashboard/manuscripts/{ms.id}")
    db.commit()
    return review


@router.get("/{mid}/reviews", response_model=list[ReviewOut])
def list_reviews(mid: str, current: User = Depends(require_roles(*EDITOR_ROLES)), db: Session = Depends(get_db)):
    return db.scalars(select(Review).where(Review.manuscript_id == mid)).all()


# ---------------------------------------------------------------- AI


@router.post("/{mid}/ai/analyze", response_model=AiAnalysisOut)
def ai_analyze(mid: str, kind: str = "structure", current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Análisis asistido — hallazgos informativos, NUNCA decisionales."""
    ms = _load(db, mid)
    if not _can_access(ms, current):
        raise HTTPException(status_code=403, detail="Not allowed")
    analysis = ai_check_manuscript(ms, kind)
    db.add(analysis)
    db.commit()
    _audit(db, current, "ai.analyze", "manuscripts", mid, {"kind": kind, "model": analysis.model})
    return analysis