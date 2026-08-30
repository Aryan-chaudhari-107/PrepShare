

"""
TODO: 18

Table: QUESTION_TAG_MAP

question_id         FK -> interview_questions.id, ON DELETE CASCADE
tag_id              FK -> question_tags.id, ON DELETE CASCADE
PRIMARY KEY(question_id, tag_id)   -- composite primary key, no separate id column
"""

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base


class QuestionTagMap(Base):
    __tablename__ = "question_tag_map"

    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_questions.id", ondelete="CASCADE"),
        primary_key=True,
    )

    tag_id = Column(
        UUID(as_uuid=True),
        ForeignKey("question_tags.id", ondelete="CASCADE"),
        primary_key=True,
    )

    
