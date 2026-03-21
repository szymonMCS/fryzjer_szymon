from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., pattern=r"^postgresql\+asyncpg://", description="PostgreSQL async connection string")
    SECRET_KEY: str = Field(..., min_length=32, description="Secret key for JWT")
    DEBUG: bool = Field(default=False, description="Debug mode")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1, le=1440)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, ge=1, le=30)
    ALGORITHM: str = Field(default="HS256", pattern=r"^HS(256|384|512)$")

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

settings = Settings()