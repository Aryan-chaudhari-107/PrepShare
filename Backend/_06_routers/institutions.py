"""Router for the institutions resource."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from _01_core import get_db
from _03_schemas.institutions import InstitutionListResponse, InstitutionOut
from _05_services import institutions

router = APIRouter(prefix="/institutions", tags=["institutions"])


@router.get("/", response_model=InstitutionListResponse)
def list_institutions(
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return institutions.list_institutions(db, page=page, limit=limit, search=search)


@router.get("/{institution_id}", response_model=InstitutionOut)
def get_institution(
    institution_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    try:
        return institutions.get_institution(db, institution_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
