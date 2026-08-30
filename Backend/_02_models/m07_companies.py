
"""
TODO 11:

Table: COMPANIES

id                  UUID, primary key, auto-generated
name                varchar, UNIQUE, indexed — e.g. "Google"
slug                varchar, UNIQUE — URL-friendly version, e.g. "google"
                    (used for URLs like /companies/google)
logo_url            optional, URL to logo image
website             optional, URL
industry            optional, varchar — e.g. "Software", "Finance"
created_at          timestamp, set once on insert
updated_at          timestamp, refreshed on every update
"""



import uuid

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Company(Base):

    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, unique=True, index=True, nullable=False)

    slug = Column(String, unique=True, nullable=False)

    logo_url = Column(Text, nullable=True)

    website = Column(Text, nullable=True)

    industry = Column(String, nullable=True)
    
    created_at = Column(
            DateTime, 
            default=utc_now, 
            nullable=False)
    
    updated_at = Column(
            DateTime, 
            default=utc_now, 
            onupdate=utc_now, 
            nullable=False)