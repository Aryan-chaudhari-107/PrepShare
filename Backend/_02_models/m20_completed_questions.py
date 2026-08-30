"""
TODO 24:

Table: COMPLETED_QUESTIONS

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, ON DELETE CASCADE
question_id         FK -> interview_questions.id, ON DELETE CASCADE
completed_at        timestamp, set once on insert

UNIQUE(user_id, question_id) — a user can only mark a question complete once
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class CompletedQuestion(Base):
    __tablename__ = "completed_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_questions.id", ondelete="CASCADE"),
        nullable=False,
    )

    completed_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_question_completed"),
    )