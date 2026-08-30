"""
Service for the posts resource — business logic only.
"""

from datetime import timezone

from _01_core import logger
from _02_models import PostRound
from _03_schemas.posts import PostUpdate
from _04_repositories import (
    add_question,
    add_round,
    count_published_posts,
    count_rounds_for_posts,
    count_user_draft_posts,
    create_post,
    get_all_questions_for_post_rounds,
    get_companies_by_ids,
    get_education_details_by_ids,
    get_post_by_id,
    get_post_round_by_id,
    get_post_rounds,
    get_published_posts,
    get_round_names_for_ids,
    get_user_by_id,
    get_user_draft_posts,
    get_users_by_ids,
    get_feed_filters_metadata,
    increment_share_count,
    increment_view_count,
    update_post,
)
from _04_repositories import (
    publish_post as repo_publish_post,
)
from utils import generate_slug, utc_now


def create_draft_post(db, current_user, data):
    slug = generate_slug(data.title)

    post = create_post(
        db,
        user_id=current_user.id,
        post_category=data.post_category,
        title=data.title,
        slug=slug,
        company_id=data.company_id,
        education_id=data.education_id,
        year_of_study=data.year_of_study,
        experience_years=data.experience_years,
        current_status=data.current_status,
        age=data.age,
        work_location=data.work_location,
        work_mode=data.work_mode,
        is_anonymous=data.is_anonymous,
        status="draft",
        experience_text="",
    )


    if data.is_anonymous:
        logger.info(f"Draft post created: {post.id} (anonymous)")
    else:
        logger.info(f"Draft post created: {post.id} by user {current_user.id}")

    return {"post_id": str(post.id), "slug": post.slug, "message": "Draft post created"}


def add_round_to_post(db, current_user, post_id, data):
    post = get_post_by_id(db, post_id)

    if not post:
        raise ValueError("Post not found")

    if post.user_id != current_user.id:
        raise ValueError("You don't own this post")

    if post.status != "draft":
        raise ValueError ("Cannot add rounds to a published post")

    # figure out the next round_number for this post
    existing_count = db.query(PostRound).filter(PostRound.post_id==post_id).count()

    if existing_count >= 15:
        raise ValueError("Maximum of 15 round per post")

    round_number = existing_count + 1

    post_round = add_round(
        db,
        post_id,
        data.name,
        data.mode,
        round_number,
        duration_minutes=getattr(data, "duration_minutes", None),
        round_tags=getattr(data, "round_tags", None),
    )

    return {
        "post_round_id": str(post_round.id),
        "round_number": post_round.round_number,
        "duration_minutes": post_round.duration_minutes,
        "round_tags": post_round.round_tags,
        "message": "Round added",
    }



def add_question_to_round(db, current_user, post_id, post_round_id, data):
    post = get_post_by_id(db, post_id)
    if not post:
        raise ValueError("Post not found")

    if post.user_id != current_user.id:
        raise ValueError("You don't own this post")

    # D3: verify the round actually belongs to this post, not another one.
    post_round = get_post_round_by_id(db, post_round_id)
    if not post_round or post_round.post_id != post.id:
        raise ValueError("Round not found on this post")

    # rule: at least one of question_text / attachment_url required
    if not data.question_text and not data.attachment_url:
        raise ValueError("Either question text or an attachment is required")

    question = add_question(db, post_id, post_round_id, data.question_text, data.attachment_url)

    return {"question_id": str(question.id), "message": "Question added"}



def publish_draft_post(db, current_user, post_id, data):
    post = get_post_by_id(db, post_id)
    if not post:
        raise ValueError("Post not found")

    if post.user_id != current_user.id:
        raise ValueError("You don't own this post")

    if post.status != "draft":
        raise ValueError("Post is already published")

    # rule: offer details required only if is_offer_received is True
    if data.is_offer_received:
        if not data.job_role or not data.package_amount or not data.currency:
            raise ValueError("job_role, package_amount, and currency are required when an offer was received")

    updated_post = repo_publish_post(
        db, post,
        experience_text=data.experience_text,
        tips=data.tips,
        is_offer_received=data.is_offer_received,
        job_role=data.job_role,
        package_amount=data.package_amount,
        currency=data.currency,
    )

    if post.is_anonymous:
        logger.info(f"Post published: {updated_post.id} (anonymous)")
    else:
        logger.info(f"Post published: {updated_post.id} by user {current_user.id}")

    return {"post_id": str(updated_post.id), "status": updated_post.status, "message": "Post published successfully"}


LOCKED_AFTER_PUBLISH = {"post_category", "company_id", "education_id"}


