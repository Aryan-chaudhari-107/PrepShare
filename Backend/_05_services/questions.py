"""Service for the questions resource — business logic only."""

import uuid

from sqlalchemy.orm import Session

from _01_core import logger
from _04_repositories.questions import (
    adjust_question_difficulty_counts,
    create_difficulty_vote,
    delete_difficulty_vote,
    get_difficulty_vote,
    get_question_by_id,
    update_difficulty_vote,
)


def vote_difficulty(db: Session, current_user, question_id: uuid.UUID, difficulty: str):
    question = get_question_by_id(db, question_id)
    if not question:
        raise ValueError("Question not found")

    existing_vote = get_difficulty_vote(db, current_user.id, question_id)

    if existing_vote:
        if existing_vote.difficulty == difficulty:
            # Toggle off: user voted the same difficulty again -> remove vote
            delete_difficulty_vote(db, existing_vote)
            adjust_question_difficulty_counts(db, question_id, inc_diff=None, dec_diff=difficulty)
            current_difficulty = None
            message = "Difficulty vote removed"
        else:
            # Switch vote: decrement old difficulty, increment new
            old_diff = existing_vote.difficulty
            update_difficulty_vote(db, existing_vote, difficulty)
            adjust_question_difficulty_counts(db, question_id, inc_diff=difficulty, dec_diff=old_diff)
            current_difficulty = difficulty
            message = f"Difficulty vote changed from {old_diff} to {difficulty}"
    else:
        # New vote: increment
        create_difficulty_vote(db, current_user.id, question_id, difficulty)
        adjust_question_difficulty_counts(db, question_id, inc_diff=difficulty, dec_diff=None)
        current_difficulty = difficulty
        message = f"Difficulty voted as {difficulty}"

    db.refresh(question)
    logger.info(f"User {current_user.id} voted {difficulty} for question {question_id}")

    return {
        "difficulty": current_difficulty,
        "easy_count": question.easy_count,
        "medium_count": question.medium_count,
        "hard_count": question.hard_count,
        "message": message,
    }

