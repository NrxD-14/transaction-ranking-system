"""Application settings loaded from environment variables or .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Transaction Ranking System API"
    app_version: str = "1.0.0"
    database_url: str = "sqlite:///./trs.db"  # SQLite file in backend/
    cors_origins: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://transaction-ranking-system-chi.vercel.app",
]
    jwt_secret: str = "trs-dev-secret-change-in-production"  # Override via .env in production
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
