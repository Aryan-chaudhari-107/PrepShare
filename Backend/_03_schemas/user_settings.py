"""Pydantic schemas for the user_settings resource."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class UserSettingsUpdate(BaseModel):
    theme_preference: Literal["light", "dark", "system"]


class UserSettingsOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    theme_preference: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

