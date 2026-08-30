"""Pydantic schemas for the questions resource."""

from typing import Literal

from pydantic import BaseModel


class DifficultyVoteCreate(BaseModel):
    difficulty: Literal["easy", "medium", "hard"]


class DifficultyVoteResponse(BaseModel):
    difficulty: str | None = None
    easy_count: int
    medium_count: int
    hard_count: int
    message: str

