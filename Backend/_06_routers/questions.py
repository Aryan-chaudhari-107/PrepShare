"""Router for the questions resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.questions import DifficultyVoteCreate, DifficultyVoteResponse
from _05_services import questions

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/{question_id}/vote", response_model=DifficultyVoteResponse)
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

