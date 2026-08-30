"""Service for the completed_questions resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _01_core import logger
from _04_repositories.companies import get_companies_by_ids
from _04_repositories.completed_questions import (
    count_completed_questions_for_user,
    create_completed_question,
    delete_completed_question,
    get_completed_question,
    get_completed_questions_for_user,
)
from _04_repositories.questions import get_question_by_id
from _04_repositories.users import get_user_by_id


def toggle_completed_question(db: Session, current_user, question_id: uuid.UUID):
    question = get_question_by_id(db, question_id)
    if not question:
        raise ValueError("Question not found")

    existing = get_completed_question(db, current_user.id, question_id)
    if existing:
        delete_completed_question(db, existing)
        completed = False
        message = "Question marked as incomplete"
    else:
        create_completed_question(db, current_user.id, question_id)
        completed = True
        message = "Question marked as completed"

    logger.info(f"Question {question_id} completion toggled by user {current_user.id} (completed={completed})")

    return {
        "completed": completed,
        "message": message,
    }


def list_user_completed_questions(
    db: Session,
    user_id: uuid.UUID,
    company_id: uuid.UUID | None = None,
    post_category: str | None = None,
    page: int = 1,
    limit: int = 20,
):
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise ValueError("User not found")

    offset = (page - 1) * limit
    total = count_completed_questions_for_user(
        db,
        user_id=user_id,
        company_id=company_id,
        post_category=post_category,
    )
    rows = get_completed_questions_for_user(
        db,
        user_id=user_id,
        company_id=company_id,
        post_category=post_category,
        limit=limit,
        offset=offset,
    )

    company_ids = [post.company_id for _, _, post in rows if post.company_id is not None]
    companies = {c.id: c.name for c in get_companies_by_ids(db, company_ids)}

    items = []
    for cq, q, post in rows:
        items.append({
            "id": cq.id,
            "question_id": q.id,
            "question_text": q.question_text,
            "attachment_url": q.attachment_url,
            "is_verified": q.is_verified,
            "easy_count": q.easy_count,
            "medium_count": q.medium_count,
            "hard_count": q.hard_count,
            "post_id": post.id,
            "post_title": post.title,
            "post_category": post.post_category,
            "company_id": post.company_id,
            "company_name": companies.get(post.company_id) if post.company_id else None,
            "completed_at": cq.completed_at,
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

