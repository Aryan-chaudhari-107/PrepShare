"""
TODO 7:

Table: OTPS

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, nullable, ON DELETE CASCADE
                    (nullable because email_verification OTPs are requested
                    BEFORE any user row exists)
email               optional varchar — used for purpose=email_verification,
                    where there's no user_id yet. For purpose=password_reset,
                    user_id is used instead and this stays null.
purpose             enum: password_reset / email_verification
otp_code_hash       hashed OTP code, never stored as plain text
expires_at          timestamp — OTP becomes invalid after this
is_used             boolean, default false — flips true once the OTP is redeemed
created_at          timestamp, set once on insert
"""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Otp(Base):
    __tablename__ = "otps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )

    email = Column(String, nullable=True)

    purpose = Column(
        Enum("password_reset", "email_verification", name="otp_purpose"),
        nullable=False,
    )

    otp_code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    failed_attempts = Column(Integer, server_default=text("0"), default=0, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)