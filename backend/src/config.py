from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., pattern=r"^postgresql\+asyncpg://", description="PostgreSQL async connection string")
    SECRET_KEY: str = Field(..., min_length=32, description="Secret key for cookies")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_PASSWORD: str = Field(...)

    model_config = SettingsConfigDict(env_file=str(Path(__file__).parent.parent.parent / ".env"), extra="ignore")

settings = Settings()
