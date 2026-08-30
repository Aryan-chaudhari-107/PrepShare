
"""
Table: INTERVIEW_ROUNDS

id                  UUID, primary key, auto-generated
name                varchar, nullable — e.g. "Technical Round 1", "HR Round"
"""


import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, nullable=True)