def update_post_details(db, current_user, post_id, data: PostUpdate):
    post = get_post_by_id(db, post_id)
    if not post:
        raise ValueError("Post not found")

    if post.user_id != current_user.id:
        raise ValueError("You don't own this post")

    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise ValueError("No fields provided to update")

    # D4 write-side privacy: regenerate slug if title changes
    if updates.get("title"):
        updates["slug"] = generate_slug(updates["title"])

    # rule: if offer details are being set now, all three must be provided together
    if updates.get("is_offer_received") is True:
        job_role = updates.get("job_role", post.job_role)
        package_amount = updates.get("package_amount", post.package_amount)
        currency = updates.get("currency", post.currency)
        if not job_role or not package_amount or not currency:
            raise ValueError("job_role, package_amount, and currency are required when an offer was received")

    if post.status == "published":
        locked_fields_attempted = LOCKED_AFTER_PUBLISH & updates.keys()
        if locked_fields_attempted:
            raise ValueError(f"Cannot change {', '.join(locked_fields_attempted)} after publishing")

        # exception: switching to anonymous is always free, never counts
        # against the edit limit/window
        is_only_anonymity_change = set(updates.keys()) == {"is_anonymous"}

        if not is_only_anonymity_change:
            days_since_publish = (utc_now() - post.published_at.replace(tzinfo=timezone.utc)).days
            if days_since_publish >= 3:
                raise ValueError("Edit window has expired (3 days after publishing)")

            if post.edit_count >= 3:
                raise ValueError("Maximum number of edits (3) reached for this post")

            post.edit_count += 1

    updated_post = update_post(db, post, updates)

    if post.is_anonymous:
        logger.info(f"Post updated: {post.id} (anonymous, edit_count={post.edit_count})")
    else:
        logger.info(f"Post updated: {post.id} by user {current_user.id} (edit_count={post.edit_count})")

    return {"post_id": str(updated_post.id), "message": "Post updated"}



def share_post(db, post_id):
    post = get_post_by_id(db, post_id)
    if not post or post.deleted_at is not None or post.status != "published":
        raise ValueError("Post not found")

    updated_post = increment_share_count(db, post)

    return {"share_count": updated_post.share_count, "message": "Share counted"}

def increment_view_count_bg(post_id_str):
    try:
        from _01_core.database import SessionLocal
        bg_db = SessionLocal()
        p = get_post_by_id(bg_db, uuid.UUID(post_id_str))
        if p:
            increment_view_count(bg_db, p)
        bg_db.close()
    except Exception:
        pass


def get_post_detail(db, post_id, current_user=None, background_tasks=None):
    post = get_post_by_id(db, post_id)
    if not post:
        raise ValueError("Post not found")

    # Soft-deleted posts are 404 for everyone, including the owner.
    if post.deleted_at is not None:
        raise ValueError("Post not found")

    # Non-published posts (draft, flagged) are visible only to the owner.
    # Always return 404 — never 403 — for everyone else, so the response
    # does not confirm the post exists.
    is_owner = current_user is not None and current_user.id == post.user_id
    if post.status != "published" and not is_owner:
        raise ValueError("Post not found")

    if background_tasks:
        background_tasks.add_task(increment_view_count_bg, str(post.id))

    # Fetched only when the post is NOT anonymous, so identity data never
    # enters the response object at all for an anonymous post.
    author = None
    if not post.is_anonymous:
        user = get_user_by_id(db, post.user_id)
        if user:
            author = {
                "user_id": user.id,
                "username": user.username,
                "profile_photo_url": user.profile_photo_url,
            }

    # D6 fix: batch all round names and questions in 2 IN queries instead of
    # one per round. A 15-round post was ~33 queries before; now it's 4.
    post_rounds = get_post_rounds(db, post_id)
    round_ids = [pr.round_id for pr in post_rounds]
    post_round_ids = [pr.id for pr in post_rounds]

    round_names = get_round_names_for_ids(db, round_ids)
    questions_by_round = get_all_questions_for_post_rounds(db, post_round_ids)

    rounds = []
    for pr in post_rounds:
        rounds.append({
            "post_round_id": pr.id,
            "round_number": pr.round_number,
            "mode": pr.mode,
            "name": round_names.get(pr.round_id),
            "duration_minutes": getattr(pr, "duration_minutes", None),
            "round_tags": getattr(pr, "round_tags", None),
            "questions": questions_by_round.get(pr.id, []),
        })

    # Fetch company and education names if linked
    company_name = None
    if post.company_id:
        c_map = {c.id: c.name for c in get_companies_by_ids(db, [post.company_id])}
        company_name = c_map.get(post.company_id)

    institution_name = None
    course_name = None
    if post.education_id:
        edu_info = get_education_details_by_ids(db, [post.education_id]).get(post.education_id)
        if edu_info:
            institution_name = edu_info.get("institution_name")
            course_name = edu_info.get("course")

    edit_count = post.edit_count or 0
    edits_remaining = max(0, 3 - edit_count)
    days_left_to_edit = 3
    if post.published_at:
        days_since_publish = (utc_now() - post.published_at.replace(tzinfo=timezone.utc)).days
        days_left_to_edit = max(0, 3 - days_since_publish)
    elif post.status != "published":
        days_left_to_edit = 3

    return {
        "id": post.id,
        "title": post.title,
        # slug is derived from the ORIGINAL title and is never regenerated, so
        # it can still contain a name the poster has since removed.
        "slug": None if post.is_anonymous else post.slug,
        "post_category": post.post_category,
        "company_id": post.company_id,
        "company_name": company_name,
        "education_id": post.education_id,
        "institution_name": institution_name,
        "course_name": course_name,
        "is_anonymous": post.is_anonymous,
        "author": author,
        "year_of_study": post.year_of_study,
        "age": post.age,
        "experience_years": post.experience_years,
        "current_status": post.current_status,
        "work_location": post.work_location,
        "work_mode": post.work_mode,
        "is_offer_received": post.is_offer_received,
        "job_role": post.job_role,
        "package_amount": post.package_amount,
        "currency": post.currency,
        "experience_text": post.experience_text,
        "tips": post.tips,
        "status": post.status,
        "edit_count": edit_count,
        "edits_remaining": edits_remaining,
        "days_left_to_edit": days_left_to_edit,
        "view_count": post.view_count,
        "share_count": post.share_count,
        "published_at": post.published_at,
        "created_at": post.created_at,
        "rounds": rounds,
    }


