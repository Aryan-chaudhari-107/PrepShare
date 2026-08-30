"""Repository for the institutions resource — raw SQLAlchemy queries only."""

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from _02_models import Institution


def get_institutions_paginated(db: Session, limit: int, offset: int, search: str | None = None):
    query = db.query(Institution)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Institution.name.ilike(pattern),
                Institution.city.ilike(pattern),
                Institution.country.ilike(pattern),
            )
        )
    return (
        query.order_by(Institution.name.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_institutions(db: Session, search: str | None = None) -> int:
    query = db.query(func.count(Institution.id))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Institution.name.ilike(pattern),
                Institution.city.ilike(pattern),
                Institution.country.ilike(pattern),
            )
        )
    return query.scalar()


def get_institution_by_id(db: Session, institution_id):
    return db.query(Institution).filter(Institution.id == institution_id).first()
