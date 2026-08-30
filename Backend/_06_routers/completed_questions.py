"""Router for the completed_questions resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.completed_questions import (
    CompletedQuestionListResponse,
    CompletedToggleResponse,
)
from _05_services import completed_questions

router = APIRouter(tags=["completed_questions"])


@router.post("/questions/{question_id}/complete", response_model=CompletedToggleResponse)
def toggle_complete_question(
    question_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return completed_questions.toggle_completed_question(db, current_user, question_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/users/me/completed-questions", response_model=CompletedQuestionListResponse)
def list_my_completed_questions(
    company_id: uuid.UUID | None = Query(None),
    post_category: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return completed_questions.list_user_completed_questions(
        db,
        user_id=current_user.id,
        company_id=company_id,
        post_category=post_category,
        page=page,
        limit=limit,
    )


@router.get("/users/{user_id}/completed-questions", response_model=CompletedQuestionListResponse)
def list_user_completed_questions(
    user_id: uuid.UUID,
    company_id: uuid.UUID | None = Query(None),
    post_category: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return completed_questions.list_user_completed_questions(
            db,
            user_id=user_id,
            company_id=company_id,
            post_category=post_category,
            page=page,
            limit=limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

