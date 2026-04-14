import os
from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).parent.parent.parent

EMBEDDING_DIMS = 1536
MAX_EMBEDDING_TOKENS = 8000


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., pattern=r"^postgresql\+asyncpg://")
    SECRET_KEY: str = Field(..., min_length=32)
    DEBUG: bool = Field(default=False)
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_PASSWORD: str = Field(...)
    BREVO_API_KEY: Optional[str] = None
    BREVO_SENDER_EMAIL: str = "szymon.maciejewski.programista@gmail.com"
    BREVO_SENDER_NAME: str = "Salon Fryzjerski"
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    OPENAI_LLM_MODEL: str = Field(default="gpt-5.4-nano")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")
    RAG_CHUNK_SIZE: int = Field(default=1000)
    RAG_CHUNK_OVERLAP: int = Field(default=200)
    RAG_SIMILARITY_THRESHOLD: float = Field(default=0.3)

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


os.environ["OPENAI_AGENTS_DISABLE_TRACING"] = "1"

settings = Settings()  # type: ignore

if settings.OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
