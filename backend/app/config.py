import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "transmuteai-secret-key-super-secure-32chars"

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # "celery" or "direct" (for serverless/single-instance local dev)
    EXECUTION_MODE: str = "direct"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # gemini, ollama, openai, mock
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"

    AIR_GAPPED_MODE: bool = False
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR / 'storage' / 'transmuteai.db'}"

    # Celery & Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Directories
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    ARTIFACTS_DIR: str = str(BASE_DIR / "storage" / "artifacts")
    UPLOADS_DIR: str = str(BASE_DIR / "storage" / "uploads")
    LEDGER_DIR: str = str(BASE_DIR / "storage" / "ledger")

    RATE_LIMIT_PER_MINUTE: int = 60

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        return v

    def setup_dirs(self):
        """Ensure all required runtime directories exist."""
        for path_str in [self.STORAGE_DIR, self.ARTIFACTS_DIR, self.UPLOADS_DIR, self.LEDGER_DIR]:
            Path(path_str).mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.setup_dirs()
