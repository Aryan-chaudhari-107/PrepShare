"""Pydantic schemas for the institutions resource."""

import uuid

from pydantic import BaseModel, ConfigDict


class InstitutionOut(BaseModel):
    id: uuid.UUID
    name: str
    city: str
    state: str | None = None
    country: str
    type: str
    website: str | None = None

    model_config = ConfigDict(from_attributes=True)


class InstitutionListResponse(BaseModel):
    items: list[InstitutionOut] = []
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
