import uuid

from pydantic import BaseModel, ConfigDict, Field


class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: str | None
    bio: str | None
    profile_photo_url: str | None
    role: str
    contribution_score: int
    is_email_verified: bool

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=1000)
    profile_photo_url: str | None = None


class PublicProfile(BaseModel):
    """
    Narrow public profile schema. Must NEVER include email, password_hash,
    user_settings, or is_email_verified.
    """
    id: uuid.UUID
    username: str
    full_name: str | None = None
    bio: str | None = None
    profile_photo_url: str | None = None
    role: str
    contribution_score: int
    follower_count: int
    following_count: int

    model_config = ConfigDict(from_attributes=True)


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class UserSearchItem(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str | None = None
    profile_photo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserSearchResponse(BaseModel):
    items: list[UserSearchItem]
