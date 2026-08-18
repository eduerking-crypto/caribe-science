"""Application configuration. Free-first defaults: SQLite + memory cache + local storage."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CARIBE SCIENCE"
    api_prefix: str = "/api/v1"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./caribe_science.db"

    # Security
    secret_key: str = "change-me-in-production-insecure-dev-key"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    password_hash_iterations: int = 600_000

    # Storage
    storage_backend: str = "local"
    storage_endpoint: str = ""
    storage_bucket: str = ""
    storage_access_key: str = ""
    storage_secret_key: str = ""
    upload_dir: Path = BASE_DIR / "storage" / "uploads"

    # External scientific metadata (free-first)
    crossref_email: str = "contact@caribescience.example"
    openalex_email: str = "contact@caribescience.example"
    unpaywall_email: str = "contact@caribescience.example"

    # ORCID public API
    orcid_client_id: str = ""
    orcid_client_secret: str = ""

    # AI — provider-agnostic (ollama local por defecto)
    ai_provider: str = "ollama"
    ai_base_url: str = "http://localhost:11434"
    ai_model: str = "qwen3:8b"
    ai_api_key: str = ""

    # Email
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    email_verification: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()