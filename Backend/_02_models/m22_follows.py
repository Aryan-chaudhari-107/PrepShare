"""
TODO 26:

Table: FOLLOWS

id                  UUID, primary key, auto-generated
follower_id         FK -> users.id, ON DELETE CASCADE — the person doing the following
following_id        FK -> users.id, ON DELETE CASCADE — the person being followed
created_at          timestamp, set once on insert

UNIQUE(follower_id, following_id) — can't follow the same person twice
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Follow(Base):
    __tablename__ = "follows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    follower_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    following_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )