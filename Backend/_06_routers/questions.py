"""Router for the questions resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_current_user_optional, get_db
from _02_models import User
from _03_schemas.questions import (
    DifficultyVoteCreate,
    DifficultyVoteResponse,
    DifficultyVoteStatusResponse,
)
from _05_services import questions

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/{question_id}/vote", response_model=DifficultyVoteResponse)
@router.post("/{question_id}/vote-difficulty", response_model=DifficultyVoteResponse)
def vote_difficulty(
    question_id: uuid.UUID,
    data: DifficultyVoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return questions.vote_difficulty(db, current_user, question_id, data.difficulty)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{question_id}/vote", response_model=DifficultyVoteStatusResponse)
def get_question_difficulty_status(
    question_id: uuid.UUID,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    try:
        return questions.get_question_difficulty(db, current_user, question_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
