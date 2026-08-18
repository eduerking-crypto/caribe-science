"""CARIBE SCIENCE — modelo de datos científico (SQLAlchemy 2.0, portable SQLite/PostgreSQL)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# ---------------------------------------------------------------- helpers


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _fk(col: str) -> str:
    return f"{col}.id"


# ---------- RBAC ----------

user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id"), primary_key=True),
)


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255), default="")
    users: Mapped[list["User"]] = relationship(secondary=user_roles, back_populates="roles")
    permissions: Mapped[list["Permission"]] = relationship(secondary=role_permissions, back_populates="roles")


class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)  # ej: manuscript.submit
    roles: Mapped[list[Role]] = relationship(secondary=role_permissions, back_populates="permissions")


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    full_name: Mapped[str] = mapped_column(String(255), default="")
    role: Mapped[str] = mapped_column(String(64), default="researcher", index=True)  # rol primario
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    theme: Mapped[str] = mapped_column(String(16), default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    roles: Mapped[list[Role]] = relationship(secondary=user_roles, back_populates="users")
    tokens: Mapped[list["AuthToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    researcher: Mapped["Researcher | None"] = relationship(back_populates="user", uselist=False)


class AuthToken(Base):
    """Tokens de verificación de email / reset de contraseña."""
    __tablename__ = "auth_tokens"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("users")), index=True)
    purpose: Mapped[str] = mapped_column(String(32))  # email_verify | password_reset
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped[User] = relationship(back_populates="tokens")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    actor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("users")), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), default="")
    entity_id: Mapped[str] = mapped_column(String(64), default="")
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

# ---------- geografía ----------


class Country(Base):
    __tablename__ = "countries"
    code: Mapped[str] = mapped_column(String(4), primary_key=True)  # ISO 3166-1 alpha-2
    name: Mapped[str] = mapped_column(String(128), unique=True)
    name_es: Mapped[str] = mapped_column(String(128), default="")
    region: Mapped[str] = mapped_column(String(64), default="Caribbean")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)


class Institution(Base):
    __tablename__ = "institutions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255), index=True)
    acronym: Mapped[str] = mapped_column(String(32), default="")
    country_code: Mapped[str] = mapped_column(String(4), ForeignKey("countries.code"), index=True)
    city: Mapped[str] = mapped_column(String(128), default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    website: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    country: Mapped[Country] = relationship()
    researchers: Mapped[list["Researcher"]] = relationship(back_populates="institution")


class Researcher(Base):
    __tablename__ = "researchers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("users")), nullable=True, index=True)
    orcid: Mapped[str | None] = mapped_column(String(19), nullable=True, index=True)
    orcid_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    full_name: Mapped[str] = mapped_column(String(255), index=True)
    institution_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("institutions")), nullable=True, index=True)
    country_code: Mapped[str | None] = mapped_column(String(4), ForeignKey("countries.code"), nullable=True, index=True)
    biography: Mapped[str] = mapped_column(Text, default="")
    research_areas: Mapped[list] = mapped_column(JSON, default=list)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped[User | None] = relationship(back_populates="researcher")
    institution: Mapped[Institution | None] = relationship(back_populates="researchers")
    country: Mapped[Country | None] = relationship()
    articles: Mapped[list["ArticleAuthor"]] = relationship(back_populates="researcher")

# ---------- revistas ----------


class Journal(Base):
    __tablename__ = "journals"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    title_es: Mapped[str] = mapped_column(String(255), default="")
    issn: Mapped[str] = mapped_column(String(16), default="")
    eissn: Mapped[str] = mapped_column(String(16), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    description_es: Mapped[str] = mapped_column(Text, default="")
    scope: Mapped[list] = mapped_column(JSON, default=list)
    publisher: Mapped[str] = mapped_column(String(255), default="CARIBE SCIENCE")
    license: Mapped[str] = mapped_column(String(64), default="CC BY 4.0")
    open_access: Mapped[bool] = mapped_column(Boolean, default=True)
    apc: Mapped[str] = mapped_column(String(64), default="No APC / APC waived")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    sections: Mapped[list["JournalSection"]] = relationship(back_populates="journal", cascade="all, delete-orphan")
    editors: Mapped[list["JournalEditor"]] = relationship(back_populates="journal", cascade="all, delete-orphan")
    special_issues: Mapped[list["SpecialIssue"]] = relationship(back_populates="journal", cascade="all, delete-orphan")


class JournalSection(Base):
    __tablename__ = "journal_sections"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    journal_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("journals")), index=True)
    name: Mapped[str] = mapped_column(String(128))
    name_es: Mapped[str] = mapped_column(String(128), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)
    journal: Mapped[Journal] = relationship(back_populates="sections")


class JournalEditor(Base):
    __tablename__ = "journal_editors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    journal_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("journals")), index=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(64), default="Editor")  # Editor-in-Chief, Section Editor...
    institution: Mapped[str] = mapped_column(String(255), default="")
    country_code: Mapped[str | None] = mapped_column(String(4), ForeignKey("countries.code"), nullable=True)
    research_areas: Mapped[list] = mapped_column(JSON, default=list)
    orcid: Mapped[str] = mapped_column(String(19), default="")
    order: Mapped[int] = mapped_column(Integer, default=0)
    journal: Mapped[Journal] = relationship(back_populates="editors")


class SpecialIssue(Base):
    __tablename__ = "special_issues"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    journal_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("journals")), index=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(128), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    deadline: Mapped[str | None] = mapped_column(String(16), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="open")  # open | closed | in_progress
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    journal: Mapped[Journal] = relationship(back_populates="special_issues")

# ---------- manuscritos (workflow editorial) ----------

MANUSCRIPT_STATUSES = [
    "draft", "submitted", "technical_check", "editorial_check", "assigned_to_editor",
    "reviewer_invitations", "under_review", "reviews_received", "editor_decision",
    "rejected", "minor_revision", "major_revision", "accepted",
    "production", "proof", "published",
]


class Manuscript(Base):
    __tablename__ = "manuscripts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("users")), index=True)
    journal_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("journals")), index=True)
    section_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("journal_sections")), nullable=True)
    special_issue_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("special_issues")), nullable=True)
    article_type: Mapped[str] = mapped_column(String(64), default="research_article")
    title: Mapped[str] = mapped_column(String(512), default="")
    abstract: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    body: Mapped[str] = mapped_column(Text, default="")  # texto del manuscrito (extraído de DOCX o manual)
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)  # v1, v2... control de versiones
    suggested_reviewers: Mapped[list] = mapped_column(JSON, default=list)
    excluded_reviewers: Mapped[list] = mapped_column(JSON, default=list)
    funding: Mapped[str] = mapped_column(Text, default="")
    conflicts: Mapped[str] = mapped_column(Text, default="")
    ethics: Mapped[str] = mapped_column(Text, default="")
    data_availability: Mapped[str] = mapped_column(Text, default="")
    author_contributions: Mapped[str] = mapped_column(Text, default="")
    acknowledgments: Mapped[str] = mapped_column(Text, default="")
    cover_letter: Mapped[str] = mapped_column(Text, default="")
    assigned_editor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("users")), nullable=True, index=True)
    editor_decision: Mapped[str | None] = mapped_column(String(32), nullable=True)
    decision_note: Mapped[str] = mapped_column(Text, default="")
    doi: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    owner: Mapped[User] = relationship(foreign_keys=[owner_id])
    journal: Mapped[Journal] = relationship()
    section: Mapped[JournalSection | None] = relationship()
    authors: Mapped[list["ManuscriptAuthor"]] = relationship(back_populates="manuscript", cascade="all, delete-orphan")
    files: Mapped[list["ManuscriptFile"]] = relationship(back_populates="manuscript", cascade="all, delete-orphan")
    versions: Mapped[list["ManuscriptVersion"]] = relationship(back_populates="manuscript", cascade="all, delete-orphan", order_by="ManuscriptVersion.version")
    events: Mapped[list["WorkflowEvent"]] = relationship(back_populates="manuscript", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="manuscript")
    invitations: Mapped[list["ReviewerInvitation"]] = relationship(back_populates="manuscript", cascade="all, delete-orphan")
    ai_analyses: Mapped[list["AiAnalysis"]] = relationship(back_populates="manuscript")


class ManuscriptVersion(Base):
    """Snapshot de metadata por versión — nunca se destruyen versiones previas."""
    __tablename__ = "manuscript_versions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    version: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(512), default="")
    abstract: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    manuscript: Mapped[Manuscript] = relationship(back_populates="versions")


class ManuscriptAuthor(Base):
    __tablename__ = "manuscript_authors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), default="")
    orcid: Mapped[str] = mapped_column(String(19), default="")
    institution: Mapped[str] = mapped_column(String(255), default="")
    country_code: Mapped[str | None] = mapped_column(String(4), ForeignKey("countries.code"), nullable=True)
    is_corresponding: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    manuscript: Mapped[Manuscript] = relationship(back_populates="authors")


class ManuscriptFile(Base):
    __tablename__ = "manuscript_files"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    original_name: Mapped[str] = mapped_column(String(512))
    storage_path: Mapped[str] = mapped_column(String(512))
    mime: Mapped[str] = mapped_column(String(128), default="")
    size: Mapped[int] = mapped_column(Integer, default=0)
    checksum: Mapped[str] = mapped_column(String(128), default="")  # sha256
    kind: Mapped[str] = mapped_column(String(32), default="manuscript")  # manuscript|figure|table|supplementary|graphical_abstract|cover_letter
    version: Mapped[int] = mapped_column(Integer, default=1)
    uploader_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("users")), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    manuscript: Mapped[Manuscript] = relationship(back_populates="files")


class WorkflowEvent(Base):
    __tablename__ = "workflow_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    from_status: Mapped[str] = mapped_column(String(32), default="")
    to_status: Mapped[str] = mapped_column(String(32))
    actor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("users")), nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    manuscript: Mapped[Manuscript] = relationship(back_populates="events")


class ReviewerProfile(Base):
    __tablename__ = "reviewer_profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("users")), index=True)
    expertise: Mapped[list] = mapped_column(JSON, default=list)
    orcid: Mapped[str] = mapped_column(String(19), default="")
    institution: Mapped[str] = mapped_column(String(255), default="")
    country_code: Mapped[str | None] = mapped_column(String(4), ForeignKey("countries.code"), nullable=True)
    publications_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ReviewerInvitation(Base):
    __tablename__ = "reviewer_invitations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    reviewer_user_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("users")), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|accepted|declined|expired
    token: Mapped[str] = mapped_column(String(128), default="")
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    manuscript: Mapped[Manuscript] = relationship(back_populates="invitations")


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    reviewer_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("users")), nullable=True)
    novelty: Mapped[int | None] = mapped_column(Integer, nullable=True)      # 1-5
    methodology: Mapped[int | None] = mapped_column(Integer, nullable=True)
    statistics: Mapped[int | None] = mapped_column(Integer, nullable=True)
    figures: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tables: Mapped[int | None] = mapped_column(Integer, nullable=True)
    references: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reproducibility: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ethics: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(32), nullable=True)  # accept|minor_revision|major_revision|reject
    confidential_comments: Mapped[str] = mapped_column(Text, default="")
    comments_to_authors: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="in_progress")  # in_progress|submitted
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    manuscript: Mapped[Manuscript] = relationship(back_populates="reviews")

# ---------- publicaciones ----------


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    manuscript_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), nullable=True, index=True)
    journal_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("journals")), index=True)
    section_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("journal_sections")), nullable=True)
    title: Mapped[str] = mapped_column(String(512))
    title_es: Mapped[str] = mapped_column(String(512), default="")
    abstract: Mapped[str] = mapped_column(Text, default="")
    abstract_es: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    keywords_es: Mapped[list] = mapped_column(JSON, default=list)
    body_html: Mapped[str] = mapped_column(Text, default="")
    section_label: Mapped[str] = mapped_column(String(128), default="")
    article_type: Mapped[str] = mapped_column(String(64), default="research_article")
    doi: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)  # test ID en dev
    doi_registered: Mapped[bool] = mapped_column(Boolean, default=False)  # nunca afirmar registro sin hacerlo
    license: Mapped[str] = mapped_column(String(64), default="CC BY 4.0")
    funding: Mapped[str] = mapped_column(Text, default="")
    conflicts: Mapped[str] = mapped_column(Text, default="")
    data_availability: Mapped[str] = mapped_column(Text, default="")
    code_availability: Mapped[str] = mapped_column(Text, default="")
    protocol_links: Mapped[list] = mapped_column(JSON, default=list)
    dataset_links: Mapped[list] = mapped_column(JSON, default=list)
    views: Mapped[int] = mapped_column(Integer, default=0)
    downloads: Mapped[int] = mapped_column(Integer, default=0)
    citations: Mapped[int] = mapped_column(Integer, default=0)  # conteo externo cuando llegue, nunca inventado
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    publication_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    journal: Mapped[Journal] = relationship()
    authors: Mapped[list["ArticleAuthor"]] = relationship(back_populates="article", cascade="all, delete-orphan")
    references: Mapped[list["ArticleReference"]] = relationship(back_populates="article", cascade="all, delete-orphan")


class ArticleAuthor(Base):
    __tablename__ = "article_authors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    article_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("articles")), index=True)
    researcher_id: Mapped[str | None] = mapped_column(String(36), ForeignKey(_fk("researchers")), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    orcid: Mapped[str] = mapped_column(String(19), default="")
    institution: Mapped[str] = mapped_column(String(255), default="")
    country_code: Mapped[str | None] = mapped_column(String(4), ForeignKey("countries.code"), nullable=True)
    is_corresponding: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    article: Mapped[Article] = relationship(back_populates="authors")
    researcher: Mapped[Researcher | None] = relationship(back_populates="articles")


class ArticleReference(Base):
    __tablename__ = "article_references"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    article_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("articles")), index=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    doi: Mapped[str] = mapped_column(String(64), default="")
    citation: Mapped[str] = mapped_column(Text)
    article: Mapped[Article] = relationship(back_populates="references")


class DoiRecord(Base):
    """Registro de DOIs: test interno en dev, Crossref en producción (nunca falsos DOIs)."""
    __tablename__ = "doi_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    doi: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(32))  # article | dataset
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    registered: Mapped[bool] = mapped_column(Boolean, default=False)
    provider: Mapped[str] = mapped_column(String(32), default="internal_test")
    deposit_state: Mapped[str] = mapped_column(String(32), default="pending")
    registered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

# ---------- datos científicos ----------


class Dataset(Base):
    __tablename__ = "datasets"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, default="")
    authors: Mapped[list] = mapped_column(JSON, default=list)
    license: Mapped[str] = mapped_column(String(64), default="CC BY 4.0")
    version: Mapped[str] = mapped_column(String(16), default="1.0")
    doi: Mapped[str] = mapped_column(String(64), default="")
    repository_url: Mapped[str] = mapped_column(Text, default="")
    file_name: Mapped[str] = mapped_column(String(255), default="")
    file_size: Mapped[str] = mapped_column(String(32), default="")
    format: Mapped[str] = mapped_column(String(64), default="CSV")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Protocol(Base):
    __tablename__ = "protocols"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(64), default="laboratory")
    authors: Mapped[list] = mapped_column(JSON, default=list)
    steps: Mapped[list] = mapped_column(JSON, default=list)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CodeResource(Base):
    __tablename__ = "code_resources"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    article_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("articles")), index=True)
    name: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")

# ---------- notificaciones / AI / proveedores ----------


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("users")), index=True)
    kind: Mapped[str] = mapped_column(String(64))  # submission_received, reviewer_invitation, review_received, revision_requested, accepted, rejected, proof_available, published
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text, default="")
    link: Mapped[str] = mapped_column(String(255), default="")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class AiAnalysis(Base):
    __tablename__ = "ai_analyses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    manuscript_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("manuscripts")), index=True)
    kind: Mapped[str] = mapped_column(String(64))  # structure|metadata|consistency|reviewer_match
    model: Mapped[str] = mapped_column(String(128), default="")
    provider: Mapped[str] = mapped_column(String(64), default="ollama")
    status: Mapped[str] = mapped_column(String(32), default="completed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    manuscript: Mapped[Manuscript] = relationship(back_populates="ai_analyses")
    findings: Mapped[list["AiFinding"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")


class AiFinding(Base):
    __tablename__ = "ai_findings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey(_fk("ai_analyses")), index=True)
    finding: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    explanation: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(255), default="rule_based")
    severity: Mapped[str] = mapped_column(String(16), default="info")
    analysis: Mapped[AiAnalysis] = relationship(back_populates="findings")


class ExternalMetadata(Base):
    """Metadata externa cacheadas con procedencia (Crossref/OpenAlex/Unpaywall/ORCID)."""
    __tablename__ = "external_metadata"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    source_provider: Mapped[str] = mapped_column(String(32), index=True)
    source_id: Mapped[str] = mapped_column(String(128), index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    raw_metadata_hash: Mapped[str] = mapped_column(String(64), default="")
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    __table_args__ = (UniqueConstraint("source_provider", "source_id", name="uq_external_metadata"),)


class ApiUsage(Base):
    """Clerk de uso de proveedores externos (costo, errores, caché)."""
    __tablename__ = "api_usage"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    provider: Mapped[str] = mapped_column(String(32), index=True)
    endpoint: Mapped[str] = mapped_column(String(128), default="")
    date: Mapped[str] = mapped_column(String(16), index=True)  # YYYY-MM-DD
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    cached_count: Mapped[int] = mapped_column(Integer, default=0)
    total_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0)
    rate_limit_remaining: Mapped[int | None] = mapped_column(Integer, nullable=True)
    __table_args__ = (UniqueConstraint("provider", "endpoint", "date", name="uq_api_usage"),)