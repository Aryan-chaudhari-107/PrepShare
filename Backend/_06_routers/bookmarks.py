"""Router for the bookmarks resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas import PostListResponse
from _03_schemas.bookmarks import BookmarkStatusResponse, BookmarkToggleResponse
from _05_services import bookmarks

router = APIRouter(tags=["bookmarks"])


@router.post("/posts/{post_id}/bookmark", response_model=BookmarkToggleResponse)
def toggle_bookmark(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return bookmarks.toggle_bookmark_post(db, current_user, post_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/posts/{post_id}/bookmark", response_model=BookmarkStatusResponse)
def get_bookmark_status(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return bookmarks.get_bookmark_status(db, current_user, post_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/users/me/bookmarks", response_model=PostListResponse)
def list_my_bookmarks(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return bookmarks.list_my_bookmarks(db, current_user, page=page, limit=limit)

