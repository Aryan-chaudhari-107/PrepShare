"""Repository for dashboard aggregates — raw SQLAlchemy queries only.

Every function here is read-only. Timestamps stored in this schema are naive
UTC (DateTime without timezone), so bucketing with `func.date(...)` yields
consistent UTC day boundaries.
"""

from datetime import date as date_type

from sqlalchemy import func
from sqlalchemy.orm import Session

from _02_models import (
    Bookmark,
    Comment,
    CompletedQuestion,
    InterviewPost,
    User,
)


def _published_filter(query):
    return query.filter(
        InterviewPost.status == "published",
        InterviewPost.deleted_at.is_(None),
    )


def count_posts_by_status(db: Session, user_id):
    """{"published": n, "draft": n} for one author, excluding soft-deleted."""
    rows = (
        db.query(InterviewPost.status, func.count(InterviewPost.id))
        .filter(InterviewPost.user_id == user_id, InterviewPost.deleted_at.is_(None))
        .group_by(InterviewPost.status)
        .all()
    )
    return {status: count for status, count in rows}


def sum_post_metrics(db: Session, user_id):
    """(views, shares) accumulated across the author's published posts."""
    row = (
        db.query(
            func.coalesce(func.sum(InterviewPost.view_count), 0),
            func.coalesce(func.sum(InterviewPost.share_count), 0),
        )
        .filter(InterviewPost.user_id == user_id)
    )
    row = _published_filter(row).one()
    return int(row[0]), int(row[1])


def count_comments_given(db: Session, user_id) -> int:
    return (
        db.query(func.count(Comment.id)).filter(Comment.user_id == user_id).scalar()
    ) or 0


def count_comments_received(db: Session, user_id) -> int:
    """Comments left on this author's published posts (any author)."""
    return (
        db.query(func.count(Comment.id))
        .join(InterviewPost, Comment.post_id == InterviewPost.id)
        .filter(InterviewPost.user_id == user_id, InterviewPost.deleted_at.is_(None))
        .scalar()
    ) or 0


def count_bookmarks_saved(db: Session, user_id) -> int:
    """Mirrors the scope of /users/me/bookmarks (published posts only)."""
    return (
        db.query(func.count(Bookmark.id))
        .join(InterviewPost, Bookmark.post_id == InterviewPost.id)
        .filter(
            Bookmark.user_id == user_id,
            InterviewPost.status == "published",
            InterviewPost.deleted_at.is_(None),
        )
        .scalar()
    ) or 0


def count_completed(db: Session, user_id) -> int:
    return (
        db.query(func.count(CompletedQuestion.id))
        .filter(CompletedQuestion.user_id == user_id)
        .scalar()
    ) or 0


def get_activity_series(db: Session, user_id, since: date_type):
    """[(date, kind, count)] over four contribution sources since `since`.

    kind is one of "posts" / "comments" / "bookmarks" / "completions".
    """
    rows = []

    post_rows = (
        db.query(func.date(InterviewPost.created_at), func.count(InterviewPost.id))
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.deleted_at.is_(None),
            InterviewPost.created_at >= since,
        )
        .group_by(func.date(InterviewPost.created_at))
        .all()
    )
    rows.extend(("posts", d, c) for d, c in post_rows)

    comment_rows = (
        db.query(func.date(Comment.created_at), func.count(Comment.id))
        .filter(Comment.user_id == user_id, Comment.created_at >= since)
        .group_by(func.date(Comment.created_at))
        .all()
    )
    rows.extend(("comments", d, c) for d, c in comment_rows)

    bookmark_rows = (
        db.query(func.date(Bookmark.created_at), func.count(Bookmark.id))
        .filter(Bookmark.user_id == user_id, Bookmark.created_at >= since)
        .group_by(func.date(Bookmark.created_at))
        .all()
    )
    rows.extend(("bookmarks", d, c) for d, c in bookmark_rows)

    completion_rows = (
        db.query(func.date(CompletedQuestion.completed_at), func.count(CompletedQuestion.id))
        .filter(
            CompletedQuestion.user_id == user_id,
            CompletedQuestion.completed_at >= since,
        )
        .group_by(func.date(CompletedQuestion.completed_at))
        .all()
    )
    rows.extend(("completions", d, c) for d, c in completion_rows)

    return rows


def get_activity_date_set(db: Session, user_id):
    """Every UTC day this user ever contributed on — feeds the streak math.

    Distinct day counts are tiny (one per active day), so the union of four
    small result sets in Python is cheaper and clearer than a SQL UNION.
    """
    days = set()

    for day, in (
        db.query(func.date(InterviewPost.created_at))
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.deleted_at.is_(None),
        )
        .distinct()
        .all()
    ):
        days.add(day)

    for day, in (
        db.query(func.date(Comment.created_at))
        .filter(Comment.user_id == user_id)
        .distinct()
        .all()
    ):
        days.add(day)

    for day, in (
        db.query(func.date(Bookmark.created_at))
        .filter(Bookmark.user_id == user_id)
        .distinct()
        .all()
    ):
        days.add(day)

    for day, in (
        db.query(func.date(CompletedQuestion.completed_at))
        .filter(CompletedQuestion.user_id == user_id)
        .distinct()
        .all()
    ):
        days.add(day)

    return days


def get_offer_signal(db: Session, user_id=None):
    """{True: n, False: n} offer outcomes for one author, or the platform."""
    query = db.query(
        InterviewPost.is_offer_received, func.count(InterviewPost.id)
    )
    query = _published_filter(query)
    if user_id is not None:
        query = query.filter(InterviewPost.user_id == user_id)
    return dict(query.group_by(InterviewPost.is_offer_received).all())


def get_category_counts(db: Session, user_id=None, limit: int = 6):
    """[(category, count)] newest-first by volume, one author or platform."""
    query = db.query(
        InterviewPost.post_category, func.count(InterviewPost.id)
    )
    query = _published_filter(query)
    if user_id is not None:
        query = query.filter(InterviewPost.user_id == user_id)
    return (
        query.group_by(InterviewPost.post_category)
        .order_by(func.count(InterviewPost.id).desc())
        .limit(limit)
        .all()
    )


def get_active_discussions(db: Session, limit: int = 5):
    """Published posts with the most recent comment activity."""
    return (
        db.query(
            InterviewPost.id,
            InterviewPost.title,
            InterviewPost.post_category,
            func.count(Comment.id).label("comment_count"),
            func.max(Comment.created_at).label("last_activity_at"),
        )
        .join(Comment, Comment.post_id == InterviewPost.id)
        .filter(
            InterviewPost.status == "published",
            InterviewPost.deleted_at.is_(None),
        )
        .group_by(
            InterviewPost.id,
            InterviewPost.title,
            InterviewPost.post_category,
        )
        .order_by(func.max(Comment.created_at).desc())
        .limit(limit)
        .all()
    )


def get_platform_totals(db: Session):
    """(published posts, distinct publishers, registered users)."""
    query = db.query(
        func.count(InterviewPost.id),
        func.count(func.distinct(InterviewPost.user_id)),
    )
    posts, contributors = _published_filter(query).one()
    users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    return int(posts or 0), int(contributors or 0), int(users)


def get_latest_draft(db: Session, user_id):
    return (
        db.query(InterviewPost)
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.status == "draft",
            InterviewPost.deleted_at.is_(None),
        )
        .order_by(InterviewPost.updated_at.desc())
        .first()
    )
