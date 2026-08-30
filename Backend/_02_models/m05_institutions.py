
"""
TODO 9:

Table: INSTITUTIONS

id                  UUID, primary key, auto-generated
name                varchar, indexed — e.g. "IIT Bombay"
city                required
state               optional — not every country has "states" as a concept
country             required
type                enum: college / university / institute
website             optional, URL
created_at          timestamp, set once on insert
"""

import uuid

from sqlalchemy import Column, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Institution(Base):

    __tablename__ = "institutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, index=True, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=True)
    country = Column(String, nullable=False)

    type = Column(
        Enum("college", "university", "institute", name="institution_type"),
        nullable=False,
    )

    website = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)