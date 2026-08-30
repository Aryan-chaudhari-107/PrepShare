"""Repository for the bookmarks resource — raw SQLAlchemy queries only."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from _02_models import Bookmark, InterviewPost


def get_bookmark(db: Session, user_id, post_id):
    return db.query(Bookmark).filter(Bookmark.user_id == user_id, Bookmark.post_id == post_id).first()


def create_bookmark(db: Session, user_id, post_id):
    bookmark = Bookmark(user_id=user_id, post_id=post_id)
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


def delete_bookmark(db: Session, bookmark):
    db.delete(bookmark)
    db.commit()


def get_bookmarked_posts_for_user(db: Session, user_id, limit: int, offset: int):
    return (
        db.query(InterviewPost)
        .join(Bookmark, Bookmark.post_id == InterviewPost.id)
        .filter(
            Bookmark.user_id == user_id,
            InterviewPost.deleted_at.is_(None),
            InterviewPost.status == "published",
        )
        .order_by(Bookmark.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_bookmarked_posts_for_user(db: Session, user_id) -> int:
    return (
        db.query(func.count(Bookmark.id))
        .join(InterviewPost, Bookmark.post_id == InterviewPost.id)
        .filter(
            Bookmark.user_id == user_id,
            InterviewPost.deleted_at.is_(None),
            InterviewPost.status == "published",
        )
        .scalar()
    )

