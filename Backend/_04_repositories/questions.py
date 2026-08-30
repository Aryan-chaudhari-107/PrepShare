"""Repository for the questions resource — raw SQLAlchemy queries only."""

from sqlalchemy import update
from sqlalchemy.orm import Session

from _02_models import InterviewQuestion, QuestionDifficultyVote


def get_question_by_id(db: Session, question_id):
    return db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first()


def get_difficulty_vote(db: Session, user_id, question_id):
    return (
        db.query(QuestionDifficultyVote)
        .filter(
            QuestionDifficultyVote.user_id == user_id,
            QuestionDifficultyVote.question_id == question_id,
        )
        .first()
    )


def create_difficulty_vote(db: Session, user_id, question_id, difficulty: str):
    vote = QuestionDifficultyVote(
        user_id=user_id,
        question_id=question_id,
        difficulty=difficulty,
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)
    return vote


def update_difficulty_vote(db: Session, vote, new_difficulty: str):
    vote.difficulty = new_difficulty
    db.commit()
    db.refresh(vote)
    return vote


def delete_difficulty_vote(db: Session, vote):
    db.delete(vote)
    db.commit()


def adjust_question_difficulty_counts(db: Session, question_id, inc_diff: str | None, dec_diff: str | None):
    """
    Atomically updates denormalized count caches on interview_questions.
    """
    values = {}
    if inc_diff == "easy":
        values[InterviewQuestion.easy_count] = InterviewQuestion.easy_count + 1
    elif inc_diff == "medium":
        values[InterviewQuestion.medium_count] = InterviewQuestion.medium_count + 1
    elif inc_diff == "hard":
        values[InterviewQuestion.hard_count] = InterviewQuestion.hard_count + 1

    if dec_diff == "easy":
        values[InterviewQuestion.easy_count] = InterviewQuestion.easy_count - 1
    elif dec_diff == "medium":
        values[InterviewQuestion.medium_count] = InterviewQuestion.medium_count - 1
    elif dec_diff == "hard":
        values[InterviewQuestion.hard_count] = InterviewQuestion.hard_count - 1

    if values:
        db.execute(
            update(InterviewQuestion)
            .where(InterviewQuestion.id == question_id)
            .values(values)
        )
        db.commit()

