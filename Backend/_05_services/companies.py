"""Service for the companies resource — business logic only."""

from sqlalchemy.orm import Session

from _01_core import logger
from _03_schemas.companies import CompanyCreate
from _04_repositories.companies import (
    count_companies,
    create_company,
    get_companies_paginated,
    get_company_by_id,
    get_company_by_name,
)
from utils import generate_slug


def create_new_company(db: Session, current_user, data: CompanyCreate):
    # Any authenticated user may create a company in Phase 1.
    # Admin-only gating is a Phase 7 (moderation) concern.
    existing = get_company_by_name(db, data.name)
    if existing:
        raise ValueError(f"A company named '{data.name}' already exists")

    slug = generate_slug(data.name)
    company = create_company(
        db,
        name=data.name,
        slug=slug,
        logo_url=data.logo_url,
        website=data.website,
        industry=data.industry,
    )
    logger.info(f"Company created: {company.id} ({company.name}) by user {current_user.id}")
    return company


def get_company(db: Session, company_id):
    company = get_company_by_id(db, company_id)
    if not company:
        raise ValueError("Company not found")
    return company


def list_companies(db: Session, page: int, limit: int, search: str | None = None):
    offset = (page - 1) * limit
    total = count_companies(db, search=search)
    items = get_companies_paginated(db, limit=limit, offset=offset, search=search)
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
