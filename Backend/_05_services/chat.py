"""Service for the chat & messaging resource — business logic."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from _02_models import User
from _03_schemas.conversations import (
    ConversationListResponse,
    ConversationOut,
    MessageListResponse,
    MessageOut,
    ParticipantOut,
)
from _04_repositories import chat as chat_repo
from _04_repositories import users as users_repo


def list_conversations(db: Session, current_user: User) -> ConversationListResponse:
    convs = chat_repo.get_user_conversations(db, current_user.id)
    out_items = []
    
    for c in convs:
        other_user_id = c.user_two_id if c.user_one_id == current_user.id else c.user_one_id
        other_user = users_repo.get_user_by_id(db, other_user_id)
        if not other_user:
            continue
            
        last_msg = chat_repo.get_latest_message_for_conversation(db, c.id)
        unread = chat_repo.get_unread_count_for_conversation(db, c.id, current_user.id)
        
        out_items.append(ConversationOut(
            id=c.id,
            user_one_id=c.user_one_id,
            user_two_id=c.user_two_id,
            created_at=c.created_at,
            other_participant=ParticipantOut(
                id=other_user.id,
                username=other_user.username,
                full_name=other_user.full_name,
                profile_photo_url=other_user.profile_photo_url
            ),
            last_message=MessageOut.model_validate(last_msg) if last_msg else None,
            unread_count=unread
        ))
        
    return ConversationListResponse(items=out_items, total=len(out_items))


def start_or_get_conversation(db: Session, current_user: User, target_user_id: uuid.UUID) -> ConversationOut:
    if target_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start a direct message conversation with yourself."
        )
        
    target_user = users_repo.get_user_by_id(db, target_user_id)
    if not target_user or not target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found or is inactive."
        )
        
    if chat_repo.is_user_blocked(db, sender_id=current_user.id, recipient_id=target_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot message this user because they have blocked messages from you."
        )
        
    conv = chat_repo.get_or_create_conversation(db, current_user.id, target_user_id)
    last_msg = chat_repo.get_latest_message_for_conversation(db, conv.id)
    unread = chat_repo.get_unread_count_for_conversation(db, conv.id, current_user.id)
    
    return ConversationOut(
        id=conv.id,
        user_one_id=conv.user_one_id,
        user_two_id=conv.user_two_id,
        created_at=conv.created_at,
        other_participant=ParticipantOut(
            id=target_user.id,
            username=target_user.username,
            full_name=target_user.full_name,
            profile_photo_url=target_user.profile_photo_url
        ),
        last_message=MessageOut.model_validate(last_msg) if last_msg else None,
        unread_count=unread
    )


def get_messages_for_conversation(
    db: Session,
    current_user: User,
    conversation_id: uuid.UUID,
    page: int = 1,
    limit: int = 50
) -> MessageListResponse:
    conv = chat_repo.get_conversation_by_id(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
        
    if current_user.id not in (conv.user_one_id, conv.user_two_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation.")
        
    items, total = chat_repo.get_messages_for_conversation(db, conversation_id, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    # Auto-mark as read when fetching
    chat_repo.mark_conversation_as_read(db, conversation_id, current_user.id)
    
    return MessageListResponse(
        items=[MessageOut.model_validate(m) for m in items],
        total=total,
        page=page,
        total_pages=total_pages
    )


def send_message(
    db: Session,
    current_user: User,
    conversation_id: uuid.UUID,
    message_text: str
) -> MessageOut:
    conv = chat_repo.get_conversation_by_id(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
        
    if current_user.id not in (conv.user_one_id, conv.user_two_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation.")
        
    recipient_id = conv.user_two_id if conv.user_one_id == current_user.id else conv.user_one_id
    if chat_repo.is_user_blocked(db, sender_id=current_user.id, recipient_id=recipient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot send message. You have been blocked by this user."
        )
        
    clean_text = message_text.strip()
    if not clean_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")
        
    msg = chat_repo.create_message(db, conversation_id, current_user.id, clean_text)
    return MessageOut.model_validate(msg)


def mark_as_read(db: Session, current_user: User, conversation_id: uuid.UUID) -> dict:
    conv = chat_repo.get_conversation_by_id(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    if current_user.id not in (conv.user_one_id, conv.user_two_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation.")
        
    count = chat_repo.mark_conversation_as_read(db, conversation_id, current_user.id)
    return {"status": "ok", "marked_read": count}


def get_unread_count(db: Session, current_user: User) -> int:
    return chat_repo.get_total_unread_messages_for_user(db, current_user.id)


def block_user_messages(db: Session, current_user: User, target_user_id: uuid.UUID) -> dict:
    if target_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot block yourself.")
    chat_repo.block_user(db, current_user.id, target_user_id)
    return {"message": "User messages blocked successfully."}


def unblock_user_messages(db: Session, current_user: User, target_user_id: uuid.UUID) -> dict:
    chat_repo.unblock_user(db, current_user.id, target_user_id)
    return {"message": "User messages unblocked successfully."}
