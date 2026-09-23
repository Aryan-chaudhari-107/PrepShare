"""Service for the auth resource — business logic."""

from datetime import timedelta

from _01_core import create_access_token, hash_password, logger, settings, verify_password
from _03_schemas import RequestOTP, ResetPassword, UserLogin, VerifyAndRegister
from _04_repositories import (
    create_otp,
    create_user,
    get_user_by_email,
    get_user_by_username,
    get_valid_otp,
    get_valid_otp_by_user,
    increment_otp_failed_attempts,
    increment_user_token_version,
    mark_otp_used,
    update_password,
)
from utils import generate_otp, send_otp_email, utc_now


def mask_email(email: str) -> str:
    """Mask email for log sanitization (e.g. u***r@example.com)."""
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "***" + local[-1]
    return f"{masked_local}@{domain}"


def request_otp(db, data: RequestOTP):
    # rule: don't let someone request an OTP for an email already registered
    if get_user_by_email(db, data.email):
        logger.warning(f"OTP requested for already-registered email: {mask_email(data.email)}")
        raise ValueError("Email already registered")

    raw_otp = generate_otp()
    otp_hash = hash_password(raw_otp)
    expires_at = utc_now() + timedelta(minutes=10)

    create_otp(
        db,
        otp_code_hash=otp_hash,
        expires_at=expires_at,
        email=data.email,
        purpose="email_verification",
    )

    delivered = send_otp_email(data.email, raw_otp)
    logger.info(f"OTP sent to {mask_email(data.email)}")

    resp = {"message": "OTP sent to your email"}
    is_dev = getattr(settings, "ENVIRONMENT", "development").lower() == "development"
    if not delivered and is_dev:
        resp["dev_code"] = raw_otp
    return resp


def verify_and_register(db, data: VerifyAndRegister):
    otp = get_valid_otp(db, data.email, purpose="email_verification")
    if not otp:
        logger.warning(f"Failed OTP verification attempt for email: {mask_email(data.email)}")
        raise ValueError("Invalid or expired OTP")

    if not verify_password(data.otp_code, otp.otp_code_hash):
        increment_otp_failed_attempts(db, otp.id)
        logger.warning(f"Failed OTP verification attempt for email: {mask_email(data.email)}")
        raise ValueError("Invalid or expired OTP")

    if get_user_by_username(db, data.username):
        raise ValueError("Username already taken")

    mark_otp_used(db, otp)

    hashed_password = hash_password(data.password)
    new_user = create_user(
        db,
        email=data.email,
        username=data.username,
        password_hash=hashed_password,
        full_name=data.full_name,
    )
    new_user.is_email_verified = True
    db.commit()

    logger.info(f"New user registered: {new_user.id} ({mask_email(new_user.email)})")
    token = create_access_token({"sub": str(new_user.id), "tv": new_user.token_version})
    return {"access_token": token, "token_type": "bearer", "message": "Registration successful"}



def login(db, data: UserLogin):
    if "@" in data.identifier:
        user = get_user_by_email(db, data.identifier)
    else:
        user = get_user_by_username(db, data.identifier)

    if not user or not verify_password(data.password, user.password_hash):
        logger.warning("Failed login attempt for identifier")
        raise ValueError("Invalid credentials")

    if not user.is_email_verified:
        raise ValueError("Please verify your email before logging in")

    logger.info(f"User {user.id} logged in successfully")
    
    token = create_access_token({"sub": str(user.id), "tv": user.token_version})
    return {"access_token": token, "token_type": "bearer", "message":"Login successful"}

def forgot_password(db, data: RequestOTP):
    user = get_user_by_email(db, data.email)
    if not user:
        return {"message": "If that email is registered, an OTP has been sent"}

    raw_otp = generate_otp()
    otp_hash = hash_password(raw_otp)
    expires_at = utc_now() + timedelta(minutes=10)

    create_otp(
        db,
        otp_code_hash=otp_hash,
        expires_at=expires_at,
        user_id=user.id,
        purpose="password_reset",
    )

    delivered = send_otp_email(data.email, raw_otp)
    logger.info(f"Password reset OTP sent to {mask_email(data.email)}")

    resp = {"message": "If that email is registered, an OTP has been sent"}
    is_dev = getattr(settings, "ENVIRONMENT", "development").lower() == "development"
    if not delivered and is_dev:
        resp["dev_code"] = raw_otp
    return resp


def reset_password(db, data: ResetPassword):
    user = get_user_by_email(db, data.email)
    if not user:
        raise ValueError("Invalid request")

    otp = get_valid_otp_by_user(db, user.id, purpose="password_reset")
    if not otp:
        logger.warning(f"Failed password reset attempt for user {user.id}")
        raise ValueError("Invalid or expired OTP")

    if not verify_password(data.otp_code, otp.otp_code_hash):
        increment_otp_failed_attempts(db, otp.id)
        logger.warning(f"Failed password reset OTP code verification for user {user.id}")
        raise ValueError("Invalid or expired OTP")

    mark_otp_used(db, otp)

    new_hash = hash_password(data.new_password)
    update_password(db, user, new_hash)

    logger.info(f"Password reset completed for user {user.id}")

    return {"message": "Password reset successful"}

def logout(db, current_user):
    affected = increment_user_token_version(db, current_user.id)
    if not affected:
        raise ValueError("User not found")
    logger.info(f"User {current_user.id} logged out successfully")
    return {"message": "Successfully logged out"}