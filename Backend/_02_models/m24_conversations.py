"""
TODO 28:

Table: CONVERSATIONS

id                  UUID, primary key, auto-generated
user_one_id         FK -> users.id
user_two_id         FK -> users.id
created_at          timestamp

UNIQUE(user_one_id, user_two_id) — one conversation per pair of users.
IMPORTANT: the API layer must always store the SMALLER UUID as user_one_id
(not enforced by the database) — this prevents two separate conversation
rows existing for the same pair in reversed order.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_one_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    user_two_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_one_id", "user_two_id", name="uq_conversation_pair"),
    )