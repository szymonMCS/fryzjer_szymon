from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., pattern=r"^postgresql\+asyncpg://", description="PostgreSQL async connection string")
    SECRET_KEY: str = Field(..., min_length=32, description="Secret key for cookies")
    DEBUG: bool = Field(default=False, description="Debug mode")
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_PASSWORD: str = Field(...)
    BREVO_API_KEY: Optional[str] = None
    BREVO_SENDER_EMAIL: str = "szymon.maciejewski.programista@gmail.com"
    BREVO_SENDER_NAME: str = "Salon Fryzjerski"
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key for embeddings and LLM")
    OPENAI_LLM_MODEL: str = Field(default="gpt-4.1-nano", description="Model LLM do generowania odpowiedzi RAG i czatu")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-large", description="Model do generowania embeddingów")
    RAG_CHUNK_SIZE: int = Field(default=800, description="Rozmiar chunka w znakach")
    RAG_CHUNK_OVERLAP: int = Field(default=150, description="Nakładanie się chunków w znakach")
    RAG_RETRIEVAL_K: int = Field(default=20, description="Liczba chunków do pobrania z bazy")
    RAG_FINAL_K: int = Field(default=10, description="Liczba chunków po rerankingu")

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()  # type: ignore
