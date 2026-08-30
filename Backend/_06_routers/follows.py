"""Router for the follows resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.follows import FollowListResponse, FollowToggleResponse
from _05_services import follows

router = APIRouter(tags=["follows"])


@router.post("/users/{user_id}/follow", response_model=FollowToggleResponse)
def toggle_follow(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return follows.toggle_follow(db, current_user, user_id)
    except ValueError as e:
        msg = str(e)
        code = status.HTTP_400_BAD_REQUEST if "yourself" in msg else status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=code, detail=msg)


@router.get("/users/{user_id}/followers", response_model=FollowListResponse)
def list_user_followers(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return follows.list_followers(db, user_id, page=page, limit=limit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/users/{user_id}/following", response_model=FollowListResponse)
def list_user_following(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return follows.list_following(db, user_id, page=page, limit=limit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

