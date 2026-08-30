"""
TODO 5:
Table: USERS

id                  UUID, primary key, auto-generated
email               unique, indexed — used for login
username            unique, indexed — public handle
password_hash       bcrypt hash, never the plain password
full_name           optional display name
bio                 optional, free text
profile_photo_url   optional, URL to image (uploaded direct-to-cloud)
role                enum: student / admin / moderator / working_professional
contribution_score  integer, default 0 — cached, kept in sync by contribution_events
follower_count      integer, default 0 — cached, updated on follow/unfollow
following_count     integer, default 0 — cached, updated on follow/unfollow
is_active           boolean, default true — soft flag for banning/deactivating
is_email_verified   boolean, default false — flips true only after OTP verification at registration
created_at          timestamp, set once on insert
updated_at          timestamp, refreshed on every update
"""

"""
Column modifier cheat sheet — applies to every model file (m01 → m26)

unique=True
    No two rows can have the same value in this column.
    Postgres enforces this at the DB level (not just in your Python code).
    Example: email, username — two users can never share one.

index=True
    Builds a separate lookup structure for this column, so queries
    filtering/searching on it are fast even with many rows.
    Only add this where the schema doc says "indexed", or on foreign
    keys you'll filter/join on often — NOT on every column.
    Tradeoff: faster reads, slightly slower writes, more disk space.
    Note: unique=True already creates an index automatically, so a
    column with both is a bit redundant but harmless.

nullable=False
    This column is REQUIRED — a row can't be saved without a value here.
    nullable=True (or omitting it) means the column is optional.
    Match this to whatever the schema doc says (nullable vs not).

default=some_value
    If nothing is provided when creating a row, use this value instead.
    IMPORTANT: for functions (uuid.uuid4, datetime.utcnow), pass the
    function itself with NO parentheses — e.g. default=uuid.uuid4.
    This means "call this fresh for every new row."
    Adding parentheses (uuid.uuid4()) runs it once, immediately, and
    reuses that same value for every row — a common beginner bug.

onupdate=some_value
    Like default, but re-runs every time the row is UPDATED, not just
    on creation. Used on updated_at so it auto-refreshes on every change.

    
--> import uuid
    This is Python's built-in standard library module. It has nothing to 
    do with databases at all — it's a general-purpose tool for generating 
    random unique identifiers. You use it as uuid.uuid4 — a function that 
    generates a fresh random UUID value each time it's called.

    
--> from sqlalchemy.dialects.postgresql import UUID
this column stores a UUID value
"""


import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class User(Base):
    __tablename__ = "users"

    # UUID primary key, auto-generated on insert
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    full_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_photo_url = Column(Text, nullable=True)

    # matches schema: enum(student, admin, moderator, working_professional)
    role = Column(
        Enum("student", "admin", "moderator", "working_professional", name="user_role"),
        nullable=False,
        default="student",
    )

    # cached counters — kept in sync by application logic, not computed live
    contribution_score = Column(Integer, default=0, nullable=False)
    follower_count = Column(Integer, default=0, nullable=False)
    following_count = Column(Integer, default=0, nullable=False)

    token_version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime, 
        default=utc_now, 
        nullable=False)

    updated_at = Column(
        DateTime, 
        default=utc_now, 
        onupdate=utc_now, 
        nullable=False)