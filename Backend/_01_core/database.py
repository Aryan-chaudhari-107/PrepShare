"""
Step 3:
Bridge between SQLAlchemy (the ORM) and the actual Postgres database.
Every model and router that touches the DB goes through what's defined here.
"""

import time

from sqlalchemy import create_engine
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

from _01_core.config import (
    settings,  # requires settings re-export uncommented in _01_core/__init__.py
)
from _01_core.logger import logger

"""
Why ?? from _01_core.config import settings 
Since database.py is imported by _01_core/__init__.py, 
and __init__.py also imports database.py, this creates a circular import dependency.
"""



# The engine is the object that knows HOW to connect to Postgres.
# Created once, using the DB URL from config.py — never hardcoded here.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=5,
    connect_args={"connect_timeout": 10},
)


# Connection-level failures that are worth retrying: Supabase cold starts,
# a dropped pool connection, a transient network blip.
_TRANSIENT_DB_ERRORS = (OperationalError, InterfaceError)


def wait_for_database(retries: int = 5, base_delay: float = 0.5) -> bool:
    """Open a real DB connection with exponential backoff and clear logs.

    Returns True once a connection succeeds; logs one actionable ERROR and
    returns False if every attempt fails (callers decide whether to keep
    serving). Delays: 0.5s, 1s, 2s, 4s by default (~7.5s worst case).
    Never logs the connection string itself, only the failure class/message.
    """
    delay = base_delay
    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        try:
            with engine.connect():
                if attempt > 1:
                    logger.info(
                        "Database reachable on attempt %d/%d", attempt, retries
                    )
                return True
        except _TRANSIENT_DB_ERRORS as exc:
            last_error = exc
            if attempt < retries:
                logger.warning(
                    "Database not reachable (attempt %d/%d, %s) — retrying in %.1fs",
                    attempt,
                    retries,
                    exc.__class__.__name__,
                    delay,
                )
                time.sleep(delay)
                delay *= 2

    logger.error(
        "Database still unreachable after %d attempts (%s: %s). "
        "Verify DATABASE_URL and the Supabase instance — endpoints that need "
        "the DB will fail until it recovers.",
        retries,
        type(last_error).__name__ if last_error else "?",
        last_error,
    )
    return False




# SessionLocal is a FACTORY for sessions, not a session itself.
# Each request will call SessionLocal() to get its own short-lived
# "conversation" with the database.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



# Base is the class every SQLAlchemy model (m01_users.py, etc.) will inherit
# from. It's how 'SQLAlchemy and Alembic' discover which classes = tables.
Base = declarative_base()



def get_db():
    """
    FastAPI dependency. Opens one session per request, hands it to the
    endpoint via `yield`, and guarantees it's closed afterward — even if
    the endpoint raises an exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()