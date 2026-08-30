"""Pydantic schemas for the reports resource."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    post_id: uuid.UUID
    reason: str = Field(..., min_length=3)


class ReportOut(BaseModel):
    id: uuid.UUID
    reporter_id: uuid.UUID
    post_id: uuid.UUID
    reason: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

