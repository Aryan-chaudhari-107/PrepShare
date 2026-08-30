
"""
TODO 22:

Table: LIKES

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, ON DELETE CASCADE
post_id             FK -> interview_posts.id, ON DELETE CASCADE
created_at          timestamp, set once on insert

UNIQUE(user_id, post_id) — one like per user per post
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Like(Base):
    __tablename__ = "likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_posts.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),
        Index("ix_likes_post_id", "post_id"),
    )