import os
from pathlib import Path
from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# Determine database directory: default to backend/data/
DEFAULT_DATA_DIR = Path(__file__).parent.parent / "data"
DEFAULT_DB_FILE = DEFAULT_DATA_DIR / "hirelens.db"


def parse_database_url(raw_url: Optional[str] = None) -> str:
    """
    Parses and normalizes the database connection URL.
    Defaults to local SQLite at backend/data/hirelens.db if not configured.
    Normalizes legacy 'postgres://' prefixes to 'postgresql://' for SQLAlchemy 2.0.
    Ensures the SQLite directory exists only when using SQLite storage.
    """
    if not raw_url or not raw_url.strip():
        DEFAULT_DATA_DIR.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{DEFAULT_DB_FILE}"

    url = raw_url.strip()
    # Normalize legacy postgres:// prefix from cloud providers (Render, Heroku, Supabase)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    if url.startswith("sqlite"):
        DEFAULT_DATA_DIR.mkdir(parents=True, exist_ok=True)

    return url


DATABASE_URL = parse_database_url(os.getenv("DATABASE_URL"))

# SQLite specific connect args for multi-threaded FastAPI workers
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 declarative base model."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None) -> None:
    """Initializes tables in database and applies lightweight SQLite migrations."""
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)

    try:
        from sqlalchemy import text
        with eng.connect() as conn:
            for col_sql in [
                "ALTER TABLE interview_questions ADD COLUMN stage VARCHAR(32) DEFAULT 'technical_depth'",
                "ALTER TABLE interview_questions ADD COLUMN acknowledgement VARCHAR(255)",
            ]:
                try:
                    conn.execute(text(col_sql))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass
