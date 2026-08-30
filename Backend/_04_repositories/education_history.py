"""Repository for the education_history resource — raw SQLAlchemy queries only."""

from sqlalchemy.orm import Session

from _02_models import EducationHistory


def create_education(db: Session, user_id, degree_level, institution_id, course,
                     branch, education_type, start_year, end_year, is_current):
    entry = EducationHistory(
        user_id=user_id,
        degree_level=degree_level,
        institution_id=institution_id,
        course=course,
        branch=branch,
        education_type=education_type,
        start_year=start_year,
        end_year=end_year,
        is_current=is_current,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_education_by_id(db: Session, education_id):
    return db.query(EducationHistory).filter(EducationHistory.id == education_id).first()


def get_education_for_user(db: Session, user_id):
    return (
        db.query(EducationHistory)
        .filter(EducationHistory.user_id == user_id)
        .order_by(EducationHistory.start_year.desc())
        .all()
    )


def update_education(db: Session, entry, updates: dict):
    for key, value in updates.items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


def delete_education(db: Session, entry):
    db.delete(entry)
    db.commit()
