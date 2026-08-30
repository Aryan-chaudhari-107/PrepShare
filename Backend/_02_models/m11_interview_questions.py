
"""
Table: INTERVIEW_QUESTIONS

id                  UUID, primary key, auto-generated
post_id             FK -> interview_posts.id, ON DELETE CASCADE
post_round_id       FK -> post_rounds.id, nullable
question_text       optional text
attachment_url      optional text — PDF/doc/txt or image
is_verified         boolean, default false — company employee/alumni can verify
easy_count          integer, default 0 — cached from question_difficulty_votes
medium_count        integer, default 0 — cached from question_difficulty_votes
hard_count          integer, default 0 — cached from question_difficulty_votes
created_at          timestamp
updated_at          timestamp

NOTE: Validation (API layer, not enforced here): at least one of question_text /
attachment_url is required.
"""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_posts.id", ondelete="CASCADE"),
        nullable=False,
    )

    post_round_id = Column(
        UUID(as_uuid=True),
        ForeignKey("post_rounds.id"),
        nullable=True,
    )

    question_text = Column(Text, nullable=True)
    attachment_url = Column(Text, nullable=True)

    is_verified = Column(Boolean, default=False, nullable=False)

    easy_count = Column(Integer, default=0, nullable=False)
    medium_count = Column(Integer, default=0, nullable=False)
    hard_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
