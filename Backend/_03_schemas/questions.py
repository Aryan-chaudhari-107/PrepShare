import uuid
from typing import Literal

from pydantic import BaseModel


class DifficultyVoteCreate(BaseModel):
    difficulty: Literal["easy", "medium", "hard"]


class DifficultyVoteResponse(BaseModel):
    question_id: uuid.UUID
    difficulty: str | None = None
    easy_count: int
    medium_count: int
    hard_count: int
    message: str


class DifficultyVoteStatusResponse(BaseModel):
    question_id: uuid.UUID
    difficulty: str | None = None
    easy_count: int
    medium_count: int
    hard_count: int

