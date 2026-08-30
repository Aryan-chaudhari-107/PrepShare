"""Service for the follows resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _01_core import logger
from _04_repositories import (
    count_followers_for_user,
    count_following_for_user,
    create_follow,
    delete_follow,
    get_follow,
    get_followers_for_user,
    get_following_for_user,
    get_user_by_id,
)


def toggle_follow(db: Session, current_user, target_user_id: uuid.UUID):
    if current_user.id == target_user_id:
        raise ValueError("You cannot follow yourself")

    target_user = get_user_by_id(db, target_user_id)
    if not target_user or not target_user.is_active:
        raise ValueError("User not found")

    existing_follow = get_follow(db, current_user.id, target_user_id)
    if existing_follow:
        delete_follow(db, existing_follow)
        db.refresh(target_user)
        logger.info(f"User {current_user.id} unfollowed user {target_user_id}")
        return {
            "following": False,
            "follower_count": target_user.follower_count,
            "message": "Unfollowed successfully",
        }
    else:
        create_follow(db, current_user.id, target_user_id)
        db.refresh(target_user)
        logger.info(f"User {current_user.id} followed user {target_user_id}")
        return {
            "following": True,
            "follower_count": target_user.follower_count,
            "message": "Followed successfully",
        }


def list_followers(db: Session, user_id: uuid.UUID, page: int, limit: int):
    target_user = get_user_by_id(db, user_id)
    if not target_user or not target_user.is_active:
        raise ValueError("User not found")

    offset = (page - 1) * limit
    total = count_followers_for_user(db, user_id)
    users = get_followers_for_user(db, user_id, limit=limit, offset=offset)

    items = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "profile_photo_url": u.profile_photo_url,
            "bio": u.bio,
            "contribution_score": u.contribution_score,
        }
        for u in users
    ]

    total_pages = (total + limit - 1) // limit if total else 0
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


def list_following(db: Session, user_id: uuid.UUID, page: int, limit: int):
    target_user = get_user_by_id(db, user_id)
    if not target_user or not target_user.is_active:
        raise ValueError("User not found")

    offset = (page - 1) * limit
    total = count_following_for_user(db, user_id)
    users = get_following_for_user(db, user_id, limit=limit, offset=offset)

    items = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "profile_photo_url": u.profile_photo_url,
            "bio": u.bio,
            "contribution_score": u.contribution_score,
        }
        for u in users
    ]

    total_pages = (total + limit - 1) // limit if total else 0
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }

