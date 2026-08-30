"""Service for the users resource — business logic only."""

from _01_core import hash_password, verify_password
from _04_repositories import (
    count_published_posts_by_user,
    count_rounds_for_posts,
    get_companies_by_ids,
    get_or_create_user_settings,
    get_published_posts_by_user,
    get_user_by_id,
    update_password,
)
from _04_repositories import (
    update_user_settings as repo_update_user_settings,
)
from _04_repositories.users import search_users as repo_search_users
from _04_repositories.users import update_user_profile as repo_update_user_profile


def get_my_profile(current_user):
    return current_user


def update_my_profile(db, current_user, data):
    return repo_update_user_profile(
        db,
        current_user,
        full_name=data.full_name,
        bio=data.bio,
        profile_photo_url=data.profile_photo_url
    )


def search_users(db, query: str, limit: int = 10):
    if not query.strip():
        return []
    return repo_search_users(db, query.strip(), limit=limit)


def get_public_profile(db, user_id):
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise ValueError("User not found")
    return user


def get_user_posts(db, user_id, page: int, limit: int):
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise ValueError("User not found")

    offset = (page - 1) * limit
    total = count_published_posts_by_user(db, user_id)
    posts = get_published_posts_by_user(db, user_id, limit=limit, offset=offset)

    post_ids = [p.id for p in posts]
    company_ids = [p.company_id for p in posts if p.company_id is not None]
    companies = {c.id: c.name for c in get_companies_by_ids(db, company_ids)}
    round_counts = count_rounds_for_posts(db, post_ids)

    _EXCERPT_LENGTH = 200
    author_info = {
        "user_id": user.id,
        "username": user.username,
        "profile_photo_url": user.profile_photo_url,
    }

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
            "slug": p.slug,
            "post_category": p.post_category,
            "company_id": p.company_id,
            "company_name": companies.get(p.company_id) if p.company_id else None,
            "is_anonymous": False,
            "author": author_info,
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


def change_password(db, current_user, data):
    if not verify_password(data.current_password, current_user.password_hash):
        raise ValueError("Current password is incorrect")

    new_hash = hash_password(data.new_password)
    update_password(db, current_user, new_hash)

    return {"message": "Password changed successfully"}


def get_settings(db, current_user):
    return get_or_create_user_settings(db, current_user.id)


def update_settings(db, current_user, data):
    settings = get_or_create_user_settings(db, current_user.id)
    return repo_update_user_settings(db, settings, theme_preference=data.theme_preference)
