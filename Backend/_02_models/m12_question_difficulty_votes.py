"""
TODO 16:

Table: QUESTION_DIFFICULTY_VOTES

id                  UUID, primary key, auto-generated
question_id         FK -> interview_questions.id, ON DELETE CASCADE
user_id             FK -> users.id, ON DELETE CASCADE
difficulty          enum: easy / medium / hard
created_at          timestamp, set once on insert

UNIQUE(question_id, user_id) — one vote per user per question. This is
what powers the single-select/toggle behavior from the frontend notes (§6):
inserting, updating, or deleting a row here (and adjusting the matching
easy_count/medium_count/hard_count on interview_questions) all happens in
ONE transaction, so counts can never drift out of sync with actual votes.
"""

import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class QuestionDifficultyVote(Base):
    __tablename__ = "question_difficulty_votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_questions.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    difficulty = Column(
        Enum("easy", "medium", "hard", name="difficulty_level"),
        nullable=False,
    )

    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("question_id", "user_id", name="uq_question_user_vote"),
    )

"""
__table_args__ is where SQLAlchemy expects table-level rules — constraints about 
multiple columns together, not one column alone.

You needed it because "one vote per user per question" is a rule about two columns 
combined (question_id + user_id), and unique=True only works on a single column. So instead:

python
__table_args__ = (
    UniqueConstraint("question_id", "user_id", name="uq_question_user_vote"),
)

This says: no two rows can have the same question_id and user_id pair at once — one user, 
one vote, per question. The name= is just a label for that rule inside Postgres. It's wrapped 
in a tuple because __table_args__ can hold several table-level rules at once.
"""