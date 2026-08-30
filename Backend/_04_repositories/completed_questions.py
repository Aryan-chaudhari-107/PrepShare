"""Repository for the completed_questions resource — raw SQLAlchemy queries only."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from _02_models import CompletedQuestion, InterviewPost, InterviewQuestion


def get_completed_question(db: Session, user_id, question_id):
    return (
        db.query(CompletedQuestion)
        .filter(
            CompletedQuestion.user_id == user_id,
            CompletedQuestion.question_id == question_id,
        )
        .first()
    )


def create_completed_question(db: Session, user_id, question_id):
    completed = CompletedQuestion(user_id=user_id, question_id=question_id)
    db.add(completed)
    db.commit()
    db.refresh(completed)
    return completed


def delete_completed_question(db: Session, completed_question):
    db.delete(completed_question)
    db.commit()


def get_completed_questions_for_user(
    db: Session,
    user_id,
    company_id=None,
    post_category=None,
    limit: int = 20,
    offset: int = 0,
):
    query = (
        db.query(CompletedQuestion, InterviewQuestion, InterviewPost)
        .join(InterviewQuestion, CompletedQuestion.question_id == InterviewQuestion.id)
        .join(InterviewPost, InterviewQuestion.post_id == InterviewPost.id)
        .filter(CompletedQuestion.user_id == user_id)
    )

    if company_id is not None:
        query = query.filter(InterviewPost.company_id == company_id)

    if post_category is not None:
        query = query.filter(InterviewPost.post_category == post_category)

    return (
        query.order_by(CompletedQuestion.completed_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_completed_questions_for_user(
    db: Session,
    user_id,
    company_id=None,
    post_category=None,
) -> int:
    query = (
        db.query(func.count(CompletedQuestion.id))
        .join(InterviewQuestion, CompletedQuestion.question_id == InterviewQuestion.id)
        .join(InterviewPost, InterviewQuestion.post_id == InterviewPost.id)
        .filter(CompletedQuestion.user_id == user_id)
    )

    if company_id is not None:
        query = query.filter(InterviewPost.company_id == company_id)

    if post_category is not None:
        query = query.filter(InterviewPost.post_category == post_category)

    return query.scalar()

