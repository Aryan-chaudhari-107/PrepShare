import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageOut(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    message_text: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    message_text: str = Field(..., min_length=1, max_length=5000)


class MessageListResponse(BaseModel):
    items: list[MessageOut]
    total: int
    page: int
    total_pages: int


class ParticipantOut(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str | None = None
    profile_photo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ConversationOut(BaseModel):
    id: uuid.UUID
    user_one_id: uuid.UUID
    user_two_id: uuid.UUID
    created_at: datetime
    other_participant: ParticipantOut
    last_message: MessageOut | None = None
    unread_count: int = 0


class ConversationListResponse(BaseModel):
    items: list[ConversationOut]
    total: int


class StartConversationPayload(BaseModel):
    target_user_id: uuid.UUID


class UnreadMessageCountResponse(BaseModel):
    unread_count: int
