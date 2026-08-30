"""Service for the bookmarks resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _01_core import logger
from _04_repositories import (
    count_rounds_for_posts,
    get_companies_by_ids,
    get_post_by_id,
    get_users_by_ids,
)
from _04_repositories.bookmarks import (
    count_bookmarked_posts_for_user,
    create_bookmark,
    delete_bookmark,
    get_bookmark,
    get_bookmarked_posts_for_user,
)


def toggle_bookmark_post(db: Session, current_user, post_id: uuid.UUID):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None:
        raise ValueError("Post not found")

    existing = get_bookmark(db, current_user.id, post_id)
    if existing:
        delete_bookmark(db, existing)
        bookmarked = False
        message = "Bookmark removed"
    else:
        create_bookmark(db, current_user.id, post_id)
        bookmarked = True
        message = "Post bookmarked"

    logger.info(f"Bookmark toggled for post {post_id} by user {current_user.id} (bookmarked={bookmarked})")

    return {
        "bookmarked": bookmarked,
        "message": message,
    }


def get_bookmark_status(db: Session, current_user, post_id: uuid.UUID):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None:
        raise ValueError("Post not found")

    bookmarked = get_bookmark(db, current_user.id, post_id) is not None
    return {"bookmarked": bookmarked}


def list_my_bookmarks(db: Session, current_user, page: int, limit: int):
    offset = (page - 1) * limit
    total = count_bookmarked_posts_for_user(db, current_user.id)
    posts = get_bookmarked_posts_for_user(db, current_user.id, limit=limit, offset=offset)

    post_ids = [p.id for p in posts]

    author_ids = {p.user_id for p in posts if not p.is_anonymous}
    authors = {
        u.id: {
            "user_id": u.id,
            "username": u.username,
            "profile_photo_url": u.profile_photo_url,
        }
        for u in get_users_by_ids(db, list(author_ids))
    }

    company_ids = [p.company_id for p in posts if p.company_id is not None]
    companies = {c.id: c.name for c in get_companies_by_ids(db, company_ids)}
    round_counts = count_rounds_for_posts(db, post_ids)

    _EXCERPT_LENGTH = 200

    items = []
    for p in posts:
        experience_text = p.experience_text or ""
        excerpt = (
            experience_text[:_EXCERPT_LENGTH] + "..."
            if len(experience_text) > _EXCERPT_LENGTH
            else experience_text
        )

        items.append({
            "id": p.id,
            "title": p.title,
            # Anonymous post rule: slug and author must be None for anonymous posts
            "slug": None if p.is_anonymous else p.slug,
            "post_category": p.post_category,
            "company_id": p.company_id,
            "company_name": companies.get(p.company_id) if p.company_id else None,
            "is_anonymous": p.is_anonymous,
            "author": None if p.is_anonymous else authors.get(p.user_id),
            "is_offer_received": p.is_offer_received,
            "job_role": p.job_role,
            "package_amount": p.package_amount,
            "currency": p.currency,
            "round_count": round_counts.get(p.id, 0),
            "experience_excerpt": excerpt,
            "view_count": p.view_count,
            "share_count": p.share_count,
            "published_at": p.published_at,
            "created_at": p.created_at,
        })

    total_pages = (total + limit - 1) // limit if total else 0

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }

