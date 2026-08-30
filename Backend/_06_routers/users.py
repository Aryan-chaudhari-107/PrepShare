import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas import PostListResponse, PublicProfile, UserProfile
from _03_schemas.user_settings import UserSettingsOut, UserSettingsUpdate
from _03_schemas.users import ChangePassword, UserProfileUpdate, UserSearchResponse
from _05_services import posts as posts_service
from _05_services import users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return users.get_my_profile(current_user)


@router.patch("/me", response_model=UserProfile)
def update_my_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return users.update_my_profile(db, current_user, data)


@router.get("/search", response_model=UserSearchResponse)
def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = users.search_users(db, q, limit=limit)
    return UserSearchResponse(items=items)


@router.get("/me/drafts", response_model=PostListResponse)
def get_my_drafts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return posts_service.list_user_drafts(db, current_user, page=page, limit=limit)


@router.get("/me/settings", response_model=UserSettingsOut)
def get_my_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return users.get_settings(db, current_user)


@router.patch("/me/settings", response_model=UserSettingsOut)
def update_my_settings(
    data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return users.update_settings(db, current_user, data)


@router.put("/change-password")
def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return users.change_password(db, current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}", response_model=PublicProfile)
def get_public_user_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    try:
        return users.get_public_profile(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{user_id}/posts", response_model=PostListResponse)
def get_public_user_posts(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    try:
        return users.get_user_posts(db, user_id, page=page, limit=limit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
