"""Repository for the reports resource — raw SQLAlchemy queries only."""

from sqlalchemy.orm import Session

from _02_models import Report


def create_report(db: Session, reporter_id, post_id, reason: str):
    report = Report(
        reporter_id=reporter_id,
        post_id=post_id,
        reason=reason,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report_by_id(db: Session, report_id):
    return db.query(Report).filter(Report.id == report_id).first()
