"""Pydantic schemas for the bookmarks resource."""


from pydantic import BaseModel


class BookmarkToggleResponse(BaseModel):
    bookmarked: bool
    message: str


class BookmarkStatusResponse(BaseModel):
    bookmarked: bool

