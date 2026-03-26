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

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
