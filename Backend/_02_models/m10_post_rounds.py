
"""
--> Why this table??

POST_ROUNDS — junction table linking a specific post to the specific rounds
it included (order + mode per round). interview_rounds is just a generic
lookup list of round types; this table says "THIS post had THIS round,
added Nth, conducted online/offline" — what makes one post able to hold
multiple rounds (the full journey: aptitude -> coding -> hr -> placement).
"""


"""
TODO 14:

Table: POST_ROUNDS

id                  UUID, primary key, auto-generated
post_id             FK -> interview_posts.id, ON DELETE CASCADE
round_id            FK -> interview_rounds.id
round_number        integer — order this round was added within this post
mode                enum: online / offline — this specific round's mode,
                    independent per round (e.g. HR in-person, technical online)
created_at          timestamp, set once on insert
"""

import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class PostRound(Base):
    __tablename__ = "post_rounds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_posts.id", ondelete="CASCADE"),
        nullable=False,
    )

    round_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_rounds.id"),
        nullable=False,
    )

    round_number = Column(Integer, nullable=False)

    mode = Column(
        Enum("online", "offline", name="round_mode"),
        nullable=False,
    )

    duration_minutes = Column(Integer, nullable=True)
    round_tags = Column(String, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)