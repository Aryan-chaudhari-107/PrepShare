"""
Repository for the auth resource — raw SQLAlchemy queries only.
No business rules here — those belong in _05_services/auth.py.
Takes a db session (from _01_core.database.get_db) as a parameter into each function.
"""

from sqlalchemy.orm import Session

from _02_models import Otp, User
from utils import utc_now


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(
    db: Session,
    email: str,
    username: str,
    password_hash: str,
    full_name: str | None = None,
):
    new_user = User(
        email=email,
        username=username,
        password_hash=password_hash,
        full_name=full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def create_otp(db: Session, otp_code_hash: str, expires_at, email: str = None, user_id=None, purpose: str = "email_verification"):
    new_otp = Otp(
        email=email,
        user_id=user_id,
        purpose=purpose,
        otp_code_hash=otp_code_hash,
        expires_at=expires_at,
    )
    db.add(new_otp)
    db.commit()
    db.refresh(new_otp)
    return new_otp


from sqlalchemy import update


def get_valid_otp(db: Session, email: str, purpose: str):
    return (
        db.query(Otp)
        .filter(
            Otp.email == email,
            Otp.purpose == purpose,
            Otp.is_used == False,
            Otp.failed_attempts < 5,
            Otp.expires_at > utc_now(),
        )
        .order_by(Otp.created_at.desc())
        .first()
    )


def increment_otp_failed_attempts(db: Session, otp_id) -> None:
    """Atomically increment the failed attempt count in SQL to prevent race conditions."""
    db.execute(
        update(Otp)
        .where(Otp.id == otp_id)
        .values(failed_attempts=Otp.failed_attempts + 1)
    )
    db.commit()


def mark_otp_used(db: Session, otp: Otp):
    otp.is_used = True
    db.commit()
    db.refresh(otp)
    return otp


def get_valid_otp_by_user(db: Session, user_id, purpose: str):
    return (
        db.query(Otp)
        .filter(
            Otp.user_id == user_id,
            Otp.purpose == purpose,
            Otp.is_used == False,
            Otp.failed_attempts < 5,
            Otp.expires_at > utc_now(),
        )
        .order_by(Otp.created_at.desc())
        .first()
    )


def update_password(db: Session, user: User, new_password_hash: str):
    db.execute(
        update(User)
        .where(User.id == user.id)
        .values(
            password_hash=new_password_hash,
            token_version=User.token_version + 1,
        )
    )
    db.commit()
    db.refresh(user)
    return user


def increment_user_token_version(db: Session, user_id) -> bool:
    """Atomically increment the user token_version to invalidate all active JWTs."""
    result = db.execute(
        update(User)
        .where(User.id == user_id)
        .values(token_version=User.token_version + 1)
    )
    db.commit()
    return result.rowcount > 0