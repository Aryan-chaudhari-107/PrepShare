"""Repository for the likes resource — raw SQLAlchemy queries only."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from _02_models import Like


def get_like(db: Session, user_id, post_id):
    return db.query(Like).filter(Like.user_id == user_id, Like.post_id == post_id).first()


def create_like(db: Session, user_id, post_id):
    like = Like(user_id=user_id, post_id=post_id)
    db.add(like)
    db.commit()
    db.refresh(like)
    return like


def delete_like(db: Session, like):
    db.delete(like)
    db.commit()


def count_likes_for_post(db: Session, post_id) -> int:
    return db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar()

