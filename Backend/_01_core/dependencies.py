"""
The core problem it solves: right now, every endpoint you've 
built (/auth/login, /auth/request-otp, etc.) is open to 
anyone — nobody has to prove who they are. But soon you'll build 
things like "create a post" or "like a comment" — and those need 
to know which logged-in user is doing it. This file is what figures that out.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from _01_core.database import get_db
from _01_core.security import verify_access_token

security_scheme = HTTPBearer()
# auto_error=False means FastAPI will pass None instead of raising 403
# when no Authorization header is present — used by optional-auth endpoints.
optional_security_scheme = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme), db: Session = Depends(get_db)):
    from _02_models import (
        User,  # imported here, not at the top — avoids circular import
    )

    token = credentials.credentials
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    token_tv = payload.get("tv")
    if not user_id or token_tv is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active or token_tv != user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security_scheme),
    db: Session = Depends(get_db),
) -> object | None:
    """
    Like get_current_user but never raises. Returns the User if a valid token
    is present, None if no token or an invalid/expired one. Use for endpoints
    that are public but need to know who the caller is when authenticated
    (e.g. GET /posts/{post_id} so a draft author can read their own post).
    """
    from _02_models import User  # imported here — avoids circular import

    if credentials is None:
        return None

    payload = verify_access_token(credentials.credentials)
    if payload is None:
        return None

    user_id = payload.get("sub")
    token_tv = payload.get("tv")
    if not user_id or token_tv is None:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active or token_tv != user.token_version:
        return None

    return user