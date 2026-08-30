"""Router for the education_history resource (/users/me/education)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.education_history import EducationCreate, EducationOut, EducationUpdate
from _05_services import education_history

router = APIRouter(prefix="/users/me/education", tags=["education"])


@router.post("/", response_model=EducationOut, status_code=status.HTTP_201_CREATED)
def add_education(
    data: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return education_history.add_education(db, current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[EducationOut])
def get_my_education(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return education_history.get_my_education(db, current_user)


@router.patch("/{education_id}", response_model=EducationOut)
def edit_education(
    education_id: uuid.UUID,
    data: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return education_history.edit_education(db, current_user, education_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{education_id}")
def remove_education(
    education_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return education_history.remove_education(db, current_user, education_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
