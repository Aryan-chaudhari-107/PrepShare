"""Service for the notifications resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _04_repositories import (
    count_notifications_for_user,
    count_unread_notifications_for_user,
    get_notification_by_id,
    get_notifications_for_user,
    get_users_by_ids,
    mark_all_notifications_read_for_user,
    mark_notification_read,
)


def list_my_notifications(db: Session, current_user, page: int, limit: int):
    offset = (page - 1) * limit
    total = count_notifications_for_user(db, current_user.id)
    unread_count = count_unread_notifications_for_user(db, current_user.id)
    notifs = get_notifications_for_user(db, current_user.id, limit=limit, offset=offset)

    sender_ids = [n.sender_id for n in notifs if n.sender_id is not None]
    senders = {
        u.id: {
            "id": u.id,
            "username": u.username,
            "profile_photo_url": u.profile_photo_url,
        }
        for u in get_users_by_ids(db, sender_ids)
    }

    items = []
    for n in notifs:
        items.append({
            "id": n.id,
            "receiver_id": n.receiver_id,
            "sender_id": n.sender_id,
            "sender": senders.get(n.sender_id) if n.sender_id else None,
            "type": n.type,
            "reference_id": n.reference_id,
            "reference_type": n.reference_type,
            "is_read": n.is_read,
            "created_at": n.created_at,
        })

    total_pages = (total + limit - 1) // limit if total else 0
    return {
        "items": items,
        "unread_count": unread_count,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


def mark_as_read(db: Session, current_user, notification_id: uuid.UUID):
    notif = get_notification_by_id(db, notification_id)
    if not notif or notif.receiver_id != current_user.id:
        raise ValueError("Notification not found")

    return mark_notification_read(db, notif)


def mark_all_as_read(db: Session, current_user):
    mark_all_notifications_read_for_user(db, current_user.id)
    return {"message": "All notifications marked as read"}

