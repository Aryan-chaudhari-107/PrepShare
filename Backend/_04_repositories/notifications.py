"""Repository for the notifications resource — raw SQLAlchemy queries only."""

from sqlalchemy import func, update
from sqlalchemy.orm import Session

from _02_models import Notification


def create_notification(db: Session, receiver_id, type, reference_id, reference_type, sender_id=None):
    notification = Notification(
        receiver_id=receiver_id,
        sender_id=sender_id,
        type=type,
        reference_id=reference_id,
        reference_type=reference_type,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_notifications_for_user(db: Session, receiver_id, limit: int, offset: int):
    return (
        db.query(Notification)
        .filter(Notification.receiver_id == receiver_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_notifications_for_user(db: Session, receiver_id) -> int:
    return (
        db.query(func.count(Notification.id))
        .filter(Notification.receiver_id == receiver_id)
        .scalar()
    )


def count_unread_notifications_for_user(db: Session, receiver_id) -> int:
    return (
        db.query(func.count(Notification.id))
        .filter(Notification.receiver_id == receiver_id, Notification.is_read.is_(False))
        .scalar()
    )


def get_notification_by_id(db: Session, notification_id):
    return db.query(Notification).filter(Notification.id == notification_id).first()


def mark_notification_read(db: Session, notification):
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_notifications_read_for_user(db: Session, receiver_id):
    db.execute(
        update(Notification)
        .where(Notification.receiver_id == receiver_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return True

