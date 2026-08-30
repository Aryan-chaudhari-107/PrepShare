"""Service for the reports resource — business logic only."""

from sqlalchemy.orm import Session

from _01_core import logger
from _03_schemas.reports import ReportCreate
from _04_repositories import (
    create_report,
    get_post_by_id,
)


def file_report(db: Session, current_user, data: ReportCreate):
    post = get_post_by_id(db, data.post_id)
    if not post or post.deleted_at is not None or post.status != "published":
        raise ValueError("Post not found")

    if post.user_id == current_user.id:
        raise ValueError("You cannot report your own post")

    report = create_report(
        db,
        reporter_id=current_user.id,
        post_id=data.post_id,
        reason=data.reason,
    )
    logger.info(f"Report filed for post {post.id} by user {current_user.id}")
    return report
