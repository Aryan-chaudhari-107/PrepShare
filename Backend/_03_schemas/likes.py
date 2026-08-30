"""Pydantic schemas for the likes resource."""


from pydantic import BaseModel


class LikeToggleResponse(BaseModel):
    liked: bool
    like_count: int
    message: str


class LikeStatusResponse(BaseModel):
    liked: bool
    like_count: int

