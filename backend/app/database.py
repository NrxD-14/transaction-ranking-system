"""SQLAlchemy database engine, session factory, and FastAPI get_db dependency."""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Add profile columns to existing SQLite databases."""
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as conn:
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "bio" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR(500)"))
        if "phone" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(32)"))
        if "location" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR(120)"))

        account_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(accounts)"))}
        if "role" not in account_columns:
            conn.execute(text("ALTER TABLE accounts ADD COLUMN role VARCHAR(16) DEFAULT 'user'"))
            conn.execute(text("UPDATE accounts SET role = 'user' WHERE role IS NULL"))
