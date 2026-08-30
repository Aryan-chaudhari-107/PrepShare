"""
TODO 30:

Table: CONTRIBUTION_EVENTS

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, ON DELETE CASCADE
event_type          varchar — e.g. "post_created", "question_added", "helpful_comment"
points              integer
reference_id        optional UUID — id of whatever triggered this event
created_at          timestamp, set once on insert

NOTE: users.contribution_score is a CACHE kept in sync by summing these
events — auditable. Every time this table gets a new row, the matching
user's contribution_score should be updated in the SAME transaction.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class ContributionEvent(Base):
    __tablename__ = "contribution_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    event_type = Column(String, nullable=False)
    points = Column(Integer, nullable=False)

    # not a ForeignKey — same reasoning as notifications.reference_id:
    # this could point at a post, a question, a comment, etc. depending
    # on event_type. No single fixed table to reference.
    reference_id = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)

    