import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentAuthor(BaseModel):
    user_id: uuid.UUID
    username: str
    profile_photo_url: str | None = None


class CommentCreate(BaseModel):
    comment_text: str = Field(..., min_length=1)
    parent_comment_id: uuid.UUID | None = None


class CommentUpdate(BaseModel):
    comment_text: str = Field(..., min_length=1)


class CommentOut(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID | None = None
    parent_comment_id: uuid.UUID | None = None
    comment_text: str
    author: CommentAuthor
    created_at: datetime
    updated_at: datetime
    is_edited: bool = False

    model_config = ConfigDict(from_attributes=True)


class CommentListResponse(BaseModel):
    items: list[CommentOut] = []
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
