
"""
TODO 12:

Table: INTERVIEW_POSTS

id                  UUID, primary key, auto-generated
user_id             FK -> users.id, ON DELETE CASCADE — who posted this
company_id          FK -> companies.id, nullable, indexed
education_id        FK -> education_history.id, nullable
post_category       enum: campus_hackathon / off_campus_hackathon /
                    campus_placement / off_campus_placement
title               varchar
slug                varchar, UNIQUE
year_of_study       optional integer — campus only, point-in-time
age                 optional integer — point-in-time
experience_years    optional numeric — off-campus: prior work experience
current_status      optional enum: student / fresher / working_professional
work_location       optional varchar — specific office/city
work_mode           optional enum: remote / onsite / hybrid
is_offer_received   boolean, default false
job_role            optional varchar — shown/required only if is_offer_received
package_amount      optional numeric — shown/required only if is_offer_received
currency            optional varchar — shown/required only if is_offer_received
experience_text     text
tips                optional text — closing tip from the poster
is_anonymous        boolean, default false
status              enum: draft / published / flagged
deleted_at          optional timestamp — soft delete
view_count          integer, default 0
share_count         integer, default 0
created_at          timestamp
updated_at          timestamp
"""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class InterviewPost(Base):

    __tablename__ = "interview_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # No CASCADE here — deleting a company shouldn't wipe out every post about it
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=True,
        index=True,
    )

    # No CASCADE here either — an old education entry being removed shouldn't
    # delete the post itself
    education_id = Column(
        UUID(as_uuid=True),
        ForeignKey("education_history.id"),
        nullable=True,
    )

    post_category = Column(
        Enum(
            "campus_hackathon",
            "off_campus_hackathon",
            "campus_placement",
            "off_campus_placement",
            name="post_category",
        ),
        nullable=False,
    )

    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)

    year_of_study = Column(Integer, nullable=True)
    age = Column(Integer, nullable=True)
    experience_years = Column(Numeric, nullable=True)

    current_status = Column(
        Enum("student", "fresher", "working_professional", name="current_status"),
        nullable=True,
    )

    work_location = Column(String, nullable=True)

    work_mode = Column(
            Enum("remote", "onsite", "hybrid", name="work_mode"),
            nullable=True,
        )
    
    is_offer_received = Column(Boolean, default=False, nullable=False)

    job_role = Column(String, nullable=True)
    package_amount = Column(Numeric, nullable=True)
    currency = Column(String, nullable=True)

    experience_text = Column(Text, nullable=False)
    tips = Column(Text, nullable=True)

    is_anonymous = Column(Boolean, default=False, nullable=False)

    status = Column(
        Enum("draft", "published", "flagged", name="post_status"),
        nullable=False,
        default="draft",
    )

    published_at = Column(DateTime, nullable=True, index=True)
    edit_count = Column(Integer, default=0, nullable=False)

    deleted_at = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)