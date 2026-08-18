"""Schemas Pydantic — API v1."""
from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    locale: str = "en"


class RegisterOut(BaseModel):
    id: str
    email: str
    full_name: str
    email_verified: bool
    message: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class EmailVerifyIn(BaseModel):
    token: str


class PasswordResetRequestIn(BaseModel):
    email: EmailStr


class PasswordResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class UserOut(ORMModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_email_verified: bool
    locale: str
    theme: str
    created_at: datetime


class UserUpdateIn(BaseModel):
    full_name: str | None = None
    locale: str | None = None
    theme: str | None = None


# ---------- geografía/personas ----------


class CountryOut(ORMModel):
    code: str
    name: str
    name_es: str
    region: str
    lat: float
    lon: float


class InstitutionOut(ORMModel):
    id: str
    name: str
    acronym: str
    country_code: str
    city: str
    lat: float
    lon: float
    website: str


class ResearcherOut(ORMModel):
    id: str
    orcid: str | None
    orcid_verified: bool
    full_name: str
    country_code: str | None
    biography: str
    research_areas: list
    keywords: list
    is_demo: bool
    institution: InstitutionOut | None = None
    article_count: int = 0


class ResearcherProfileIn(BaseModel):
    orcid: str | None = None
    biography: str = ""
    research_areas: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    institution_id: str | None = None
    country_code: str | None = None


# ---------- revistas ----------


class JournalOut(ORMModel):
    id: str
    slug: str
    title: str
    title_es: str
    issn: str
    eissn: str
    description: str
    scope: list
    publisher: str
    license: str
    open_access: bool
    apc: str
    is_demo: bool


class JournalDetailOut(JournalOut):
    sections: list["SectionOut"] = []
    editors: list["EditorOut"] = []
    special_issues: list["SpecialIssueOut"] = []
    article_count: int = 0
    description_es: str = ""


class SectionOut(ORMModel):
    id: str
    name: str
    name_es: str
    description: str
    order: int


class EditorOut(ORMModel):
    id: str
    name: str
    role: str
    institution: str
    country_code: str | None
    research_areas: list
    orcid: str


class SpecialIssueOut(ORMModel):
    id: str
    title: str
    slug: str
    description: str
    keywords: list
    deadline: str | None
    status: str


# ---------- contenido ----------


class ArticleAuthorOut(ORMModel):
    id: str
    name: str
    orcid: str
    institution: str
    country_code: str | None
    is_corresponding: bool
    order: int
    researcher_id: str | None = None


class ArticleReferenceOut(ORMModel):
    id: str
    order: int
    doi: str
    citation: str


class ArticleOut(ORMModel):
    id: str
    slug: str
    title: str
    title_es: str
    abstract: str
    keywords: list
    section_label: str
    article_type: str
    doi: str | None
    doi_registered: bool
    license: str
    publication_date: datetime | None
    views: int
    downloads: int
    citations: int
    is_demo: bool
    journal: JournalOut | None = None
    authors: list[ArticleAuthorOut] = []


class ArticleDetailOut(ArticleOut):
    abstract_es: str
    keywords_es: list
    body_html: str
    funding: str
    conflicts: str
    data_availability: str
    code_availability: str
    references: list[ArticleReferenceOut] = []


class DatasetOut(ORMModel):
    id: str
    slug: str
    title: str
    description: str
    authors: list
    license: str
    version: str
    doi: str
    repository_url: str
    file_name: str
    file_size: str
    format: str
    is_demo: bool


class ProtocolOut(ORMModel):
    id: str
    slug: str
    title: str
    description: str
    category: str
    authors: list


# ---------- manuscritos ----------


class AuthorIn(BaseModel):
    name: str
    email: str = ""
    orcid: str = ""
    institution: str = ""
    country_code: str | None = None
    is_corresponding: bool = False
    order: int = 0


class ManuscriptCreateIn(BaseModel):
    journal_id: str
    section_id: str | None = None
    special_issue_id: str | None = None
    article_type: str = "research_article"


class ManuscriptUpdateIn(BaseModel):
    journal_id: str | None = None
    section_id: str | None = None
    special_issue_id: str | None = None
    article_type: str | None = None
    title: str | None = None
    abstract: str | None = None
    keywords: list[str] | None = None
    body: str | None = None
    suggested_reviewers: list | None = None
    excluded_reviewers: list | None = None
    funding: str | None = None
    conflicts: str | None = None
    ethics: str | None = None
    data_availability: str | None = None
    author_contributions: str | None = None
    acknowledgments: str | None = None
    cover_letter: str | None = None


class ManuscriptAuthorIn(AuthorIn):
    pass


class ManuscriptOut(ORMModel):
    id: str
    journal_id: str
    section_id: str | None
    special_issue_id: str | None
    article_type: str
    title: str
    abstract: str
    keywords: list
    status: str
    version: int
    doi: str | None
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None
    editor_decision: str | None
    journal: JournalOut | None = None
    authors: list[ArticleAuthorOut] = []


class WorkflowEventOut(ORMModel):
    id: str
    from_status: str
    to_status: str
    actor_id: str | None
    note: str
    created_at: datetime


class ManuscriptDetailOut(ManuscriptOut):
    body: str
    suggested_reviewers: list
    excluded_reviewers: list
    funding: str
    conflicts: str
    ethics: str
    data_availability: str
    author_contributions: str
    acknowledgments: str
    cover_letter: str
    decision_note: str
    events: list[WorkflowEventOut] = []
    files: list["FileOut"] = []


class FileOut(ORMModel):
    id: str
    original_name: str
    mime: str
    size: int
    kind: str
    version: int
    created_at: datetime


class SubmitIn(BaseModel):
    note: str = ""


class TransitionIn(BaseModel):
    note: str = ""


class DecisionIn(BaseModel):
    decision: str  # accept | reject | minor_revision | major_revision
    note: str = ""


class ReviewIn(BaseModel):
    novelty: int | None = Field(default=None, ge=1, le=5)
    methodology: int | None = Field(default=None, ge=1, le=5)
    statistics: int | None = Field(default=None, ge=1, le=5)
    figures: int | None = Field(default=None, ge=1, le=5)
    tables: int | None = Field(default=None, ge=1, le=5)
    references: int | None = Field(default=None, ge=1, le=5)
    reproducibility: int | None = Field(default=None, ge=1, le=5)
    ethics: int | None = Field(default=None, ge=1, le=5)
    recommendation: str | None = None
    confidential_comments: str = ""
    comments_to_authors: str = ""


class ReviewOut(ORMModel):
    id: str
    manuscript_id: str
    reviewer_user_id: str | None
    novelty: int | None
    methodology: int | None
    statistics: int | None
    figures: int | None
    tables: int | None
    references: int | None
    reproducibility: int | None
    ethics: int | None
    recommendation: str | None
    comments_to_authors: str
    status: str
    submitted_at: datetime | None


class InvitationOut(ORMModel):
    id: str
    manuscript_id: str
    status: str
    invited_at: datetime
    manuscript_title: str = ""


class InvitationRespondIn(BaseModel):
    accept: bool


class ReviewerMatchOut(BaseModel):
    reviewer_id: str
    name: str
    orcid: str
    institution: str
    country_code: str | None
    expertise: list
    score: float
    reason: str


class AiFindingOut(ORMModel):
    id: str
    finding: str
    confidence: float
    explanation: str
    source: str
    severity: str


class AiAnalysisOut(ORMModel):
    id: str
    kind: str
    model: str
    provider: str
    status: str
    created_at: datetime
    findings: list[AiFindingOut] = []


# ---------- search / misc ----------


class SearchHit(BaseModel):
    type: str  # article | researcher | journal | dataset | protocol
    id: str
    title: str
    subtitle: str = ""
    slug: str = ""
    url: str = ""


class SearchOut(BaseModel):
    query: str
    hits: list[SearchHit]
    total: int


class MetricsOut(BaseModel):
    articles: int
    researchers: int
    institutions: int
    journals: int
    datasets: int
    countries: int
    views: int


class ApiUsageOut(ORMModel):
    provider: str
    endpoint: str
    date: str
    request_count: int
    success_count: int
    error_count: int
    cached_count: int
    estimated_cost: float
    rate_limit_remaining: int | None


class NotificationOut(ORMModel):
    id: str
    kind: str
    title: str
    body: str
    link: str
    read: bool
    created_at: datetime


class MetadataOut(BaseModel):
    found: bool
    provider: str
    data: dict[str, Any] = {}


class ErrorOut(BaseModel):
    error: dict[str, str]


class PageOut(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int