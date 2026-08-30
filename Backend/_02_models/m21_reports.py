"""
TODO 25:

Table: REPORTS

id                  UUID, primary key, auto-generated
reporter_id         FK -> users.id — who filed the report
post_id             FK -> interview_posts.id, ON DELETE CASCADE
reason              text
status              enum: pending / reviewed / resolved, default "pending"
created_at          timestamp, set once on insert
"""

import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    reporter_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_posts.id", ondelete="CASCADE"),
        nullable=False,
    )

    reason = Column(Text, nullable=False)

    status = Column(
        Enum("pending", "reviewed", "resolved", name="report_status"),
        nullable=False,
        default="pending",
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)