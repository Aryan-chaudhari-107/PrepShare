"""Schemas for the dashboard aggregation endpoint."""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class DashboardCounts(BaseModel):
    """Signed-in user's content ledger."""

    posts: int = 0
    drafts: int = 0
    replies_given: int = 0
    comments_received: int = 0
    bookmarks: int = 0
    completed_questions: int = 0
    followers: int = 0
    following: int = 0
    views: int = 0
    shares: int = 0


class DashboardStreak(BaseModel):
    """Consecutive UTC days with at least one contribution."""

    current: int = 0
    best: int = 0


class DashboardActivityDay(BaseModel):
    """One bucket of the activity series (always present, zero-filled)."""

    date: date
    posts: int = 0
    comments: int = 0
    bookmarks: int = 0
    completions: int = 0
    total: int = 0


class DashboardTrend(BaseModel):
    """Week-over-week deltas, derived from the activity series."""

    posts_this_week: int = 0
    posts_last_week: int = 0
    comments_this_week: int = 0
    comments_last_week: int = 0


class DashboardWeeklyGoal(BaseModel):
    """Contributions made in the current ISO week against the shared goal."""

    completed: int = 0
    goal: int = 8


class DashboardOfferSignal(BaseModel):
    """Offer outcomes — scoped to the signed-in user's posts when signed in,
    otherwise to the whole platform (the signed-out dashboard hero)."""

    offers: int = 0
    without_offer: int = 0
    total: int = 0


class DashboardCategoryCount(BaseModel):
    category: str
    count: int = 0


class ActiveDiscussion(BaseModel):
    """A published post ranked by how recently people are talking in it."""

    id: UUID
    title: str
    post_category: Optional[str] = None
    comment_count: int = 0
    last_activity_at: Optional[datetime] = None


class DashboardRecentDraft(BaseModel):
    """The draft the user is most likely to resume next."""

    id: UUID
    title: str
    updated_at: Optional[datetime] = None


class DashboardPlatform(BaseModel):
    """Always present — powers the signed-out hero and footer stats."""

    total_posts: int = 0
    total_contributors: int = 0
    total_users: int = 0


class DashboardSummary(BaseModel):
    signed_in: bool
    generated_at: datetime
    platform: DashboardPlatform
    offer_signal: DashboardOfferSignal
    categories: List[DashboardCategoryCount] = []
    active_discussions: List[ActiveDiscussion] = []
    # Personal blocks are null for signed-out visitors.
    counts: Optional[DashboardCounts] = None
    streak: Optional[DashboardStreak] = None
    activity: List[DashboardActivityDay] = []
    trend: Optional[DashboardTrend] = None
    weekly: Optional[DashboardWeeklyGoal] = None
    recent_draft: Optional[DashboardRecentDraft] = None
