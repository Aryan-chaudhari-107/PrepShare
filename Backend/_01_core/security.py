"""
TODO: password hashing (passlib/bcrypt) + JWT create/verify (python-jose).
Needed by: auth.py router (signup/login), and a get_current_user dependency
used across most other routers.
"""
"""
Step 4:
Main work of this file 
Job 1: turn a password into gibberish so nobody can read it, even you.
Job 2: give a logged-in user a "wristband" (a token) that proves "yes, I already checked in" so they don't have to show ID every single time.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from _01_core.config import settings

# One reusable "hashing machine", configured for bcrypt.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    # copy the dict so we don't modify the caller's original object
    to_encode = data.copy()

    # work out when this token should expire:
    # "right now" + either a custom length (expires_delta) if one was
    # passed in, or the default minutes from settings/.env
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # "exp" is a reserved field name — the JWT library specifically
    # looks for this key to know when the token stops being valid
    to_encode.update({"exp": expire})

    # sign + encode everything into one token string, using SECRET_KEY
    # (only your server knows this, so the token can't be forged)
    # and ALGORITHM (e.g. "HS256", the signing method)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_access_token(token: str) -> dict | None:
    try:
        # decode checks BOTH the signature and the "exp" field
        # automatically — you don't need to check expiry by hand
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    except JWTError:
        # covers: tampered token, wrong signature, or expired —
        # return None instead of crashing, so the caller can turn
        # this into a clean "please log in again" response
        return None