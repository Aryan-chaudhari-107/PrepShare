"""Service for the dashboard — business logic over read-only aggregates."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from _01_core import settings
from _04_repositories import (
    count_bookmarks_saved,
    count_comments_given,
    count_comments_received,
    count_completed,
    count_posts_by_status,
    get_active_discussions,
    get_activity_date_set,
    get_activity_series,
    get_category_counts,
    get_latest_draft,
    get_offer_signal,
    get_platform_totals,
    sum_post_metrics,
)

# How many days of history the bento chart and trend comparison need:
# a full current week + a full previous week, worst case 13 days + today.
SERIES_DAYS = 14

# Weekly contribution goal, read from settings so it can be tuned via env
# (DASHBOARD_WEEKLY_GOAL) without a schema migration.
WEEKLY_GOAL = settings.DASHBOARD_WEEKLY_GOAL

# Timezone policy: every calendar-day calculation in this service (activity
# buckets, streaks, Monday-start week windows) uses UTC dates end-to-end.
# Timestamps are stored as naive UTC, _utc_today() anchors "today", and
# _trend_and_weekly() starts weeks on Monday UTC — so streaks and goal
# progress are deterministic regardless of server or client timezone.
# Consequence: a "day" flips at 00:00 UTC, not at the user's local midnight.


def _utc_today() -> datetime:
    return datetime.now(timezone.utc)


def _zero_filled_days(series, since: datetime, today: datetime):
    """[(date, posts, comments, bookmarks, completions, total)] for every day
    in [since..today] — gaps become explicit zeros so the chart never breaks."""
    buckets = {}

    for kind, day, count in series:
        entry = buckets.setdefault(
            day, {"posts": 0, "comments": 0, "bookmarks": 0, "completions": 0}
        )
        if kind in entry:
            entry[kind] = count

    days = []
    cursor = since
    while cursor <= today:
        entry = buckets.get(
            cursor.date(),
            {"posts": 0, "comments": 0, "bookmarks": 0, "completions": 0},
        )
        total = sum(entry.values())
        days.append(
            {
                "date": cursor.date(),
                "posts": entry["posts"],
                "comments": entry["comments"],
                "bookmarks": entry["bookmarks"],
                "completions": entry["completions"],
                "total": total,
            }
        )
        cursor = cursor + timedelta(days=1)

    return days


def _current_streak(today: datetime, active_days) -> int:
    """Consecutive active days ending today (or yesterday — a streak stays
    alive during the day that hasn't had a contribution yet). Day boundaries
    are UTC (see the timezone policy note above), not the user's local midnight."""
    day = today.date()
    if day not in active_days:
        day = day - timedelta(days=1)
        if day not in active_days:
            return 0

    streak = 0
    while day in active_days:
        streak += 1
        day = day - timedelta(days=1)
    return streak


def _best_streak(active_days) -> int:
    if not active_days:
        return 0
    ordered = sorted(active_days, reverse=True)
    best = current = 1
    for newer, older in zip(ordered, ordered[1:]):
        current = current + 1 if (newer - older).days == 1 else 1
        best = max(best, current)
    return best


def _trend_and_weekly(days, today: datetime):
    """Derive week-over-week deltas and this week's goal progress from the
    zero-filled series (Monday-start, UTC)."""
    week_start = today.date() - timedelta(days=today.weekday())
    last_week_start = week_start - timedelta(days=7)

    posts_this = posts_last = comments_this = comments_last = 0
    weekly_completed = 0

    for day in days:
        if day["date"] >= week_start:
            posts_this += day["posts"]
            comments_this += day["comments"]
            weekly_completed += day["total"]
        elif day["date"] >= last_week_start:
            posts_last += day["posts"]
            comments_last += day["comments"]

    trend = {
        "posts_this_week": posts_this,
        "posts_last_week": posts_last,
        "comments_this_week": comments_this,
        "comments_last_week": comments_last,
    }
    weekly = {"completed": weekly_completed, "goal": WEEKLY_GOAL}
    return trend, weekly


def get_summary(db: Session, current_user: Optional[object]) -> dict:
    """One round-trip for the whole bento dashboard.

    Signed-out visitors still get platform totals, the (global) offer signal,
    category mix and live discussions — every personal block stays null.
    """
    now = _utc_today()
    signed_in = current_user is not None
    user_id = current_user.id if signed_in else None

    platform_posts, platform_contributors, platform_users = get_platform_totals(db)
    offer_rows = get_offer_signal(db, user_id)
    category_rows = get_category_counts(db, user_id=user_id, limit=6)
    discussions = get_active_discussions(db, limit=5)

    summary = {
        "signed_in": signed_in,
        "generated_at": now,
        "platform": {
            "total_posts": platform_posts,
            "total_contributors": platform_contributors,
            "total_users": platform_users,
        },
        "offer_signal": {
            "offers": int(offer_rows.get(True, 0)),
            "without_offer": int(offer_rows.get(False, 0)),
            "total": int(sum(offer_rows.values())),
        },
        "categories": [
            {"category": category, "count": count}
            for category, count in category_rows
        ],
        "active_discussions": [
            {
                "id": row.id,
                "title": row.title,
                "post_category": row.post_category,
                "comment_count": row.comment_count,
                "last_activity_at": row.last_activity_at,
            }
            for row in discussions
        ],
        "counts": None,
        "streak": None,
        "activity": [],
        "trend": None,
        "weekly": None,
        "recent_draft": None,
    }

    if not signed_in:
        return summary

    # ---- personal ledger -------------------------------------------------
    status_counts = count_posts_by_status(db, user_id)
    views, shares = sum_post_metrics(db, user_id)
    followers = int(getattr(current_user, "follower_count", 0) or 0)
    following = int(getattr(current_user, "following_count", 0) or 0)

    summary["counts"] = {
        "posts": int(status_counts.get("published", 0)),
        "drafts": int(status_counts.get("draft", 0)),
        "replies_given": count_comments_given(db, user_id),
        "comments_received": count_comments_received(db, user_id),
        "bookmarks": count_bookmarks_saved(db, user_id),
        "completed_questions": count_completed(db, user_id),
        "followers": followers,
        "following": following,
        "views": views,
        "shares": shares,
    }

    since = now - timedelta(days=SERIES_DAYS - 1)
    series = get_activity_series(db, user_id, since.date())
    days = _zero_filled_days(series, since, now)
    summary["activity"] = days

    active_days = get_activity_date_set(db, user_id)
    summary["streak"] = {
        "current": _current_streak(now, active_days),
        "best": _best_streak(active_days),
    }

    trend, weekly = _trend_and_weekly(days, now)
    summary["trend"] = trend
    summary["weekly"] = weekly

    draft = get_latest_draft(db, user_id)
    if draft is not None:
        summary["recent_draft"] = {
            "id": draft.id,
            "title": draft.title,
            "updated_at": draft.updated_at,
        }

    return summary
