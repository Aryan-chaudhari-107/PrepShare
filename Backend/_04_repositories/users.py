"""Repository for the users resource — raw SQLAlchemy queries only."""


from sqlalchemy import or_
from sqlalchemy.orm import Session

from _02_models import User, UserSettings


def get_user_by_id(db: Session, user_id):
    return db.query(User).filter(User.id == user_id).first()


def get_users_by_ids(db: Session, user_ids):
    if not user_ids:
        return []
    return db.query(User).filter(User.id.in_(user_ids)).all()


def update_user_profile(db: Session, user: User, full_name=None, bio=None, profile_photo_url=None):
    if full_name is not None:
        user.full_name = full_name
    if bio is not None:
        user.bio = bio
    if profile_photo_url is not None:
        user.profile_photo_url = profile_photo_url
    db.commit()
    db.refresh(user)
    return user


def search_users(db: Session, query: str, limit: int = 10):
    pattern = f"%{query}%"
    return db.query(User).filter(
        User.is_active == True,
        or_(
            User.username.ilike(pattern),
            User.full_name.ilike(pattern)
        )
    ).limit(limit).all()


def get_or_create_user_settings(db: Session, user_id):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id, theme_preference="system")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_user_settings(db: Session, settings, theme_preference: str):
    settings.theme_preference = theme_preference
    db.commit()
    db.refresh(settings)
    return settings
