"""
TODO 19:

Table: HACKATHONS

id                          UUID, primary key, auto-generated
post_id                     FK -> interview_posts.id, UNIQUE, ON DELETE CASCADE
name                        varchar
theme                       varchar
level                       enum: college / state / national — national = country-wide event
host_institution_id         FK -> institutions.id, nullable — shown only if level = college
state                       optional varchar — shown only if level = state
country                     optional varchar — shown only if level = national
eligibility_text            optional text — which degree(s)/branches could participate
location                    optional varchar — venue city, or "Virtual"
position                    varchar — overall position/outcome text
rank_achieved               optional varchar — e.g. "Top 10", "Winner", "3rd place"
team_size                   integer
prize_amount                optional numeric
problem_statement_text      optional text
problem_statement_attachment_url   optional text — either/both allowed
evaluation_questions        optional text — questions asked during evaluation
tips                        optional text
created_at                  timestamp
"""

import uuid

from sqlalchemy import (
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


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_posts.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    name = Column(String, nullable=False)
    theme = Column(String, nullable=False)

    level = Column(
        Enum("college", "state", "national", name="hackathon_level"),
        nullable=False,
    )

    # no CASCADE — deleting an institution shouldn't wipe out hackathon posts about it
    host_institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id"),
        nullable=True,
    )

    state = Column(String, nullable=True)
    country = Column(String, nullable=True)

    eligibility_text = Column(Text, nullable=True)
    location = Column(String, nullable=True)

    position = Column(String, nullable=False)
    rank_achieved = Column(String, nullable=True)

    team_size = Column(Integer, nullable=False)
    prize_amount = Column(Numeric, nullable=True)

    problem_statement_text = Column(Text, nullable=True)
    problem_statement_attachment_url = Column(Text, nullable=True)
    evaluation_questions = Column(Text, nullable=True)
    tips = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)

    