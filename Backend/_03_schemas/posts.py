import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PostCreate(BaseModel):
    post_category: str
    title: str
    company_id: uuid.UUID | None = None
    education_id: uuid.UUID | None = None
    year_of_study: int | None = None
    experience_years: float | None = None
    current_status: str | None = None
    age: int | None = None
    work_location: str | None = None
    work_mode: str | None = None
    is_anonymous: bool = False


class RoundCreate(BaseModel):
    name: str | None = None
    mode: str  # "online" or "offline"
    duration_minutes: int | None = None
    round_tags: str | None = None

class QuestionCreate(BaseModel):
    question_text: str | None = None
    attachment_url: str | None = None

class PostPublish(BaseModel):
    experience_text: str
    tips: str | None = None
    is_offer_received: bool = False
    job_role: str | None = None
    package_amount: float | None = None
    currency: str | None = None

class PostUpdate(BaseModel):
    title: str | None = None
    post_category: str | None = None
    company_id: uuid.UUID | None = None
    education_id: uuid.UUID | None = None
    year_of_study: int | None = None
    experience_years: float | None = None
    current_status: str | None = None
    age: int | None = None
    work_location: str | None = None
    work_mode: str | None = None
    is_anonymous: bool | None = None
    experience_text: str | None = None
    tips: str | None = None
    is_offer_received: bool | None = None
    job_role: str | None = None
    package_amount: float | None = None
    currency: str | None = None


class AuthorOut(BaseModel):
    user_id: uuid.UUID
    username: str
    profile_photo_url: str | None = None


class QuestionOut(BaseModel):
    id: uuid.UUID
    question_text: str | None = None
    attachment_url: str | None = None
    is_verified: bool
    easy_count: int
    medium_count: int
    hard_count: int
    is_completed: bool = False
    my_vote: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RoundOut(BaseModel):
    post_round_id: uuid.UUID
    round_number: int
    name: str | None = None
    mode: str
    duration_minutes: int | None = None
    round_tags: str | None = None
    questions: list[QuestionOut] = []


class PostOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str | None = None
    post_category: str
    company_id: uuid.UUID | None = None
    company_name: str | None = None
    education_id: uuid.UUID | None = None
    institution_name: str | None = None
    course_name: str | None = None

    is_anonymous: bool
    author: AuthorOut | None = None   # None means anonymous — never a partial author

    year_of_study: int | None = None
    age: int | None = None
    experience_years: float | None = None
    current_status: str | None = None
    work_location: str | None = None
    work_mode: str | None = None

    is_offer_received: bool
    job_role: str | None = None
    package_amount: float | None = None
    currency: str | None = None

    experience_text: str
    tips: str | None = None

    status: str
    edit_count: int = 0
    edits_remaining: int = 3
    days_left_to_edit: int = 0
    view_count: int
    share_count: int
    published_at: datetime | None = None
    created_at: datetime

    rounds: list[RoundOut] = []


class PostListItem(BaseModel):
    id: uuid.UUID
    title: str
    slug: str | None = None

    post_category: str
    company_id: uuid.UUID | None = None
    company_name: str | None = None
    institution_name: str | None = None
    course: str | None = None
    work_location: str | None = None

    is_anonymous: bool
    author: AuthorOut | None = None   # same contract as PostOut — None means anonymous

    is_offer_received: bool
    job_role: str | None = None
    package_amount: float | None = None
    currency: str | None = None

    round_count: int = 0
    experience_excerpt: str = ""

    view_count: int
    share_count: int
    published_at: datetime | None = None
    created_at: datetime


class PostListResponse(BaseModel):
    items: list[PostListItem] = []
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool