"""Router for the notifications resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.notifications import NotificationListResponse, NotificationOut
from _05_services import notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=NotificationListResponse)
def list_my_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notifications.list_my_notifications(db, current_user, page=page, limit=limit)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return notifications.mark_as_read(db, current_user, notification_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/read-all")
@router.post("/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notifications.mark_all_as_read(db, current_user)

