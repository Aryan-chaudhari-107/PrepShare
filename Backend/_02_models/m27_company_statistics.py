"""
TODO 31:

Table: COMPANY_STATISTICS  (future / v2+)

company_id          FK -> companies.id, PRIMARY KEY
total_interviews    integer
avg_package         optional numeric
popular_topics      jsonb
updated_at          timestamp
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import JSONB, UUID

from _01_core import Base
from utils import utc_now


class CompanyStatistics(Base):
    __tablename__ = "company_statistics"

    # company_id IS the primary key here — no separate id column.
    # One row per company, computed/aggregated, not created directly by users.
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        primary_key=True,
    )

    total_interviews = Column(Integer, default=0, nullable=False)
    avg_package = Column(Numeric, nullable=True)

    # jsonb — stores flexible, semi-structured data (e.g. {"DSA": 45, "HR": 30})
    # instead of a fixed set of columns, since "popular topics" varies per company
    popular_topics = Column(JSONB, nullable=True)

    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    