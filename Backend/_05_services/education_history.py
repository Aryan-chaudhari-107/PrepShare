"""Service for the education_history resource — business logic only."""

from sqlalchemy.orm import Session

from _01_core import NotFoundError
from _03_schemas.education_history import EducationCreate, EducationUpdate
from _04_repositories.education_history import (
    create_education,
    delete_education,
    get_education_by_id,
    get_education_for_user,
    update_education,
)
from _04_repositories.institutions import get_institution_by_id


def add_education(db: Session, current_user, data: EducationCreate):
    # Validate the institution exists before inserting the FK
    institution = get_institution_by_id(db, data.institution_id)
    if not institution:
        raise NotFoundError("Institution not found")

    return create_education(
        db,
        user_id=current_user.id,
        degree_level=data.degree_level,
        institution_id=data.institution_id,
        course=data.course,
        branch=data.branch,
        education_type=data.education_type,
        start_year=data.start_year,
        end_year=data.end_year,
        is_current=data.is_current,
    )


def get_my_education(db: Session, current_user):
    return get_education_for_user(db, current_user.id)


def edit_education(db: Session, current_user, education_id, data: EducationUpdate):
    entry = get_education_by_id(db, education_id)
    if not entry:
        raise NotFoundError("Education entry not found")
    if entry.user_id != current_user.id:
        raise ValueError("You don't own this education entry")

    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise ValueError("No fields provided to update")

    # Validate institution if being changed
    if "institution_id" in updates:
        institution = get_institution_by_id(db, updates["institution_id"])
        if not institution:
            raise NotFoundError("Institution not found")

    return update_education(db, entry, updates)


def remove_education(db: Session, current_user, education_id):
    entry = get_education_by_id(db, education_id)
    if not entry:
        raise NotFoundError("Education entry not found")
    if entry.user_id != current_user.id:
        raise ValueError("You don't own this education entry")

    delete_education(db, entry)
    return {"message": "Education entry removed"}
