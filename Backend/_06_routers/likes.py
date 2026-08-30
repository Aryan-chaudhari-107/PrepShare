"""Router for the likes resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_current_user_optional, get_db
from _02_models import User
from _03_schemas.likes import LikeStatusResponse, LikeToggleResponse
from _05_services import likes

router = APIRouter(tags=["likes"])


@router.post("/posts/{post_id}/like", response_model=LikeToggleResponse)
def toggle_like(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return likes.toggle_like_post(db, current_user, post_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/posts/{post_id}/like", response_model=LikeStatusResponse)
def get_like_status(
    post_id: uuid.UUID,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    try:
        return likes.get_like_status(db, current_user, post_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

