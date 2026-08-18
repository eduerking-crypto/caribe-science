export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  locale: string;
  orcid: string | null;
  created_at: string;
}

export interface InstitutionOut {
  id: string;
  name: string;
  acronym: string;
  country_code: string | null;
  city: string;
  website: string;
}

export interface ResearcherOut {
  id: string;
  orcid: string | null;
  orcid_verified: boolean;
  full_name: string;
  country_code: string | null;
  biography: string;
  research_areas: string[];
  keywords: string[];
  is_demo: boolean;
  institution: InstitutionOut | null;
  article_count: number;
}

export interface SectionOut {
  id: string;
  name: string;
  name_es: string;
  description: string;
  order: number;
}

export interface EditorOut {
  id: string;
  name: string;
  role: string;
  institution: string;
  country_code: string | null;
  research_areas: string[];
  orcid: string;
}

export interface SpecialIssueOut {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  deadline: string | null;
  status: string;
}

export interface JournalOut {
  id: string;
  slug: string;
  title: string;
  title_es: string;
  issn: string;
  eissn: string;
  description: string;
  scope: string[];
  publisher: string;
  license: string;
  open_access: boolean;
  apc: string;
  is_demo: boolean;
}

export interface JournalDetailOut extends JournalOut {
  sections: SectionOut[];
  editors: EditorOut[];
  special_issues: SpecialIssueOut[];
  article_count: number;
  description_es: string;
}

export interface ArticleAuthorOut {
  id: string;
  name: string;
  orcid: string;
  institution: string;
  country_code: string | null;
  is_corresponding: boolean;
  order: number;
  researcher_id: string | null;
}

export interface ArticleReferenceOut {
  id: string;
  order: number;
  doi: string;
  citation: string;
}

export interface ArticleOut {
  id: string;
  slug: string;
  title: string;
  title_es: string;
  abstract: string;
  keywords: string[];
  section_label: string;
  article_type: string;
  doi: string | null;
  doi_registered: boolean;
  license: string;
  publication_date: string | null;
  views: number;
  downloads: number;
  citations: number;
  is_demo: boolean;
  journal: JournalOut | null;
  authors: ArticleAuthorOut[];
}

export interface ArticleDetailOut extends ArticleOut {
  abstract_es: string;
  keywords_es: string[];
  body_html: string;
  funding: string;
  conflicts: string;
  data_availability: string;
  code_availability: string;
  references: ArticleReferenceOut[];
}

export interface DatasetOut {
  id: string;
  slug: string;
  title: string;
  description: string;
  authors: unknown[];
  license: string;
  version: string;
  doi: string;
  repository_url: string;
  file_name: string;
  file_size: string;
  format: string;
  is_demo: boolean;
}

export interface ProtocolOut {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  authors: unknown[];
}

export interface SearchHit {
  type: "article" | "researcher" | "journal" | "dataset" | "protocol";
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  url: string;
}

export interface SearchOut {
  query: string;
  hits: SearchHit[];
  total: number;
}

export interface MetricsOut {
  articles: number;
  researchers: number;
  institutions: number;
  journals: number;
  datasets: number;
  countries: number;
  views: number;
}

export interface AuthorIn {
  name: string;
  email: string;
  orcid: string;
  institution: string;
  country_code: string | null;
  is_corresponding: boolean;
  order: number;
}

export interface ManuscriptOut {
  id: string;
  journal_id: string;
  section_id: string | null;
  special_issue_id: string | null;
  article_type: string;
  title: string;
  abstract: string;
  keywords: string[];
  status: string;
  version: number;
  doi: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  editor_decision: string | null;
  journal: JournalOut | null;
  authors: ArticleAuthorOut[];
}

export interface WorkflowEventOut {
  id: string;
  from_status: string;
  to_status: string;
  actor_id: string | null;
  note: string;
  created_at: string;
}

export interface FileOut {
  id: string;
  original_name: string;
  mime: string;
  size: number;
  kind: string;
  version: number;
  created_at: string;
}

export interface ManuscriptDetailOut extends ManuscriptOut {
  body: string;
  suggested_reviewers: unknown[];
  excluded_reviewers: unknown[];
  funding: string;
  conflicts: string;
  ethics: string;
  data_availability: string;
  author_contributions: string;
  acknowledgments: string;
  cover_letter: string;
  decision_note: string;
  events: WorkflowEventOut[];
  files: FileOut[];
}

export interface ReviewOut {
  id: string;
  manuscript_id: string;
  reviewer_user_id: string | null;
  novelty: number | null;
  methodology: number | null;
  statistics: number | null;
  figures: number | null;
  tables: number | null;
  references: number | null;
  reproducibility: number | null;
  ethics: number | null;
  recommendation: string | null;
  comments_to_authors: string;
  status: string;
  submitted_at: string | null;
}

export interface InvitationOut {
  id: string;
  manuscript_id: string;
  status: string;
  invited_at: string;
  manuscript_title: string;
}

export interface ReviewerMatchOut {
  reviewer_id: string;
  name: string;
  orcid: string;
  institution: string;
  country_code: string | null;
  expertise: string[];
  score: number;
  reason: string;
}

export interface AiFindingOut {
  id: string;
  finding: string;
  confidence: number;
  explanation: string;
  source: string;
  severity: string;
}

export interface AiAnalysisOut {
  id: string;
  kind: string;
  model: string;
  provider: string;
  status: string;
  created_at: string;
  findings: AiFindingOut[];
}

export interface NotificationOut {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  new_submissions: number;
  technical_checks: number;
  awaiting_editors: number;
  reviewer_invitations: number;
  active_reviews: number;
  reviews_received: number;
  revisions: number;
  decisions_pending: number;
  accepted: number;
  published: number;
  rejected: number;
  total: number;
}

export const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  technical_check: "Technical check",
  editorial_check: "Editorial check",
  assigned_to_editor: "Assigned to editor",
  reviewer_invitations: "Inviting reviewers",
  under_review: "Under review",
  reviews_received: "Reviews received",
  editor_decision: "Editor decision",
  rejected: "Rejected",
  minor_revision: "Minor revision",
  major_revision: "Major revision",
  accepted: "Accepted",
  production: "In production",
  proof: "Proofing",
  published: "Published",
};

export const ARTICLE_TYPES = [
  "research_article",
  "review_article",
  "short_communication",
  "methods_article",
  "data_paper",
  "perspective",
  "commentary",
  "correspondence",
] as const;