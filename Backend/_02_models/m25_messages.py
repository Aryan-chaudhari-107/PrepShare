"""
TODO 29:

Table: MESSAGES

id                  UUID, primary key, auto-generated
conversation_id     FK -> conversations.id, ON DELETE CASCADE
sender_id           FK -> users.id
message_text        text
is_read             boolean, default false — drives red (unseen) / green (seen) dot in UI
created_at          timestamp, indexed
"""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )

    sender_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    message_text = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)