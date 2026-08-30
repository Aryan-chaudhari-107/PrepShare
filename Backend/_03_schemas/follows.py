"""Pydantic schemas for the follows resource."""

import uuid

from pydantic import BaseModel, ConfigDict


class FollowToggleResponse(BaseModel):
    following: bool
    follower_count: int
    message: str


class FollowUserItem(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str | None = None
    profile_photo_url: str | None = None
    bio: str | None = None
    contribution_score: int = 0

    model_config = ConfigDict(from_attributes=True)


class FollowListResponse(BaseModel):
    items: list[FollowUserItem] = []
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

