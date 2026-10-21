import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# Determine database directory: default to backend/data/
DEFAULT_DATA_DIR = Path(__file__).parent.parent / "data"
DEFAULT_DATA_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_DB_FILE = DEFAULT_DATA_DIR / "hirelens.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE}")

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
    """Initializes tables in database."""
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)
