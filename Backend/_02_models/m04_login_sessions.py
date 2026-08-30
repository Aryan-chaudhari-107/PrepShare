
"""
TODO 8:

Table: LOGIN_SESSIONS

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, ON DELETE CASCADE (not unique — a user can
                    have multiple active sessions, e.g. phone + laptop)
refresh_token_hash  hashed refresh token, never stored as plain text
device              optional, free text — e.g. "Chrome on Windows"
ip_address          optional, free text
expires_at          timestamp — session becomes invalid after this
created_at          timestamp, set once on insert
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class LoginSession(Base):

    __tablename__ = "login_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=(uuid.uuid4))

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        )

    refresh_token_hash = Column(String, nullable=False)

    device = Column(String, nullable=True)

    ip_address = Column(String, nullable=True)

    expires_at = Column(DateTime, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)