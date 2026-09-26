"""Service for the comments resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _01_core import NotFoundError, logger
from _03_schemas.comments import CommentCreate, CommentUpdate
from _04_repositories import (
    get_post_by_id,
    get_users_by_ids,
)
from _04_repositories.comments import (
    count_comments_for_post,
    create_comment,
    delete_comment,
    get_comment_by_id,
    get_comments_for_post,
    update_comment,
)
from _04_repositories.notifications import create_notification


def add_comment_to_post(db: Session, current_user, post_id: uuid.UUID, data: CommentCreate):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None:
        raise NotFoundError("Post not found")

    parent = None
    if data.parent_comment_id:
        parent = get_comment_by_id(db, data.parent_comment_id)
        if not parent or parent.post_id != post_id:
            raise NotFoundError("Parent comment not found on this post")

    comment = create_comment(
        db,
        post_id=post_id,
        user_id=current_user.id,
        comment_text=data.comment_text,
        parent_comment_id=data.parent_comment_id,
    )

    # Trigger notifications:
    try:
        # If this is a reply to another comment, notify the parent comment's author
        if parent and parent.user_id != current_user.id:
            create_notification(
                db,
                receiver_id=parent.user_id,
                sender_id=current_user.id,
                type="COMMENT",
                reference_id=post_id,
                reference_type="post",
            )
        # Also notify the post author if they are not the commenter and not the parent comment author
        if post.user_id and post.user_id != current_user.id and (not parent or parent.user_id != post.user_id):
            create_notification(
                db,
                receiver_id=post.user_id,
                sender_id=current_user.id,
                type="COMMENT",
                reference_id=post_id,
                reference_type="post",
            )
    except Exception as e:
        logger.warning(f"Failed to create COMMENT notification: {e}")

    logger.info(f"Comment added: {comment.id} to post {post_id} by user {current_user.id}")

    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "user_id": current_user.id,
        "parent_comment_id": comment.parent_comment_id,
        "comment_text": comment.comment_text,
        "author": {
            "user_id": current_user.id,
            "username": current_user.username,
            "profile_photo_url": current_user.profile_photo_url,
        },
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "is_edited": False,
    }


def list_comments_for_post(db: Session, post_id: uuid.UUID, page: int, limit: int):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None:
        raise NotFoundError("Post not found")

    offset = (page - 1) * limit
    total = count_comments_for_post(db, post_id)
    comments = get_comments_for_post(db, post_id, limit=limit, offset=offset)

    user_ids = list({c.user_id for c in comments})
    users = {u.id: u for u in get_users_by_ids(db, user_ids)}

    items = []
    for c in comments:
        u = users.get(c.user_id)
        author = {
            "user_id": u.id if u else c.user_id,
            "username": u.username if u else "[deleted]",
            "profile_photo_url": u.profile_photo_url if u else None,
        }
        is_edited = bool(c.updated_at and c.created_at and c.updated_at > c.created_at)
        items.append({
            "id": c.id,
            "post_id": c.post_id,
            "user_id": c.user_id,
            "parent_comment_id": c.parent_comment_id,
            "comment_text": c.comment_text,
            "author": author,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "is_edited": is_edited,
        })

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


def edit_comment_text(db: Session, current_user, comment_id: uuid.UUID, data: CommentUpdate):
    comment = get_comment_by_id(db, comment_id)
    if not comment:
        raise NotFoundError("Comment not found")

    if comment.user_id != current_user.id:
        raise ValueError("You don't own this comment")

    updated = update_comment(db, comment, data.comment_text)

    return {
        "id": updated.id,
        "post_id": updated.post_id,
        "user_id": current_user.id,
        "parent_comment_id": updated.parent_comment_id,
        "comment_text": updated.comment_text,
        "author": {
            "user_id": current_user.id,
            "username": current_user.username,
            "profile_photo_url": current_user.profile_photo_url,
        },
        "created_at": updated.created_at,
        "updated_at": updated.updated_at,
        "is_edited": True,
    }


def remove_comment_by_id(db: Session, current_user, comment_id: uuid.UUID):
    comment = get_comment_by_id(db, comment_id)
    if not comment:
        raise NotFoundError("Comment not found")

    if comment.user_id != current_user.id:
        raise ValueError("You don't own this comment")

    delete_comment(db, comment)
    return {"message": "Comment deleted successfully"}
