"""
TODO 17: 

Table: QUESTION_TAGS

id                  UUID, primary key, auto-generated
name                varchar, UNIQUE — e.g. "DSA", "DBMS", "OS", "System Design"
"""

import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base


class QuestionTag(Base):
    __tablename__ = "question_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, unique=True, nullable=False)

