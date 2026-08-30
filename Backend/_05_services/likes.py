"""Service for the likes resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _01_core import logger
from _04_repositories import get_post_by_id
from _04_repositories.likes import (
    count_likes_for_post,
    create_like,
    delete_like,
    get_like,
)


def toggle_like_post(db: Session, current_user, post_id: uuid.UUID):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None:
        raise ValueError("Post not found")

    existing_like = get_like(db, current_user.id, post_id)
    if existing_like:
        delete_like(db, existing_like)
        liked = False
        message = "Post unliked"
    else:
        create_like(db, current_user.id, post_id)
        liked = True
        message = "Post liked"

    like_count = count_likes_for_post(db, post_id)
    logger.info(f"Like toggled for post {post_id} by user {current_user.id} (liked={liked})")

    return {
        "liked": liked,
        "like_count": like_count,
        "message": message,
    }


def get_like_status(db: Session, current_user, post_id: uuid.UUID):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None:
        raise ValueError("Post not found")

    liked = False
    if current_user:
        liked = get_like(db, current_user.id, post_id) is not None

    like_count = count_likes_for_post(db, post_id)
    return {
        "liked": liked,
        "like_count": like_count,
    }

