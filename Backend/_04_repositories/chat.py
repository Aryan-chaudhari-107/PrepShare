"""Repository for the chat & messaging resource — raw SQLAlchemy queries only."""

import uuid

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from _02_models import Conversation, Message, MessageBlock
from utils import utc_now


def get_or_create_conversation(db: Session, user_a_id: uuid.UUID, user_b_id: uuid.UUID) -> Conversation:
    u1, u2 = (user_a_id, user_b_id) if str(user_a_id) < str(user_b_id) else (user_b_id, user_a_id)
    
    conv = db.query(Conversation).filter(
        Conversation.user_one_id == u1,
        Conversation.user_two_id == u2
    ).first()
    
    if not conv:
        conv = Conversation(user_one_id=u1, user_two_id=u2, created_at=utc_now())
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def get_user_conversations(db: Session, user_id: uuid.UUID) -> list[Conversation]:
    return db.query(Conversation).filter(
        or_(Conversation.user_one_id == user_id, Conversation.user_two_id == user_id)
    ).order_by(Conversation.created_at.desc()).all()


def get_conversation_by_id(db: Session, conversation_id: uuid.UUID) -> Conversation | None:
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


def get_latest_message_for_conversation(db: Session, conversation_id: uuid.UUID) -> Message | None:
    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).first()


def get_unread_count_for_conversation(db: Session, conversation_id: uuid.UUID, user_id: uuid.UUID) -> int:
    return db.query(func.count(Message.id)).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        Message.is_read == False
    ).scalar() or 0


def get_messages_for_conversation(
    db: Session,
    conversation_id: uuid.UUID,
    page: int = 1,
    limit: int = 50
) -> tuple[list[Message], int]:
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    total = query.count()
    items = query.order_by(Message.created_at.asc()).offset((page - 1) * limit).limit(limit).all()
    return items, total


def create_message(
    db: Session,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    message_text: str
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        message_text=message_text,
        is_read=False,
        created_at=utc_now()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def mark_conversation_as_read(db: Session, conversation_id: uuid.UUID, reader_id: uuid.UUID) -> int:
    updated = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != reader_id,
        Message.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return updated


def get_total_unread_messages_for_user(db: Session, user_id: uuid.UUID) -> int:
    # Find all conversations the user is in
    conv_ids = [c.id for c in get_user_conversations(db, user_id)]
    if not conv_ids:
        return 0
    return db.query(func.count(Message.id)).filter(
        Message.conversation_id.in_(conv_ids),
        Message.sender_id != user_id,
        Message.is_read == False
    ).scalar() or 0


def is_user_blocked(db: Session, sender_id: uuid.UUID, recipient_id: uuid.UUID) -> bool:
    # Returns true if recipient has blocked sender
    return db.query(MessageBlock).filter(
        MessageBlock.blocker_id == recipient_id,
        MessageBlock.blocked_id == sender_id
    ).first() is not None


def block_user(db: Session, blocker_id: uuid.UUID, blocked_id: uuid.UUID) -> MessageBlock:
    existing = db.query(MessageBlock).filter(
        MessageBlock.blocker_id == blocker_id,
        MessageBlock.blocked_id == blocked_id
    ).first()
    if not existing:
        existing = MessageBlock(blocker_id=blocker_id, blocked_id=blocked_id, created_at=utc_now())
        db.add(existing)
        db.commit()
        db.refresh(existing)
    return existing


def unblock_user(db: Session, blocker_id: uuid.UUID, blocked_id: uuid.UUID) -> bool:
    row = db.query(MessageBlock).filter(
        MessageBlock.blocker_id == blocker_id,
        MessageBlock.blocked_id == blocked_id
    ).first()
    if row:
        db.delete(row)
        db.commit()
        return True
    return False
