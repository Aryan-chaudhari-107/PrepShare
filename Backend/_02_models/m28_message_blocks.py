"""
Table: MESSAGE_BLOCKS

id                  UUID, primary key, auto-generated
blocker_id          FK -> users.id, ON DELETE CASCADE — who is doing the blocking
blocked_id          FK -> users.id, ON DELETE CASCADE — who is blocked
created_at          timestamp, set once on insert

UNIQUE(blocker_id, blocked_id) — can't block the same person twice.
Messaging-only block: does NOT hide posts/profile, only stops blocked_id
from sending messages to blocker_id.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class MessageBlock(Base):
    __tablename__ = "message_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    blocker_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    blocked_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked"),
    )