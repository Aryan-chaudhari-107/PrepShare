
"""
TODO 6:
Table: USER_SETTINGS

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, UNIQUE (one settings row per user),
                    ON DELETE CASCADE (deleted automatically if the user is deleted)
theme_preference    enum: light / dark / system, default "system"
created_at          timestamp, set once on insert
updated_at          timestamp, refreshed on every update
"""

"""
ondelete="CASCADE" — this is a database-level rule: if the referenced user 
row gets deleted, Postgres automatically deletes this row too, instead of 
leaving an orphaned settings row pointing at nothing.
"""


import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    theme_preference = Column(
        Enum("light", "dark", "system", name="theme_preference"),
        nullable=False,
        default="system",
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)