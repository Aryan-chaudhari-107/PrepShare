"""Repository for the companies resource — raw SQLAlchemy queries only."""

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from _02_models import Company


def create_company(db: Session, name: str, slug: str, logo_url=None, website=None, industry=None):
    company = Company(
        name=name,
        slug=slug,
        logo_url=logo_url,
        website=website,
        industry=industry,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def get_company_by_id(db: Session, company_id):
    return db.query(Company).filter(Company.id == company_id).first()


def get_company_by_name(db: Session, name: str):
    return db.query(Company).filter(Company.name == name).first()


def get_companies_paginated(db: Session, limit: int, offset: int, search: str | None = None):
    query = db.query(Company)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Company.name.ilike(pattern),
                Company.industry.ilike(pattern),
            )
        )
    return (
        query.order_by(Company.name.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_companies(db: Session, search: str | None = None) -> int:
    query = db.query(func.count(Company.id))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Company.name.ilike(pattern),
                Company.industry.ilike(pattern),
            )
        )
    return query.scalar()


def get_companies_by_ids(db: Session, company_ids: list):
    """Batch lookup by list of ids — one IN query, used by feed enrichment."""
    if not company_ids:
        return []
    return db.query(Company).filter(Company.id.in_(company_ids)).all()
