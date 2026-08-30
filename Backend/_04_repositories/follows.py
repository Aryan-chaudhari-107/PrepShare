"""Repository for the follows resource — raw SQLAlchemy queries only."""

from sqlalchemy import func, update
from sqlalchemy.orm import Session

from _02_models import Follow, User


def get_follow(db: Session, follower_id, following_id):
    return (
        db.query(Follow)
        .filter(Follow.follower_id == follower_id, Follow.following_id == following_id)
        .first()
    )


def create_follow(db: Session, follower_id, following_id):
    follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(follow)

    # Atomic count updates on User
    db.execute(
        update(User)
        .where(User.id == follower_id)
        .values(following_count=User.following_count + 1)
    )
    db.execute(
        update(User)
        .where(User.id == following_id)
        .values(follower_count=User.follower_count + 1)
    )
    db.commit()
    db.refresh(follow)
    return follow


def delete_follow(db: Session, follow):
    follower_id = follow.follower_id
    following_id = follow.following_id

    db.delete(follow)

    db.execute(
        update(User)
        .where(User.id == follower_id)
        .values(following_count=func.greatest(0, User.following_count - 1))
    )
    db.execute(
        update(User)
        .where(User.id == following_id)
        .values(follower_count=func.greatest(0, User.follower_count - 1))
    )
    db.commit()
    return True


def get_followers_for_user(db: Session, user_id, limit: int, offset: int):
    return (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id, User.is_active.is_(True))
        .order_by(Follow.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_followers_for_user(db: Session, user_id) -> int:
    return (
        db.query(func.count(Follow.id))
        .join(User, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id, User.is_active.is_(True))
        .scalar()
    )


def get_following_for_user(db: Session, user_id, limit: int, offset: int):
    return (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id, User.is_active.is_(True))
        .order_by(Follow.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_following_for_user(db: Session, user_id) -> int:
    return (
        db.query(func.count(Follow.id))
        .join(User, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id, User.is_active.is_(True))
        .scalar()
    )

