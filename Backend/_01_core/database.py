"""
Step 3:
Bridge between SQLAlchemy (the ORM) and the actual Postgres database.
Every model and router that touches the DB goes through what's defined here.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from _01_core.config import (
    settings,  # requires settings re-export uncommented in _01_core/__init__.py
)

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