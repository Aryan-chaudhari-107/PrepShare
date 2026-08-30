"""Repository for the comments resource — raw SQLAlchemy queries only."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from _02_models import Comment


def create_comment(db: Session, post_id, user_id, comment_text: str, parent_comment_id=None):
    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        comment_text=comment_text,
        parent_comment_id=parent_comment_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_comment_by_id(db: Session, comment_id):
    return db.query(Comment).filter(Comment.id == comment_id).first()


def get_comments_for_post(db: Session, post_id, limit: int, offset: int):
    return (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_comments_for_post(db: Session, post_id) -> int:
    return (
        db.query(func.count(Comment.id))
        .filter(Comment.post_id == post_id)
        .scalar()
    )


def update_comment(db: Session, comment, comment_text: str):
    comment.comment_text = comment_text
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment):
    db.delete(comment)
    db.commit()
