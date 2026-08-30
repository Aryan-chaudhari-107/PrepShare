
"""
TODO 10:

Table: EDUCATION_HISTORY

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, ON DELETE CASCADE
                    (not unique — one user can have multiple degrees:
                    Bachelor's, Master's, PhD, none overwritten)
degree_level        enum: Diploma / Bachelors / Masters / PhD
institution_id      FK -> institutions.id
course              varchar — e.g. "Computer Science"
branch              varchar — e.g. "AI/ML" or a specialization
education_type      enum: full_time / part_time / online
start_year          integer
end_year             integer
is_current          boolean, default false — true if still ongoing
created_at          timestamp, set once on insert
updated_at          timestamp, refreshed on every update
"""

import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class EducationHistory(Base):

    __tablename__ = "education_history"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    degree_level = Column(
        Enum(
            "Diploma",
            "Bachelors",
            "Masters",
            "PhD",
            name="degree_level",
        ),
        nullable=False,
    )

    institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id"),
        nullable=False,
    )

    # Education Details
    course = Column(String, nullable=False)

    branch = Column(String, nullable=True)

    education_type = Column(
        Enum(
            "full_time",
            "part_time",
            "online",
            name="education_type",
        ),
        nullable=False,
    )

    # Timeline
    start_year = Column(Integer, nullable=False)

    end_year = Column(Integer, nullable=True)

    is_current = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )