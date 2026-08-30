"""FastAPI router for chat & direct messaging endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.conversations import (
    ConversationListResponse,
    ConversationOut,
    MessageCreate,
    MessageListResponse,
    MessageOut,
    StartConversationPayload,
    UnreadMessageCountResponse,
)
from _05_services import chat as chat_service

router = APIRouter(prefix="", tags=["chat"])


@router.get("/conversations/", response_model=ConversationListResponse)
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.list_conversations(db, current_user)


@router.post("/conversations/", response_model=ConversationOut)
def start_conversation(
    payload: StartConversationPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.start_or_get_conversation(db, current_user, payload.target_user_id)


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
def get_messages(
    conversation_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.get_messages_for_conversation(db, current_user, conversation_id, page=page, limit=limit)


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.send_message(db, current_user, conversation_id, payload.message_text)


@router.patch("/conversations/{conversation_id}/read")
def mark_read(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.mark_as_read(db, current_user, conversation_id)


@router.get("/messages/unread-count", response_model=UnreadMessageCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = chat_service.get_unread_count(db, current_user)
    return UnreadMessageCountResponse(unread_count=count)


@router.post("/users/{user_id}/block-messages")
def block_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.block_user_messages(db, current_user, user_id)


@router.delete("/users/{user_id}/block-messages")
def unblock_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.unblock_user_messages(db, current_user, user_id)