def get_posts_feed(
    db,
    page: int,
    limit: int,
    company_id=None,
    company_name=None,
    post_category=None,
    institution_id=None,
    institution_name=None,
    course=None,
    work_location=None,
    industry=None,
    job_role=None,
    round_tag=None,
    is_offer_received=None,
    search=None,
):
    offset = (page - 1) * limit

    posts = get_published_posts(
        db,
        limit=limit,
        offset=offset,
        company_id=company_id,
        company_name=company_name,
        post_category=post_category,
        institution_id=institution_id,
        institution_name=institution_name,
        course=course,
        work_location=work_location,
        industry=industry,
        job_role=job_role,
        round_tag=round_tag,
        is_offer_received=is_offer_received,
        search=search,
    )

    if offset == 0 and len(posts) < limit:
        total = len(posts)
    else:
        total = count_published_posts(
            db,
            company_id=company_id,
            company_name=company_name,
            post_category=post_category,
            institution_id=institution_id,
            institution_name=institution_name,
            course=course,
            work_location=work_location,
            industry=industry,
            job_role=job_role,
            round_tag=round_tag,
            is_offer_received=is_offer_received,
            search=search,
        )

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
    companies = {
        c.id: c.name
        for c in get_companies_by_ids(db, company_ids)
    }

    education_ids = [p.education_id for p in posts if p.education_id is not None]
    education_map = get_education_details_by_ids(db, education_ids)

    round_counts = count_rounds_for_posts(db, post_ids)

    _EXCERPT_LENGTH = 200

    items = []
    for p in posts:
        experience_text = p.experience_text or ""
        excerpt = experience_text[:_EXCERPT_LENGTH] + "..." if len(experience_text) > _EXCERPT_LENGTH else experience_text
        edu_info = education_map.get(p.education_id, {}) if p.education_id else {}

        items.append({
            "id": p.id,
            "title": p.title,
            "slug": None if p.is_anonymous else p.slug,
            "post_category": p.post_category,
            "company_id": p.company_id,
            "company_name": companies.get(p.company_id) if p.company_id else None,
            "institution_name": edu_info.get("institution_name"),
            "course": edu_info.get("course"),
            "work_location": p.work_location,
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


def list_user_drafts(db, current_user, page: int, limit: int):
    offset = (page - 1) * limit
    total = count_user_draft_posts(db, current_user.id)
    posts = get_user_draft_posts(db, current_user.id, limit=limit, offset=offset)

    post_ids = [p.id for p in posts]
    company_ids = [p.company_id for p in posts if p.company_id is not None]
    companies = {
        c.id: c.name
        for c in get_companies_by_ids(db, company_ids)
    }
    round_counts = count_rounds_for_posts(db, post_ids)

    _EXCERPT_LENGTH = 200

    items = []
    for p in posts:
        experience_text = p.experience_text or ""
        excerpt = experience_text[:_EXCERPT_LENGTH] + "..." if len(experience_text) > _EXCERPT_LENGTH else experience_text

        items.append({
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "post_category": p.post_category,
            "company_id": p.company_id,
            "company_name": companies.get(p.company_id) if p.company_id else None,
            "is_anonymous": p.is_anonymous,
            "author": {
                "user_id": current_user.id,
                "username": current_user.username,
                "profile_photo_url": current_user.profile_photo_url,
            } if not p.is_anonymous else None,
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