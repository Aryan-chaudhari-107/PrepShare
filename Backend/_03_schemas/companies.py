"""Pydantic schemas for the companies resource."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyCreate(BaseModel):
    name: str
    logo_url: str | None = None
    website: str | None = None
    industry: str | None = None


class CompanyOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    logo_url: str | None = None
    website: str | None = None
    industry: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyListResponse(BaseModel):
    items: list[CompanyOut] = []
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
