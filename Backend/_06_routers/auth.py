"""
Router for the auth resource — controller layer. Receives HTTP requests,
calls _05_services/auth.py, returns HTTP responses. No database access,
no business rules here.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db, limiter
from _02_models import User
from _03_schemas import RequestOTP, ResetPassword, Token, UserLogin, VerifyAndRegister
from _05_services import auth

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-otp")
@limiter.limit("3/minute")
def request_otp(request: Request, data: RequestOTP, db: Session = Depends(get_db)):
    try:
        return auth.request_otp(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/verify-and-register", response_model=Token)
@limiter.limit("5/minute")
def verify_and_register(request: Request, data: VerifyAndRegister, db: Session = Depends(get_db)):
    try:
        return auth.verify_and_register(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    try:
        return auth.login(db, data)
    except ValueError as e:
        message = str(e)
        code = (
            status.HTTP_403_FORBIDDEN
            if "verify your email" in message
            else status.HTTP_401_UNAUTHORIZED
        )
        raise HTTPException(status_code=code, detail=message)

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: RequestOTP, db: Session = Depends(get_db)):
    return auth.forgot_password(db, data)


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, data: ResetPassword, db: Session = Depends(get_db)):
    try:
        return auth.reset_password(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return auth.logout(db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))