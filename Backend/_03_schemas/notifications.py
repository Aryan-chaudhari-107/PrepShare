"""Pydantic schemas for the notifications resource."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationSender(BaseModel):
    id: uuid.UUID
    username: str
    profile_photo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class NotificationOut(BaseModel):
    id: uuid.UUID
    receiver_id: uuid.UUID
    sender_id: uuid.UUID | None = None
    sender: NotificationSender | None = None
    type: str
    reference_id: uuid.UUID
    reference_type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[NotificationOut] = []
    unread_count: int = 0
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

