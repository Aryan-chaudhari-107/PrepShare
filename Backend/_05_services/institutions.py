"""Service for the institutions resource — business logic only."""

from sqlalchemy.orm import Session

from _04_repositories.institutions import (
    count_institutions,
    get_institution_by_id,
    get_institutions_paginated,
)


def list_institutions(db: Session, page: int, limit: int, search: str | None = None):
    offset = (page - 1) * limit
    total = count_institutions(db, search=search)
    items = get_institutions_paginated(db, limit=limit, offset=offset, search=search)
    total_pages = (total + limit - 1) // limit if total else 0
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


def get_institution(db: Session, institution_id):
    institution = get_institution_by_id(db, institution_id)
    if not institution:
        raise ValueError("Institution not found")
    return institution
