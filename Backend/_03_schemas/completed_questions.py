"""Pydantic schemas for the completed_questions resource."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class CompletedToggleResponse(BaseModel):
    completed: bool
    message: str


class CompletedQuestionItem(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    question_text: str | None = None
    attachment_url: str | None = None
    is_verified: bool
    easy_count: int
    medium_count: int
    hard_count: int
    post_id: uuid.UUID
    post_title: str
    post_category: str
    company_id: uuid.UUID | None = None
    company_name: str | None = None
    completed_at: datetime


class CompletedQuestionListResponse(BaseModel):
    items: list[CompletedQuestionItem] = []
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

